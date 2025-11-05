<template>
    <div class="department-management">
        <div class="header">
            <h2>部门管理</h2>
            <el-button type="primary" @click="showAddDialog(null)">
                <el-icon><Plus /></el-icon>
                新增部门
            </el-button>
        </div>

        <div class="content">
            <el-tree
                :data="departmentTree"
                :props="treeProps"
                :expand-on-click-node="false"
                default-expand-all
                node-key="id"
            >
                <template #default="{ node, data }">
                    <div class="tree-node">
                        <div class="node-info">
                            <span class="node-name">{{ data.name }}</span>
                            <el-tag v-if="data.userCount" size="small" type="info">
                                {{ data.userCount }}人
                            </el-tag>
                            <el-tag v-if="data.admin && data.admin.length > 0" size="small" type="success">
                                部门管理员：{{ data.admin.map(a => a.name).join('，') }}
                            </el-tag>
                        </div>
                        <div class="node-actions">
                            <el-button type="primary" size="small" @click="showAddDialog(data)">
                                新增子部门
                            </el-button>
                            <el-button type="info" size="small" @click="showMemberManagement(data)">
                                成员管理
                            </el-button>
                            <!-- 部门管理员专用功能 -->
                            <template v-if="canManageDepartment(data.id)">
                                <el-button type="success" size="small" @click="showSetAdminDialog(data)">
                                    设置管理员
                                </el-button>
                                          <el-button type="warning" size="small" @click="showEditDialog(data)">
                                    编辑
                                </el-button>
                                <el-button type="danger" size="small" @click="handleDelete(data)">
                                    删除
                                </el-button>
                            </template>
                            <!-- 非部门管理员只能查看，但删除按钮临时可见用于测试 -->
                            <template v-else>
                                <el-button type="warning" size="small" @click="showEditDialog(data)">
                                    查看详情
                                </el-button>
                                <!-- 临时：删除按钮始终显示，用于测试删除接口 -->
                                <el-button type="danger" size="small" @click="handleDelete(data)">
                                    删除
                                </el-button>
                            </template>
                        </div>
                    </div>
                </template>
            </el-tree>
        </div>

        <!-- 新增/编辑部门弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="isEdit ? '编辑部门' : '新增部门'"
            width="500px"
            @close="resetForm"
        >
            <el-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                label-width="100px"
            >
                <el-form-item label="部门名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入部门名称" />
                </el-form-item>
                <el-form-item label="上级部门">
                    <el-tree-select
                        v-model="formData.parentId"
                        :data="departmentOptions"
                        :props="treeProps"
                        placeholder="请选择上级部门"
                        clearable
                        check-strictly
                        :render-after-expand="false"
                    />
                </el-form-item>
                <el-form-item label="部门描述" prop="description">
                    <el-input
                        v-model="formData.description"
                        type="textarea"
                        placeholder="请输入部门描述"
                        :rows="3"
                    />
                </el-form-item>
                <el-form-item label="负责人" prop="manager">
                    <el-input v-model="formData.manager" placeholder="请输入负责人姓名" />
                </el-form-item>
                <el-form-item label="联系电话" prop="phone">
                    <el-input v-model="formData.phone" placeholder="请输入联系电话" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确认</el-button>
            </template>
        </el-dialog>

        <!-- 设置管理员弹窗 -->
        <el-dialog
            v-model="adminDialogVisible"
            title="部门管理员管理"
            width="600px"
            @close="handleDialogClose"
        >
            <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabClick">
                <!-- 设置管理员标签页 -->
                <el-tab-pane label="设置管理员" name="set">
                    <el-form
                        ref="adminFormRef"
                        :model="adminFormData"
                        :rules="adminFormRules"
                        label-width="100px"
                    >
                        <el-form-item label="部门名称">
                            <el-input v-model="currentDepartmentName" readonly />
                        </el-form-item>
                        <el-form-item label="选择管理员" prop="admin_id">
                            <el-select
                                v-model="adminFormData.admin_id"
                                placeholder="请选择管理员"
                                style="width: 100%"
                                clearable
                                filterable
                                :key="departmentMembers.length"
                            >
                                <el-option
                                    v-for="member in departmentMembers"
                                    :key="`member-${member.id}`"
                                    :label="member.name"
                                    :value="member.id"
                                />
                                <template v-if="departmentMembers.length === 0">
                                    <el-option disabled value="" label="暂无可选择的成员" />
                                </template>
                            </el-select>
                            <div v-if="departmentMembers.length > 0" style="font-size: 12px; color: #999; margin-top: 4px;">
                                共 {{ departmentMembers.length }} 个可选成员
                            </div>
                        </el-form-item>
                    </el-form>
                    <div style="text-align: right; margin-top: 20px;">
                        <el-button type="primary" @click="handleSetAdmin">确认设置</el-button>
                    </div>
                </el-tab-pane>

                <!-- 取消管理员标签页 -->
                <el-tab-pane label="取消管理员" name="unset" :disabled="!currentDepartmentAdmins || currentDepartmentAdmins.length === 0">
                    <div v-if="!currentDepartmentAdmins || currentDepartmentAdmins.length === 0" style="text-align: center; padding: 40px; color: #999;">
                        该部门暂无管理员
                    </div>
                    <div v-else>
                        <div style="margin-bottom: 16px;">
                            <strong>部门：</strong>{{ currentDepartmentName }}
                        </div>
                        <div style="margin-bottom: 16px;">
                            <strong>当前管理员列表：</strong>
                        </div>
                        <el-table :data="currentDepartmentAdmins" border>
                            <el-table-column prop="name" label="管理员姓名" />
                            <el-table-column prop="id" label="ID" width="80" />
                            <el-table-column label="操作" width="100">
                                <template #default="{ row }">
                                    <el-button
                                        type="danger"
                                        size="small"
                                        @click="confirmUnsetAdmin(row)"
                                    >
                                        取消
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </el-tab-pane>
            </el-tabs>

            <template #footer>
                <el-button @click="adminDialogVisible = false">关闭</el-button>
            </template>
        </el-dialog>

        <!-- 成员管理弹窗 -->
        <el-dialog
            v-model="memberDialogVisible"
            :title="`${currentDepartment?.name || ''} - 成员管理`"
            width="90%"
            :close-on-click-modal="false"
            @close="resetMemberManagement"
        >
            <div class="member-management-content">
                <!-- 操作区域 -->
                <div class="member-actions">
                    <el-button type="success" @click="showImportMemberDialog">
                        <el-icon><Upload /></el-icon>
                        批量导入
                    </el-button>
                </div>

                <!-- 搜索区域 -->
                <div class="member-search">
                    <el-form :model="memberSearchForm" inline>
                        <el-form-item label="姓名">
                            <el-input
                                v-model="memberSearchForm.name"
                                placeholder="请输入姓名"
                                clearable
                                style="width: 200px"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="handleMemberSearch">搜索</el-button>
                            <el-button @click="resetMemberSearch">重置</el-button>
                        </el-form-item>
                    </el-form>
                </div>

                <!-- 成员表格 -->
                <div class="member-table">
                    <el-table
                        :data="memberTableData"
                        border
                        style="width: 100%"
                        v-loading="memberLoading"
                    >
                        <el-table-column type="selection" width="55" />
                        <el-table-column type="index" label="序号" width="60" align="center" />
                        <el-table-column prop="name" label="姓名" min-width="100" />
                        <el-table-column prop="sex" label="性别" width="60" />
                        <el-table-column prop="race" label="民族" width="80" />
                        <el-table-column prop="political_status" label="政治面貌" width="100" />
                        <el-table-column prop="id_number" label="身份证号" width="180" show-overflow-tooltip />
                        <el-table-column prop="department" label="部门" width="120" />
                        <el-table-column prop="wx_id" label="微信ID" min-width="150" show-overflow-tooltip />
                        <el-table-column prop="invite_code" label="邀请码" width="120" show-overflow-tooltip>
                            <template #default="{ row }">
                                <span
                                    v-if="row.invite_code"
                                    class="invite-code"
                                    @click="copyInvitationCode(row.invite_code)"
                                    title="点击复制邀请码"
                                >
                                    {{ row.invite_code }}
                                </span>
                                <span v-else class="no-invite-code">无邀请码</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="is_super_admin" label="超级管理员" width="100">
                            <template #default="{ row }">
                                <el-tag :type="row.is_super_admin ? 'warning' : 'info'" size="small">
                                    {{ row.is_super_admin ? '是' : '否' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="权限（内容管理，题库管理等）" width="200">
                            <template #default="{ row }">
                                <el-tag v-if="row.edit_text" type="success" size="small" class="permission-tag">
                                    内容管理
                                </el-tag>
                                <el-tag v-if="row.edit_question" type="primary" size="small" class="permission-tag">
                                    题库管理
                                </el-tag>
                                <span v-if="!row.edit_text && !row.edit_question" class="no-permission">
                                    暂无权限
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="100" fixed="right">
                            <template #default="{ row }">
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
                            v-model:current-page="memberPagination.page"
                            v-model:page-size="memberPagination.size"
                            :page-sizes="[10, 20, 50, 100]"
                            :total="memberPagination.total"
                            layout="total, sizes, prev, pager, next, jumper"
                            @size-change="handleMemberSizeChange"
                            @current-change="handleMemberCurrentChange"
                        />
                    </div>
                </div>
            </div>
        </el-dialog>

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
                label-width="100px"
            >
                <el-form-item label="用户名" prop="name">
                    <el-input v-model="memberFormData.name" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="memberFormData.email" placeholder="请输入邮箱" />
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                    <el-input v-model="memberFormData.phone" placeholder="请输入手机号" />
                </el-form-item>
                <el-form-item label="用户分组">
                    <el-select
                        v-model="memberFormData.groupIds"
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
                <el-form-item v-if="!isEditMember" label="密码" prop="password">
                    <el-input
                        v-model="memberFormData.password"
                        type="password"
                        placeholder="请输入密码"
                        show-password
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="memberFormDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleMemberSubmit">确认</el-button>
            </template>
        </el-dialog>

        <!-- 批量导入成员弹窗 -->
        <el-dialog
            v-model="importDialogVisible"
            title="批量导入成员"
            width="500px"
            :close-on-click-modal="false"
        >
            <el-form ref="importFormRef" :model="{ file: fileList }" label-width="80px">
                <el-form-item label="上传文件">
                    <el-upload
                        ref="uploadRef"
                        :auto-upload="false"
                        :show-file-list="true"
                        :limit="1"
                        accept=".xlsx,.xls"
                        :on-change="handleFileChange"
                        :before-upload="beforeUpload"
                        style="width: 100%"
                    >
                        <el-button type="primary">选择文件</el-button>
                        <template #tip>
                            <div class="el-upload__tip">
                                请上传 .xlsx 或 .xls 格式的Excel文件
                            </div>
                        </template>
                    </el-upload>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="importDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="uploading" @click="handleImport">导入</el-button>
            </template>
        </el-dialog>

        </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Upload } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { Department, DepartmentUser, UserGroup } from '@/types/organization';
import { getAllDepartments, updateDepartment, createDepartment, deleteDepartment, setDepartmentAdmin, unsetDepartmentAdmin } from '@/api/department';
import { getUsersByDepartment, removeUserFromDepartment, toggleUserStatus, addUsersByFile } from '@/api/user';
import { usePermissStore } from '@/store/permiss';
import { permission } from '@/utils/permission';

// 响应式数据
const departmentTree = ref<Department[]>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const permiss = usePermissStore();
const isUnmounted = ref(false); // 组件是否已卸载
const abortController = new AbortController(); // 用于取消异步请求

// 设置管理员弹窗相关
const adminDialogVisible = ref(false);
const adminFormRef = ref<FormInstance>();
const currentDepartmentId = ref<number | null>(null);
const currentDepartmentName = ref('');
const departmentMembers = ref<DepartmentUser[]>([]); // 部门成员列表
const currentDepartmentAdmins = ref<{ id: number; name: string }[]>([]); // 当前部门管理员列表
const activeTab = ref('set'); // 当前激活的标签页

// 批量导入相关
const importDialogVisible = ref(false);
const importFormRef = ref<FormInstance>();
const uploading = ref(false);
const fileList = ref([]);
const importUrl = ref('');

// 成员管理弹窗相关
const memberDialogVisible = ref(false);
const memberFormDialogVisible = ref(false);
const memberFormRef = ref<FormInstance>();
const currentDepartment = ref<Department | null>(null);
const memberLoading = ref(false);
const isEditMember = ref(false);

// 成员管理相关数据
const memberTableData = ref<DepartmentUser[]>([]);
const groupOptions = ref<UserGroup[]>([]);

const memberSearchForm = reactive({
    name: '',
    status: ''
});

const memberFormData = reactive({
    id: 0,
    name: '',
    email: '',
    phone: '',
    groupIds: [] as number[],
    password: ''
});

const memberPagination = reactive({
    page: 1,
    size: 10,
    total: 0
});

const formData = reactive({
    id: 0,
    name: '',
    parentId: 0 as number,
    description: '',
    manager: '',
    phone: ''
});

const adminFormData = reactive({
    admin_id: null as number | null
});

const treeProps = {
    children: 'children',
    label: 'name',
    value: 'id'
};


// 表单验证规则
const formRules = {
    name: [
        { required: true, message: '请输入部门名称', trigger: 'blur' },
        { min: 2, max: 50, message: '部门名称长度在 2 到 50 个字符', trigger: 'blur' }
    ]
};

// 管理员表单验证规则
const adminFormRules = {
    admin_id: [
        { required: true, message: '请选择管理员', trigger: 'change' }
    ]
};

// 成员表单验证规则
const memberFormRules = {
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
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ]
};

// 获取部门选项（不包含当前部门及其子部门）
const departmentOptions = computed(() => {
    const filterDepartments = (deps: Department[], excludeId?: number): Department[] => {
        return deps.filter(dep => dep.id !== excludeId).map(dep => ({
            ...dep,
            children: dep.children ? filterDepartments(dep.children, excludeId) : undefined
        }));
    };

    return [
        { id: 0, name: '根部门', children: filterDepartments(departmentTree.value, isEdit.value ? formData.id : undefined) }
    ];
});

// 获取部门数据
const getDepartmentData = async () => {
    if (isUnmounted.value || abortController.signal.aborted) return;

    try {
        const res = await getAllDepartments();

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            // 将API数据转换为前端需要的格式
            const departments = res.data.data.map((item: any) => {
                return {
                    id: item.id,
                    name: item.name || '未命名部门',
                    parentId: item.parent_department_id === -1 ? null : item.parent_department_id,
                    level: item.level || 1,
                    description: item.description || '',
                    manager: item.manager || '',
                    phone: item.phone || '',
                    createTime: item.create_time || '',
                    userCount: item.user_count || 0,
                    admin: item.admin || [], // 添加管理员信息
                    children: [] // 先初始化为空，后面会构建树结构
                };
            });

            // 构建树结构
            departmentTree.value = buildDepartmentTree(departments);
        } else {
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        if (!isUnmounted.value) {
            ElMessage.error('获取部门数据失败');
            console.error('获取部门数据错误:', error);
        }

        // 使用模拟数据作为fallback
        departmentTree.value = [
            {
                id: 1,
                name: '总公司',
                parentId: null,
                level: 1,
                description: '公司总部',
                manager: '张三',
                phone: '13800138000',
                createTime: '2023-01-01',
                userCount: 15,
                children: [
                    {
                        id: 2,
                        name: '技术部',
                        parentId: 1,
                        level: 2,
                        description: '负责技术研发',
                        manager: '李四',
                        phone: '13800138001',
                        createTime: '2023-01-01',
                        userCount: 8,
                        children: [
                            {
                                id: 4,
                                name: '前端组',
                                parentId: 2,
                                level: 3,
                                description: '前端开发',
                                manager: '王五',
                                phone: '13800138003',
                                createTime: '2023-01-01',
                                userCount: 3
                            },
                            {
                                id: 5,
                                name: '后端组',
                                parentId: 2,
                                level: 3,
                                description: '后端开发',
                                manager: '赵六',
                                phone: '13800138004',
                                createTime: '2023-01-01',
                                userCount: 5
                            }
                        ]
                    },
                    {
                        id: 3,
                        name: '市场部',
                        parentId: 1,
                        level: 2,
                        description: '负责市场推广',
                        manager: '钱七',
                        phone: '13800138002',
                        createTime: '2023-01-01',
                        userCount: 7
                    }
                ]
            }
        ];
    }
};

// 构建部门树结构
const buildDepartmentTree = (departments: Department[]): Department[] => {
    const map = new Map<number, Department>();
    const tree: Department[] = [];

    // 创建映射
    departments.forEach(dept => {
        map.set(dept.id, { ...dept, children: [] });
    });

    // 构建树
    departments.forEach(dept => {
        const node = map.get(dept.id)!;
        if (dept.parentId === null) {
            tree.push(node);
        } else {
            const parent = map.get(dept.parentId);
            if (parent) {
                parent.children!.push(node);
            } else {
                // 如果找不到父节点，作为根节点
                tree.push(node);
            }
        }
    });

    return tree;
};

// 显示新增对话框
const showAddDialog = (parent: Department | null) => {
    isEdit.value = false;
    resetForm();
    if (parent) {
        formData.parentId = parent.id;
    }
    dialogVisible.value = true;
};

// 显示编辑对话框
const showEditDialog = (department: Department) => {
    isEdit.value = true;
    Object.assign(formData, department);
    dialogVisible.value = true;
};

// 删除部门
const handleDelete = async (department: Department) => {
    if (department.children && department.children.length > 0) {
        ElMessage.error('该部门下还有子部门，无法删除');
        return;
    }

    if (department.userCount && department.userCount > 0) {
        ElMessage.error('该部门下还有用户，无法删除');
        return;
    }

    try {
        await ElMessageBox.confirm('确定要删除该部门吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 调用删除API
        await deleteDepartment({ department_id: department.id });

        ElMessage.success('删除成功');
        await getDepartmentData();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
        }
    }
};

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        // 调用创建或更新API
        if (isEdit.value) {
            // 构造更新接口所需的参数格式
            const updateData = {
                department_id: formData.id,
                name: formData.name,
                parent_department_id: formData.parentId === 0 ? -1 : formData.parentId || -1  // 根部门(id=0)转换为-1
            };
            await updateDepartment(updateData);
        } else {
            // 构造新增接口所需的参数格式
            const createData = {
                name: formData.name,
                parent_department_id: formData.parentId === 0 ? -1 : formData.parentId || -1  // 根部门(id=0)转换为-1
            };
            await createDepartment(createData);
        }

        ElMessage.success(isEdit.value ? '编辑成功' : '新增成功');
        dialogVisible.value = false;
        await getDepartmentData();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(isEdit.value ? '编辑失败' : '新增失败');
        }
    }
};

// 显示设置管理员对话框
const showSetAdminDialog = async (department: Department) => {
    console.log('打开管理员对话框，部门:', department);

    // 设置部门信息
    currentDepartmentId.value = department.id;
    currentDepartmentName.value = department.name;
    console.log('设置部门ID:', currentDepartmentId.value, '部门名称:', currentDepartmentName.value);

    // 设置当前部门管理员列表
    currentDepartmentAdmins.value = department.admin || [];
    console.log('设置管理员列表:', currentDepartmentAdmins.value);
    console.log('管理员列表长度:', currentDepartmentAdmins.value.length);

    // 重置表单和标签页
    resetAdminForm();
    activeTab.value = 'set';

    // 获取该部门的成员列表
    await getDepartmentMembers(department.id);

    // 等待下一个tick确保数据更新完成
    await nextTick();

    console.log('即将打开对话框，最终数据检查:');
    console.log('- 部门ID:', currentDepartmentId.value);
    console.log('- 管理员列表:', currentDepartmentAdmins.value);
    console.log('- 激活标签页:', activeTab.value);

    adminDialogVisible.value = true;
};

// 获取部门成员列表
const getDepartmentMembers = async (departmentId: number) => {
    if (isUnmounted.value || abortController.signal.aborted) return;

    try {
        const res = await getUsersByDepartment(departmentId);
        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            departmentMembers.value = res.data.data.map((item: any) => ({
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
                departmentId: departmentId,
                departmentName: item.department || '未分配',
                groupIds: [],
                groups: [],
                createTime: '',
                lastLoginTime: undefined
            }));

            console.log('部门成员列表已加载:', departmentMembers.value);
        } else {
            departmentMembers.value = [];
            console.log('API返回数据格式不正确:', res.data);
        }
    } catch (error) {
        if (!isUnmounted.value) {
            console.error('获取部门成员失败:', error);
            departmentMembers.value = [];
        }
    }
};

// 处理设置管理员
const handleSetAdmin = async () => {
    if (!adminFormRef.value || currentDepartmentId.value === null) return;

    try {
        await adminFormRef.value.validate();

        const adminData = {
            admin_id: adminFormData.admin_id!,
            department_id: currentDepartmentId.value
        };

        await setDepartmentAdmin(adminData);

        if (isUnmounted.value) return;

        ElMessage.success('设置管理员成功');
        adminDialogVisible.value = false;

        // 重新获取数据以更新显示
        if (!isUnmounted.value) {
            await getDepartmentData();
        }
    } catch (error) {
        if (error !== 'cancel' && !isUnmounted.value) {
            ElMessage.error('设置管理员失败');
        }
    }
};

// 确认取消管理员
const confirmUnsetAdmin = (admin: { id: number; name: string }) => {
    console.log('尝试取消管理员:', admin, '部门ID:', currentDepartmentId.value);

    ElMessageBox.confirm(
        `确定要取消管理员"${admin.name}"吗？取消后该管理员将失去部门管理权限。`,
        '确认取消管理员',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(async () => {
        if (isUnmounted.value) return;

        if (!currentDepartmentId.value) {
            ElMessage.error('部门ID为空，无法取消管理员');
            return;
        }

        try {
            const adminData = {
                admin_id: admin.id,
                department_id: currentDepartmentId.value
            };

            console.log('发送取消管理员请求:', adminData);
            await unsetDepartmentAdmin(adminData);
            console.log('取消管理员请求成功');

            if (isUnmounted.value) return;

            ElMessage.success('取消管理员成功');

            // 更新本地管理员列表
            if (!isUnmounted.value && currentDepartmentAdmins.value) {
                currentDepartmentAdmins.value = currentDepartmentAdmins.value.filter(a => a.id !== admin.id);
                console.log('更新本地管理员列表:', currentDepartmentAdmins.value);
            }

            // 重新获取部门数据以更新显示
            if (!isUnmounted.value) {
                await getDepartmentData();
            }
        } catch (error) {
            if (!isUnmounted.value) {
                console.error('取消管理员失败:', error);
                ElMessage.error('取消管理员失败');
            }
        }
    }).catch(() => {
        // 用户取消操作
        console.log('用户取消了取消管理员操作');
    });
};

// 处理标签页点击
const handleTabClick = (tab: any) => {
    console.log('标签页点击:', tab.props.name, '当前管理员列表:', currentDepartmentAdmins.value);
    activeTab.value = tab.props.name;
};

// 处理对话框关闭
const handleDialogClose = () => {
    console.log('对话框关闭，当前部门ID:', currentDepartmentId.value);
    // 重置表单但保留关键数据
    try {
        if (adminFormRef.value && !isUnmounted.value) {
            adminFormRef.value.resetFields();
        }
    } catch (error) {
        // 忽略表单重置过程中的错误
    }

    if (!isUnmounted.value) {
        Object.assign(adminFormData, {
            admin_id: null
        });
        // 不要清空部门ID和管理员列表，只在重新打开对话框时才更新
        activeTab.value = 'set';
    }
};

// 重置管理员表单
const resetAdminForm = () => {
    try {
        if (adminFormRef.value && !isUnmounted.value) {
            adminFormRef.value.resetFields();
        }
    } catch (error) {
        // 忽略表单重置过程中的错误
    }

    if (!isUnmounted.value) {
        Object.assign(adminFormData, {
            admin_id: null
        });
        activeTab.value = 'set';
    }
};

// 重置表单
const resetForm = () => {
    try {
        if (formRef.value && !isUnmounted.value) {
            formRef.value.resetFields();
        }
    } catch (error) {
        // 忽略表单重置过程中的错误
    }

    if (!isUnmounted.value) {
        Object.assign(formData, {
            id: 0,
            name: '',
            parentId: 0,
            description: '',
            manager: '',
            phone: ''
        });
    }
};

// 成员管理相关函数
// 显示成员管理弹窗
const showMemberManagement = (department: Department) => {
    // 创建部门对象的副本以避免只读计算属性错误
    currentDepartment.value = { ...department };
    memberDialogVisible.value = true;
    getMemberData();
    getGroupData();
};

// 获取成员数据
const getMemberData = async () => {
    if (!currentDepartment.value) return;

    memberLoading.value = true;
    try {
        // 调用API获取当前部门的成员
        const res = await getUsersByDepartment(currentDepartment.value.id);

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            // 直接使用API数据，字段已经匹配
            const apiData: DepartmentUser[] = res.data.data.map((item: any) => ({
                id: item.id,
                wx_id: item.wx_id || '',
                name: item.name || '未命名用户',
                sex: item.sex || '',
                race: item.race || '',
                political_status: item.political_status || '',
                id_number: item.id_number || '',
                department: item.department || currentDepartment.value!.name,
                invite_code: item.invite_code || '',
                points: item.points || 0,
                is_super_admin: item.is_super_admin || false,
                edit_text: item.edit_text || false,
                edit_question: item.edit_question || false,
                manage_departments: item.manage_departments || [],
                // 兼容字段
                status: item.status || 'active'
            }));

            // 应用筛选条件
            let filteredData = apiData.filter((user) => {
                if (memberSearchForm.name && !user.name?.includes(memberSearchForm.name)) return false;
                if (memberSearchForm.status && (user.status || 'active') !== memberSearchForm.status) return false;
                return true;
            });

            memberPagination.total = filteredData.length;
            const start = (memberPagination.page - 1) * memberPagination.size;
            const end = start + memberPagination.size;
            memberTableData.value = filteredData.slice(start, end);
        } else {
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        console.error('获取成员数据错误:', error);
        ElMessage.error('获取成员数据失败');

        // 使用模拟数据作为fallback
        const mockData: DepartmentUser[] = [
            {
                id: 2010,
                wx_id: 'oj8Jj4_rBxL2IRU1HR7Ucq4S_KQI',
                name: '张三',
                sex: '男',
                race: '汉族',
                political_status: '中共党员',
                id_number: '223456781234567810',
                department: currentDepartment.value.name || '技术部',
                invite_code: 'INV2010',
                points: 85,
                is_super_admin: false,
                edit_text: true,
                edit_question: false,
                manage_departments: []
            },
            {
                id: 2011,
                wx_id: 'oj8Jj4_rBxL2IRU1HR7Ucq4S_KQJ',
                name: '李四',
                sex: '女',
                race: '汉族',
                political_status: '共青团员',
                id_number: '223456781234567811',
                department: currentDepartment.value.name || '技术部',
                invite_code: 'INV2011',
                points: 92,
                is_super_admin: false,
                edit_text: true,
                edit_question: true,
                manage_departments: []
            },
            {
                id: 2012,
                wx_id: '',
                name: '王五',
                sex: '男',
                race: '回族',
                political_status: '群众',
                id_number: '223456781234567812',
                department: currentDepartment.value.name || '技术部',
                invite_code: 'INV2012',
                points: 0,
                is_super_admin: false,
                edit_text: false,
                edit_question: false,
                manage_departments: []
            }
        ];

        // 应用筛选条件
        let filteredData = mockData.filter((user) => {
            if (memberSearchForm.name && !user.name?.includes(memberSearchForm.name)) return false;
            if (memberSearchForm.status && (user.status || 'active') !== memberSearchForm.status) return false;
            return true;
        });

        memberPagination.total = filteredData.length;
        const start = (memberPagination.page - 1) * memberPagination.size;
        const end = start + memberPagination.size;
        memberTableData.value = filteredData.slice(start, end);
    } finally {
        memberLoading.value = false;
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

// 成员搜索
const handleMemberSearch = () => {
    memberPagination.page = 1;
    getMemberData();
};

// 重置成员搜索
const resetMemberSearch = () => {
    Object.assign(memberSearchForm, {
        name: ''
    });
    handleMemberSearch();
};

// 成员分页处理
const handleMemberSizeChange = (size: number) => {
    memberPagination.size = size;
    getMemberData();
};

const handleMemberCurrentChange = (page: number) => {
    memberPagination.page = page;
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
        email: user.email,
        phone: user.phone,
        groupIds: user.groupIds
    });
    memberFormDialogVisible.value = true;
};

// 显示导入成员对话框
const showImportMemberDialog = () => {
    importDialogVisible.value = true;
};

const handleFileChange = (uploadFile: any) => {
    fileList.value = [uploadFile];
};

const beforeUpload = (uploadFile: any) => {
    const isExcel = uploadFile.type === 'application/vnd.ms-excel' ||
                   uploadFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!isExcel) {
        ElMessage.error('只能上传 Excel 文件!');
        return false;
    }
    return true;
};

const handleImport = async () => {
    if (fileList.value.length === 0) {
        ElMessage.warning('请选择要上传的文件');
        return;
    }

    uploading.value = true;
    try {
        const file = fileList.value[0].raw || fileList.value[0];
        const response = await addUsersByFile(currentDepartment.value.id, file);

        // 检查响应类型，如果是JSON错误响应则处理错误
        if (response.data instanceof Blob && response.data.type === 'application/json') {
            const errorText = await response.data.text();
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || '服务器返回错误');
        }

        // 直接下载返回的文件（无论成功或失败）
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `批量导入结果_${new Date().toLocaleDateString()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // 检查导入结果并显示相应消息
        const importSuccess = response.headers['x-import-success'] || response.headers['X-Import-Success'];

        if (importSuccess === 'true' || importSuccess === true) {
            ElMessage.success('批量导入成功，处理结果已下载');
            getMemberData(); // 刷新成员列表
        } else {
            ElMessage.warning('导入处理完成，请查看下载的结果文件了解详情');
        }

        importDialogVisible.value = false;
        fileList.value = [];
    } catch (error: any) {
        console.error('批量导入失败:', error);

        // 尝试从错误响应中提取详细错误信息
        let errorMessage = '文件上传失败，请重试';
        if (error.response?.data instanceof Blob) {
            try {
                const errorText = await error.response.data.text();
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (parseError) {
                console.error('解析错误响应失败:', parseError);
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        ElMessage.error(errorMessage);
    } finally {
        uploading.value = false;
    }
};

// 切换成员状态
const toggleMemberStatus = async (user: DepartmentUser) => {
    const action = user.status === 'active' ? '禁用' : '启用';
    try {
        await ElMessageBox.confirm(`确定要${action}成员 ${user.name} 吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 调用API切换用户状态
        const newStatus = user.status === 'active' ? 'disabled' : 'active';
        await toggleUserStatus(user.id, newStatus);

        // 更新本地状态
        user.status = newStatus;
        ElMessage.success(`${action}成功`);
    } catch (error) {
        if (error !== 'cancel') {
            console.error('切换用户状态错误:', error);
            ElMessage.error(`${action}失败`);
        }
    }
};

// 移除成员
const removeMember = async (user: DepartmentUser) => {
    if (!currentDepartment.value) return;

    try {
        await ElMessageBox.confirm(`确定要将 ${user.name} 移出当前部门吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 调用API将用户从部门移除
        await removeUserFromDepartment({
            user_id: user.id,
            department_id: currentDepartment.value.id
        });

        // 从本地数据中移除
        const index = memberTableData.value.findIndex(item => item.id === user.id);
        if (index > -1) {
            memberTableData.value.splice(index, 1);
            memberPagination.total--;
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

        // 实际应该调用API
        if (isEditMember.value) {
            ElMessage.success('编辑成功');
        } else {
            // 生成新的邀请码
            const newUser: DepartmentUser = {
                id: Date.now(),
                wx_id: '',
                name: memberFormData.name,
                sex: '男',
                race: '汉族',
                political_status: '群众',
                id_number: '',
                department: currentDepartment.value!.name,
                invite_code: 'INV' + Date.now().toString().slice(-6),
                points: 0,
                is_super_admin: false,
                edit_text: false,
                edit_question: false,
                manage_departments: [],
                // 兼容字段
                email: memberFormData.email,
                phone: memberFormData.phone,
                status: 'active',
                departmentId: currentDepartment.value!.id,
                departmentName: currentDepartment.value!.name,
                groupIds: memberFormData.groupIds,
                groups: memberFormData.groupIds.map(id => {
                    const group = groupOptions.value.find(g => g.id === id);
                    return group ? group.name : '';
                }).filter(Boolean),
                createTime: new Date().toLocaleString()
            };
            memberTableData.value.unshift(newUser);
            memberPagination.total++;
            ElMessage.success('添加成功');
        }

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
        email: '',
        phone: '',
        groupIds: [],
        password: ''
    });
};

// 复制邀请码
const copyInvitationCode = (code: string) => {
    if (!code) {
        ElMessage.warning('邀请码为空');
        return;
    }
    navigator.clipboard.writeText(code).then(() => {
        ElMessage.success('邀请码已复制到剪贴板');
    }).catch(() => {
        ElMessage.error('复制失败');
    });
};

// 重置成员管理
const resetMemberManagement = () => {
    memberTableData.value = [];
    Object.assign(memberSearchForm, {
        name: '',
        status: ''
    });
    Object.assign(memberPagination, {
        page: 1,
        size: 10,
        total: 0
    });
    currentDepartment.value = null;
};

// 检查是否可以管理部门
const canManageDepartment = (departmentId: number): boolean => {
    // 检查权限工具类的权限
    const hasPermission = permission.canManageDepartment(departmentId);

    // 如果没有权限，检查是否有组织管理权限码 (10)
    const hasOrgPermission = permission.hasPermission('10');

    return hasPermission || hasOrgPermission;
};

onMounted(() => {
    getDepartmentData();
});

onUnmounted(() => {
    isUnmounted.value = true;

    // 取消所有正在进行的异步请求
    abortController.abort();

    // 立即关闭所有弹窗
    dialogVisible.value = false;
    adminDialogVisible.value = false;
    memberDialogVisible.value = false;
    importDialogVisible.value = false;

    // 使用 setTimeout 延迟清理，确保 Vue 完成卸载过程
    setTimeout(() => {
        try {
            // 清理所有可能引起问题的引用
            currentDepartmentId.value = null;
            currentDepartmentName.value = '';
            departmentMembers.value = [];
            // currentDepartmentAdmins 不需要清空，因为它会被组件卸载自动清理
            activeTab.value = 'set';
        } catch (error) {
            // 忽略清理过程中的任何错误
        }
    }, 0);
});
</script>

<style scoped>
.department-management {
    padding: 20px;
    transition: all 0.3s ease;
}

/* 暗色模式下的部门管理容器 */
:root.dark .department-management {
    background-color: var(--dashboard-bg, #0f0f0f);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.content {
    background: #fff;
    border-radius: 4px;
    padding: 20px;
    transition: all 0.3s ease;
}

/* 暗色模式下的内容区域 */
:root.dark .content {
    background: var(--card-bg, #1a1a1a);
    border: 1px solid var(--card-border, #2d2d2d);
}

.tree-node {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-right: 20px;
}

.node-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.node-name {
    font-weight: 500;
    color: var(--text-primary, #1f2937);
    transition: color 0.3s ease;
}

/* 暗色模式下的节点名称 */
:root.dark .node-name {
    color: var(--text-primary, #e5eaf3);
}

.node-actions {
    display: flex;
    gap: 8px;
}

:deep(.el-tree-node__content) {
    height: 40px;
    border-radius: 4px;
    margin: 2px 0;
}

:deep(.el-tree-node__content:hover) {
    background-color: #f5f7fa;
}

/* 暗色模式下的树形控件 */
:root.dark :deep(.el-tree-node__content) {
    background-color: transparent;
    color: var(--text-primary, #e5eaf3);
}

:root.dark :deep(.el-tree-node__content:hover) {
    background-color: var(--el-fill-color-light, #262727);
}

:root.dark :deep(.el-tree-node__expand-icon) {
    color: var(--text-secondary, #a3a6ad);
}

:root.dark :deep(.el-tree-node__expand-icon:hover) {
    color: var(--text-primary, #e5eaf3);
}

:root.dark :deep(.el-tree-node__label) {
    color: var(--text-primary, #e5eaf3);
}

/* 成员管理样式 */
.member-management-content {
    max-height: 70vh;
    overflow-y: auto;
}

.member-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.member-search {
    background: #f5f7fa;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

/* 暗色模式下的搜索区域 */
:root.dark .member-search {
    background: var(--el-fill-color-light, #262727);
    border: 1px solid var(--card-border, #2d2d2d);
}

.member-table {
    background: #fff;
    transition: background-color 0.3s ease;
}

/* 暗色模式下的成员表格 */
:root.dark .member-table {
    background: var(--card-bg, #1a1a1a);
}

.group-tag {
    margin-right: 5px;
    margin-bottom: 2px;
}

.permission-tag {
    margin-right: 5px;
    margin-bottom: 2px;
}

.no-permission {
    color: #909399;
    font-size: 12px;
    transition: color 0.3s ease;
}

/* 暗色模式下的权限提示 */
:root.dark .no-permission {
    color: var(--text-muted, #6c6e72);
}

.invite-code {
    color: #409eff;
    cursor: pointer;
    text-decoration: underline;
    font-family: monospace;
    font-weight: 500;
}

.invite-code:hover {
    color: #66b1ff;
}

.no-invite-code {
    color: #c0c4cc;
    font-style: italic;
    transition: color 0.3s ease;
}

/* 暗色模式下的无邀请码提示 */
:root.dark .no-invite-code {
    color: var(--text-muted, #6c6e72);
}

.pagination {
    margin-top: 20px;
    text-align: right;
}
</style>