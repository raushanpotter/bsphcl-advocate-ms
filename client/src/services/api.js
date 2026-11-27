import axios from 'axios';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://bsphcl-advocate-api.onrender.com';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (BACKEND_URL ? `${BACKEND_URL}/api` : '/api');
export const UPLOADS_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/uploads` : '/uploads';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
