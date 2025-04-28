import { Types } from "mongoose";

export enum FileStatus {
    PENDING = "pending",
    USED = "used",
}

export interface IFile {
    _id?: Types.ObjectId;
    fileName: string;
    fileKey: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    status: FileStatus;
    expireAt?: Date;
}
