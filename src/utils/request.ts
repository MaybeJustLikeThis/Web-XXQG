import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const getBaseURL = () => {
    // 开发环境使用代理
    if (import.meta.env.DEV) {
        return '/api';
    }
    // 生产环境使用完整URL
    return import.meta.env.VITE_API_BASE_URL || 'https://api.xuexi.geekyuu.com';
};

// 通用请求实例（需要认证的接口）
const service: AxiosInstance = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
    withCredentials: true, // 需要后端支持CORS credentials
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// 登录专用请求实例
const authService: AxiosInstance = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
    withCredentials: true, // 后端已修复支持CORS
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// 通用请求拦截器
service.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 添加token到请求头（非登录接口）
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 登录请求拦截器（不需要token）
authService.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 登录接口不需要Authorization头
        return config;
    },
    (error: AxiosError) => {
        console.error('登录请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
const responseInterceptor = (response: AxiosResponse) => {
    // 检查业务层面的响应码（HTTP 200 + 业务code 401）
    if (response.data && typeof response.data === 'object' && response.data.code === 401) {
        console.warn('认证失败: 业务返回code 401，token未验证或已过期');
        handleAuthError('业务码401');
        return Promise.reject(new Error('用户未登录'));
    }

    // HTTP状态码检查
    if (response.status === 200) {
        return response;
    } else {
        return Promise.reject(new Error(`HTTP请求失败: ${response.status}`));
    }
};

// 错误响应拦截器
const errorInterceptor = (error: AxiosError) => {
    if (error.response) {
        const status = error.response.status;

        // 如果返回401或403，说明认证失败，清除本地存储的用户信息
        if (status === 401 || status === 403) {
            console.warn(`认证失败: HTTP ${status} - 权限不足或token过期`);
            handleAuthError(`HTTP ${status}`);
        } else {
            console.error(`请求错误: HTTP ${status}`, error.response.data);
        }
    } else if (error.request) {
        console.error('网络错误: 请求发送失败', error.message);
    } else {
        console.error('请求配置错误:', error.message);
    }

    return Promise.reject(error);
};

// 为通用服务添加响应拦截器
service.interceptors.response.use(responseInterceptor, errorInterceptor);

// 为认证服务添加响应拦截器
authService.interceptors.response.use(responseInterceptor, errorInterceptor);

// 处理认证错误的统一函数
const handleAuthError = (errorType?: string) => {
    console.log(`认证错误处理 (${errorType}): 清除用户数据并跳转`);

    // 清除所有认证相关的本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('vuems_name');
    localStorage.removeItem('login-param');

    // 避免在登录页重复跳转
    const currentPath = window.location.hash || window.location.pathname;
    if (currentPath !== '#/login' && currentPath !== '/login') {
        console.log('跳转到登录页面');
        window.location.href = '/#/login';
    }
};

// 默认导出通用服务（向后兼容）
export default service;

// 导出认证服务，用于登录等不需要token的接口
export { authService };
