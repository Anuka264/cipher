import axios from 'axios';

const API = axios.create({
    //baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    baseURL: import.meta.env.PROD 
        ? 'https://cipher-backend.onrender.com/api' 
        : 'http://localhost:5001/api',
});

API.interceptors.request.use((config) => {
    const publicPaths = ['/users/register', '/users/login'];
    const requestUrl = config.url || '';

    if (publicPaths.some((path) => requestUrl.includes(path))) {
        if (config.headers && 'Authorization' in config.headers) {
            delete config.headers.Authorization;
        }
        return config;
    }

    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
