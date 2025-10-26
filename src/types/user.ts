
export interface User {
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
}

export interface Register {
    username: string;
    password: string;
    email: string;
}