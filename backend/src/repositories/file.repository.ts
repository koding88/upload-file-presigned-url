import { fileModel } from "../models/file.model";
import { IFile } from "../types/file.type";
import { logger } from "../utils/logger.util";
import { Types } from "mongoose";
import { FileStatus } from "../types/file.type";

class FileRepository {
    async getFileByIds(fileIds: Types.ObjectId[]) {
        try {
            return await fileModel.find({ _id: { $in: fileIds } });
        } catch (error: any) {
            logger.error(
                `[FileRepository]-[getFileByIds] Error: ${error.message}`
            );
            throw error;
        }
    }

    async createFile(file: IFile) {
        try {
            const newFile = await fileModel.create(file);
            return newFile;
        } catch (error: any) {
            logger.error(
                `[FileRepository]-[createFile] Error: ${error.message}`
            );
            throw error;
        }
    }

    async updateManyFilesStatus(fileIds: Types.ObjectId[], status: FileStatus) {
        try {
            return await fileModel.updateMany(
                { _id: { $in: fileIds } },
                {
                    $set: {
                        status,
                    },
                    $unset: {
                        expireAt: "",
                    },
                },
                {
                    new: true,
                }
            );
        } catch (error: any) {
            logger.error(
                `[FileRepository]-[updateManyFilesStatus] Error: ${error.message}`
            );
            throw error;
        }
    }

    async deleteManyFilesByIds(fileIds: Types.ObjectId[]) {
        try {
            return await fileModel.deleteMany({ _id: { $in: fileIds } });
        } catch (error: any) {
            logger.error(
                `[FileRepository]-[deleteManyFilesByIds] Error: ${error.message}`
            );
            throw error;
        }
    }

    async deleteManyFilesByStatusAndCreatedAt(
        status: FileStatus,
        createdAt: Date
    ) {
        try {
            return await fileModel.deleteMany({
                status,
                createdAt: { $lt: createdAt },
            });
        } catch (error: any) {
            logger.error(
                `[FileRepository]-[deleteManyFilesByStatusAndCreatedAt] Error: ${error.message}`
            );
            throw error;
        }
    }

    async findOrphanedFiles(timeThresholdMs: number) {
        try {
            return await fileModel.find({
                status: FileStatus.PENDING,
                createdAt: { $lt: new Date(Date.now() - timeThresholdMs) },
            });
        } catch (error: any) {
            logger.error(
                `[FileRepository]-[findOrphanedFiles] Error: ${error.message}`
            );
            throw error;
        }
    }

    async updateFileSizeById(fileId: Types.ObjectId, fileSize: number) {
        try {
            return await fileModel.findByIdAndUpdate(
                fileId,
                { fileSize },
                { new: true }
            );
        } catch (error: any) {
            logger.error(
                `[FileRepository]-[updateFileSizeById] Error: ${error.message}`
            );
            throw error;
        }
    }
}

export const fileRepository = new FileRepository();
