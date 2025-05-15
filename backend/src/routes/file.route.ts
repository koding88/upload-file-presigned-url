import { Router } from "express";
import { fileController } from "../controllers/file.controller";

export const fileRouter = Router();

// Route to generate a signed URL for file upload
fileRouter.post("/generate-upload-url", fileController.generateUploadUrl);
