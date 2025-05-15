import { Types } from "mongoose";

export interface IProduct {
    _id?: Types.ObjectId;
    name: string;
    images: Types.ObjectId[];
    videos: Types.ObjectId[];
}

// Cấu trúc file với fileSize
export interface IFileWithSize {
    _id: Types.ObjectId;
    fileSize?: number;
}

// Make IProductCreate accept either plain IDs or objects with fileSize
export interface IProductRepositoryCreate {
    name: string;
    images: Types.ObjectId[];
    videos: Types.ObjectId[];
}

export interface IProductUpdate extends IProductRepositoryCreate {}

// Type for incoming requests
export interface IProductCreateRequest {
    name: string;
    images: IFileWithSize[];
    videos: IFileWithSize[];
}

export interface IProductUpdateRequest {
    name: string;
    newImages: IFileWithSize[];
    newVideos: IFileWithSize[];
    imagesToDelete: Types.ObjectId[];
    videosToDelete: Types.ObjectId[];
}
