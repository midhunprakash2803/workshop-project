import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rentiq_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking /api/auth/me during app boot
      if (!error.config.url.includes('/auth/me')) {
        localStorage.removeItem('rentiq_token');
        localStorage.removeItem('rentiq_user');
      }
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getDemoAccounts: () => api.get('/auth/demo-accounts')
};

export const assetsAPI = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  getByCode: (code) => api.get(`/assets/code/${code}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`)
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

export const requestsAPI = {
  create: (data) => api.post('/requests', data),
  getAll: (params) => api.get('/requests', { params }),
  approve: (id) => api.put(`/requests/${id}/approve`),
  reject: (id, data) => api.put(`/requests/${id}/reject`, data),
  cancel: (id) => api.put(`/requests/${id}/cancel`)
};

export const rentalsAPI = {
  getAll: (params) => api.get('/rentals', { params }),
  getById: (id) => api.get(`/rentals/${id}`),
  issue: (data) => api.post('/rentals/issue', data),
  initiateReturn: (id) => api.put(`/rentals/${id}/initiate-return`),
  checkOverdue: () => api.post('/rentals/check-overdue'),
  sendReminder: (id) => api.post(`/rentals/${id}/remind`)
};

export const inspectionAPI = {
  uploadPhotos: (formData) => api.post('/inspections/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submitInspection: (data) => api.post('/inspections/inspect', data),
  getComparison: (rentalId) => api.get(`/inspections/comparison/${rentalId}`)
};

export const damageAPI = {
  getAll: (params) => api.get('/damage', { params }),
  create: (data) => api.post('/damage', data),
  update: (id, data) => api.put(`/damage/${id}`, data)
};

export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data)
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export const auditAPI = {
  getAll: (params) => api.get('/audit', { params })
};

export const dashboardAPI = {
  getMetrics: () => api.get('/dashboard/metrics')
};

export default api;
