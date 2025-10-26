import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const getBaseURL = () => {
    // 开发环境使用代理
    if (import.meta.env.DEV) {
        return '/api';
    }
    // 生产环境使用完整URL
    return import.meta.env.VITE_API_BASE_URL || 'https://api.xuexi.geekyuu.com';
};

const service: AxiosInstance = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
    withCredentials: true, // 禁用cookie支持，避免CORS问题
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        return config;
    },
    (error: AxiosError) => {
        console.log(error);
        return Promise.reject();
    }
);

service.interceptors.response.use(
    (response: AxiosResponse) => {
        if (response.status === 200) {
            return response;
        } else {
            Promise.reject();
        }
    },
    (error: AxiosError) => {
        console.log('Response Error:', error);
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Data:', error.response.data);
            console.log('Error Headers:', error.response.headers);
        }
        return Promise.reject(error);
    }
);

export default service;
