import axios from "axios";

// Create an axios instance with default configuration
const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 300000, // 5 minutes timeout
});

export default api;
