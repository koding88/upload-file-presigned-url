import { Router } from "express";
import { fileController } from "../controllers/file.controller";

export const fileRouter = Router();

// Route to generate a signed URL for file upload
fileRouter.post("/generate-upload-url", fileController.generateUploadUrl);

// Route to update file metadata after successful upload
fileRouter.put("/update-metadata", fileController.updateFileMetadata);

// Route to mark files as used and create file usage records
fileRouter.post("/save-meta", fileController.saveFileMeta);
