import axios from "axios";

// LOCAL DEV:  VITE_API_URL is empty → vite proxy kicks in → /api/* → backend
// PRODUCTION: VITE_API_URL = "https://shopyfix-backend.onrender.com" (set in Vercel dashboard)
const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
// Paths keep full /api/... prefix so they work in BOTH environments:
//   Local:      "" + "/api/auth/login" → vite proxy → backend ✅
//   Production: "https://...onrender.com" + "/api/auth/login"  ✅
export const loginUser      = (data) => api.post("/api/auth/login", data);
export const registerUser   = (data) => api.post("/api/auth/register", data);
export const getCurrentUser = ()     => api.get("/api/auth/me");

// ── Other routes (add yours here) ────────────────────────────────────────────
// export const getProducts   = ()     => api.get("/api/products");
// export const getCategories = ()     => api.get("/api/categories");

export default api;