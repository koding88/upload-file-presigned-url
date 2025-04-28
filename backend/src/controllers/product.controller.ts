import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { HttpStatus } from "../constant/http-status.constant";
import { Types } from "mongoose";
import { validateId } from "../validations/id.validation";
import { errorHandler } from "../utils/error.util";
import { productValidation } from "../validations/product.validation";
import { cleanupFiles, extractFileIds } from "../utils/file.util";
import { logger } from "../utils/logger.util";
import { IProductUpdateRequest } from "../types/product.type";

class ProductController {
    async getProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const products = await productService.getProducts();

            res.status(HttpStatus.OK).json({
                status: "success",
                payload: products,
                message: "Products fetched successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    async getProductById(req: Request, res: Response, next: NextFunction) {
        try {
            if (!validateId(req.params.id)) {
                throw errorHandler(
                    "Invalid product ID",
                    HttpStatus.BAD_REQUEST
                );
            }

            const product = await productService.getProductById(
                new Types.ObjectId(req.params.id)
            );
            res.status(HttpStatus.OK).json({
                status: "success",
                payload: product,
                message: "Product fetched successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    async createProduct(req: Request, res: Response, next: NextFunction) {
        const { name, images, videos } = req.body;
        // Trích xuất IDs từ images và videos
        const imageIds = extractFileIds(images || []);
        const videoIds = extractFileIds(videos || []);

        const { error } = productValidation.validate({ name });
        if (error) {
            logger.error(
                `[ProductController]-[createProduct] Error Validation: ${error.message}`
            );
            await cleanupFiles([...imageIds, ...videoIds]);
            throw errorHandler(error.message, HttpStatus.BAD_REQUEST);
        }

        try {
            const product = await productService.createProduct({
                name,
                images: imageIds,
                videos: videoIds,
            });

            res.status(HttpStatus.CREATED).json({
                status: "success",
                payload: product,
                message: "Product created successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    async updateProduct(req: Request, res: Response, next: NextFunction) {
        try {
            if (!validateId(req.params.id)) {
                throw errorHandler(
                    "Invalid product ID",
                    HttpStatus.BAD_REQUEST
                );
            }

            const {
                name,
                newImages,
                newVideos,
                imagesToDelete,
                videosToDelete,
            } = req.body as IProductUpdateRequest;
            // Trích xuất IDs của các file mới
            const newImageIds = extractFileIds(newImages);
            const newVideoIds = extractFileIds(newVideos);

            const { error } = productValidation.validate({ name });
            if (error) {
                await cleanupFiles([...newImageIds, ...newVideoIds]);
                logger.error(
                    `[ProductController]-[updateProduct] Error Validation: ${error.message}`
                );
                throw errorHandler(error.message, HttpStatus.BAD_REQUEST);
            }

            const product = await productService.updateProduct(
                new Types.ObjectId(req.params.id),
                {
                    name,
                    newImages: newImageIds,
                    newVideos: newVideoIds,
                    imagesToDelete,
                    videosToDelete,
                }
            );
            res.status(HttpStatus.OK).json({
                status: "success",
                payload: product,
                message: "Product updated successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }

    async deleteProduct(req: Request, res: Response, next: NextFunction) {
        try {
            if (!validateId(req.params.id)) {
                throw errorHandler(
                    "Invalid product ID",
                    HttpStatus.BAD_REQUEST
                );
            }

            const product = await productService.deleteProduct(
                new Types.ObjectId(req.params.id)
            );

            res.status(HttpStatus.NO_CONTENT).json({
                status: "success",
                payload: product,
                message: "Product deleted successfully",
            });
        } catch (error: any) {
            next(error);
        }
    }
}

export const productController = new ProductController();
