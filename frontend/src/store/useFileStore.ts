import { create } from "zustand";
import api from "@/api/axios";
import axios from "axios";
import { FileData, UploadUrlResponse } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "";

interface FileStore {
    // States
    uploadedFiles: FileData[];
    uploadedVideos: FileData[];
    isLoading: boolean;
    error: string | null;

    // Actions
    generateUploadUrl: (params: {
        fileType: string;
        fileName: string;
    }) => Promise<UploadUrlResponse>;
    uploadFileToS3: (uploadUrl: string, file: File) => Promise<void>;

    setFiles: (files: FileData[]) => void;
    setVideos: (videos: FileData[]) => void;
    clearError: () => void;
}

const useFileStore = create<FileStore>((set) => ({
    uploadedFiles: [],
    uploadedVideos: [],
    isLoading: false,
    error: null,

    generateUploadUrl: async (params) => {
        try {
            set({ isLoading: true, error: null });
            const response = await api.post(
                `${API_URL}/files/generate-upload-url`,
                params
            );
            return response.data.payload;
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.error || (error as Error).message
                : "Failed to generate upload URL";
            set({ error: errorMessage });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    uploadFileToS3: async (uploadUrl, file) => {
        try {
            set({ isLoading: true, error: null });
            await api.put(uploadUrl, file, {
                headers: {
                    "Content-Type": file.type,
                },
            });
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.error || (error as Error).message
                : "Failed to upload file to storage";
            set({ error: errorMessage });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    setFiles: (files) => {
        set({ uploadedFiles: files });
    },

    setVideos: (videos) => {
        set({ uploadedVideos: videos });
    },

    clearError: () => {
        set({ error: null });
    },
}));

export default useFileStore;
