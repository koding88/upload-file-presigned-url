import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constant/http-status.constant";
import { errorHandler } from "../utils/error.util";
import { fileService } from "../services/file.service";
import { validateId } from "../validations/id.validation";

class FileController {
    async generateUploadUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const { fileType, fileName } = req.body;

            if (!fileType || !fileName) {
                throw errorHandler(
                    "File type and name are required",
                    HttpStatus.BAD_REQUEST
                );
            }

            const result = await fileService.generateUploadUrl(
                fileType,
                fileName
            );
            res.status(HttpStatus.CREATED).json({
                status: "success",
                payload: result,
                message: "Upload URL generated successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async updateFileMetadata(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { fileKey, fileSize } = req.body;

            if (!fileKey) {
                throw errorHandler(
                    "File key is required",
                    HttpStatus.BAD_REQUEST
                );
            }

            const updatedFile = await fileService.updateFileMetadata(
                fileKey,
                fileSize
            );

            res.status(HttpStatus.OK).json({
                status: "success",
                payload: updatedFile,
                message: "File metadata updated successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async saveFileMeta(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { fileIds, modelName, documentId } = req.body;

            if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
                throw errorHandler(
                    "File IDs are required",
                    HttpStatus.BAD_REQUEST
                );
            }

            // Check if fileIds is an array of valid ObjectId
            if (!fileIds.every((id) => validateId(id))) {
                throw errorHandler("Invalid file IDs", HttpStatus.BAD_REQUEST);
            }

            if (!modelName || !documentId) {
                throw errorHandler(
                    "Model name and document ID are required",
                    HttpStatus.BAD_REQUEST
                );
            }

            const result = await fileService.saveFileMeta(
                fileIds,
                modelName,
                documentId
            );
            res.status(HttpStatus.CREATED).json({
                status: "success",
                payload: result,
                message: "File metadata saved successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

export const fileController = new FileController();
