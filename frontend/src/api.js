import axios from 'axios';
import toast from 'react-hot-toast';

export const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
});

// Request interceptor for API calls
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

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Logout user if token is expired/invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
      return Promise.reject(error);
    }
    
    const message = error.response?.data?.detail || error.message || 'An unexpected error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export default api;
