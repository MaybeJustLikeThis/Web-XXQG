<template>
    <div class="member-management">
        <div class="header">
            <h2>成员管理</h2>
            <div class="header-actions">
                <el-button type="primary" @click="showAddMemberDialog">
                    <el-icon><Plus /></el-icon>
                    添加成员
                </el-button>
                <el-button type="success" @click="showImportMemberDialog">
                    <el-icon><Upload /></el-icon>
                    批量导入
                </el-button>
            </div>
        </div>

        <!-- 筛选区域 -->
        <div class="filter-section">
            <el-form :model="searchForm" inline>
                <el-form-item label="姓名">
                    <el-input
                        v-model="searchForm.name"
                        placeholder="请输入姓名"
                        clearable
                        style="width: 200px"
                    />
                </el-form-item>
                <el-form-item label="部门">
                    <el-tree-select
                        v-model="searchForm.departmentId"
                        :data="departmentOptions"
                        :props="treeProps"
                        placeholder="请选择部门"
                        clearable
                        check-strictly
                        style="width: 200px"
                    />
                </el-form-item>
                <el-form-item label="政治面貌">
                    <el-select
                        v-model="searchForm.political_status"
                        placeholder="请选择政治面貌"
                        clearable
                        style="width: 150px"
                    >
                        <el-option label="中共党员" value="中共党员" />
                        <el-option label="共青团员" value="共青团员" />
                        <el-option label="群众" value="群众" />
                        <el-option label="其他" value="其他" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button @click="resetSearch">重置</el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 成员表格 -->
        <div class="table-section">
            <el-table
                :data="tableData"
                border
                style="width: 100%"
                v-loading="loading"
            >
                <el-table-column type="selection" width="55" />
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="name" label="姓名" min-width="100" />
                <el-table-column prop="sex" label="性别" width="60" />
                <el-table-column prop="race" label="民族" width="80" />
                <el-table-column prop="political_status" label="政治面貌" width="100" />
                <el-table-column prop="department" label="部门" width="120" />
                <el-table-column prop="wx_id" label="微信ID" min-width="150" show-overflow-tooltip />
                <el-table-column prop="is_super_admin" label="超级管理员" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.is_super_admin ? 'warning' : 'info'" size="small">
                            {{ row.is_super_admin ? '是' : '否' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="权限" width="150">
                    <template #default="{ row }">
                        <el-tag v-if="row.edit_text" type="success" size="small" class="permission-tag">
                            编辑文本
                        </el-tag>
                        <el-tag v-if="row.edit_question" type="primary" size="small" class="permission-tag">
                            编辑题目
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="showEditMemberDialog(row)">
                            编辑
                        </el-button>
                        <el-button
                            type="warning"
                            size="small"
                            @click="toggleMemberPermissions(row)"
                        >
                            权限
                        </el-button>
                        <el-button
                            type="danger"
                            size="small"
                            @click="removeMember(row)"
                        >
                            移除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination">
                <el-pagination
                    v-model:current-page="pagination.page"
                    v-model:page-size="pagination.size"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="pagination.total"
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                />
            </div>
        </div>

        <!-- 添加/编辑成员弹窗 -->
        <el-dialog
            v-model="memberFormDialogVisible"
            :title="isEditMember ? '编辑成员' : '添加成员'"
            width="600px"
            @close="resetMemberForm"
        >
            <el-form
                ref="memberFormRef"
                :model="memberFormData"
                :rules="memberFormRules"
                label-width="120px"
            >
                <el-form-item label="姓名" prop="name">
                    <el-input v-model="memberFormData.name" placeholder="请输入姓名" />
                </el-form-item>
                <el-form-item label="性别" prop="sex">
                    <el-select v-model="memberFormData.sex" placeholder="请选择性别" style="width: 100%">
                        <el-option label="男" value="男" />
                        <el-option label="女" value="女" />
                    </el-select>
                </el-form-item>
                <el-form-item label="民族" prop="race">
                    <el-input v-model="memberFormData.race" placeholder="请输入民族" />
                </el-form-item>
                <el-form-item label="政治面貌" prop="political_status">
                    <el-select v-model="memberFormData.political_status" placeholder="请选择政治面貌" style="width: 100%">
                        <el-option label="中共党员" value="中共党员" />
                        <el-option label="共青团员" value="共青团员" />
                        <el-option label="群众" value="群众" />
                        <el-option label="其他" value="其他" />
                    </el-select>
                </el-form-item>
                <el-form-item label="身份证号" prop="id_number">
                    <el-input v-model="memberFormData.id_number" placeholder="请输入身份证号" />
                </el-form-item>
                <el-form-item label="部门" prop="department">
                    <el-input v-model="memberFormData.department" placeholder="请输入部门" />
                </el-form-item>
                <el-form-item label="微信ID">
                    <el-input v-model="memberFormData.wx_id" placeholder="请输入微信ID" />
                </el-form-item>
                <el-form-item label="超级管理员">
                    <el-switch v-model="memberFormData.is_super_admin" />
                </el-form-item>
                <el-form-item label="权限设置">
                    <el-checkbox v-model="memberFormData.edit_text">编辑文本权限</el-checkbox>
                    <el-checkbox v-model="memberFormData.edit_question">编辑题目权限</el-checkbox>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="memberFormDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleMemberSubmit">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Upload } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { DepartmentUser, UserGroup, Department } from '@/types/organization';
import { getUsersByDepartment, getAllUsers, removeUserFromDepartment, toggleUserStatus } from '@/api/user';
import { getAllDepartments } from '@/api/department';

// 响应式数据
const loading = ref(false);
const tableData = ref<DepartmentUser[]>([]);
const departmentOptions = ref<Department[]>([]);
const groupOptions = ref<UserGroup[]>([]);
const memberFormDialogVisible = ref(false);
const memberFormRef = ref<FormInstance>();
const isEditMember = ref(false);

// 搜索表单
const searchForm = reactive({
    name: '',
    departmentId: null as number | null,
    political_status: ''
});

// 分页数据
const pagination = reactive({
    page: 1,
    size: 10,
    total: 0
});

// 成员表单数据
const memberFormData = reactive({
    id: 0,
    name: '',
    wx_id: '',
    sex: '',
    race: '',
    political_status: '',
    id_number: '',
    department: '',
    points: 0,
    is_super_admin: false,
    edit_text: false,
    edit_question: false
});

const treeProps = {
    children: 'children',
    label: 'name',
    value: 'id'
};

// 表单验证规则
const memberFormRules = {
    name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 50, message: '姓名长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    sex: [
        { required: true, message: '请选择性别', trigger: 'change' }
    ],
    race: [
        { required: true, message: '请输入民族', trigger: 'blur' }
    ],
    political_status: [
        { required: true, message: '请选择政治面貌', trigger: 'change' }
    ],
    id_number: [
        { required: true, message: '请输入身份证号', trigger: 'blur' },
        { pattern: /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的身份证号格式', trigger: 'blur' }
    ],
    department: [
        { required: true, message: '请输入部门', trigger: 'blur' }
    ]
};

// 获取部门选项
const getDepartmentOptions = async () => {
    try {
        const res = await getAllDepartments();
        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            const departments = res.data.data.map((item: any) => ({
                id: item.id,
                name: item.name || '未命名部门',
                parentId: item.parent_department_id === -1 ? null : item.parent_department_id,
                children: []
            }));
            departmentOptions.value = buildDepartmentTree(departments);
        }
    } catch (error) {
        console.error('获取部门数据失败:', error);
    }
};

// 构建部门树结构
const buildDepartmentTree = (departments: Department[]): Department[] => {
    const map = new Map<number, Department>();
    const tree: Department[] = [];

    departments.forEach(dept => {
        map.set(dept.id, { ...dept, children: [] });
    });

    departments.forEach(dept => {
        const node = map.get(dept.id)!;
        if (dept.parentId === null) {
            tree.push(node);
        } else {
            const parent = map.get(dept.parentId);
            if (parent) {
                parent.children!.push(node);
            } else {
                tree.push(node);
            }
        }
    });

    return tree;
};

// 获取成员数据
const getMemberData = async () => {
    loading.value = true;
    try {
        let res;

        // 如果选择了特定部门，调用部门用户接口
        if (searchForm.departmentId) {
            res = await getUsersByDepartment(searchForm.departmentId);
        } else {
            // 否则获取所有用户
            res = await getAllUsers();
        }

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            const apiData: DepartmentUser[] = res.data.data.map((item: any) => ({
                id: item.id,
                wx_id: item.wx_id || '',
                name: item.name || '未命名用户',
                sex: item.sex || '',
                race: item.race || '',
                political_status: item.political_status || '',
                id_number: item.id_number || '',
                department: item.department || '未分配',
                points: item.points || 0,
                is_super_admin: item.is_super_admin || false,
                edit_text: item.edit_text || false,
                edit_question: item.edit_question || false,
                manage_departments: item.manage_departments || [],
                // 兼容旧字段
                email: item.email || '',
                phone: item.phone || '',
                status: 'active',
                departmentId: 0,
                departmentName: item.department || '未分配',
                groupIds: [],
                groups: [],
                createTime: '',
                lastLoginTime: undefined
            }));

            // 应用筛选条件
            let filteredData = apiData.filter(user => {
                if (searchForm.name && !user.name.includes(searchForm.name)) return false;
                if (searchForm.political_status && user.political_status !== searchForm.political_status) return false;
                return true;
            });

            pagination.total = filteredData.length;
            const start = (pagination.page - 1) * pagination.size;
            const end = start + pagination.size;
            tableData.value = filteredData.slice(start, end);
        } else {
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        console.error('获取成员数据错误:', error);
        ElMessage.error('获取成员数据失败');
        tableData.value = [];
        pagination.total = 0;
    } finally {
        loading.value = false;
    }
};

// 获取用户分组数据
const getGroupData = async () => {
    // 模拟数据
    groupOptions.value = [
        {
            id: 1,
            name: '开发者',
            description: '技术开发人员',
            userCount: 5,
            createTime: '2023-01-01'
        },
        {
            id: 2,
            name: '管理员',
            description: '系统管理员',
            userCount: 2,
            createTime: '2023-01-01'
        },
        {
            id: 3,
            name: '营销',
            description: '市场营销人员',
            userCount: 3,
            createTime: '2023-01-01'
        }
    ];
};

// 搜索处理
const handleSearch = () => {
    pagination.page = 1;
    getMemberData();
};

// 重置搜索
const resetSearch = () => {
    Object.assign(searchForm, {
        name: '',
        departmentId: null,
        political_status: ''
    });
    handleSearch();
};

// 分页处理
const handleSizeChange = (size: number) => {
    pagination.size = size;
    getMemberData();
};

const handleCurrentChange = (page: number) => {
    pagination.page = page;
    getMemberData();
};

// 显示添加成员对话框
const showAddMemberDialog = () => {
    isEditMember.value = false;
    resetMemberForm();
    memberFormDialogVisible.value = true;
};

// 显示编辑成员对话框
const showEditMemberDialog = (user: DepartmentUser) => {
    isEditMember.value = true;
    Object.assign(memberFormData, {
        id: user.id,
        name: user.name,
        wx_id: user.wx_id,
        sex: user.sex,
        race: user.race,
        political_status: user.political_status,
        id_number: user.id_number,
        department: user.department,
        points: user.points,
        is_super_admin: user.is_super_admin,
        edit_text: user.edit_text,
        edit_question: user.edit_question
    });
    memberFormDialogVisible.value = true;
};

// 显示导入成员对话框
const showImportMemberDialog = () => {
    ElMessage.info('批量导入功能开发中...');
};

// 切换成员权限
const toggleMemberPermissions = async (user: DepartmentUser) => {
    try {
        await ElMessageBox.confirm(`确定要切换 ${user.name} 的权限设置吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 这里可以打开权限设置对话框
        ElMessage.info('权限设置功能开发中...');
    } catch (error) {
        if (error !== 'cancel') {
            console.error('切换用户权限错误:', error);
            ElMessage.error('权限设置失败');
        }
    }
};

// 移除成员
const removeMember = async (user: DepartmentUser) => {
    try {
        await ElMessageBox.confirm(`确定要将 ${user.name} 移出当前部门吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        await removeUserFromDepartment({
            user_id: user.id,
            department_id: user.departmentId
        });

        const index = tableData.value.findIndex(item => item.id === user.id);
        if (index > -1) {
            tableData.value.splice(index, 1);
            pagination.total--;
        }
        ElMessage.success('移除成功');
    } catch (error) {
        if (error !== 'cancel') {
            console.error('移除成员错误:', error);
            ElMessage.error('移除失败');
        }
    }
};

// 提交成员表单
const handleMemberSubmit = async () => {
    if (!memberFormRef.value) return;

    try {
        await memberFormRef.value.validate();
        ElMessage.success(isEditMember.value ? '编辑成功' : '添加成功');
        memberFormDialogVisible.value = false;
        getMemberData();
    } catch (error) {
        console.error('表单验证失败:', error);
    }
};

// 重置成员表单
const resetMemberForm = () => {
    if (memberFormRef.value) {
        memberFormRef.value.resetFields();
    }
    Object.assign(memberFormData, {
        id: 0,
        name: '',
        wx_id: '',
        sex: '',
        race: '',
        political_status: '',
        id_number: '',
        department: '',
        points: 0,
        is_super_admin: false,
        edit_text: false,
        edit_question: false
    });
};

onMounted(() => {
    getDepartmentOptions();
    getMemberData();
    getGroupData();
});
</script>

<style scoped>
.member-management {
    padding: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.filter-section {
    background: #f5f7fa;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.table-section {
    background: #fff;
    border-radius: 4px;
    padding: 20px;
}

.group-tag {
    margin-right: 5px;
    margin-bottom: 2px;
}

.permission-tag {
    margin-right: 5px;
    margin-bottom: 2px;
}

.pagination {
    margin-top: 20px;
    text-align: right;
}
</style>