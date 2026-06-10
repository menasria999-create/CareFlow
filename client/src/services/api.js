import axios from 'axios';

// ✅ الآن نستخدم المتغير الذي تم تمريره من vite.config.js
// إذا لم ينجح، سيستخدم الرابط المحلي كحل احتياطي
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('🔴 401 error on URL:', error.config?.url);
            if (error.config?.url !== '/auth/me') {
                console.log('⚠️ Logging out due to 401 on:', error.config?.url);
                localStorage.removeItem('token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            } else {
                console.log('⚠️ 401 on /auth/me, clearing token but not redirecting');
                localStorage.removeItem('token');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
