import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../constant/http-status.constant";
import { errorHandler } from "../utils/error.util";
import { fileService } from "../services/file.service";

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
}

export const fileController = new FileController();
