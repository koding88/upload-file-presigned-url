import mongoose from "mongoose";

const fileUsageSchema = new mongoose.Schema(
    {
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            required: true,
        },
        modelName: {
            type: String,
            required: true,
        },
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
    },
    { timestamps: true }
);

fileUsageSchema.index(
    { fileId: 1, modelName: 1, documentId: 1 },
    { unique: true }
);

export const fileUsageModel = mongoose.model(
    "FileUsage",
    fileUsageSchema,
    "files-usage"
);
