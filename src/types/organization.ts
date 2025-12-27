export interface Department {
    id: number;
    name: string;
    parentId: number | null;
    level: number;
    description?: string;
    manager?: string;
    phone?: string;
    createTime: string;
    children?: Department[];
    userCount?: number;
    activeCount?: number;
    admin?: Array<{
        id: number;
        name: string;
    }>;
}

export interface DepartmentUser {
    id: number;
    wx_id: string;
    name: string;
    sex: string;
    race: string;
    political_status: string;
    id_number: string;
    department: string;
    invite_code: string;
    points: number;
    is_super_admin: boolean;
    edit_text: boolean;
    edit_question: boolean;
    manage_departments: any[];
    // 兼容旧字段
    email?: string;
    phone?: string;
    status?: 'active' | 'disabled';
    departmentId?: number;
    departmentName?: string;
    groupIds?: number[];
    groups?: string[];
    createTime?: string;
    lastLoginTime?: string;
}

export interface UserGroup {
    id: number;
    name: string;
    description?: string;
    color?: string;
    userCount: number;
    createTime: string;
}

export interface ImportUserItem {
    name: string;
    phone?: string;
    email?: string;
    departmentName: string;
    groupName?: string;
}

export interface OrganizationTreeItem extends Department {
    children?: OrganizationTreeItem[];
}