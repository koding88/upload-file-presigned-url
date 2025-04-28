import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true,
        },
        images: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "File",
            default: [],
        },
        videos: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "File",
            default: [],
        },
    },
    { timestamps: true }
);

export const productModel = mongoose.model(
    "Product",
    productSchema,
    "products"
);
