import React, { useState, useRef, ChangeEvent } from "react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { ProgressCustom } from "@/components/ui/progress-custom";
import { FileData } from "@/types";
import { Loader2, Image, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SimpleFileUploaderProps {
    accept?: string;
    multiple?: boolean;
    maxFiles?: number;
    onUploadComplete: (files: FileData[]) => void;
}

const SimpleFileUploader: React.FC<SimpleFileUploaderProps> = ({
    accept = "*",
    multiple = false,
    maxFiles = 10,
    onUploadComplete,
}) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{
        [key: string]: number;
    }>({});
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setError(null);

        if (!e.target.files || e.target.files.length === 0) return;

        const fileList = Array.from(e.target.files);

        // Check if number of files exceeds the limit
        if (fileList.length > maxFiles) {
            setError(
                `You can only upload a maximum of ${maxFiles} files at once.`
            );
            return;
        }

        setSelectedFiles((prev) => [...prev, ...fileList]);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setError(null);

        const uploadedFiles: FileData[] = [];

        try {
            // Process files sequentially
            for (const file of selectedFiles) {
                // Get presigned URL
                const presignedResponse = await api.post(
                    "/files/generate-upload-url",
                    {
                        fileName: file.name,
                        fileType: file.type,
                    }
                );

                const { uploadUrl, fileKey, fileId, fileUrl } =
                    presignedResponse.data.payload;

                // Upload file with progress tracking
                await api.put(uploadUrl, file, {
                    headers: { "Content-Type": file.type },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) /
                                (progressEvent.total || 100)
                        );
                        setUploadProgress((prev) => ({
                            ...prev,
                            [file.name]: percentCompleted,
                        }));
                    },
                });

                // Add the file to our array of uploaded files
                uploadedFiles.push({
                    _id: fileId, // Use fileId from backend response instead of fileKey
                    fileKey: fileKey,
                    fileName: file.name,
                    fileUrl: fileUrl,
                    fileType: file.type,
                    fileSize: file.size,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            }

            // Call the callback with uploaded files
            onUploadComplete(uploadedFiles);

            // Reset state
            setSelectedFiles([]);
            setUploadProgress({});
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            console.error("Error uploading files:", err);
            setError(
                "An error occurred while uploading files. Please try again."
            );
        } finally {
            setUploading(false);
        }
    };

    const clearSelection = () => {
        setSelectedFiles([]);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " bytes";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    return (
        <div className="w-full space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors border-blue-200 hover:border-blue-400">
                <Image className="h-10 w-10 mx-auto text-blue-500 mb-3" />
                <p className="text-sm text-blue-700 mb-3">
                    Click the button below to select images
                </p>
                <div className="flex justify-center">
                    <input
                        type="file"
                        accept={accept}
                        multiple={multiple}
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                        id="image-upload"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Select Images
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                    Supports: JPG, PNG, GIF, WebP
                </p>
            </div>

            {selectedFiles.length > 0 && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-blue-700">
                            Selected images ({selectedFiles.length})
                        </h4>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearSelection}
                            disabled={uploading}
                            className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        >
                            Clear All
                        </Button>
                    </div>

                    <ScrollArea className="h-48 rounded-md border border-blue-100">
                        <div className="p-2 space-y-2">
                            {selectedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 rounded-md bg-blue-50"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Image className="h-4 w-4 text-blue-600" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground"
                                        onClick={() => removeFile(index)}
                                        disabled={uploading}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {Object.keys(uploadProgress).length > 0 && (
                        <div className="space-y-2">
                            {selectedFiles.map(
                                (file, index) =>
                                    uploadProgress[file.name] !== undefined && (
                                        <div key={index} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-blue-700">
                                                    {file.name}
                                                </span>
                                                <span className="text-blue-700">
                                                    {uploadProgress[file.name]}%
                                                </span>
                                            </div>
                                            <ProgressCustom
                                                value={
                                                    uploadProgress[file.name]
                                                }
                                                className="h-2 bg-blue-100"
                                                indicatorClassName="bg-blue-500"
                                            />
                                        </div>
                                    )
                            )}
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        disabled={uploading || selectedFiles.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload Images"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default SimpleFileUploader;
