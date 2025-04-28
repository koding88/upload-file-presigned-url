import dotenv from "dotenv";
// Load environment variables
dotenv.config();

import { fileService } from "../services/file.service";
import { connectDatabase } from "../providers/connectDB.provider";
import { logger } from "../utils/logger.util";

async function cleanupOrphanedFiles() {
    try {
        // Connect to database
        await connectDatabase();
        logger.info("[AUTO]-[cleanupOrphanedFiles] Connected to database");

        // Cleanup orphaned files
        await fileService.cleanupOrphanedFiles();
        logger.info(
            "[AUTO]-[cleanupOrphanedFiles] Successfully cleaned up orphaned files"
        );

        process.exit(0);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(
                `[AUTO]-[cleanupOrphanedFiles] Error: ${error.message}`
            );
        } else {
            logger.error(
                "[AUTO]-[cleanupOrphanedFiles] An unknown error occurred"
            );
        }
        process.exit(1);
    }
}

cleanupOrphanedFiles();
