import { usePermissStore, type UserProfile } from '@/store/permiss';

/**
 * 权限检查工具类 - 懒加载模式
 */
export class PermissionChecker {
    private _store: ReturnType<typeof usePermissStore> | null = null;

    /**
     * 获取权限 store 实例（懒加载）
     */
    private getStore() {
        if (!this._store) {
            this._store = usePermissStore();
        }
        return this._store;
    }

    /**
     * 设置用户信息并更新权限
     */
    setUserInfo(userData: UserProfile) {
        this.getStore().setUserProfile(userData);
    }

    /**
     * 清除用户信息
     */
    clearUserInfo() {
        this.getStore().clearUser();
    }

    /**
     * 检查是否有特定权限
     */
    hasPermission(permission: string): boolean {
        return this.getStore().hasPermission(permission);
    }

    /**
     * 检查是否有内容管理权限
     */
    canManageContent(): boolean {
        const store = this.getStore();
        return store.hasPermission('151') ||
               store.hasPermission('152') ||
               store.hasPermission('153');
    }

    /**
     * 检查是否有题目管理权限
     */
    canManageQuestions(): boolean {
        return this.getStore().hasPermission('16');
    }

    /**
     * 检查是否有组织管理权限
     */
    canManageOrganization(): boolean {
        return this.getStore().hasPermission('10');
    }

    /**
     * 检查是否有积分管理权限
     */
    canManagePoints(): boolean {
        const store = this.getStore();
        return store.hasPermission('171') ||
               store.hasPermission('172') ||
               store.hasPermission('173');
    }

    /**
     * 检查是否可以管理指定部门
     */
    canManageDepartment(departmentId: number): boolean {
        const store = this.getStore();
        return store.canManageDepartment(departmentId) ||
               store.isSuperAdmin;
    }

    /**
     * 检查是否为超级管理员
     */
    isSuperAdmin(): boolean {
        return this.getStore().isSuperAdmin;
    }

    /**
     * 获取当前用户角色列表
     */
    getUserRoles(): string[] {
        return this.getStore().userRoles;
    }

    /**
     * 检查是否有任意一个指定权限
     */
    hasAnyPermission(permissions: string[]): boolean {
        return permissions.some(permission => this.hasPermission(permission));
    }

    /**
     * 检查是否有所有指定权限
     */
    hasAllPermissions(permissions: string[]): boolean {
        return permissions.every(permission => this.hasPermission(permission));
    }
}

// 导出单例实例（懒加载）
export const permission = new PermissionChecker();

/**
 * 权限指令的更新逻辑
 */
export const updatePermissionElement = (el: HTMLElement, binding: any) => {
    const { value } = binding;

    // 延迟获取 store，确保 Pinia 已经初始化
    try {
        const permissStore = usePermissStore();

        if (value && !permissStore.key.includes(String(value))) {
            el.style.display = 'none';
        } else {
            el.style.display = '';
        }
    } catch (error) {
        console.warn('权限检查失败，可能是 Pinia 未初始化:', error);
        // 如果 store 不可用，默认显示元素
        el.style.display = '';
    }
};