import { ref, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getUsersByDepartment } from '@/api/user';
import { getAllDepartments } from '@/api/department';
import { showError } from '@/utils/errorHandler';

interface AdminDialogOptions {
    grantFn: (userId: number) => Promise<any>;
    revokeFn: (userId: number) => Promise<any>;
    permissionName: string;
    lockedDepartmentId?: Ref<number | null>;
    lockedDepartmentName?: Ref<string>;
    onSuccess?: () => Promise<void>;
}

export function useAdminDialog(options: AdminDialogOptions) {
    const {
        grantFn,
        revokeFn,
        permissionName,
        lockedDepartmentId,
        lockedDepartmentName,
        onSuccess,
    } = options;

    const isLocked = !!lockedDepartmentId;

    const adminDialogVisible = ref(false);
    const adminUserId = ref<number | null>(null);
    const allDepartments = ref<{ id: number; name: string }[]>([]);
    const selectedDepartmentId = ref<number | null>(null);
    const departmentUsers = ref<{ id: number; name: string }[]>([]);
    const loading = ref(false);

    const loadDepartmentUsers = async (deptId: number) => {
        adminUserId.value = null;
        departmentUsers.value = [];
        if (!deptId) return;
        try {
            const res = await getUsersByDepartment(deptId);
            if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
                departmentUsers.value = res.data.data.map((u: any) => ({ id: u.id, name: u.name }));
            }
        } catch (e) {
            console.error('加载部门用户失败:', e);
        }
    };

    const loadAllDepartments = async () => {
        try {
            const res = await getAllDepartments();
            if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
                allDepartments.value = res.data.data.map((d: any) => ({ id: d.id, name: d.name }));
            }
        } catch (e) {
            console.error('加载部门列表失败:', e);
        }
    };

    const openDialog = async () => {
        adminUserId.value = null;
        departmentUsers.value = [];

        if (isLocked) {
            const deptId = lockedDepartmentId!.value;
            if (!deptId) {
                ElMessage.warning('当前未选择部门');
                return;
            }
            selectedDepartmentId.value = deptId;
            if (lockedDepartmentName?.value) {
                allDepartments.value = [{ id: deptId, name: lockedDepartmentName.value }];
            }
            await loadDepartmentUsers(deptId);
        } else {
            selectedDepartmentId.value = null;
            if (allDepartments.value.length === 0) {
                await loadAllDepartments();
            }
        }

        adminDialogVisible.value = true;
    };

    const closeDialog = () => {
        adminDialogVisible.value = false;
    };

    const handleDepartmentChange = (deptId: number) => {
        loadDepartmentUsers(deptId);
    };

    const handleGrant = async () => {
        if (!adminUserId.value) {
            ElMessage.warning('请选择用户');
            return;
        }
        try {
            loading.value = true;
            await grantFn(adminUserId.value);
            ElMessage.success(`已授予${permissionName}权限`);
            adminUserId.value = null;
            onSuccess?.();
        } catch (error) {
            showError(error, '授权失败');
        } finally {
            loading.value = false;
        }
    };

    const handleRevoke = async () => {
        if (!adminUserId.value) {
            ElMessage.warning('请选择用户');
            return;
        }
        try {
            loading.value = true;
            await revokeFn(adminUserId.value);
            ElMessage.success(`已撤销${permissionName}权限`);
            adminUserId.value = null;
            onSuccess?.();
        } catch (error) {
            showError(error, '撤销失败');
        } finally {
            loading.value = false;
        }
    };

    return {
        adminDialogVisible,
        adminUserId,
        allDepartments,
        selectedDepartmentId,
        departmentUsers,
        loading,
        departmentDisabled: isLocked,
        openDialog,
        closeDialog,
        handleDepartmentChange,
        handleGrant,
        handleRevoke,
    };
}
