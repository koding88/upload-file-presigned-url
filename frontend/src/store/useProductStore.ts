import { create } from "zustand";
import api from "@/api/axios";
import axios from "axios";
import { Product, ProductForm, ProductUpdateForm } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "";

interface ProductStore {
    // States
    products: Product[];
    currentProduct: Product | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchProducts: () => Promise<void>;
    getProductById: (id: string) => Promise<Product>;
    createProduct: (productData: ProductForm) => Promise<Product>;
    updateProduct: (
        id: string,
        productData: ProductUpdateForm
    ) => Promise<Product>;
    deleteProduct: (id: string) => Promise<void>;
    setCurrentProduct: (product: Product | null) => void;
    clearError: () => void;
}

const useProductStore = create<ProductStore>((set) => ({
    products: [],
    currentProduct: null,
    isLoading: false,
    error: null,

    fetchProducts: async () => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.get(`${API_URL}/products`);
            set({
                products: response.data.payload || [],
                isLoading: false,
            });
        } catch (error: unknown) {
            set({
                error: error instanceof Error ? error.message : "Unknown error",
                isLoading: false,
            });
        }
    },

    getProductById: async (id) => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.get(`${API_URL}/products/${id}`);
            const product = response.data.payload;
            set({ currentProduct: product });
            return product;
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.error || (error as Error).message
                : "Failed to fetch product";
            set({ error: errorMessage });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    createProduct: async (productData) => {
        const response = await api.post(`${API_URL}/products`, productData);
        const newProduct = response.data.payload;
        set((state) => ({
            products: [...state.products, newProduct],
        }));
        return newProduct;
    },

    updateProduct: async (id, productData) => {
        try {
            const response = await api.put(
                `${API_URL}/products/${id}`,
                productData
            );
            const updatedProduct = response.data.payload;
            set((state) => ({
                products: state.products.map((product) =>
                    product._id === id ? updatedProduct : product
                ),
                currentProduct: updatedProduct,
            }));
            return updatedProduct;
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.error || (error as Error).message
                : "Failed to update product";
            set({ error: errorMessage });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteProduct: async (id) => {
        try {
            set({ isLoading: true, error: null });
            await api.delete(`${API_URL}/products/${id}`);
            set((state) => ({
                products: state.products.filter(
                    (product) => product._id !== id
                ),
            }));
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.error || (error as Error).message
                : "Failed to delete product";
            set({ error: errorMessage });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    setCurrentProduct: (product) => {
        set({ currentProduct: product });
    },

    clearError: () => {
        set({ error: null });
    },
}));

export default useProductStore;
