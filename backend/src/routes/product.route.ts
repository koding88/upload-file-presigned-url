import { Router } from "express";
import { productController } from "../controllers/product.controller";

export const productRouter = Router();

productRouter.get("/", productController.getProducts);
productRouter.get("/:id", productController.getProductById);
productRouter.post("/", productController.createProduct);
productRouter.put("/:id", productController.updateProduct);
productRouter.delete("/:id", productController.deleteProduct);
