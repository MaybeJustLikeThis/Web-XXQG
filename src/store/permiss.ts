import { defineStore } from 'pinia';

interface ObjectList {
    [key: string]: string[];
}

// 用户信息接口
export interface UserProfile {
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

export const usePermissStore = defineStore('permiss', {
    state: () => {
        // 权限码定义
        const PERMISSION_CODES = {
            // 基础权限
            DASHBOARD: '0',
            SYSTEM_BASIC: '1',

            // 组织管理
            ORG_MANAGE: '10',

            // 内容管理
            CONTENT_MODULE: '15',
            CONTENT_ARTICLES: '151',
            CONTENT_TOPICS: '152',
            CONTENT_COLUMNS: '153',

            // 题目管理
            QUESTION_MANAGE: '16',

            // 积分管理
            POINTS_MODULE: '17',
            POINTS_RULES: '171',
            POINTS_RECORDS: '172',
            POINTS_STATS: '173',

            // 系统管理
            MENU_MANAGE: '13',
            ICON_MANAGE: '5',
            THEME_MANAGE: '7',

            // 表格操作
            TABLE_BASIC: '31',
            TABLE_EDIT: '32',
            TABLE_IMPORT: '33',
            TABLE_EXPORT: '34',

            // 图表
            CHART_SCHART: '41',
            CHART_ECHARTS: '42',

            // 组件权限
            FORM: '21',
            UPLOAD: '22',
            CAROUSEL: '23',
            CALENDAR: '24',
            WATERMARK: '25',
            TOUR: '26',
            STEPS: '27',
            STATISTIC: '28',
            EDITOR: '291',
            MARKDOWN: '292',
        };

        // 角色权限映射
        const ROLE_PERMISSIONS = {
            // 超级管理员 - 拥有所有权限
            SUPER_ADMIN: Object.values(PERMISSION_CODES),

            // 内容管理员 - 内容相关权限
            CONTENT_MANAGER: [
                PERMISSION_CODES.DASHBOARD,
                PERMISSION_CODES.SYSTEM_BASIC,
                PERMISSION_CODES.CONTENT_MODULE,
                PERMISSION_CODES.CONTENT_ARTICLES,
                PERMISSION_CODES.CONTENT_TOPICS,
                PERMISSION_CODES.CONTENT_COLUMNS,
                PERMISSION_CODES.EDITOR,
                PERMISSION_CODES.MARKDOWN,
                PERMISSION_CODES.UPLOAD,
                PERMISSION_CODES.TABLE_BASIC,
                PERMISSION_CODES.TABLE_IMPORT,
                PERMISSION_CODES.TABLE_EXPORT,
                PERMISSION_CODES.CHART_SCHART,
                PERMISSION_CODES.CHART_ECHARTS,
                PERMISSION_CODES.ICON_MANAGE,
                PERMISSION_CODES.THEME_MANAGE,
            ],

            // 题目管理员 - 题目相关权限
            QUESTION_MANAGER: [
                PERMISSION_CODES.DASHBOARD,
                PERMISSION_CODES.SYSTEM_BASIC,
                PERMISSION_CODES.QUESTION_MANAGE,
                PERMISSION_CODES.FORM,
                PERMISSION_CODES.TABLE_BASIC,
                PERMISSION_CODES.TABLE_EDIT,
                PERMISSION_CODES.TABLE_IMPORT,
                PERMISSION_CODES.TABLE_EXPORT,
                PERMISSION_CODES.UPLOAD,
                PERMISSION_CODES.CHART_SCHART,
                PERMISSION_CODES.CHART_ECHARTS,
            ],

            // 部门管理员 - 基础权限 + 组织管理
            DEPARTMENT_MANAGER: [
                PERMISSION_CODES.DASHBOARD,
                PERMISSION_CODES.SYSTEM_BASIC,
                PERMISSION_CODES.ORG_MANAGE,
                PERMISSION_CODES.TABLE_BASIC,
                PERMISSION_CODES.TABLE_EXPORT,
                PERMISSION_CODES.CHART_SCHART,
                PERMISSION_CODES.POINTS_STATS,
            ],

            // 普通用户 - 最基础权限
            USER: [
                PERMISSION_CODES.DASHBOARD,
                PERMISSION_CODES.SYSTEM_BASIC,
                PERMISSION_CODES.ICON_MANAGE,
            ],
        };

        // 默认权限列表（保持向后兼容）
        const defaultList: ObjectList = {
            admin: ROLE_PERMISSIONS.SUPER_ADMIN,
            user: ROLE_PERMISSIONS.USER,
        };

        // 从localStorage获取用户信息
        const getUserProfile = (): UserProfile | null => {
            const profileStr = localStorage.getItem('userProfile');
            if (profileStr) {
                try {
                    return JSON.parse(profileStr);
                } catch (e) {
                    console.error('Failed to parse user profile:', e);
                }
            }
            return null;
        };

        const profile = getUserProfile();
        const username = localStorage.getItem('vuems_name');

        // 根据用户数据确定权限
        const getUserPermissions = (): string[] => {
            if (profile) {
                const permissions: string[] = [];

                // 超级管理员权限
                if (profile.is_super_admin) {
                    permissions.push(...ROLE_PERMISSIONS.SUPER_ADMIN);
                    return permissions;
                }

                // 内容管理员权限
                if (profile.edit_text) {
                    permissions.push(...ROLE_PERMISSIONS.CONTENT_MANAGER);
                }

                // 题目管理员权限
                if (profile.edit_question) {
                    permissions.push(...ROLE_PERMISSIONS.QUESTION_MANAGER);
                }

                // 部门管理员权限
                if (profile.manage_departments && profile.manage_departments.length > 0) {
                    permissions.push(...ROLE_PERMISSIONS.DEPARTMENT_MANAGER);
                }

                // 如果没有任何特殊角色，给予基础用户权限
                if (permissions.length === 0) {
                    permissions.push(...ROLE_PERMISSIONS.USER);
                }

                return [...new Set(permissions)]; // 去重
            }

            // 向后兼容：使用原有的用户名判断逻辑
            return username === 'admin' ? defaultList.admin : defaultList.user;
        };

        return {
            key: getUserPermissions(),
            userProfile: profile,
            defaultList,
            ROLE_PERMISSIONS,
            PERMISSION_CODES,
        };
    },
    getters: {
        // 获取用户角色
        userRoles: (state) => {
            if (!state.userProfile) return [];

            const roles = [];
            if (state.userProfile.is_super_admin) roles.push('超级管理员');
            if (state.userProfile.edit_text) roles.push('内容管理员');
            if (state.userProfile.edit_question) roles.push('题目管理员');
            if (state.userProfile.manage_departments?.length > 0) roles.push('部门管理员');

            return roles.length > 0 ? roles : ['普通用户'];
        },

        // 检查是否有特定权限
        hasPermission: (state) => (permission: string) => {
            return state.key.includes(permission);
        },

        // 检查是否有部门管理权限
        canManageDepartment: (state) => (departmentId: number) => {
            return state.userProfile?.manage_departments?.includes(departmentId) || false;
        },

        // 检查是否为超级管理员
        isSuperAdmin: (state) => {
            return state.userProfile?.is_super_admin || false;
        },
    },
    actions: {
        // 设置用户信息并更新权限
        setUserProfile(profile: UserProfile) {
            this.userProfile = profile;
            localStorage.setItem('userProfile', JSON.stringify(profile));
            localStorage.setItem('vuems_name', profile.name);

            // 重新计算权限
            const permissions: string[] = [];

            if (profile.is_super_admin) {
                permissions.push(...this.ROLE_PERMISSIONS.SUPER_ADMIN);
            } else {
                if (profile.edit_text) {
                    permissions.push(...this.ROLE_PERMISSIONS.CONTENT_MANAGER);
                }
                if (profile.edit_question) {
                    permissions.push(...this.ROLE_PERMISSIONS.QUESTION_MANAGER);
                }
                if (profile.manage_departments?.length > 0) {
                    permissions.push(...this.ROLE_PERMISSIONS.DEPARTMENT_MANAGER);
                }
                if (permissions.length === 0) {
                    permissions.push(...this.ROLE_PERMISSIONS.USER);
                }
            }

            this.key = [...new Set(permissions)];
        },

        // 清除用户信息
        clearUser() {
            this.userProfile = null;
            this.key = [];
            localStorage.removeItem('userProfile');
            localStorage.removeItem('vuems_name');
        },

        // 直接设置权限（向后兼容）
        handleSet(val: string[]) {
            this.key = val;
        },
    },
});
