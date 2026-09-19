import axios from 'axios';

const getBaseURL = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  const rawUrl = (typeof envUrl === 'string' && envUrl.trim())
    ? envUrl.trim()
    : 'http://localhost:5000';

  const sanitized = rawUrl.replace(/\/+$/, '');
  return sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('clinicflow_token') || localStorage.getItem('clinicflow_token');
  const clinicId = sessionStorage.getItem('clinicflow_clinic_id') || localStorage.getItem('clinicflow_clinic_id');

  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (clinicId && clinicId !== 'undefined' && clinicId !== 'null') {
    config.headers['X-Clinic-ID'] = clinicId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('clinicflow_token');
      sessionStorage.removeItem('clinicflow_user');
      sessionStorage.removeItem('clinicflow_clinic');
      sessionStorage.removeItem('clinicflow_clinic_id');
      localStorage.removeItem('clinicflow_token');
      localStorage.removeItem('clinicflow_user');
      localStorage.removeItem('clinicflow_clinic');
      localStorage.removeItem('clinicflow_clinic_id');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/sign-in') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
