import axios from "axios";

// Create an axios instance with default configuration
const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000, // 10 seconds timeout
});

export default api;
