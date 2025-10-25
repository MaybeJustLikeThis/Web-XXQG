import request from '../utils/request';

export interface LoginParams {
    id_number: string;
    password: string;
}

export interface LoginResponse {
    code: number;
    msg: string;
    data: {
        token: string;
        user: {
            id: number;
            username: string;
            role: string;
        };
        priority: number; // 权限优先级，数值越大权限越高
    } | null;
}

export const login = (params: LoginParams) => {
    return request<LoginResponse>({
        url: '/user/login_with_password',
        method: 'post',
        data: params
    });
};