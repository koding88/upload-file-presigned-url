import { Types } from "mongoose";
import { productRepository } from "../repositories/product.repository";
import {
    IProductCreate,
    IProductUpdate,
    IProductUpdateRequest,
} from "../types/product.type";
import { logger } from "../utils/logger.util";
import { errorHandler } from "../utils/error.util";
import { HttpStatus } from "../constant/http-status.constant";
import { cleanupFiles, updateFileList } from "../utils/file.util";
import { fileService } from "../services/file.service";
import { fileRepository } from "../repositories/file.repository";

class ProductService {
    async getProducts() {
        try {
            return await productRepository.getProducts();
        } catch (error: any) {
            logger.error(
                `[ProductService]-[getProducts] Error: ${error.message}`
            );
            throw error;
        }
    }

    async getProductById(productId: Types.ObjectId) {
        try {
            return await productRepository.getProductById(productId);
        } catch (error: any) {
            logger.error(
                `[ProductService]-[getProductById] Error: ${error.message}`
            );
            throw error;
        }
    }

    async createProduct(productData: IProductCreate) {
        try {
            // Validate file IDs - check if they exist in the database
            const { images = [], videos = [] } = productData;
            const allFileIds = [...images, ...videos];

            if (allFileIds.length > 0) {
                // Convert string IDs to ObjectIDs
                const fileObjectIds = allFileIds.map(
                    (id) => new Types.ObjectId(id.toString())
                );

                // Check if files exist
                const existingFiles = await fileRepository.getFileByIds(
                    fileObjectIds
                );

                if (existingFiles.length !== fileObjectIds.length) {
                    throw errorHandler(
                        "Some file IDs do not exist in the database",
                        HttpStatus.BAD_REQUEST
                    );
                }
            }

            const product = await productRepository.createProduct(productData);

            if (!product) {
                throw errorHandler(
                    "Failed to create product",
                    HttpStatus.BAD_REQUEST
                );
            }

            // Automatically save file metadata after product creation
            if (allFileIds.length > 0) {
                // Convert string IDs to ObjectIDs
                const fileObjectIds = allFileIds.map(
                    (id) => new Types.ObjectId(id.toString())
                );

                // Save file metadata
                await fileService.saveFileMeta(
                    fileObjectIds,
                    "Product",
                    product._id.toString()
                );
            }

            return product;
        } catch (error: any) {
            logger.error(
                `[ProductService]-[createProduct] Error: ${error.message}`
            );
            throw error;
        }
    }

    async updateProduct(
        productId: Types.ObjectId,
        productData: IProductUpdateRequest
    ) {
        try {
            const {
                name,
                newImages = [],
                newVideos = [],
                imagesToDelete = [],
                videosToDelete = [],
            } = productData;
            const product = await productRepository.getProductById(productId);

            if (!product) {
                throw errorHandler("Product not found", HttpStatus.NOT_FOUND);
            }

            // Validate new file IDs - check if they exist in the database
            const allNewFileIds = [...newImages, ...newVideos];

            if (allNewFileIds.length > 0) {
                // Convert string IDs to ObjectIDs
                const fileObjectIds = allNewFileIds.map(
                    (id) => new Types.ObjectId(id.toString())
                );

                // Check if files exist
                const existingFiles = await fileRepository.getFileByIds(
                    fileObjectIds
                );

                if (existingFiles.length !== fileObjectIds.length) {
                    throw errorHandler(
                        "Some file IDs do not exist in the database",
                        HttpStatus.BAD_REQUEST
                    );
                }
            }

            // Get current images and videos
            const currentImages = product.images;
            const currentVideos = product.videos;

            // Update images
            const updatedImages = updateFileList(
                currentImages,
                newImages,
                imagesToDelete
            );

            // Update videos
            const updatedVideos = updateFileList(
                currentVideos,
                newVideos,
                videosToDelete
            );

            const updatedProduct = await productRepository.updateProduct(
                productId,
                {
                    name,
                    images: updatedImages,
                    videos: updatedVideos,
                }
            );

            if (!updatedProduct) {
                throw errorHandler(
                    "Failed to update product",
                    HttpStatus.BAD_REQUEST
                );
            }

            // Automatically save metadata for new files
            if (allNewFileIds.length > 0) {
                // Convert string IDs to ObjectIDs
                const fileObjectIds = allNewFileIds.map(
                    (id) => new Types.ObjectId(id.toString())
                );

                // Save file metadata for new files
                await fileService.saveFileMeta(
                    fileObjectIds,
                    "Product",
                    productId.toString()
                );
            }

            // Delete files that are no longer needed
            await cleanupFiles([...imagesToDelete, ...videosToDelete]);

            return updatedProduct;
        } catch (error: any) {
            logger.error(
                `[ProductService]-[updateProduct] Error: ${error.message}`
            );
            throw error;
        }
    }

    async deleteProduct(productId: Types.ObjectId) {
        try {
            const product = await productRepository.deleteProduct(productId);

            if (!product) {
                throw errorHandler("Product not found", HttpStatus.NOT_FOUND);
            }

            await cleanupFiles([...product.images, ...product.videos]);

            return product;
        } catch (error: any) {
            logger.error(
                `[ProductService]-[deleteProduct] Error: ${error.message}`
            );
            throw error;
        }
    }
}

export const productService = new ProductService();
