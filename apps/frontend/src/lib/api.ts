import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Dishes
export const dishApi = {
  getAll: (params?: Record<string, string | number | boolean>) =>
    api.get('/dishes', { params }),
  getOne: (id: string) => api.get(`/dishes/${id}`),
  create: (data: unknown) => api.post('/dishes', data),
  update: (id: string, data: unknown) => api.put(`/dishes/${id}`, data),
  delete: (id: string) => api.delete(`/dishes/${id}`),
  toggleAvailability: (id: string) => api.patch(`/dishes/${id}/availability`),
};

// Orders
export const orderApi = {
  create: (data: unknown) => api.post('/orders', data),
  getAll: (params?: Record<string, string | number | boolean>) => api.get('/orders', { params }),
  getOne: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  getStats: () => api.get('/orders/stats'),
  export: (params?: Record<string, string>) =>
    api.get('/orders/export', { params, responseType: 'blob' }),
  createManual: (data: unknown) => api.post('/orders/manual', data),
  archiveFriday: () => api.post('/orders/archive-friday'),
  archiveSelected: (ids: string[]) => api.post('/orders/archive-selected', { ids }),
};

// Auth
export const authApi = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Settings
export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
  getPickupMessages: () => api.get('/settings/pickup-messages'),
  createPickupMessage: (data: unknown) => api.post('/settings/pickup-messages', data),
  updatePickupMessage: (id: string, data: unknown) => api.put(`/settings/pickup-messages/${id}`, data),
};

// Admin
export const adminApi = {
  getWhatsAppMessage: () => api.get('/admin/whatsapp-message'),
  getFridayMenuImage: () => api.get('/admin/friday-menu-image'),
};

// Upload
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteImage: (publicId: string) => api.delete(`/upload/${encodeURIComponent(publicId)}`),
};
