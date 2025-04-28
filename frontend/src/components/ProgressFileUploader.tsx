import { useState, useRef, ChangeEvent } from "react";
import {
    UploadCloud,
    Image,
    Loader2,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ProgressCustom } from "@/components/ui/progress-custom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileData, UploadStatus } from "@/types";
import useFileStore from "@/store/useFileStore";

interface ProgressFileUploaderProps {
    onUploadComplete?: (uploadedResults: FileData[]) => void;
}

export default function ProgressFileUploader({
    onUploadComplete,
}: ProgressFileUploaderProps) {
    const { generateUploadUrl, uploadFileToS3, updateFileMetadata } =
        useFileStore();

    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
            setUploadStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!files.length) {
            setUploadStatus({
                success: false,
                message: "Please select at least one file",
            });
            return;
        }

        try {
            setIsUploading(true);
            setUploadStatus(null);
            setUploadProgress(0);
            setCurrentFileIndex(0);

            const uploadedResults: FileData[] = [];
            const totalFiles = files.length;

            // Upload each file in sequence
            for (let i = 0; i < totalFiles; i++) {
                const file = files[i];
                setCurrentFileIndex(i);

                // Update progress based on file index and upload stage
                setUploadProgress(Math.round((i / totalFiles) * 100));

                // Step 1: Get a signed URL from the backend
                const { uploadUrl, fileKey, fileId, fileUrl } =
                    await generateUploadUrl({
                        fileType: file.type,
                        fileName: file.name,
                    });

                // Step 2: Upload the file directly to S3 (MinIO)
                await uploadFileToS3(uploadUrl, file);

                // Step 3: Update file metadata with the file size
                const fileData = await updateFileMetadata({
                    fileKey,
                    fileSize: file.size,
                });

                // Ensure fileId is included in the result
                const completeFileData: FileData = {
                    ...fileData,
                    _id: fileId,
                    fileUrl,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                uploadedResults.push(completeFileData);
            }

            // Final progress
            setUploadProgress(100);

            setUploadStatus({
                success: true,
                message: `${uploadedResults.length} file(s) uploaded successfully`,
            });

            // Call callback with the uploaded files
            if (onUploadComplete) {
                onUploadComplete(uploadedResults);
            }

            // Reset file input
            setFiles([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadStatus({
                success: false,
                message: `Upload failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " bytes";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Upload Images
                </CardTitle>
                <CardDescription>
                    Select multiple images to upload
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:border-primary/50">
                    <UploadCloud className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                        Click the button below to select images
                    </p>
                    <div className="flex justify-center">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="image-upload"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Select Images
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                        Supports: JPG, PNG, GIF, WebP
                    </p>
                </div>

                {files.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium">
                                Selected files ({files.length})
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFiles([]);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = "";
                                    }
                                }}
                                className="h-7 text-xs"
                            >
                                Clear All
                            </Button>
                        </div>

                        <ScrollArea className="h-48 rounded-md border">
                            <div className="p-2 space-y-2">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 rounded-md bg-muted/40"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Image className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {file.type
                                                    .split("/")[1]
                                                    .toUpperCase()}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() =>
                                                    removeFile(index)
                                                }
                                            >
                                                <AlertCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {isUploading && (
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between mb-1">
                            <span className="text-xs flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Uploading {currentFileIndex + 1} of{" "}
                                {files.length}
                            </span>
                            <span className="text-xs">{uploadProgress}%</span>
                        </div>
                        <ProgressCustom
                            value={uploadProgress}
                            className="h-2"
                        />
                        {files[currentFileIndex] && (
                            <p className="text-xs text-muted-foreground truncate">
                                Current: {files[currentFileIndex].name}
                            </p>
                        )}
                    </div>
                )}

                {uploadStatus && (
                    <Alert
                        variant={
                            uploadStatus.success ? "default" : "destructive"
                        }
                        className="mt-4"
                    >
                        {uploadStatus.success ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                            {uploadStatus.success ? "Success" : "Error"}
                        </AlertTitle>
                        <AlertDescription>
                            {uploadStatus.message}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>

            <Separator />

            <CardFooter className="pt-4">
                <Button
                    onClick={handleUpload}
                    disabled={isUploading || !files.length}
                    className="w-full"
                >
                    {isUploading ? (
                        <span className="flex items-center gap-1">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                        </span>
                    ) : (
                        "Upload Images"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
