import { Types } from "mongoose";

export interface IProduct {
    _id?: Types.ObjectId;
    name: string;
    images: Types.ObjectId[];
    videos: Types.ObjectId[];
}

export interface IProductCreate {
    name: string;
    images: Types.ObjectId[];
    videos: Types.ObjectId[];
}

export interface IProductUpdate extends IProductCreate {}

export interface IProductUpdateRequest {
    name: string;
    newImages: Types.ObjectId[];
    newVideos: Types.ObjectId[];
    imagesToDelete: Types.ObjectId[];
    videosToDelete: Types.ObjectId[];
}
