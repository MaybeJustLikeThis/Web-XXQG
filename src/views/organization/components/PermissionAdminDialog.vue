<template>
    <el-dialog
        :model-value="visible"
        :title="title"
        width="480px"
        :close-on-click-modal="false"
        @close="handleClose"
    >
        <el-form label-width="80px">
            <el-form-item label="选择部门">
                <el-input :model-value="lockedDepartmentName" disabled />
            </el-form-item>
            <el-form-item label="选择用户">
                <el-select
                    v-model="selectedUserId"
                    filterable
                    clearable
                    placeholder="请搜索用户姓名"
                    :loading="loading"
                    style="width: 100%"
                >
                    <el-option
                        v-for="u in users"
                        :key="u.id"
                        :label="u.name || `用户${u.id}`"
                        :value="u.id"
                    />
                </el-select>
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="handleClose">关闭</el-button>
            <el-button type="primary" :loading="granting" :disabled="!selectedUserId" @click="handleGrant">
                授权
            </el-button>
            <el-button type="danger" :loading="revoking" :disabled="!selectedUserId" @click="handleRevoke">
                撤销
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
    getUsersByDepartment,
    grantTextEdit,
    revokeTextEdit,
    grantQuestionEdit,
    revokeQuestionEdit
} from '@/api/user';
import { showError } from '@/utils/errorHandler';
import type { DepartmentUser } from '@/types/organization';

const props = defineProps<{
    visible: boolean;
    title: string;
    permissionType: 'text' | 'question';
    lockedDepartmentId: number | null;
    lockedDepartmentName: string;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    'success': [];
}>();

const users = ref<DepartmentUser[]>([]);
const selectedUserId = ref<number | null>(null);
const loading = ref(false);
const granting = ref(false);
const revoking = ref(false);

const fetchUsers = async () => {
    if (!props.lockedDepartmentId) {
        users.value = [];
        return;
    }
    loading.value = true;
    try {
        const res = await getUsersByDepartment(props.lockedDepartmentId);
        const data = res.data?.data || res.data || [];
        users.value = Array.isArray(data) ? data : data.list || [];
    } catch (error) {
        showError(error, '获取用户列表失败');
    } finally {
        loading.value = false;
    }
};

watch(
    () => props.visible,
    (v) => {
        if (v) {
            selectedUserId.value = null;
            fetchUsers();
        }
    }
);

const handleGrant = async () => {
    if (!selectedUserId.value) return;
    granting.value = true;
    try {
        const action = props.permissionType === 'text' ? grantTextEdit : grantQuestionEdit;
        await action(selectedUserId.value);
        ElMessage.success('授权成功');
        emit('success');
        handleClose();
    } catch (error) {
        showError(error, '授权失败');
    } finally {
        granting.value = false;
    }
};

const handleRevoke = async () => {
    if (!selectedUserId.value) return;
    revoking.value = true;
    try {
        const action = props.permissionType === 'text' ? revokeTextEdit : revokeQuestionEdit;
        await action(selectedUserId.value);
        ElMessage.success('撤销成功');
        emit('success');
        handleClose();
    } catch (error) {
        showError(error, '撤销失败');
    } finally {
        revoking.value = false;
    }
};

const handleClose = () => emit('update:visible', false);
</script>
