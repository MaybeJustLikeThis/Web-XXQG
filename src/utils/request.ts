import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const getBaseURL = () => {
    // 开发环境使用代理
    if (import.meta.env.DEV) {
        return '/api';
    }
    // 生产环境使用完整URL
    return import.meta.env.VITE_API_BASE_URL || "https://api.xuexi.9998k.cn";
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
    // 跳过二进制响应的业务码解析
    if (response.config.responseType === 'blob') {
        return response;
    }

    if (response.data && typeof response.data === 'object') {
        const { code, msg } = response.data;

        // 业务码 401：认证失败
        if (code === 401) {
            handleAuthError();
            return Promise.reject(new Error(msg || '用户未登录'));
        }

        // 业务码非 200：业务错误（如 code 500）
        if (code !== undefined && code !== 200) {
            console.error(`业务错误: code ${code}`, msg);
            return Promise.reject(new Error(msg || '请求失败'));
        }
    }

    return response;
};

// 错误响应拦截器
const errorInterceptor = (error: AxiosError) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).__CANCEL__ || (error as any).code === 'ERR_CANCELED') {
        return Promise.reject(error);
    }

    if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data as Record<string, unknown> | undefined;

        // 如果返回401或403，说明认证失败，清除本地存储的用户信息
        if (status === 401 || status === 403) {
            handleAuthError();
            const msg = typeof responseData?.msg === 'string' ? responseData.msg : '登录已过期，请重新登录';
            return Promise.reject(new Error(msg));
        }

        console.error(`请求错误: HTTP ${status}`, error.response.data);
        const backendMsg = typeof responseData?.msg === 'string' ? responseData.msg : undefined;
        return Promise.reject(new Error(backendMsg || '服务器异常，请稍后重试'));
    }

    if (error.request) {
        console.error('网络错误: 请求发送失败', error.message);
        return Promise.reject(new Error('网络连接失败，请检查网络'));
    }

    console.error('请求配置错误:', error.message);
    return Promise.reject(new Error('请求配置错误，请稍后重试'));
};

// 为通用服务添加响应拦截器
service.interceptors.response.use(responseInterceptor, errorInterceptor);

// 为认证服务添加响应拦截器
authService.interceptors.response.use(responseInterceptor, errorInterceptor);

// 处理认证错误的统一函数
const handleAuthError = () => {

    // 清除所有认证相关的本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('vuems_name');
    localStorage.removeItem('login-param');

    // 避免在登录页重复跳转
    const currentPath = window.location.hash || window.location.pathname;
    if (currentPath !== '#/login' && currentPath !== '/login') {
        window.location.href = '/#/login';
    }
};

// 默认导出通用服务（向后兼容）
export default service;

// 导出认证服务，用于登录等不需要token的接口
export { authService };
