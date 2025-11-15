// src/api/axiosInstance.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backportalelectro.onrender.com/api',
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
