// File type definitions
export interface FileData {
    _id: string;
    fileKey: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    createdAt: string;
    updatedAt: string;
}

// Product type definitions
export interface Product {
    _id: string;
    name: string;
    images: FileData[];
    videos: FileData[];
    createdAt: string;
    updatedAt: string;
}

// Create Product request
export interface CreateProductRequest {
    name: string;
    images: string[];
    videos: string[];
}

// Update Product request
export interface UpdateProductRequest {
    name: string;
    newImages: string[];
    newVideos: string[];
    imagesToDelete: string[];
    videosToDelete: string[];
}

// File upload response
export interface UploadUrlResponse {
    uploadUrl: string;
    fileKey: string;
    fileId: string;
    fileUrl: string;
}

// File metadata
export interface FileMetadata {
    fileKey: string;
    fileSize: number;
}

// Upload status
export interface UploadStatus {
    success: boolean;
    message: string;
    fileUrl?: string;
}
