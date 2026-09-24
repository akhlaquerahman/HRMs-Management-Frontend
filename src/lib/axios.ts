import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import NProgress from 'nprogress';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6002/api',
  withCredentials: true,
});

let activeRequests = 0;

const startLoader = () => {
  // Global loader removed per user request
};

const stopLoader = () => {
  // Global loader removed per user request
};

api.interceptors.request.use((config) => {
  startLoader();
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  stopLoader();
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    stopLoader();
    return response;
  },
  async (error) => {
    stopLoader();
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        startLoader();
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        stopLoader();
        if (res.data.success) {
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.getState().setAuth(currentUser, res.data.data.token);
          }
          originalRequest.headers.Authorization = `Bearer ${res.data.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        stopLoader();
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
