import { Types } from "mongoose";
import { productRepository } from "../repositories/product.repository";
import {
    IProductCreateRequest,
    IProductUpdateRequest,
    IFileWithSize,
} from "../types/product.type";
import { logger } from "../utils/logger.util";
import { errorHandler } from "../utils/error.util";
import { HttpStatus } from "../constant/http-status.constant";
import { cleanupFiles, updateFileList } from "../utils/file.util";
import { fileService } from "../services/file.service";
import { fileRepository } from "../repositories/file.repository";

class ProductService {
    private async validateFileExistence(
        fileIds: Types.ObjectId[]
    ): Promise<void> {
        if (fileIds.length === 0) return;

        const existingFiles = await fileRepository.getFileByIds(fileIds);
        if (existingFiles.length !== fileIds.length) {
            throw errorHandler(
                "Some file IDs do not exist",
                HttpStatus.BAD_REQUEST
            );
        }
    }

    private async updateFileSizes(
        files: IFileWithSize[]
    ): Promise<void> {
        const updates = files
            .filter((file) => file.fileSize)
            .map((file) =>
                fileRepository.updateFileSizeById(file._id, file.fileSize!)
            );
        await Promise.all(updates);
    }

    private async saveFileMetadata(
        fileIds: Types.ObjectId[],
        modelName: string,
        refId: Types.ObjectId
    ): Promise<void> {
        if (fileIds.length === 0) return;
        await fileService.saveFileMeta(fileIds, modelName, refId);
    }

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

    async createProduct(productData: IProductCreateRequest) {
        try {
            const imageIds = productData.images.map((img) => img._id);
            const videoIds = productData.videos.map((vid) => vid._id);
            const allFileIds = [...imageIds, ...videoIds];

            await this.validateFileExistence(allFileIds);
            await this.updateFileSizes([
                ...productData.images,
                ...productData.videos,
            ]);

            const newProduct = {
                name: productData.name,
                images: imageIds.map((id) => new Types.ObjectId(id)),
                videos: videoIds.map((id) => new Types.ObjectId(id)),
            };

            const product = await productRepository.createProduct(newProduct);
            if (!product) {
                throw errorHandler(
                    "Failed to create product",
                    HttpStatus.BAD_REQUEST
                );
            }

            await this.saveFileMetadata(allFileIds, "Product", product._id);
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

            const newImageIds = newImages.map((img) => img._id);
            const newVideoIds = newVideos.map((vid) => vid._id);
            const allNewFileIds = [...newImageIds, ...newVideoIds];

            await this.validateFileExistence(allNewFileIds);
            await this.updateFileSizes([...newImages, ...newVideos]);

            const updatedImages = updateFileList(
                product.images,
                newImageIds.map((id) => new Types.ObjectId(id)),
                imagesToDelete.map((id) => new Types.ObjectId(id))
            );

            const updatedVideos = updateFileList(
                product.videos,
                newVideoIds.map((id) => new Types.ObjectId(id)),
                videosToDelete.map((id) => new Types.ObjectId(id))
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

            await this.saveFileMetadata(allNewFileIds, "Product", productId);
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
