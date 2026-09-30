import axios from 'axios';

export const getRawBaseHost = (): string => {
  const envSocket = import.meta.env.VITE_SOCKET_URL;
  if (envSocket && envSocket.trim()) {
    let url = envSocket.trim();
    if (url.startsWith('wss://')) url = 'https://' + url.slice(6);
    else if (url.startsWith('ws://')) url = 'http://' + url.slice(5);
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (url.endsWith('/api/v1')) url = url.slice(0, -7);
    return url;
  }
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && envApi.trim()) {
    let url = envApi.trim();
    if (url.startsWith('wss://')) url = 'https://' + url.slice(6);
    else if (url.startsWith('ws://')) url = 'http://' + url.slice(5);
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (url.endsWith('/api/v1')) url = url.slice(0, -7);
    return url;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  return '';
};

const getBaseURL = () => {
  const host = getRawBaseHost();
  if (host) {
    return `${host}/api/v1`;
  }
  return '/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let activeSocketId: string | null = null;

export const setApiSocketId = (socketId: string | null) => {
  activeSocketId = socketId;
};

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('agribiz_access_token');
    if (config.headers) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (activeSocketId) {
        config.headers['X-Socket-Id'] = activeSocketId;
      }
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do NOT attempt token refresh for unauthenticated errors on auth routes
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authService = (await import('../auth/authService')).default;
        const res = await authService.refreshSession();

        if (res.success) {
          const accessToken = authService.getAccessToken();
          if (accessToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            processQueue(null, accessToken);
            return api(originalRequest);
          }
        }

        processQueue(new Error('Session refresh failed.'));
        if (typeof window !== 'undefined' && window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/';
        }
        return Promise.reject(error);
      } catch (refreshErr) {
        processQueue(refreshErr);
        if (typeof window !== 'undefined' && window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
