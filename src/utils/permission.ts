import { usePermissStore, type UserProfile } from '@/store/permiss';
import { getAllDepartments } from '@/api/department';

/**
 * 部门节点接口
 */
interface DepartmentNode {
    id: number;
    parent_department_id: number;
    children?: DepartmentNode[];
}

/**
 * 权限检查工具类 - 懒加载模式
 */
export class PermissionChecker {
    private _store: ReturnType<typeof usePermissStore> | null = null;
    private _departmentTree: DepartmentNode[] = [];
    private _lastTreeFetch: number = 0;
    private readonly TREE_CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

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
     * 获取部门树结构（带缓存）
     */
    private async getDepartmentTree(): Promise<DepartmentNode[]> {
        const now = Date.now();

        // 检查缓存是否有效
        if (this._departmentTree.length > 0 && (now - this._lastTreeFetch) < this.TREE_CACHE_DURATION) {
            return this._departmentTree;
        }

        try {
            const response = await getAllDepartments();
            if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
                // 将API数据转换为树节点格式
                const departments = response.data.data.map((item: any) => ({
                    id: item.id,
                    parent_department_id: item.parent_department_id === -1 ? 0 : item.parent_department_id, // 处理根部门
                    children: []
                }));

                // 构建树结构
                this._departmentTree = this.buildDepartmentTree(departments);
                this._lastTreeFetch = now;
                return this._departmentTree;
            }
        } catch (error) {
            console.warn('获取部门树失败，使用空树:', error);
        }

        return [];
    }

    /**
     * 构建部门树结构
     */
    private buildDepartmentTree(departments: DepartmentNode[]): DepartmentNode[] {
        const map = new Map<number, DepartmentNode>();
        const tree: DepartmentNode[] = [];

        // 创建映射
        departments.forEach(dept => {
            map.set(dept.id, { ...dept, children: [] });
        });

        // 构建树
        departments.forEach(dept => {
            const node = map.get(dept.id)!;
            if (dept.parent_department_id === -1 || dept.parent_department_id === 0) {
                // 根部门
                tree.push(node);
            } else {
                const parent = map.get(dept.parent_department_id);
                if (parent) {
                    parent.children!.push(node);
                } else {
                    // 如果找不到父节点，作为根节点
                    console.warn(`找不到部门 ${dept.id} 的父部门 ${dept.parent_department_id}，作为根节点处理`);
                    tree.push(node);
                }
            }
        });

        return tree;
    }

    /**
     * 获取指定部门的所有子部门ID（包括嵌套子部门）
     */
    private async getChildDepartmentIds(departmentId: number): Promise<number[]> {
        const tree = await this.getDepartmentTree();
        const childIds: number[] = [];

        const findChildren = (departments: DepartmentNode[], targetId: number) => {
            for (const dept of departments) {
                if (dept.id === targetId) {
                    // 找到目标部门，收集所有子部门ID
                    collectChildren(dept);
                    return true;
                }
                if (dept.children && findChildren(dept.children, targetId)) {
                    return true;
                }
            }
            return false;
        };

        const collectChildren = (dept: DepartmentNode) => {
            if (dept.children) {
                for (const child of dept.children) {
                    childIds.push(child.id);
                    collectChildren(child);
                }
            }
        };

        // 从树根开始查找
        findChildren(tree, departmentId);
        return childIds;
    }

    /**
     * 获取指定部门的所有父部门ID（包括嵌套父部门）
     */
    private async getParentDepartmentIds(departmentId: number): Promise<number[]> {
        const tree = await this.getDepartmentTree();
        const parentIds: number[] = [];

        const findParents = (departments: DepartmentNode[], targetId: number, path: number[] = []): boolean => {
            for (const dept of departments) {
                if (dept.id === targetId) {
                    // 找到目标部门，保存路径上的所有父部门ID
                    parentIds.push(...path);
                    return true;
                }
                if (dept.children) {
                    const newPath = [...path, dept.id];
                    if (findParents(dept.children, targetId, newPath)) {
                        return true;
                    }
                }
            }
            return false;
        };

        // 从树根开始查找
        findParents(tree, departmentId);
        return parentIds;
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
     * 检查是否可以管理指定部门（支持权限继承）
     * 规则：如果你有部门A的直接权限，那么部门A的所有子部门你都有权限管理
     */
    async canManageDepartment(departmentId: number): Promise<boolean> {
        const store = this.getStore();

        // 超级管理员拥有所有权限
        if (store.isSuperAdmin) {
            return true;
        }

        const userProfile = store.userProfile;
        if (!userProfile?.manage_departments || userProfile.manage_departments.length === 0) {
            return false;
        }

        try {
            // 检查是否有直接管理权限
            if (userProfile.manage_departments.includes(departmentId)) {
                return true;
            }

            // 检查权限继承：如果目标部门是用户可管理部门的子部门，则有权限
            for (const allowedDeptId of userProfile.manage_departments) {
                const childIds = await this.getChildDepartmentIds(allowedDeptId);
                if (childIds.includes(departmentId)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.warn('检查权限继承时出错:', error);
            // 降级到直接权限检查
            return userProfile.manage_departments.includes(departmentId);
        }
    }

    /**
     * 同步版本的部门权限检查（不包含继承逻辑，用于向后兼容）
     */
    canManageDepartmentSync(departmentId: number): boolean {
        const store = this.getStore();
        return store.canManageDepartment(departmentId) ||
               store.isSuperAdmin;
    }

    /**
     * 检查用户是否可以管理部门及其所有子部门
     */
    async canManageDepartmentWithChildren(departmentId: number): Promise<boolean> {
        const canManage = await this.canManageDepartment(departmentId);
        if (!canManage) {
            return false;
        }

        // 如果能管理该部门，则自动拥有所有子部门的管理权限
        return true;
    }

    /**
     * 获取用户可管理的所有部门ID（包括继承的权限）
     */
    async getAllManageableDepartmentIds(): Promise<number[]> {
        const store = this.getStore();
        const userProfile = store.userProfile;

        // 超级管理员可以管理所有部门
        if (store.isSuperAdmin) {
            try {
                const tree = await this.getDepartmentTree();
                const allIds: number[] = [];
                const collectIds = (departments: DepartmentNode[]) => {
                    departments.forEach(dept => {
                        allIds.push(dept.id);
                        if (dept.children) {
                            collectIds(dept.children);
                        }
                    });
                };
                collectIds(tree);
                return allIds;
            } catch (error) {
                console.warn('获取所有部门ID失败:', error);
                return [];
            }
        }

        const manageableIds = new Set<number>();

        // 添加直接管理的部门
        if (userProfile?.manage_departments) {
            userProfile.manage_departments.forEach(id => manageableIds.add(id));
        }

        // 添加继承的子部门权限：如果用户能管理部门A，则能管理A的所有子部门
        try {
            for (const deptId of userProfile?.manage_departments || []) {
                const childIds = await this.getChildDepartmentIds(deptId);
                childIds.forEach(id => manageableIds.add(id));
            }
        } catch (error) {
            console.warn('获取继承部门权限失败:', error);
        }

        return Array.from(manageableIds);
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

        // 确保 store 已正确初始化，如果没有则尝试初始化
        if (!permissStore.userProfile && !permissStore.key.length) {
            const userProfileStr = localStorage.getItem('userProfile');
            const username = localStorage.getItem('vuems_name');

            if (userProfileStr) {
                try {
                    const userProfile = JSON.parse(userProfileStr);
                    permissStore.setUserProfile(userProfile);
                } catch (error) {
                    console.error('解析用户信息失败:', error);
                }
            } else if (username) {
                // 兼容旧版本
                const keys = username === 'admin' ? permissStore.defaultList.admin : permissStore.defaultList.user;
                permissStore.handleSet(keys);
            }
        }

        // 检查权限
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