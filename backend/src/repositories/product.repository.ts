import { Types } from "mongoose";
import { productModel } from "../models/product.model";
import { fileModel } from "../models/file.model";
import {
    IProductRepositoryCreate,
    IProductUpdate,
} from "../types/product.type";
import { logger } from "../utils/logger.util";

class ProductRepository {
    async getProducts() {
        try {
            const products = await productModel.find().populate({
                path: "images videos",
                model: fileModel,
                select: "fileUrl fileName fileType",
            });
            return products;
        } catch (error: any) {
            logger.error(
                `[ProductRepository]-[getProducts] Error: ${error.message}`
            );
            throw error;
        }
    }

    async getProductById(productId: Types.ObjectId) {
        try {
            const product = await productModel.findById(productId).populate({
                path: "images videos",
                model: fileModel,
                select: "fileUrl fileName fileType",
            });
            return product;
        } catch (error: any) {
            logger.error(
                `[ProductRepository]-[getProductById] Error: ${error.message}`
            );
            throw error;
        }
    }

    async createProduct(productData: IProductRepositoryCreate) {
        try {
            const product = await productModel.create(productData);
            return product;
        } catch (error: any) {
            logger.error(
                `[ProductRepository]-[createProduct] Error: ${error.message}`
            );
            throw error;
        }
    }

    async updateProduct(
        productId: Types.ObjectId,
        productData: IProductUpdate
    ) {
        try {
            const product = await productModel.findByIdAndUpdate(
                productId,
                productData,
                { new: true }
            );
            return product;
        } catch (error: any) {
            logger.error(
                `[ProductRepository]-[updateProduct] Error: ${error.message}`
            );
            throw error;
        }
    }

    async deleteProduct(productId: Types.ObjectId) {
        try {
            const product = await productModel.findByIdAndDelete(productId);
            return product;
        } catch (error: any) {
            logger.error(
                `[ProductRepository]-[deleteProduct] Error: ${error.message}`
            );
            throw error;
        }
    }
}

export const productRepository = new ProductRepository();
