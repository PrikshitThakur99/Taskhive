import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskhive_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error — backend not running
      error.message = 'Cannot connect to server. Make sure the backend is running on port 5000.';
      console.error('❌ Network Error:', error.message);
      return Promise.reject(error);
    }
    if (error.response.status === 401) {
      const isAuthRoute = error.config.url?.includes('/auth/');
      if (!isAuthRoute) {
        localStorage.removeItem('taskhive_token');
        localStorage.removeItem('taskhive_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
