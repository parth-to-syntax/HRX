import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  timeout: 15000,
});

function normalizeError(error) {
  if (error && error.response) {
    const { status, data } = error.response;
    return {
      status,
      message: data?.error || data?.message || error.message || 'Request failed',
      details: data,
    };
  }
  return { status: 0, message: error?.message || 'Network error', details: null };
}

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const n = normalizeError(err);
    if (n.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(n);
  }
);

export default api;
