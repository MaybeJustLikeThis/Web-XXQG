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
                        </div>
                        <div class="node-actions">
                            <el-button type="primary" size="small" @click="showAddDialog(data)">
                                新增子部门
                            </el-button>
                            <el-button type="warning" size="small" @click="showEditDialog(data)">
                                编辑
                            </el-button>
                            <el-button type="danger" size="small" @click="handleDelete(data)">
                                删除
                            </el-button>
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
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { Department } from '@/types/organization';
import { getAllDepartments } from '@/api/department';

// 响应式数据
const departmentTree = ref<Department[]>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();

const formData = reactive({
    id: 0,
    name: '',
    parentId: null as number | null,
    description: '',
    manager: '',
    phone: ''
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

// 获取部门选项（不包含当前部门及其子部门）
const departmentOptions = computed(() => {
    const filterDepartments = (deps: Department[], excludeId?: number): Department[] => {
        return deps.filter(dep => dep.id !== excludeId).map(dep => ({
            ...dep,
            children: dep.children ? filterDepartments(dep.children, excludeId) : undefined
        }));
    };

    return [
        { id: null, name: '根部门', children: filterDepartments(departmentTree.value, isEdit.value ? formData.id : undefined) }
    ];
});

// 获取部门数据
const getDepartmentData = async () => {
    try {
        const res = await getAllDepartments();

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            // 将API数据转换为前端需要的格式
            const departments = res.data.data.map((item: any) => {
                return {
                    id: item.id,
                    name: item.name || '未命名部门',
                    parentId: item.parent_id || null,
                    level: item.level || 1,
                    description: item.description || '',
                    manager: item.manager || '',
                    phone: item.phone || '',
                    createTime: item.create_time || '',
                    userCount: item.user_count || 0,
                    children: [] // 先初始化为空，后面会构建树结构
                };
            });

            // 构建树结构
            departmentTree.value = buildDepartmentTree(departments);
        } else {
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        ElMessage.error('获取部门数据失败');
        console.error('获取部门数据错误:', error);

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

        // TODO: 调用删除API
        // await deleteDepartment(department.id);

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

        // TODO: 调用创建或更新API
        // if (isEdit.value) {
        //     await updateDepartment(formData.id, formData);
        // } else {
        //     await createDepartment(formData);
        // }

        ElMessage.success(isEdit.value ? '编辑成功' : '新增成功');
        dialogVisible.value = false;
        await getDepartmentData();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(isEdit.value ? '编辑失败' : '新增失败');
        }
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
        parentId: null,
        description: '',
        manager: '',
        phone: ''
    });
};

onMounted(() => {
    getDepartmentData();
});
</script>

<style scoped>
.department-management {
    padding: 20px;
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
</style>