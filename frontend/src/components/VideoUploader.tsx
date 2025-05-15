import { useState, useRef, ChangeEvent } from "react";
import {
    Video,
    Upload,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileData, UploadStatus } from "@/types";
import useFileStore from "@/store/useFileStore";

interface VideoUploaderProps {
    onUploadComplete?: (uploadedResults: FileData[]) => void;
}

export default function VideoUploader({
    onUploadComplete,
}: VideoUploaderProps) {
    const { generateUploadUrl, uploadFileToS3 } = useFileStore();

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
                message: "Please select at least one video",
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

                // Update progress based on file index
                setUploadProgress(Math.round((i / totalFiles) * 100));

                // Step 1: Get a signed URL from the backend
                const { uploadUrl, fileKey, fileId, fileUrl } =
                    await generateUploadUrl({
                        fileType: file.type,
                        fileName: file.name,
                    });

                // Step 2: Upload the file directly to S3 (MinIO)
                await uploadFileToS3(uploadUrl, file);

                // Create the complete file data object with fileSize included directly
                const completeFileData: FileData = {
                    _id: fileId,
                    fileKey: fileKey,
                    fileName: file.name,
                    fileUrl: fileUrl,
                    fileType: file.type,
                    fileSize: file.size,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                uploadedResults.push(completeFileData);
            }

            // Final progress
            setUploadProgress(100);

            setUploadStatus({
                success: true,
                message: `${uploadedResults.length} video(s) uploaded successfully`,
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

    // Format file size to display in MB
    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return mb.toFixed(2) + " MB";
    };

    return (
        <Card className="w-full bg-gradient-to-br from-green-50 to-transparent">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-green-600" />
                    Upload Videos
                </CardTitle>
                <CardDescription>
                    Select videos to upload to your product
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors border-green-200 hover:border-green-400">
                    <Upload className="h-10 w-10 mx-auto text-green-500 mb-3" />
                    <p className="text-sm text-green-700 mb-3">
                        Click the button below to select videos
                    </p>
                    <div className="flex justify-center">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            id="video-upload"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Select Videos
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                        Supported formats: MP4, WebM, and other video formats
                    </p>
                </div>

                {files.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-green-700">
                                Selected videos ({files.length})
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setFiles([]);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = "";
                                    }
                                }}
                                className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                            >
                                Clear All
                            </Button>
                        </div>

                        <ScrollArea className="h-48 rounded-md border border-green-100">
                            <div className="p-2 space-y-2">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 rounded-md bg-green-50"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Video className="h-4 w-4 text-green-600" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="text-xs bg-green-100 text-green-700 border-green-200"
                                            >
                                                {file.type
                                                    .split("/")[1]
                                                    .toUpperCase()}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 hover:bg-green-100"
                                                onClick={() =>
                                                    removeFile(index)
                                                }
                                            >
                                                <X className="h-3 w-3 text-green-700" />
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
                            <span className="text-xs flex items-center gap-1 text-green-700">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Uploading {currentFileIndex + 1} of{" "}
                                {files.length}
                            </span>
                            <span className="text-xs text-green-700">
                                {uploadProgress}%
                            </span>
                        </div>
                        <ProgressCustom
                            value={uploadProgress}
                            className="bg-green-100"
                            indicatorClassName="bg-green-500"
                        />
                        {files[currentFileIndex] && (
                            <p className="text-xs text-green-600 truncate">
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
                        className={`mt-4 ${
                            uploadStatus.success
                                ? "bg-green-50 border-green-200 text-green-800"
                                : ""
                        }`}
                    >
                        {uploadStatus.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
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

            <Separator className="bg-green-100" />

            <CardFooter className="pt-4">
                <Button
                    onClick={handleUpload}
                    disabled={isUploading || !files.length}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                    {isUploading ? (
                        <span className="flex items-center gap-1">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                        </span>
                    ) : (
                        "Upload Videos"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
