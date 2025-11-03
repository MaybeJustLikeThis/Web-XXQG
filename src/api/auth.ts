import request from '../utils/request';

export interface LoginParams {
    id_number: string;
    password: string;
}

export interface LoginResponse {
    code: number;
    msg: string;
    data: {
        id: number;
        wx_id: string;
        name: string;
        sex: string;
        race: string;
        political_status: string;
        id_number: string;
        department: string;
        points: number;
        is_super_admin: boolean;
        edit_text: boolean;
        edit_question: boolean;
        manage_departments: number[];
        invite_code?: string;
        token?: string; // 可选的token字段
    } | null;
}

export const login = (params: LoginParams) => {
    return request<LoginResponse>({
        url: '/user/login_with_password',
        method: 'post',
        data: params
    });
};

export interface UpdatePasswordParams {
    password: string;
}

export interface UpdatePasswordResponse {
    code: number;
    msg: string;
    data: null;
}

export const updatePassword = (params: UpdatePasswordParams) => {
    return request<UpdatePasswordResponse>({
        url: '/user/update_password',
        method: 'post',
        data: params
    });
};