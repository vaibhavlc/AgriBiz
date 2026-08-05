import axios from 'axios';

const getBaseURL = () => {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) {
    return envApi.endsWith('/') ? `${envApi}api/v1` : `${envApi}/api/v1`;
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

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('agribiz_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
        const storedRefreshToken = sessionStorage.getItem('agribiz_refresh_token');
        if (!storedRefreshToken) {
          processQueue(new Error('No refresh token available.'));
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post(
          `${getBaseURL()}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );
        const { success, accessToken, refreshToken: newRefreshToken, user, company } = refreshResponse.data;

        if (success && accessToken) {
          sessionStorage.setItem('agribiz_access_token', accessToken);
          if (newRefreshToken) {
            sessionStorage.setItem('agribiz_refresh_token', newRefreshToken);
          }
          sessionStorage.setItem('agribiz_current_user', JSON.stringify(user));
          sessionStorage.setItem('agribiz_current_company', JSON.stringify(company));
          
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          processQueue(null, accessToken);
          return api(originalRequest);
        } else {
          sessionStorage.removeItem('agribiz_access_token');
          sessionStorage.removeItem('agribiz_refresh_token');
          sessionStorage.removeItem('agribiz_current_user');
          sessionStorage.removeItem('agribiz_current_company');
          sessionStorage.removeItem('agribiz_auth_session');
          
          processQueue(new Error('Session refresh failed.'));
          if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
            window.location.href = '/';
          }
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        sessionStorage.removeItem('agribiz_access_token');
        sessionStorage.removeItem('agribiz_refresh_token');
        sessionStorage.removeItem('agribiz_current_user');
        sessionStorage.removeItem('agribiz_current_company');
        sessionStorage.removeItem('agribiz_auth_session');
        
        processQueue(refreshErr);
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
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
