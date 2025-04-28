import { s3 } from "../config/s3.config";
import { HttpStatus } from "../constant/http-status.constant";
import { FileStatus } from "../types/file.type";
import { errorHandler } from "../utils/error.util";
import { logger } from "../utils/logger.util";
import { Types } from "mongoose";
import { fileRepository } from "../repositories/file.repository";
import { fileUsageRepository } from "../repositories/file-usage.repository";
import { v4 as uuidv4 } from "uuid";

class FileService {
    private readonly URL_EXPIRE_TIME = 3 * 60 * 60; // 3 hours
    private readonly FILE_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 1 day
    private readonly BUCKET_NAME =
        process.env.AWS_BUCKET_NAME || "default-bucket";
    private readonly ENDPOINT = process.env.AWS_ENDPOINT;
    async generateUploadUrl(fileType: string, fileName: string) {
        try {
            // Tạo file key duy nhất
            const fileExtension = fileType.split("/")[1];
            const fileKey = `uploads/${uuidv4()}.${fileExtension}`;

            // Cấu hình params cho signed URL với tagging
            const params = {
                Bucket: this.BUCKET_NAME,
                Key: fileKey,
                Expires: this.URL_EXPIRE_TIME, // URL hết hạn sau 3 hours
                ContentType: fileType,
                Tagging: "status=pending", // Thêm tag cho lifecycle rule
            };

            // Tạo signed URL
            const uploadUrl = await s3.getSignedUrlPromise("putObject", params);

            // Tạo URL truy cập file sau khi upload
            const fileUrl = `${process.env.AWS_ENDPOINT}/${process.env.AWS_BUCKET_NAME}/${fileKey}`;

            // Tạo expireAt date
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + 1); // Hết hạn sau 1 ngày

            // Tạo bản ghi file mới trong database
            const newFile = await fileRepository.createFile({
                fileName,
                fileKey,
                fileUrl,
                fileType,
                status: FileStatus.PENDING,
                expireAt,
            });

            // Trả về upload URL và thông tin file
            return {
                uploadUrl,
                fileKey,
                fileUrl,
                fileType,
                fileId: newFile._id,
            };
        } catch (error: any) {
            logger.error(
                `[FileService]-[generateUploadUrl] Error: ${error.message}`
            );
            throw error;
        }
    }

    async updateFileMetadata(fileKey: string, fileSize: number) {
        try {
            const updatedFile = await fileRepository.updateFileByFileKey(
                fileKey,
                fileSize
            );

            if (!updatedFile) {
                throw errorHandler("File not found", HttpStatus.NOT_FOUND);
            }

            return updatedFile;
        } catch (error: any) {
            logger.error(
                `[FileService]-[updateFileMetadata] Error: ${error.message}`
            );
            throw error;
        }
    }

    async saveFileMeta(
        fileIds: Types.ObjectId[],
        modelName: string,
        documentId: string
    ) {
        try {
            // Cập nhật trạng thái file thành "used" và xóa expireAt
            await fileRepository.updateManyFilesStatus(
                fileIds,
                FileStatus.USED
            );

            // Tạo file usage records
            const usageRecords = fileIds.map((fileId) => ({
                fileId,
                modelName,
                documentId,
            }));

            await fileUsageRepository.createMany(usageRecords);

            // Cập nhật tags trên S3 objects
            const files = await fileRepository.getFileByIds(fileIds);

            const updateTagPromises = files.map((file) => {
                return s3
                    .putObjectTagging({
                        Bucket: this.BUCKET_NAME,
                        Key: file.fileKey,
                        Tagging: {
                            TagSet: [{ Key: "status", Value: FileStatus.USED }],
                        },
                    })
                    .promise();
            });

            await Promise.all(updateTagPromises);

            return {
                files_usage: files.length,
            };
        } catch (error: any) {
            logger.error(
                `[FileService]-[saveFileMeta] Error: ${error.message}`
            );
            throw error;
        }
    }

    async deleteMultipleFiles(fileIds: Types.ObjectId[]) {
        try {
            // Tìm tất cả files để lấy fileKeys
            const files = await fileRepository.getFileByIds(fileIds);

            if (files.length === 0) {
                throw errorHandler(
                    "No files found for IDs: " + fileIds,
                    HttpStatus.NOT_FOUND
                );
            }

            // Xóa từ S3
            const deletePromises: Promise<any>[] = [];

            for (const file of files) {
                if (file.fileKey) {
                    const params = {
                        Bucket: this.BUCKET_NAME,
                        Key: file.fileKey,
                    };
                    deletePromises.push(s3.deleteObject(params).promise());
                } else {
                    throw errorHandler(
                        "File has no fileKey property",
                        HttpStatus.BAD_REQUEST
                    );
                }
            }

            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
            }

            // Xóa file usages
            await fileUsageRepository.deleteByFileIds(fileIds);

            // Xóa từ database
            const deleteResult = await fileRepository.deleteManyFilesByIds(
                fileIds
            );

            return {
                files_deleted: deleteResult.deletedCount,
            };
        } catch (error: any) {
            logger.error(
                `[FileService]-[deleteMultipleFiles] Error: ${error.message}`
            );
            throw error;
        }
    }

    async cleanupOrphanedFiles(timeThresholdMs = this.FILE_EXPIRE_TIME) {
        try {
            // Tìm files có trạng thái "pending" và cũ hơn thời gian chỉ định
            const pendingFiles = await fileRepository.findOrphanedFiles(
                timeThresholdMs
            );

            if (pendingFiles.length === 0) {
                logger.info(
                    `[FileService]-[cleanupOrphanedFiles] No orphaned files to clean up`
                );
                return {
                    cleanup_files: 0,
                };
            }

            logger.info(
                `[FileService]-[cleanupOrphanedFiles] Found ${pendingFiles.length} orphaned files to clean up`
            );

            // Xóa từ S3
            const deletePromises: Promise<any>[] = [];

            for (const file of pendingFiles) {
                if (file.fileKey) {
                    const params = {
                        Bucket: this.BUCKET_NAME,
                        Key: file.fileKey,
                    };
                    deletePromises.push(
                        s3
                            .deleteObject(params)
                            .promise()
                            .then(() =>
                                logger.info(
                                    `[FileService]-[cleanupOrphanedFiles] Deleted S3 object: ${file.fileKey}`
                                )
                            )
                            .catch((err: any) =>
                                logger.error(
                                    `[FileService]-[cleanupOrphanedFiles] Error deleting S3 object ${file.fileKey}:${err.message}`
                                )
                            )
                    );
                }
            }

            await Promise.all(deletePromises);

            // Xóa từ database (thường được xử lý bởi TTL, nhưng để chắc chắn)
            const deleteResult =
                await fileRepository.deleteManyFilesByStatusAndCreatedAt(
                    FileStatus.PENDING,
                    new Date(Date.now() - timeThresholdMs)
                );

            return {
                cleanup_files: deleteResult.deletedCount,
            };
        } catch (error: any) {
            logger.error(
                `[FileService]-[cleanupOrphanedFiles] Error: ${error.message}`
            );
            throw error;
        }
    }
}

export const fileService = new FileService();
