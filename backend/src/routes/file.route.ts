import { Router } from "express";
import { fileController } from "../controllers/file.controller";

export const fileRouter = Router();

// Route to generate a signed URL for file upload
fileRouter.post("/generate-upload-url", fileController.generateUploadUrl);

// Route to update file metadata after successful upload
fileRouter.put("/update-metadata", fileController.updateFileMetadata);

// Chức năng saveFileMeta giờ đã được tích hợp vào productService
// và không cần endpoint API riêng nữa
