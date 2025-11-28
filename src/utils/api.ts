import axios from 'axios';

// Mengambil URL dari Environment Variable
// Fallback ke localhost jika env var tidak terbaca (untuk safety saat dev local)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8082/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (Untuk Token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
