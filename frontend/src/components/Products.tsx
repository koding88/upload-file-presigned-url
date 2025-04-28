import { useState } from "react";
import { PackageOpen, PlusCircle, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ProductList from "@/components/ProductList";
import ProductForm from "@/components/ProductForm";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";

export default function Products() {
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState<string>("list");

    const handleAddClick = () => {
        setCurrentProduct(null);
        setActiveTab("form");
    };

    const handleEditClick = (product: Product) => {
        setCurrentProduct(product);
        setActiveTab("form");
    };

    const handleFormCancel = () => {
        setCurrentProduct(null);
        setActiveTab("list");
    };

    const handleFormSave = () => {
        setCurrentProduct(null);
        // Trigger a refresh of the product list
        setRefreshTrigger((prev) => prev + 1);
        setActiveTab("list");
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="p-2 rounded-full bg-primary/10 text-primary inline-flex">
                    <PackageOpen className="h-10 w-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Product Management
                </h1>
                <p className="text-muted-foreground max-w-[700px]">
                    Create, manage, and organize your products with rich media
                    content
                </p>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <div className="flex items-center justify-between mb-4">
                    {activeTab === "list" ? (
                        <div className="flex items-center justify-between w-full">
                            <h2 className="text-xl font-semibold">
                                Product List
                            </h2>
                            <Button
                                onClick={handleAddClick}
                                className="flex items-center gap-1"
                                variant="outline"
                            >
                                <PlusCircle className="h-4 w-4 mr-1" />
                                Add New Product
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <Button
                                onClick={handleFormCancel}
                                className="flex items-center gap-1"
                                variant="outline"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to Products
                            </Button>
                            <h2 className="text-xl font-semibold">
                                {currentProduct
                                    ? "Edit Product"
                                    : "Add New Product"}
                            </h2>
                        </div>
                    )}
                </div>

                <Card>
                    <CardContent className="p-6">
                        <TabsContent value="list" className="mt-0">
                            <ProductList
                                key={refreshTrigger}
                                onEdit={handleEditClick}
                                onAdd={handleAddClick}
                            />
                        </TabsContent>

                        <TabsContent value="form" className="mt-0">
                            <ProductForm
                                product={currentProduct}
                                onSave={handleFormSave}
                                onCancel={handleFormCancel}
                            />
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}
