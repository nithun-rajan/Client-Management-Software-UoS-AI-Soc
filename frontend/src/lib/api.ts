import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Don't clear tokens or redirect if we're already on login/register pages
      // These pages handle their own authentication state
      if (currentPath !== "/login" && currentPath !== "/register") {
        // Clear token and redirect to login
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        // Use replace to avoid adding to history
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
