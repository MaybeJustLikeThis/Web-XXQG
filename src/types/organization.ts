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
    admin?: Array<{
        id: number;
        name: string;
    }>;
}

export interface DepartmentUser {
    id: number;
    name: string;
    email: string;
    phone: string;
    invitationCode: string;
    status: 'active' | 'disabled';
    departmentId: number;
    departmentName: string;
    groupIds: number[];
    groups: string[];
    createTime: string;
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