import mongoose from "mongoose";
import { logger } from "../utils/logger.util";

export const connectDatabase = async () => {
    try {
        mongoose.set("strictQuery", false);
        await mongoose.connect(process.env.MONGO_URI ?? "", {
            minPoolSize: 1,
            maxPoolSize: 20,
            compressors: ["zlib"],
            socketTimeoutMS: 60000,
            serverSelectionTimeoutMS: 60000,
        });
        logger.info("[PROVIDER]-[connectDatabase] Connected to MongoDB");
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(
                `[PROVIDER]-[connectDatabase] Error connecting to MongoDB: ${error.message}`
            );
        } else {
            logger.error(
                "[PROVIDER]-[connectDatabase] An unknown error occurred while connecting to MongoDB"
            );
        }
        process.exit(1); // Exit process on connection error
    }
};