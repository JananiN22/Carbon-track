import axios from 'axios';

let apiBaseURL = import.meta.env.VITE_API_URL || '/api';
if (apiBaseURL && apiBaseURL !== '/api' && !apiBaseURL.endsWith('/api') && !apiBaseURL.endsWith('/api/')) {
  apiBaseURL = apiBaseURL.endsWith('/') ? `${apiBaseURL}api` : `${apiBaseURL}/api`;
}

const api = axios.create({
  baseURL: apiBaseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ct_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ct_token');
      localStorage.removeItem('ct_user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;
