import axios, { InternalAxiosRequestConfig } from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

API.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const registerUser = (data: Record<string, any>) => API.post('/api/auth/register', data);
export const loginUser = (data: Record<string, any>) => API.post('/api/auth/login', data);
export const getProfile = () => API.get('/api/auth/profile');
export const updateProfile = (data: Record<string, any>) => API.put('/api/auth/profile', data);