<template>
    <el-dialog
        :model-value="visible"
        title="部门管理员管理"
        width="620px"
        :close-on-click-modal="false"
        @open="handleOpen"
        @close="handleClose"
    >
        <el-tabs v-model="activeTab">
            <!-- 设置管理员 -->
            <el-tab-pane label="设置管理员" name="set">
                <el-form label-width="90px">
                    <el-form-item label="部门名称">
                        <el-input :model-value="departmentName" disabled />
                    </el-form-item>
                    <el-form-item label="选择管理员">
                        <el-select
                            v-model="selectedUserId"
                            filterable
                            clearable
                            placeholder="请选择管理员"
                            :loading="userLoading"
                            style="width: 100%"
                        >
                            <el-option
                                v-for="user in availableUsers"
                                :key="user.id"
                                :label="user.name || `用户${user.id}`"
                                :value="user.id"
                            />
                        </el-select>
                        <div class="hint">共 {{ availableUsers.length }} 个可选成员</div>
                    </el-form-item>
                </el-form>
            </el-tab-pane>

            <!-- 取消管理员 -->
            <el-tab-pane label="取消管理员" name="unset">
                <div class="dept-line">部门：{{ departmentName }}</div>
                <div class="list-title">当前管理员列表：</div>
                <el-table :data="localAdmins" border style="width: 100%">
                    <el-table-column prop="name" label="管理员姓名" min-width="160" />
                    <el-table-column prop="id" label="ID" width="120" align="center" />
                    <el-table-column label="操作" width="120" align="center">
                        <template #default="{ row }">
                            <el-button
                                type="danger"
                                size="small"
                                :loading="revokingId === row.id"
                                @click="handleUnset(row)"
                            >
                                取消
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <el-empty v-if="localAdmins.length === 0" description="暂无管理员" :image-size="60" />
            </el-tab-pane>
        </el-tabs>

        <template #footer>
            <template v-if="activeTab === 'set'">
                <el-button @click="handleClose">取消</el-button>
                <el-button
                    type="primary"
                    :loading="submitting"
                    :disabled="!selectedUserId"
                    @click="handleSet"
                >
                    确认设置
                </el-button>
            </template>
            <el-button v-else @click="handleClose">关闭</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getUsersByDepartment } from '@/api/user';
import { setDepartmentAdmin, unsetDepartmentAdmin } from '@/api/department';
import { showError } from '@/utils/errorHandler';
import type { DepartmentUser } from '@/types/organization';

interface AdminItem {
    id: number;
    name: string;
}

const props = defineProps<{
    visible: boolean;
    departmentId: number | null;
    departmentName: string;
    admins: AdminItem[];
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    'data-changed': [];
}>();

const activeTab = ref<'set' | 'unset'>('set');
const localAdmins = ref<AdminItem[]>([]);
const departmentMembers = ref<DepartmentUser[]>([]);
const selectedUserId = ref<number | null>(null);
const userLoading = ref(false);
const submitting = ref(false);
const revokingId = ref<number | null>(null);

// 可选成员 = 部门成员 - 已是管理员
const availableUsers = computed(() => {
    const adminIds = new Set(localAdmins.value.map(item => item.id));
    return departmentMembers.value.filter(user => !adminIds.has(user.id));
});

watch(
    () => props.admins,
    (admins) => {
        localAdmins.value = Array.isArray(admins) ? admins.map(item => ({ ...item })) : [];
    },
    { immediate: true }
);

const fetchMembers = async () => {
    if (!props.departmentId) {
        departmentMembers.value = [];
        return;
    }
    userLoading.value = true;
    try {
        const res = await getUsersByDepartment(props.departmentId);
        const data = res.data?.data || res.data || [];
        departmentMembers.value = Array.isArray(data) ? data : data.list || [];
    } catch (error) {
        showError(error, '获取成员列表失败');
    } finally {
        userLoading.value = false;
    }
};

const handleOpen = () => {
    activeTab.value = 'set';
    selectedUserId.value = null;
    localAdmins.value = Array.isArray(props.admins)
        ? props.admins.map(item => ({ ...item }))
        : [];
    fetchMembers();
};

const handleSet = async () => {
    if (!props.departmentId || !selectedUserId.value) return;
    submitting.value = true;
    try {
        await setDepartmentAdmin({
            department_id: props.departmentId,
            admin_id: selectedUserId.value
        });
        ElMessage.success('设置管理员成功');
        // 即时反馈：把新管理员加入本地列表（父组件 data-changed 后会再同步）
        const user = availableUsers.value.find(u => u.id === selectedUserId.value);
        if (user) {
            localAdmins.value = [...localAdmins.value, { id: user.id, name: user.name }];
        }
        selectedUserId.value = null;
        emit('data-changed');
    } catch (error) {
        showError(error, '设置管理员失败');
    } finally {
        submitting.value = false;
    }
};

const handleUnset = async (admin: AdminItem) => {
    if (!props.departmentId) return;
    revokingId.value = admin.id;
    try {
        await unsetDepartmentAdmin({
            department_id: props.departmentId,
            admin_id: admin.id
        });
        ElMessage.success('取消管理员成功');
        localAdmins.value = localAdmins.value.filter(a => a.id !== admin.id);
        emit('data-changed');
    } catch (error) {
        showError(error, '取消管理员失败');
    } finally {
        revokingId.value = null;
    }
};

const handleClose = () => emit('update:visible', false);
</script>

<style scoped>
.hint {
    color: #909399;
    font-size: 12px;
    line-height: 1.6;
}

.dept-line {
    margin-bottom: 12px;
    color: #606266;
    font-size: 14px;
}

.list-title {
    margin-bottom: 8px;
    color: #303133;
    font-weight: 500;
    font-size: 14px;
}
</style>
