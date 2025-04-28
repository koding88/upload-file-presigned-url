import { useState, useRef, ChangeEvent } from "react";
import { UploadCloud, CheckCircle2, FileText, AlertCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { UploadStatus } from "@/types";
import useFileStore from "@/store/useFileStore";

interface FileUploaderProps {
    onUploadComplete?: (fileUrl: string) => void;
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
    const { generateUploadUrl, uploadFileToS3, updateFileMetadata } =
        useFileStore();

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            setFile(selectedFiles[0]);
            setUploadStatus(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " bytes";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus({
                success: false,
                message: "Please select a file first",
            });
            return;
        }

        try {
            setIsUploading(true);
            setUploadStatus(null);
            setUploadProgress(10);

            // Step 1: Get a signed URL from the backend
            const { uploadUrl, fileKey, fileUrl } = await generateUploadUrl({
                fileType: file.type,
                fileName: file.name,
            });

            setUploadProgress(30);

            // Step 2: Upload the file directly to S3 (MinIO)
            await uploadFileToS3(uploadUrl, file);

            setUploadProgress(70);

            // Step 3: Update file metadata with the file size
            await updateFileMetadata({
                fileKey,
                fileSize: file.size,
            });

            setUploadProgress(100);

            setUploadStatus({
                success: true,
                message: "File uploaded successfully",
                fileUrl,
            });

            if (onUploadComplete) {
                onUploadComplete(fileUrl);
            }

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setFile(null);
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

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UploadCloud className="h-5 w-5" />
                    Upload File
                </CardTitle>
                <CardDescription>Select a file to upload</CardDescription>
            </CardHeader>

            <CardContent>
                <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors hover:border-primary/50">
                    <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                        Click the button below to select a file
                    </p>
                    <div className="flex justify-center">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Select File
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        Supports: Images, PDF
                    </p>
                </div>

                {file && (
                    <div className="mt-4 p-3 border rounded-md">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>
                            <Badge variant="outline">
                                {file.type.split("/")[1].toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                )}

                {isUploading && (
                    <div className="mt-4">
                        <div className="flex justify-between mb-1">
                            <span className="text-xs">Uploading...</span>
                            <span className="text-xs">{uploadProgress}%</span>
                        </div>
                        <ProgressCustom
                            value={uploadProgress}
                            className="h-2"
                        />
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
                            <CheckCircle2 className="h-4 w-4" />
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

            <CardFooter>
                <div className="w-full">
                    <Button
                        onClick={handleUpload}
                        disabled={isUploading || !file}
                        className="w-full"
                    >
                        {isUploading ? "Uploading..." : "Upload"}
                    </Button>

                    {uploadStatus?.success && uploadStatus.fileUrl && (
                        <a
                            href={uploadStatus.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm text-primary hover:underline text-center w-full"
                        >
                            View Uploaded File
                        </a>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
