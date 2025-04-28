import { useState, useEffect } from "react";
import {
    Edit,
    Trash2,
    Image as ImageIcon,
    Video,
    Package,
    Loader2,
    Info,
    AlertTriangle,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Product } from "@/types";
import useProductStore from "@/store/useProductStore";

interface ProductListProps {
    onEdit: (product: Product) => void;
    onAdd: () => void;
}

export default function ProductList({ onEdit, onAdd }: ProductListProps) {
    const { products, fetchProducts, deleteProduct, isLoading, error } =
        useProductStore();
    const [expandedProductId, setExpandedProductId] = useState<string | null>(
        null
    );

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDelete = async (id: string) => {
        try {
            await deleteProduct(id);
        } catch (err) {
            console.error("Error deleting product:", err);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedProductId((prevId) => (prevId === id ? null : id));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                        Loading products...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="my-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Package className="h-16 w-16 text-muted-foreground/30" />
                <h3 className="text-xl font-medium text-muted-foreground">
                    No products found
                </h3>
                <p className="text-sm text-muted-foreground">
                    Get started by creating your first product
                </p>
                <Button onClick={onAdd} className="mt-2">
                    Create Product
                </Button>
            </div>
        );
    }

    // Find expanded product for safety
    const expandedProduct = expandedProductId
        ? products.find((p) => p._id === expandedProductId)
        : null;

    return (
        <div className="space-y-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Product</TableHead>
                        <TableHead>Media</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product._id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="font-normal"
                                    >
                                        #{product._id.substring(0, 6)}
                                    </Badge>
                                    <span className="truncate max-w-[200px]">
                                        {product.name}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                    >
                                        <ImageIcon className="h-3 w-3" />
                                        {product.images?.length || 0}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                    >
                                        <Video className="h-3 w-3" />
                                        {product.videos?.length || 0}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            toggleExpand(product._id)
                                        }
                                    >
                                        <Info className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(product)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Are you sure?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be
                                                    undone. This will
                                                    permanently delete the
                                                    product and all associated
                                                    media.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        handleDelete(
                                                            product._id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {expandedProduct && (
                <Card className="mt-4 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            {expandedProduct.name}
                        </CardTitle>
                        <CardDescription>
                            Product details and media content
                        </CardDescription>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                        {expandedProduct.images?.length === 0 &&
                        expandedProduct.videos?.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                                No media content available for this product
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {expandedProduct.images?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                            <ImageIcon className="h-4 w-4" />
                                            Images (
                                            {expandedProduct.images.length})
                                        </h4>
                                        <ScrollArea className="h-48 w-full rounded-md border">
                                            <div className="flex gap-2 p-2">
                                                {expandedProduct.images.map(
                                                    (image) => (
                                                        <a
                                                            key={image._id}
                                                            href={image.fileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="relative group"
                                                        >
                                                            <img
                                                                src={
                                                                    image.fileUrl
                                                                }
                                                                alt={
                                                                    image.fileName
                                                                }
                                                                className="h-40 w-40 object-cover rounded-md border border-border transition-all group-hover:border-primary group-hover:shadow-sm"
                                                            />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                                                <span className="text-white text-xs px-2 py-1 bg-black/60 rounded-md max-w-[90%] overflow-hidden whitespace-nowrap text-ellipsis">
                                                                    {
                                                                        image.fileName
                                                                    }
                                                                </span>
                                                            </div>
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}

                                {expandedProduct.videos?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                            <Video className="h-4 w-4" />
                                            Videos (
                                            {expandedProduct.videos.length})
                                        </h4>
                                        <ScrollArea className="h-72 w-full rounded-md border">
                                            <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {expandedProduct.videos.map(
                                                    (video) => (
                                                        <div
                                                            key={video._id}
                                                            className="space-y-1"
                                                        >
                                                            <video
                                                                src={
                                                                    video.fileUrl
                                                                }
                                                                controls
                                                                className="w-full rounded-md border border-border aspect-video object-cover"
                                                            />
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {video.fileName}
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end border-t pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(expandedProduct)}
                        >
                            Edit Product
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
