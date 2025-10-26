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
        // 从 localStorage 获取 token
        const token = localStorage.getItem('token');
        if (token) {
            // 将 token 添加到请求头
            config.headers.Authorization = `Bearer ${token}`;
        }
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
            const status = error.response.status;
            console.log('Error Status:', status);
            console.log('Error Data:', error.response.data);
            console.log('Error Headers:', error.response.headers);

            // 处理 401 错误 - token 过期或无效
            if (status === 401) {
                // 401 Unauthorized - token 无效或已过期
                console.warn('登录状态失效（401），清除登录信息');
                console.log('401错误详情:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.response?.data
                });
                console.log('清除前的localStorage:', {
                    token: localStorage.getItem('token'),
                    username: localStorage.getItem('vuems_name'),
                    profile: localStorage.getItem('userProfile')
                });

                localStorage.removeItem('token');
                localStorage.removeItem('vuems_name');
                localStorage.removeItem('userProfile');

                // 跳转到登录页（使用 hash 路由）
                setTimeout(() => {
                    window.location.hash = '#/login';
                }, 100);
            } else if (status === 403) {
                // 403 Forbidden - 权限不足，但不一定需要重新登录
                // 检查是否是鉴权失败（token 有效但无权限）还是需要重新登录
                const errorData = error.response.data as any;
                const errorMessage = errorData?.message || errorData?.msg || '';

                // 如果错误消息包含 token 相关信息，说明需要重新登录
                if (errorMessage.toLowerCase().includes('token') ||
                    errorMessage.toLowerCase().includes('unauthorized') ||
                    errorMessage.toLowerCase().includes('未授权') ||
                    errorMessage.toLowerCase().includes('登录')) {
                    console.warn('Token 无效导致403错误，清除登录信息');
                    console.log('403 Token错误详情:', {
                        url: error.config?.url,
                        method: error.config?.method,
                        errorMessage,
                        clearData: {
                            token: localStorage.getItem('token'),
                            username: localStorage.getItem('vuems_name'),
                            profile: localStorage.getItem('userProfile')
                        }
                    });
                    localStorage.removeItem('token');
                    localStorage.removeItem('vuems_name');
                    localStorage.removeItem('userProfile');

                    setTimeout(() => {
                        window.location.hash = '#/login';
                    }, 100);
                } else {
                    // 普通的权限不足，不自动跳转，由页面自己处理
                    console.warn('权限不足（403）：', errorMessage);
                }
            } else if (status === 404) {
                // 404 Not Found - 资源不存在，不处理
                console.log('资源不存在（404）');
            } else if (status >= 500) {
                // 500+ 服务器错误，不处理
                console.error('服务器错误（' + status + '）');
            }
        } else if (error.request) {
            // 请求已发出但没有收到响应 - 网络错误
            console.error('网络错误：无法连接到服务器');
        } else {
            // 请求配置错误
            console.error('请求错误：', error.message);
        }

        return Promise.reject(error);
    }
);

export default service;
