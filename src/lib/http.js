import axios from 'axios';
import { API_BASE_URL } from './env';
import { notifyError } from './notify';
import { getStoredToken } from './storage';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    // Auto-unwrap ApiResponse wrapper: { status, message, data, timestamp } → data
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const fallbackMessage = 'Đã có lỗi xảy ra, vui lòng thử lại.';
    const apiMessage = error?.response?.data?.message;
    notifyError(apiMessage || fallbackMessage);
    const normalizedError = new Error(apiMessage || fallbackMessage);
    normalizedError.status = error?.response?.status;
    normalizedError.payload = error?.response?.data;
    return Promise.reject(normalizedError);
  },
);
