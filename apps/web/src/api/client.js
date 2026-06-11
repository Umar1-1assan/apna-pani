import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api`
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401, logout on failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken, setTokens } = useAuthStore.getState();
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/auth/refresh`,
          { refreshToken }
        );
        setTokens(data.data.accessToken, refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
