import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
};

// Reports APIs
export const reportsAPI = {
    upload: (formData) => api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getAll: () => api.get('/reports'),
    getById: (id) => api.get(`/reports/${id}`),
    delete: (id) => api.delete(`/reports/${id}`),
    search: (params) => api.get('/reports/search/filter', { params }),
    getFile: (id) => `${API_BASE_URL}/reports/${id}/file`,
    downloadFile: (id) => api.get(`/reports/${id}/file`, { responseType: 'blob' }),
};

// Vitals APIs
export const vitalsAPI = {
    add: (data) => api.post('/vitals', data),
    getByReport: (reportId) => api.get(`/vitals/report/${reportId}`),
    getTrends: (params) => api.get('/vitals/trends', { params }),
    getSummary: () => api.get('/vitals/summary'),
    delete: (id) => api.delete(`/vitals/${id}`),
};

// Sharing APIs
export const sharingAPI = {
    share: (data) => api.post('/sharing/share', data),
    revoke: (shareId) => api.delete(`/sharing/share/${shareId}`),
    getReceived: () => api.get('/sharing/received'),
    getSent: () => api.get('/sharing/sent'),
    getByReport: (reportId) => api.get(`/sharing/report/${reportId}`),
};

export default api;
