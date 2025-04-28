import { create } from "zustand";
import api from "@/api/axios";
import axios from "axios";
import { Product, CreateProductRequest, UpdateProductRequest } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "";

interface ProductStore {
    // States
    products: Product[];
    currentProduct: Product | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchProducts: () => Promise<Product[]>;
    getProductById: (id: string) => Promise<Product>;
    createProduct: (data: CreateProductRequest) => Promise<Product>;
    updateProduct: (id: string, data: UpdateProductRequest) => Promise<Product>;
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
            const products = response.data.payload;
            set({ products });
            return products;
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.error || (error as Error).message
                : "Failed to fetch products";
            set({ error: errorMessage });
            throw error;
        } finally {
            set({ isLoading: false });
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

    createProduct: async (data) => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.post(`${API_URL}/products`, data);
            const newProduct = response.data.payload;
            set((state) => ({ products: [...state.products, newProduct] }));
            return newProduct;
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.error || (error as Error).message
                : "Failed to create product";
            set({ error: errorMessage });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateProduct: async (id, data) => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.put(`${API_URL}/products/${id}`, data);
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
