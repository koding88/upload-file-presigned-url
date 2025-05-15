import { fileUsageModel } from "../models/file-usage.model";
import { Types } from "mongoose";
import { logger } from "../utils/logger.util";

interface IFileUsage {
    fileId: Types.ObjectId;
    modelName: string;
    documentId: Types.ObjectId;
}

class FileUsageRepository {
    async createMany(
        fileUsages: IFileUsage[],
        options: { ordered: boolean } = { ordered: false }
    ) {
        try {
            return await fileUsageModel.insertMany(fileUsages, options);
        } catch (error: any) {
            // Bỏ qua lỗi trùng key nếu ordered = false
            if (error.code !== 11000 || options.ordered) throw error;
            return [];
        }
    }

    async deleteByFileIds(fileIds: Types.ObjectId[]) {
        try {
            return await fileUsageModel.deleteMany({
                fileId: { $in: fileIds },
            });
        } catch (error: any) {
            logger.error(
                `[FileUsageRepository]-[deleteByFileIds] Error: ${error.message}`
            );
            throw error;
        }
    }
}

export const fileUsageRepository = new FileUsageRepository();
