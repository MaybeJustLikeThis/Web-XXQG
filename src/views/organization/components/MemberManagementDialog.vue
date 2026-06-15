<template>
    <el-dialog
        :model-value="visible"
        :title="`${department?.name || '部门'} - 成员管理`"
        width="1100px"
        top="5vh"
        @open="handleOpen"
        @close="handleClose"
    >
        <!-- 工具栏 + 搜索（单行，宽度不足时自动换行） -->
        <div class="toolbar">
            <div class="toolbar-left">
                <el-button type="primary" :icon="Plus" @click="openAdd">新增成员</el-button>
                <el-upload
                    :show-file-list="false"
                    :auto-upload="true"
                    :before-upload="handleBeforeUpload"
                    accept=".xls,.xlsx"
                    class="upload-inline"
                >
                    <el-button type="success" :icon="Upload" :loading="importing">批量导入</el-button>
                </el-upload>
                <el-button type="warning" :icon="Download" :loading="exporting" @click="handleExport">
                    批量导出
                </el-button>
                <el-button type="warning" :icon="Key" @click="openPermission('text')">添加文章管理员</el-button>
                <el-button type="warning" :icon="Key" @click="openPermission('question')">添加题目管理员</el-button>
            </div>
            <div class="toolbar-right">
                <el-input
                    v-model="keyword"
                    placeholder="请输入姓名"
                    clearable
                    style="width: 220px"
                    @keyup.enter="onSearch"
                />
                <el-button type="primary" :icon="Search" @click="onSearch">搜索</el-button>
                <el-button :icon="Refresh" @click="onReset">重置</el-button>
            </div>
        </div>

        <!-- 表格 -->
        <el-table :data="displayData" v-loading="loading" border stripe style="width: 100%">
            <el-table-column type="selection" width="45" align="center" />
            <el-table-column type="index" label="序号" width="60" align="center">
                <template #default="{ $index }">
                    {{ $index + 1 + (page.page - 1) * page.size }}
                </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" min-width="90" show-overflow-tooltip />
            <el-table-column prop="sex" label="性别" width="60" align="center" />
            <el-table-column prop="race" label="民族" width="80" show-overflow-tooltip />
            <el-table-column prop="political_status" label="政治面貌" min-width="100" show-overflow-tooltip />
            <el-table-column prop="id_number" label="手机号" min-width="120" show-overflow-tooltip />
            <el-table-column prop="department" label="部门" min-width="120" show-overflow-tooltip />
            <el-table-column label="微信ID" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                    <span v-if="row.wx_id">{{ row.wx_id }}</span>
                    <span v-else class="muted">未激活</span>
                </template>
            </el-table-column>
            <el-table-column prop="invite_code" label="邀请码" width="90" align="center" />
            <el-table-column label="超级管理员" width="90" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.is_super_admin ? 'success' : 'info'" size="small">
                        {{ row.is_super_admin ? '是' : '否' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="文章/题目管理权限" min-width="130" align="center">
                <template #default="{ row }">
                    <span v-if="!row.edit_text && !row.edit_question" class="muted">暂无权限</span>
                    <span v-else>
                        <el-tag v-if="row.edit_text" type="primary" size="small">文章</el-tag>
                        <el-tag
                            v-if="row.edit_question"
                            type="success"
                            size="small"
                            style="margin-left: 4px"
                        >题目</el-tag>
                    </span>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="290" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button type="warning" size="small" :icon="Key" @click="openResetPwd(row)">
                        修改密码
                    </el-button>
                    <el-button type="primary" size="small" :icon="Edit" @click="openEdit(row)">编辑</el-button>
                    <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
            <el-pagination
                v-model:current-page="page.page"
                v-model:page-size="page.size"
                :page-sizes="[10, 20, 50, 100]"
                :total="filteredMembers.length"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="page.page = 1"
            />
        </div>

        <template #footer>
            <el-button @click="handleClose">关闭</el-button>
        </template>

        <!-- 新增/编辑 -->
        <MemberEditDialog
            v-model:visible="editVisible"
            :mode="editMode"
            :department-id="department?.id ?? null"
            :user="editUser"
            @success="onEditSuccess"
        />
        <!-- 文章/题目管理员授权 -->
        <PermissionAdminDialog
            v-model:visible="permissionVisible"
            :title="permissionTitle"
            :permission-type="permissionType"
            :locked-department-id="department?.id ?? null"
            :locked-department-name="department?.name || ''"
            @success="onPermissionSuccess"
        />
        <!-- 改密（不影响成员列表，无需刷新） -->
        <AdminResetPasswordDialog v-model="resetPwdVisible" :user="resetPwdUser" />
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Upload, Download, Search, Refresh, Key, Edit, Delete } from '@element-plus/icons-vue';
import { getUsersByDepartment, addUsersByFile, deleteUser } from '@/api/user';
import { exportDepartmentUsers } from '@/api/department';
import { showError } from '@/utils/errorHandler';
import type { Department, DepartmentUser } from '@/types/organization';
import MemberEditDialog from './MemberEditDialog.vue';
import PermissionAdminDialog from './PermissionAdminDialog.vue';
import AdminResetPasswordDialog from '@/components/AdminResetPasswordDialog.vue';

const props = defineProps<{
    visible: boolean;
    department: Department | null;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    'data-changed': [];
}>();

const loading = ref(false);
const importing = ref(false);
const exporting = ref(false);
const members = ref<DepartmentUser[]>([]);
const keyword = ref('');
const page = reactive({ page: 1, size: 10 });

// 前端按姓名过滤
const filteredMembers = computed(() => {
    const kw = keyword.value.trim();
    if (!kw) return members.value;
    return members.value.filter(m => (m.name || '').includes(kw));
});

// 前端分页
const displayData = computed(() => {
    const start = (page.page - 1) * page.size;
    return filteredMembers.value.slice(start, start + page.size);
});

const fetchMembers = async () => {
    if (!props.department?.id) {
        members.value = [];
        return;
    }
    loading.value = true;
    try {
        const res = await getUsersByDepartment(props.department.id);
        const data = res.data?.data || res.data || [];
        members.value = Array.isArray(data) ? data : data.list || [];
    } catch (error) {
        showError(error, '获取成员列表失败');
    } finally {
        loading.value = false;
    }
};

const handleOpen = () => {
    keyword.value = '';
    page.page = 1;
    fetchMembers();
};

const handleClose = () => emit('update:visible', false);

const onSearch = () => {
    page.page = 1;
};

const onReset = () => {
    keyword.value = '';
    page.page = 1;
};

// ===== 新增/编辑 =====
const editVisible = ref(false);
const editMode = ref<'add' | 'edit'>('add');
const editUser = ref<DepartmentUser | null>(null);

const openAdd = () => {
    editMode.value = 'add';
    editUser.value = null;
    editVisible.value = true;
};

const openEdit = (row: DepartmentUser) => {
    editMode.value = 'edit';
    editUser.value = { ...row };
    editVisible.value = true;
};

// ===== 修改密码 =====
const resetPwdVisible = ref(false);
const resetPwdUser = ref<{ id: number; name: string } | null>(null);

const openResetPwd = (row: DepartmentUser) => {
    resetPwdUser.value = { id: row.id, name: row.name };
    resetPwdVisible.value = true;
};

// ===== 文章/题目管理员授权 =====
const permissionVisible = ref(false);
const permissionType = ref<'text' | 'question'>('text');
const permissionTitle = ref('');

const openPermission = (type: 'text' | 'question') => {
    permissionType.value = type;
    permissionTitle.value = type === 'text' ? '文章管理员管理' : '题目管理员管理';
    permissionVisible.value = true;
};

// ===== 删除 =====
const handleDelete = async (row: DepartmentUser) => {
    try {
        await ElMessageBox.confirm(`确定删除成员“${row.name}”吗？`, '提示', { type: 'warning' });
    } catch {
        return;
    }
    try {
        const res = await deleteUser({ user_id: row.id });
        if (res.data && res.data.code === 200) {
            ElMessage.success('删除成功');
            emit('data-changed');
            await fetchMembers();
        } else {
            showError(res, '删除失败');
        }
    } catch (error) {
        showError(error, '删除失败');
    }
};

// ===== 批量导入（before-upload 拦截，返回 false 阻止默认上传，手动调用接口）=====
const handleBeforeUpload = (file: File) => {
    doImport(file);
    return false;
};

const doImport = async (file: File) => {
    if (!props.department?.id) return;
    importing.value = true;
    try {
        await addUsersByFile(props.department.id, file);
        ElMessage.success('导入完成');
        emit('data-changed');
        await fetchMembers();
    } catch (error) {
        showError(error, '导入成员失败');
    } finally {
        importing.value = false;
    }
};

// ===== 批量导出 =====
const handleExport = async () => {
    if (!props.department?.id) return;
    exporting.value = true;
    try {
        const res = await exportDepartmentUsers(props.department.id);
        const blob = new Blob([res.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${props.department.name || '部门'}成员.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        ElMessage.success('导出成功');
    } catch (error) {
        showError(error, '导出成员失败');
    } finally {
        exporting.value = false;
    }
};

// 子弹窗成功回调
const onEditSuccess = () => {
    emit('data-changed');
    fetchMembers();
};

const onPermissionSuccess = () => {
    fetchMembers();
};
</script>

<style scoped>
.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
}

.upload-inline {
    display: inline-block;
}

.pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
}

.muted {
    color: #909399;
    font-size: 12px;
}
</style>
