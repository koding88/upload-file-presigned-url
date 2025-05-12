import { useState, useEffect } from "react";
import { Save, X, ImagePlus, VideoIcon, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import SimpleFileUploader from "@/components/SimpleFileUploader";
import VideoUploader from "@/components/VideoUploader";
import { FileData, Product } from "@/types";
import useProductStore from "@/store/useProductStore";
import useFileStore from "@/store/useFileStore";

interface ProductFormProps {
    product: Product | null;
    onSave: (product: Product) => void;
    onCancel: () => void;
}

export default function ProductForm({
    product,
    onSave,
    onCancel,
}: ProductFormProps) {
    const { createProduct, updateProduct } = useProductStore();
    const { uploadedFiles, uploadedVideos, setFiles, setVideos } =
        useFileStore();

    const [name, setName] = useState("");
    const [selectedImages, setSelectedImages] = useState<FileData[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<FileData[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Lưu trữ các ID gốc của file khi bắt đầu chỉnh sửa
    const [originalImageIds, setOriginalImageIds] = useState<string[]>([]);
    const [originalVideoIds, setOriginalVideoIds] = useState<string[]>([]);

    const isEditMode = !!product;

    useEffect(() => {
        // If we're editing a product, set the form values
        if (product) {
            setName(product.name || "");
            if (product.images && product.images.length > 0) {
                setSelectedImages(product.images);
                setFiles(product.images);
                // Lưu lại ID gốc để so sánh sau này
                setOriginalImageIds(product.images.map((img) => img._id));
            }
            if (product.videos && product.videos.length > 0) {
                setSelectedVideos(product.videos);
                setVideos(product.videos);
                // Lưu lại ID gốc để so sánh sau này
                setOriginalVideoIds(product.videos.map((vid) => vid._id));
            }
        } else {
            // Reset form for create mode
            setSelectedImages([]);
            setSelectedVideos([]);
            setOriginalImageIds([]);
            setOriginalVideoIds([]);
        }
    }, [product, setFiles, setVideos]);

    const toggleImageSelection = (fileId: string) => {
        setSelectedImages((prevSelected) => {
            const isCurrentlySelected = prevSelected.some(
                (img) => img._id === fileId
            );

            if (isCurrentlySelected) {
                return prevSelected.filter((img) => img._id !== fileId);
            } else {
                const imageToAdd = uploadedFiles.find(
                    (file) => file._id === fileId
                );
                if (imageToAdd) {
                    return [...prevSelected, imageToAdd];
                }
                return prevSelected;
            }
        });
    };

    const toggleVideoSelection = (fileId: string) => {
        setSelectedVideos((prevSelected) => {
            const isCurrentlySelected = prevSelected.some(
                (vid) => vid._id === fileId
            );

            if (isCurrentlySelected) {
                return prevSelected.filter((vid) => vid._id !== fileId);
            } else {
                const videoToAdd = uploadedVideos.find(
                    (file) => file._id === fileId
                );
                if (videoToAdd) {
                    return [...prevSelected, videoToAdd];
                }
                return prevSelected;
            }
        });
    };

    const resetFormState = () => {
        setName("");
        setSelectedImages([]);
        setSelectedVideos([]);
        setOriginalImageIds([]);
        setOriginalVideoIds([]);
        setError(null);
        // Reset file store states
        setFiles([]);
        setVideos([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Product name is required");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            // Xử lý create product
            if (!isEditMode) {
                const imageIds = selectedImages.map((img) => img._id);
                const videoIds = selectedVideos.map((vid) => vid._id);

                const productData = {
                    name,
                    images: imageIds,
                    videos: videoIds,
                };

                const result = await createProduct(productData);

                // Reset form state after successful creation
                resetFormState();
                onSave(result);
            }
            // Xử lý update product với cấu trúc dữ liệu mới
            else {
                // Lấy IDs của ảnh và video hiện tại
                const currentImageIds = selectedImages.map((img) => img._id);
                const currentVideoIds = selectedVideos.map((vid) => vid._id);

                // Xác định ảnh mới được thêm vào (không có trong danh sách gốc)
                const newImages = currentImageIds.filter(
                    (id) => !originalImageIds.includes(id)
                );

                // Xác định video mới được thêm vào (không có trong danh sách gốc)
                const newVideos = currentVideoIds.filter(
                    (id) => !originalVideoIds.includes(id)
                );

                // Xác định files (ảnh) bị xóa
                const imagesToDelete = originalImageIds.filter(
                    (id) => !currentImageIds.includes(id)
                );

                // Xác định files (video) bị xóa
                const videosToDelete = originalVideoIds.filter(
                    (id) => !currentVideoIds.includes(id)
                );

                // Chuẩn bị dữ liệu theo cấu trúc mới
                const productData = {
                    name,
                    newImages,
                    newVideos,
                    imagesToDelete,
                    videosToDelete,
                };

                const result = await updateProduct(product._id, productData);

                // Reset form state after successful update
                resetFormState();
                onSave(result);
            }
        } catch (err) {
            console.error("Error saving product:", err);
            setError(
                `Failed to ${isEditMode ? "update" : "create"} product. ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>
                        {isEditMode ? "Edit Product" : "Create New Product"}
                    </CardTitle>
                    <CardDescription>
                        {isEditMode
                            ? "Update product information and manage media"
                            : "Add product details and attach media files"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="product-name">Product Name</Label>
                        <Input
                            id="product-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter product name"
                            className="w-full"
                        />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Media Content</h3>

                        {/* Image section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <ImagePlus className="h-5 w-5 text-blue-600" />
                                <h4 className="font-medium">
                                    Images{" "}
                                    {selectedImages.length > 0 &&
                                        `(${selectedImages.length})`}
                                </h4>
                            </div>

                            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                                <SimpleFileUploader
                                    accept="image/*"
                                    multiple={true}
                                    maxFiles={10}
                                    onUploadComplete={(uploadedResults) => {
                                        // Thêm files đã upload vào danh sách và tự động chọn chúng
                                        setFiles([
                                            ...uploadedFiles,
                                            ...uploadedResults,
                                        ]);
                                        setSelectedImages((prevSelected) => [
                                            ...prevSelected,
                                            ...uploadedResults,
                                        ]);
                                    }}
                                />
                            </div>

                            {uploadedFiles.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-1 text-blue-700">
                                        <ImagePlus className="h-4 w-4" />
                                        Select Images for Product
                                    </h4>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file._id}
                                                className={`border rounded-md overflow-hidden cursor-pointer transition-all ${
                                                    selectedImages.some(
                                                        (img) =>
                                                            img._id === file._id
                                                    )
                                                        ? "ring-2 ring-blue-500 border-blue-300"
                                                        : "border-blue-100 hover:border-blue-300"
                                                }`}
                                                onClick={() =>
                                                    toggleImageSelection(
                                                        file._id
                                                    )
                                                }
                                            >
                                                <div className="relative aspect-square">
                                                    <img
                                                        src={file.fileUrl}
                                                        alt={file.fileName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                    {selectedImages.some(
                                                        (img) =>
                                                            img._id === file._id
                                                    ) && (
                                                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                                            ✓
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-1.5 bg-blue-50">
                                                    <p className="text-xs truncate text-blue-700">
                                                        {file.fileName}
                                                    </p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-[10px] text-blue-600">
                                                            {(
                                                                file.fileSize /
                                                                1024
                                                            ).toFixed(0)}{" "}
                                                            KB
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] h-4 px-1 bg-blue-100 text-blue-700 border-blue-200"
                                                        >
                                                            {file.fileType
                                                                .split("/")[1]
                                                                .toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator className="my-6" />

                        {/* Video section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <VideoIcon className="h-5 w-5 text-green-600" />
                                <h4 className="font-medium">
                                    Videos{" "}
                                    {selectedVideos.length > 0 &&
                                        `(${selectedVideos.length})`}
                                </h4>
                            </div>

                            <VideoUploader
                                onUploadComplete={(uploadedResults) => {
                                    // Thêm videos đã upload vào danh sách và tự động chọn chúng
                                    setVideos([
                                        ...uploadedVideos,
                                        ...uploadedResults,
                                    ]);
                                    setSelectedVideos((prevSelected) => [
                                        ...prevSelected,
                                        ...uploadedResults,
                                    ]);
                                }}
                            />

                            {uploadedVideos.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-1">
                                        <VideoIcon className="h-4 w-4" />
                                        Select Videos for Product
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        {uploadedVideos.map((file) => (
                                            <div
                                                key={file._id}
                                                className={`border rounded-md overflow-hidden cursor-pointer transition-all ${
                                                    selectedVideos.some(
                                                        (vid) =>
                                                            vid._id === file._id
                                                    )
                                                        ? "ring-2 ring-green-500 border-green-300"
                                                        : "hover:border-muted-foreground"
                                                }`}
                                                onClick={() =>
                                                    toggleVideoSelection(
                                                        file._id
                                                    )
                                                }
                                            >
                                                <div className="relative aspect-video">
                                                    <video
                                                        src={file.fileUrl}
                                                        className="h-full w-full object-cover"
                                                    />
                                                    {selectedVideos.some(
                                                        (vid) =>
                                                            vid._id === file._id
                                                    ) && (
                                                        <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                                            ✓
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2">
                                                    <p className="text-xs truncate text-muted-foreground">
                                                        {file.fileName}
                                                    </p>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {(
                                                                file.fileSize /
                                                                (1024 * 1024)
                                                            ).toFixed(1)}{" "}
                                                            MB
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] h-4 px-1 border-green-200"
                                                        >
                                                            {file.fileType
                                                                .split("/")[1]
                                                                .toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="flex items-center gap-1"
                    >
                        <X className="h-4 w-4" />
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-1"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting
                            ? "Saving..."
                            : isEditMode
                            ? "Update Product"
                            : "Create Product"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
