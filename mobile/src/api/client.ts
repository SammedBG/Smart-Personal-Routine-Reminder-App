import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '../store/authStore';
import { saveTokens, clearTokens } from '../services/SecureStorage';
import { API_BASE_URL } from '../config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Track whether a refresh is in-flight to avoid duplicate refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

// Response interceptor: on 401, attempt token refresh once
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401 and if we haven't already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      // No refresh token available — force logout
      useAuthStore.getState().clearSession();
      await clearTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the ongoing refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call the refresh endpoint (refresh_token in request body)
      const { data } = await axios.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
      }>(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      }, {
        timeout: 10000,
      });

      const newAccessToken = data.access_token;
      const newRefreshToken = data.refresh_token;

      // Update store and secure storage
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setSession(user, newAccessToken, newRefreshToken);
      }
      await saveTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      // Retry queued requests
      processQueue(null, newAccessToken);

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — force logout
      useAuthStore.getState().clearSession();
      await clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

