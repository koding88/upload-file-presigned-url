// File type definitions
export interface FileData {
    _id: string;
    fileKey: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    createdAt: string;
    updatedAt: string;
}

// File with size
export interface FileWithSize {
    _id: string;
    fileSize?: number;
}

// Product type definitions
export interface Product {
    _id: string;
    name: string;
    images: FileData[];
    videos: FileData[];
    createdAt?: string;
    updatedAt?: string;
}

// Create Product request - Updated to match backend IProductCreateRequest
export interface ProductForm {
    name: string;
    images: FileWithSize[]; // Now only accepting FileWithSize[] to ensure fileSize is included
    videos: FileWithSize[]; // Now only accepting FileWithSize[] to ensure fileSize is included
}

// Update Product request - Updated to match backend IProductUpdateRequest
export interface ProductUpdateForm {
    name: string;
    newImages: FileWithSize[];
    newVideos: FileWithSize[];
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
