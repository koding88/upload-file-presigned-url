import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { productService } from "../services/product.service";
import { HttpStatus } from "../constant/http-status.constant";
import { validateId } from "../validations/id.validation";
import { errorHandler } from "../utils/error.util";
import { productValidation } from "../validations/product.validation";
import { logger } from "../utils/logger.util";
import {
    IProductCreateRequest,
    IProductUpdateRequest,
    IFileWithSize,
} from "../types/product.type";

class ProductController {
    private validateObjectId(id: string | Types.ObjectId, field = "ID") {
        if (!validateId(id)) {
            throw errorHandler(`Invalid ${field}`, HttpStatus.BAD_REQUEST);
        }
    }

    private transformMediaArray(media: IFileWithSize[], field: string) {
        return media.map((item) => {
            this.validateObjectId(item._id, `${field} ID`);
            return {
                _id: item._id,
                fileSize: item.fileSize,
            };
        });
    }

    private transformIdArray(ids: Types.ObjectId[], field: string) {
        return ids.map((id) => {
            this.validateObjectId(id, `${field} ID to delete`);
            return id;
        });
    }

    getProducts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const products = await productService.getProducts();
            res.status(HttpStatus.OK).json({
                status: "success",
                payload: products,
                message: "Products fetched successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    getProductById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            this.validateObjectId(req.params.id, "Product ID");

            const product = await productService.getProductById(
                new Types.ObjectId(req.params.id)
            );

            res.status(HttpStatus.OK).json({
                status: "success",
                payload: product,
                message: "Product fetched successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    createProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                name,
                images = [],
                videos = [],
            } = req.body as IProductCreateRequest;

            const { error } = productValidation.validate({ name });
            if (error) {
                logger.error(
                    `[ProductController] Validation failed: ${error.message}`
                );
                throw errorHandler(error.message, HttpStatus.BAD_REQUEST);
            }

            const imageData = this.transformMediaArray(images, "image");
            const videoData = this.transformMediaArray(videos, "video");

            const product = await productService.createProduct({
                name,
                images: imageData,
                videos: videoData,
            });

            res.status(HttpStatus.CREATED).json({
                status: "success",
                payload: product,
                message: "Product created successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    updateProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            this.validateObjectId(id, "Product ID");

            const {
                name,
                newImages = [],
                newVideos = [],
                imagesToDelete = [],
                videosToDelete = [],
            } = req.body as IProductUpdateRequest;

            const { error } = productValidation.validate({ name });
            if (error) {
                logger.error(
                    `[ProductController] Validation failed: ${error.message}`
                );
                throw errorHandler(error.message, HttpStatus.BAD_REQUEST);
            }

            const newImageData = this.transformMediaArray(newImages, "image");
            const newVideoData = this.transformMediaArray(newVideos, "video");

            const imagesToDeleteObjIds = this.transformIdArray(
                imagesToDelete,
                "image"
            );
            const videosToDeleteObjIds = this.transformIdArray(
                videosToDelete,
                "video"
            );

            const product = await productService.updateProduct(
                new Types.ObjectId(id),
                {
                    name,
                    newImages: newImageData,
                    newVideos: newVideoData,
                    imagesToDelete: imagesToDeleteObjIds,
                    videosToDelete: videosToDeleteObjIds,
                }
            );

            res.status(HttpStatus.OK).json({
                status: "success",
                payload: product,
                message: "Product updated successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            this.validateObjectId(req.params.id, "Product ID");

            await productService.deleteProduct(
                new Types.ObjectId(req.params.id)
            );

            res.status(HttpStatus.NO_CONTENT).json({
                status: "success",
                message: "Product deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

export const productController = new ProductController();
