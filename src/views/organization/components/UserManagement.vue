<template>
    <div class="user-management">
        <div class="header">
            <h2>用户管理</h2>
            <div class="header-actions">
                <el-button type="success" @click="showImportDialog">
                    <el-icon><Upload /></el-icon>
                    批量导入
                </el-button>
                <el-button type="primary" @click="showAddDialog">
                    <el-icon><Plus /></el-icon>
                    新增用户
                </el-button>
            </div>
        </div>

        <!-- 搜索区域 -->
        <div class="search-area">
            <el-form :model="searchForm" inline>
                <el-form-item label="用户名">
                    <el-input
                        v-model="searchForm.name"
                        placeholder="请输入用户名"
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
                <el-form-item label="用户分组">
                    <el-select
                        v-model="searchForm.groupId"
                        placeholder="请选择用户分组"
                        clearable
                        style="width: 200px"
                    >
                        <el-option
                            v-for="group in groupOptions"
                            :key="group.id"
                            :label="group.name"
                            :value="group.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="状态">
                    <el-select
                        v-model="searchForm.status"
                        placeholder="请选择状态"
                        clearable
                        style="width: 120px"
                    >
                        <el-option label="启用" value="active" />
                        <el-option label="禁用" value="disabled" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button @click="resetSearch">重置</el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 表格区域 -->
        <div class="table-area">
            <el-table
                :data="tableData"
                border
                style="width: 100%"
                v-loading="loading"
            >
                <el-table-column type="selection" width="55" />
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="name" label="用户名" min-width="120" />
                <el-table-column prop="email" label="邮箱" min-width="180" />
                <el-table-column prop="phone" label="手机号" width="120" />
                <el-table-column prop="departmentName" label="部门" width="120" />
                <el-table-column prop="groups" label="用户分组" width="150">
                    <template #default="{ row }">
                        <el-tag
                            v-for="group in row.groups"
                            :key="group"
                            size="small"
                            class="group-tag"
                        >
                            {{ group }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="invitationCode" label="邀请码" width="120">
                    <template #default="{ row }">
                        <el-input
                            v-model="row.invitationCode"
                            size="small"
                            readonly
                            style="width: 100px"
                        >
                            <template #append>
                                <el-button
                                    size="small"
                                    @click="copyInvitationCode(row.invitationCode)"
                                >
                                    复制
                                </el-button>
                            </template>
                        </el-input>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                            {{ row.status === 'active' ? '启用' : '禁用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="160" />
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="showEditDialog(row)">
                            编辑
                        </el-button>
                        <el-button
                            :type="row.status === 'active' ? 'warning' : 'success'"
                            size="small"
                            @click="toggleUserStatus(row)"
                        >
                            {{ row.status === 'active' ? '禁用' : '启用' }}
                        </el-button>
                        <el-button
                            type="info"
                            size="small"
                            @click="resetInvitationCode(row)"
                        >
                            重置邀请码
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

        <!-- 新增/编辑用户弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="isEdit ? '编辑用户' : '新增用户'"
            width="600px"
            @close="resetForm"
        >
            <el-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                label-width="100px"
            >
                <el-form-item label="用户名" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="formData.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                    <el-input v-model="formData.phone" placeholder="请输入手机号" />
                </el-form-item>
                <el-form-item label="所属部门" prop="departmentId">
                    <el-tree-select
                        v-model="formData.departmentId"
                        :data="departmentOptions"
                        :props="treeProps"
                        placeholder="请选择部门"
                        check-strictly
                    />
                </el-form-item>
                <el-form-item label="用户分组">
                    <el-select
                        v-model="formData.groupIds"
                        multiple
                        placeholder="请选择用户分组"
                        style="width: 100%"
                    >
                        <el-option
                            v-for="group in groupOptions"
                            :key="group.id"
                            :label="group.name"
                            :value="group.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="!isEdit" label="密码" prop="password">
                    <el-input
                        v-model="formData.password"
                        type="password"
                        placeholder="请输入密码"
                        show-password
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确认</el-button>
            </template>
        </el-dialog>

        <!-- 批量导入弹窗 -->
        <el-dialog
            v-model="importDialogVisible"
            title="批量导入用户"
            width="800px"
        >
            <div class="import-content">
                <div class="import-tips">
                    <p>1. 请先下载模板文件，按照模板格式填写用户信息</p>
                    <p>2. 支持批量导入用户名、邮箱、手机号、部门、用户分组等信息</p>
                    <p>3. 如未填写邀请码，系统将自动生成</p>
                </div>
                <div class="import-actions">
                    <el-button type="primary" @click="downloadTemplate">
                        <el-icon><Download /></el-icon>
                        下载模板
                    </el-button>
                    <el-upload
                        action="#"
                        :limit="1"
                        accept=".xlsx, .xls"
                        :show-file-list="false"
                        :before-upload="beforeUpload"
                        :http-request="handleImport"
                    >
                        <el-button type="success">
                            <el-icon><Upload /></el-icon>
                            选择文件
                        </el-button>
                    </el-upload>
                </div>
                <div v-if="importData.length > 0" class="import-preview">
                    <h4>预览数据（前10条）</h4>
                    <el-table :data="importData.slice(0, 10)" border max-height="300">
                        <el-table-column prop="name" label="用户名" />
                        <el-table-column prop="email" label="邮箱" />
                        <el-table-column prop="phone" label="手机号" />
                        <el-table-column prop="departmentName" label="部门" />
                        <el-table-column prop="groupName" label="用户分组" />
                    </el-table>
                    <div class="import-confirm">
                        <el-button type="primary" @click="confirmImport" :loading="importing">
                            确认导入
                        </el-button>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Upload, Download } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { DepartmentUser, Department, UserGroup, ImportUserItem } from '@/types/organization';
import * as XLSX from 'xlsx';

// 响应式数据
const loading = ref(false);
const dialogVisible = ref(false);
const importDialogVisible = ref(false);
const isEdit = ref(false);
const importing = ref(false);
const formRef = ref<FormInstance>();

const searchForm = reactive({
    name: '',
    departmentId: null as number | null,
    groupId: null as number | null,
    status: ''
});

const formData = reactive({
    id: 0,
    name: '',
    email: '',
    phone: '',
    departmentId: null as number | null,
    groupIds: [] as number[],
    password: ''
});

const pagination = reactive({
    page: 1,
    size: 10,
    total: 0
});

const tableData = ref<DepartmentUser[]>([]);
const departmentOptions = ref<Department[]>([]);
const groupOptions = ref<UserGroup[]>([]);
const importData = ref<ImportUserItem[]>([]);

const treeProps = {
    children: 'children',
    label: 'name',
    value: 'id'
};

// 表单验证规则
const formRules = {
    name: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    departmentId: [
        { required: true, message: '请选择部门', trigger: 'change' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ]
};

// 获取用户数据
const getUserData = async () => {
    loading.value = true;
    try {
        // 模拟数据，实际应该从API获取
        const mockData: DepartmentUser[] = [
            {
                id: 1,
                name: '张三',
                email: 'zhangsan@example.com',
                phone: '13800138000',
                invitationCode: 'INV001',
                status: 'active',
                departmentId: 2,
                departmentName: '技术部',
                groupIds: [1],
                groups: ['开发者'],
                createTime: '2023-01-01 10:00:00',
                lastLoginTime: '2023-10-24 09:30:00'
            },
            {
                id: 2,
                name: '李四',
                email: 'lisi@example.com',
                phone: '13800138001',
                invitationCode: 'INV002',
                status: 'active',
                departmentId: 2,
                departmentName: '技术部',
                groupIds: [1, 2],
                groups: ['开发者', '管理员'],
                createTime: '2023-01-02 10:00:00',
                lastLoginTime: '2023-10-23 15:20:00'
            },
            {
                id: 3,
                name: '王五',
                email: 'wangwu@example.com',
                phone: '13800138002',
                invitationCode: 'INV003',
                status: 'disabled',
                departmentId: 3,
                departmentName: '市场部',
                groupIds: [3],
                groups: ['营销'],
                createTime: '2023-01-03 10:00:00'
            }
        ];

        // 应用筛选条件
        let filteredData = mockData.filter(user => {
            if (searchForm.name && !user.name.includes(searchForm.name)) return false;
            if (searchForm.departmentId && user.departmentId !== searchForm.departmentId) return false;
            if (searchForm.groupId && !user.groupIds.includes(searchForm.groupId)) return false;
            if (searchForm.status && user.status !== searchForm.status) return false;
            return true;
        });

        pagination.total = filteredData.length;
        const start = (pagination.page - 1) * pagination.size;
        const end = start + pagination.size;
        tableData.value = filteredData.slice(start, end);
    } catch (error) {
        ElMessage.error('获取用户数据失败');
    } finally {
        loading.value = false;
    }
};

// 获取部门数据
const getDepartmentData = async () => {
    // 模拟数据
    departmentOptions.value = [
        {
            id: 1,
            name: '总公司',
            parentId: null,
            level: 1,
            createTime: '2023-01-01',
            children: [
                {
                    id: 2,
                    name: '技术部',
                    parentId: 1,
                    level: 2,
                    createTime: '2023-01-01'
                },
                {
                    id: 3,
                    name: '市场部',
                    parentId: 1,
                    level: 2,
                    createTime: '2023-01-01'
                }
            ]
        }
    ];
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

// 搜索
const handleSearch = () => {
    pagination.page = 1;
    getUserData();
};

// 重置搜索
const resetSearch = () => {
    Object.assign(searchForm, {
        name: '',
        departmentId: null,
        groupId: null,
        status: ''
    });
    handleSearch();
};

// 分页处理
const handleSizeChange = (size: number) => {
    pagination.size = size;
    getUserData();
};

const handleCurrentChange = (page: number) => {
    pagination.page = page;
    getUserData();
};

// 显示新增对话框
const showAddDialog = () => {
    isEdit.value = false;
    resetForm();
    dialogVisible.value = true;
};

// 显示编辑对话框
const showEditDialog = (user: DepartmentUser) => {
    isEdit.value = true;
    Object.assign(formData, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        departmentId: user.departmentId,
        groupIds: user.groupIds
    });
    dialogVisible.value = true;
};

// 显示导入对话框
const showImportDialog = () => {
    importData.value = [];
    importDialogVisible.value = true;
};

// 切换用户状态
const toggleUserStatus = async (user: DepartmentUser) => {
    const action = user.status === 'active' ? '禁用' : '启用';
    try {
        await ElMessageBox.confirm(`确定要${action}用户 ${user.name} 吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 实际应该调用API
        user.status = user.status === 'active' ? 'disabled' : 'active';
        ElMessage.success(`${action}成功`);
    } catch {
        // 用户取消
    }
};

// 重置邀请码
const resetInvitationCode = async (user: DepartmentUser) => {
    try {
        await ElMessageBox.confirm(`确定要重置用户 ${user.name} 的邀请码吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 生成新的邀请码
        user.invitationCode = 'INV' + Date.now().toString().slice(-6);
        ElMessage.success('邀请码重置成功');
    } catch {
        // 用户取消
    }
};

// 复制邀请码
const copyInvitationCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
        ElMessage.success('邀请码已复制到剪贴板');
    }).catch(() => {
        ElMessage.error('复制失败');
    });
};

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        // 实际应该调用API
        if (isEdit.value) {
            ElMessage.success('编辑成功');
        } else {
            ElMessage.success('新增成功');
        }

        dialogVisible.value = false;
        getUserData();
    } catch (error) {
        console.error('表单验证失败:', error);
    }
};

// 重置表单
const resetForm = () => {
    if (formRef.value) {
        formRef.value.resetFields();
    }
    Object.assign(formData, {
        id: 0,
        name: '',
        email: '',
        phone: '',
        departmentId: null,
        groupIds: [],
        password: ''
    });
};

// 下载模板
const downloadTemplate = () => {
    const templateData = [
        ['用户名', '邮箱', '手机号', '部门', '用户分组', '邀请码']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '用户导入模板');
    XLSX.writeFile(wb, '用户导入模板.xlsx');
};

// 文件上传前处理
const beforeUpload = (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel';

    if (!isExcel) {
        ElMessage.error('只能上传Excel文件');
        return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            importData.value = jsonData.map(item => ({
                name: item['用户名'] || '',
                email: item['邮箱'] || '',
                phone: item['手机号'] || '',
                departmentName: item['部门'] || '',
                groupName: item['用户分组'] || '',
                invitationCode: item['邀请码'] || ''
            })).filter(item => item.name); // 过滤掉空行

            ElMessage.success(`成功解析 ${importData.value.length} 条数据`);
        } catch (error) {
            ElMessage.error('文件解析失败，请检查文件格式');
        }
    };
    reader.readAsArrayBuffer(file);

    return false; // 阻止默认上传行为
};

// 确认导入
const confirmImport = async () => {
    importing.value = true;
    try {
        // 实际应该调用API批量导入
        await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟API调用

        ElMessage.success(`成功导入 ${importData.value.length} 个用户`);
        importDialogVisible.value = false;
        getUserData();
    } catch (error) {
        ElMessage.error('导入失败');
    } finally {
        importing.value = false;
    }
};

// 处理文件导入
const handleImport = () => {
    // 在 beforeUpload 中已经处理了文件
};

onMounted(() => {
    getDepartmentData();
    getGroupData();
    getUserData();
});
</script>

<style scoped>
.user-management {
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

.search-area {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.table-area {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
}

.pagination {
    margin-top: 20px;
    text-align: right;
}

.group-tag {
    margin-right: 5px;
    margin-bottom: 2px;
}

.import-content {
    padding: 20px 0;
}

.import-tips {
    background: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 20px;
}

.import-tips p {
    margin: 5px 0;
    color: #666;
}

.import-actions {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.import-preview {
    margin-top: 20px;
}

.import-preview h4 {
    margin-bottom: 10px;
    color: #333;
}

.import-confirm {
    margin-top: 15px;
    text-align: center;
}
</style>