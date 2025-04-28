import { Types } from "mongoose";
import { fileService } from "../services/file.service";
import { logger } from "../utils/logger.util";
import { validateId } from "../validations/id.validation";

export const extractFileIds = (items: any[]) => {
    try {
        if (!Array.isArray(items)) return [];

        const ids = items.map((item) =>
            typeof item === "object" && item._id
                ? item._id.toString()
                : item.toString()
        );

        // Validate each ID
        const validIds = ids.filter((id) => {
            const isValid = validateId(id);
            if (!isValid) {
                logger.error(
                    `[FileUtil]-[extractFileIds] Invalid ID found: ${id}`
                );
            }
            return isValid;
        });
        return validIds;
    } catch (error: any) {
        logger.error(`[FileUtil]-[extractFileIds] Error: ${error.message}`);
        throw error;
    }
};

export const cleanupFiles = async (
    fileIds: Types.ObjectId[]
): Promise<void> => {
    try {
        if (fileIds.length > 0) {
            logger.info(
                `[FileUtil]-[cleanupFiles] Deleting ${fileIds.length} files`
            );
            await fileService.deleteMultipleFiles(fileIds);
        }
        logger.info(`[FileUtil]-[cleanupFiles] No files to delete`);
    } catch (error: any) {
        logger.error(`[FileUtil]-[cleanupFiles] Error: ${error.message}`);
        throw error;
    }
};

export const updateFileList = (
    currentFiles: Types.ObjectId[],
    newFiles: Types.ObjectId[],
    filesToDelete: Types.ObjectId[]
) => {
    try {
        // Extract file ids from current files, new files and files to delete
        const currentFileIds = extractFileIds(currentFiles);
        const newFileIds = extractFileIds(newFiles);
        const fileIdsToDelete = extractFileIds(filesToDelete);

        // Filter out files that are in the files to delete
        const remainingFiles = currentFileIds.filter(
            (id) => !fileIdsToDelete.includes(id.toString())
        );

        // Combine remaining files with new files
        return [...remainingFiles, ...newFileIds];
    } catch (error: any) {
        logger.error(`[FileUtil]-[updateFileList] Error: ${error.message}`);
        throw error;
    }
};
