
/** 创建/更新用户时提交的性别：0 男，1 女，2 未确定（空值与未知也按 2） */
export type UserSexCode = 0 | 1 | 2;

/** 管理员创建/更新用户的写入字段。sex 为数字编码，不是列表接口返回的中文文案。 */
export interface UserAdminWritePayload {
    name: string;
    sex: UserSexCode;
    race: string;
    political_status: string;
    id_number: string;
}

export interface CreateUserPayload extends UserAdminWritePayload {
    department_id: number;
}

export interface User {
    id: number;
    wx_id: string;
    name: string;
    /** 读取接口返回的展示文案（如「男」「女」「未确定」），写入请使用 UserSexCode */
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
}

export interface Register {
    username: string;
    password: string;
    email: string;
}