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
// Meetings
export const scheduleMeeting = (data: Record<string, any>) => API.post('/api/meetings', data);
export const getMyMeetings = () => API.get('/api/meetings');
export const acceptMeeting = (id: string) => API.put(`/api/meetings/${id}/accept`);
export const rejectMeeting = (id: string) => API.put(`/api/meetings/${id}/reject`);
export const cancelMeeting = (id: string) => API.put(`/api/meetings/${id}/cancel`);
export const getAllUsers = () => API.get('/api/auth/users');
// Documents
export const uploadDocument = (formData: FormData) => 
  API.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const getDocuments = () => API.get('/api/documents');
export const signDocument = (id: string, signature: string) => 
  API.put(`/api/documents/${id}/sign`, { signature });
export const deleteDocument = (id: string) => API.delete(`/api/documents/${id}`);
export const updateDocumentStatus = (id: string, status: string) => 
  API.put(`/api/documents/${id}/status`, { status });