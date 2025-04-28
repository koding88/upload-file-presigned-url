import mongoose, { Schema } from "mongoose";
import { FileStatus } from "../types/file.type";

const fileSchema = new Schema(
    {
        fileName: {
            type: String,
            required: true,
        },
        fileKey: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
        },
        status: {
            type: String,
            enum: FileStatus,
            default: FileStatus.PENDING,
        },
        expireAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

fileSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
export const fileModel = mongoose.model("File", fileSchema, "files");
