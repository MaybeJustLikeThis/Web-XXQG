<template>
    <div class="group-management">
        <div class="header">
            <h2>用户分组管理</h2>
            <el-button type="primary" @click="showAddDialog">
                <el-icon><Plus /></el-icon>
                新增分组
            </el-button>
        </div>

        <div class="content">
            <el-row :gutter="20">
                <!-- 分组列表 -->
                <el-col :span="16">
                    <el-card class="group-list">
                        <template #header>
                            <div class="card-header">
                                <span>分组列表</span>
                                <span class="total-count">共 {{ groupList.length }} 个分组</span>
                            </div>
                        </template>

                        <el-table
                            :data="groupList"
                            border
                            style="width: 100%"
                            v-loading="loading"
                        >
                            <el-table-column type="index" label="序号" width="60" align="center" />
                            <el-table-column prop="name" label="分组名称" min-width="120">
                                <template #default="{ row }">
                                    <div class="group-name">
                                        <el-tag
                                            :color="row.color"
                                            effect="light"
                                            size="small"
                                            style="margin-right: 8px"
                                        >
                                            &nbsp;
                                        </el-tag>
                                        {{ row.name }}
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="description" label="描述" min-width="200" />
                            <el-table-column prop="userCount" label="用户数量" width="100" align="center">
                                <template #default="{ row }">
                                    <el-link type="primary" @click="showGroupUsers(row)">
                                        {{ row.userCount }} 人
                                    </el-link>
                                </template>
                            </el-table-column>
                            <el-table-column prop="createTime" label="创建时间" width="160" />
                            <el-table-column label="操作" width="150" fixed="right">
                                <template #default="{ row }">
                                    <el-button type="primary" size="small" @click="showEditDialog(row)">
                                        编辑
                                    </el-button>
                                    <el-button type="danger" size="small" @click="handleDelete(row)">
                                        删除
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-card>
                </el-col>

                <!-- 分组统计 -->
                <el-col :span="8">
                    <el-card class="group-stats">
                        <template #header>
                            <span>分组统计</span>
                        </template>

                        <div class="stats-item">
                            <div class="stats-label">总分组数</div>
                            <div class="stats-value">{{ groupList.length }}</div>
                        </div>

                        <div class="stats-item">
                            <div class="stats-label">总用户数</div>
                            <div class="stats-value">{{ totalUsers }}</div>
                        </div>

                        <div class="stats-item">
                            <div class="stats-label">平均每组用户</div>
                            <div class="stats-value">{{ averageUsers }}</div>
                        </div>

                        <div class="chart-container">
                            <div ref="chartRef" class="chart"></div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 新增/编辑分组弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="isEdit ? '编辑分组' : '新增分组'"
            width="500px"
            @close="resetForm"
        >
            <el-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                label-width="100px"
            >
                <el-form-item label="分组名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入分组名称" />
                </el-form-item>
                <el-form-item label="分组描述" prop="description">
                    <el-input
                        v-model="formData.description"
                        type="textarea"
                        placeholder="请输入分组描述"
                        :rows="3"
                    />
                </el-form-item>
                <el-form-item label="分组颜色" prop="color">
                    <div class="color-picker">
                        <el-color-picker v-model="formData.color" />
                        <span class="color-preview">预览：</span>
                        <el-tag :color="formData.color" effect="light">
                            {{ formData.name || '分组名称' }}
                        </el-tag>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确认</el-button>
            </template>
        </el-dialog>

        <!-- 分组用户弹窗 -->
        <el-dialog
            v-model="userDialogVisible"
            :title="`${currentGroup?.name} - 用户列表`"
            width="800px"
        >
            <div class="user-list">
                <div class="user-header">
                    <span>共 {{ groupUsers.length }} 个用户</span>
                    <el-button type="primary" size="small" @click="showAddUserDialog">
                        添加用户
                    </el-button>
                </div>

                <el-table :data="groupUsers" border style="width: 100%">
                    <el-table-column prop="name" label="用户名" />
                    <el-table-column prop="email" label="邮箱" />
                    <el-table-column prop="phone" label="手机号" />
                    <el-table-column prop="departmentName" label="部门" />
                    <el-table-column label="操作" width="100">
                        <template #default="{ row }">
                            <el-button
                                type="danger"
                                size="small"
                                @click="removeUserFromGroup(row)"
                            >
                                移除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-dialog>

        <!-- 添加用户到分组弹窗 -->
        <el-dialog
            v-model="addUserDialogVisible"
            title="添加用户到分组"
            width="600px"
        >
            <div class="add-user-content">
                <el-form inline>
                    <el-form-item label="搜索用户">
                        <el-input
                            v-model="userSearchKeyword"
                            placeholder="请输入用户名或邮箱"
                            clearable
                            style="width: 300px"
                            @input="searchUsers"
                        />
                    </el-form-item>
                </el-form>

                <el-table
                    :data="availableUsers"
                    border
                    style="width: 100%"
                    max-height="400"
                    @selection-change="handleUserSelection"
                >
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="name" label="用户名" />
                    <el-table-column prop="email" label="邮箱" />
                    <el-table-column prop="departmentName" label="部门" />
                </el-table>
            </div>
            <template #footer>
                <el-button @click="addUserDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmAddUsers" :disabled="selectedUsers.length === 0">
                    添加选中用户 ({{ selectedUsers.length }})
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { UserGroup, DepartmentUser } from '@/types/organization';
import * as echarts from 'echarts';

// 响应式数据
const loading = ref(false);
const dialogVisible = ref(false);
const userDialogVisible = ref(false);
const addUserDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const chartRef = ref<HTMLDivElement>();

const groupList = ref<UserGroup[]>([]);
const groupUsers = ref<DepartmentUser[]>([]);
const availableUsers = ref<DepartmentUser[]>([]);
const selectedUsers = ref<DepartmentUser[]>([]);
const userSearchKeyword = ref('');
const currentGroup = ref<UserGroup | null>(null);

const formData = reactive({
    id: 0,
    name: '',
    description: '',
    color: '#409EFF'
});

// 表单验证规则
const formRules = {
    name: [
        { required: true, message: '请输入分组名称', trigger: 'blur' },
        { min: 2, max: 50, message: '分组名称长度在 2 到 50 个字符', trigger: 'blur' }
    ]
};

// 计算属性
const totalUsers = computed(() => {
    return groupList.value.reduce((sum, group) => sum + group.userCount, 0);
});

const averageUsers = computed(() => {
    if (groupList.value.length === 0) return 0;
    return Math.round(totalUsers.value / groupList.value.length);
});

// 获取分组数据
const getGroupData = async () => {
    loading.value = true;
    try {
        // 模拟数据
        groupList.value = [
            {
                id: 1,
                name: '开发者',
                description: '技术开发人员',
                color: '#67C23A',
                userCount: 8,
                createTime: '2023-01-01'
            },
            {
                id: 2,
                name: '管理员',
                description: '系统管理员',
                color: '#E6A23C',
                userCount: 3,
                createTime: '2023-01-02'
            },
            {
                id: 3,
                name: '营销',
                description: '市场营销人员',
                color: '#F56C6C',
                userCount: 5,
                createTime: '2023-01-03'
            },
            {
                id: 4,
                name: '设计',
                description: 'UI/UX设计师',
                color: '#909399',
                userCount: 4,
                createTime: '2023-01-04'
            }
        ];
    } catch (error) {
        ElMessage.error('获取分组数据失败');
    } finally {
        loading.value = false;
    }
};

// 获取用户数据
const getUserData = async () => {
    // 模拟数据
    availableUsers.value = [
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
            createTime: '2023-01-01'
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
            createTime: '2023-01-02'
        },
        {
            id: 3,
            name: '王五',
            email: 'wangwu@example.com',
            phone: '13800138002',
            invitationCode: 'INV003',
            status: 'active',
            departmentId: 3,
            departmentName: '市场部',
            groupIds: [3],
            groups: ['营销'],
            createTime: '2023-01-03'
        },
        {
            id: 4,
            name: '赵六',
            email: 'zhaoliu@example.com',
            phone: '13800138003',
            invitationCode: 'INV004',
            status: 'active',
            departmentId: 4,
            departmentName: '设计部',
            groupIds: [4],
            groups: ['设计'],
            createTime: '2023-01-04'
        }
    ];
};

// 显示分组用户
const showGroupUsers = async (group: UserGroup) => {
    currentGroup.value = group;

    // 获取该分组的用户
    groupUsers.value = availableUsers.value.filter(user =>
        user.groupIds.includes(group.id)
    );

    userDialogVisible.value = true;
};

// 显示添加用户对话框
const showAddUserDialog = () => {
    userSearchKeyword.value = '';
    selectedUsers.value = [];

    // 获取不在当前分组的用户
    const currentGroupUsers = groupUsers.value.map(u => u.id);
    const filteredUsers = availableUsers.value.filter(user =>
        !currentGroupUsers.includes(user.id)
    );

    availableUsers.value = filteredUsers;
    addUserDialogVisible.value = true;
};

// 搜索用户
const searchUsers = () => {
    if (!userSearchKeyword.value) {
        // 重新获取可用用户（排除当前分组用户）
        const currentGroupUsers = groupUsers.value.map(u => u.id);
        const filteredUsers = availableUsers.value.filter(user =>
            !currentGroupUsers.includes(user.id)
        );
        availableUsers.value = filteredUsers;
        return;
    }

    const keyword = userSearchKeyword.value.toLowerCase();
    availableUsers.value = availableUsers.value.filter(user =>
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    );
};

// 处理用户选择
const handleUserSelection = (selection: DepartmentUser[]) => {
    selectedUsers.value = selection;
};

// 确认添加用户
const confirmAddUsers = async () => {
    try {
        // 实际应该调用API
        for (const user of selectedUsers.value) {
            user.groupIds.push(currentGroup.value!.id);
            user.groups.push(currentGroup.value!.name);
        }

        // 更新分组用户数
        currentGroup.value!.userCount += selectedUsers.value.length;

        ElMessage.success(`成功添加 ${selectedUsers.value.length} 个用户到分组`);

        // 刷新用户列表
        showGroupUsers(currentGroup.value!);

        addUserDialogVisible.value = false;
    } catch (error) {
        ElMessage.error('添加用户失败');
    }
};

// 从分组移除用户
const removeUserFromGroup = async (user: DepartmentUser) => {
    try {
        await ElMessageBox.confirm(
            `确定要将用户 ${user.name} 从分组 ${currentGroup.value?.name} 中移除吗？`,
            '提示',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        );

        // 实际应该调用API
        const groupIndex = user.groupIds.indexOf(currentGroup.value!.id);
        const groupNameIndex = user.groups.indexOf(currentGroup.value!.name);

        if (groupIndex > -1) user.groupIds.splice(groupIndex, 1);
        if (groupNameIndex > -1) user.groups.splice(groupNameIndex, 1);

        // 更新分组用户数
        currentGroup.value!.userCount--;

        ElMessage.success('移除成功');

        // 刷新用户列表
        showGroupUsers(currentGroup.value!);
    } catch {
        // 用户取消
    }
};

// 显示新增对话框
const showAddDialog = () => {
    isEdit.value = false;
    resetForm();
    dialogVisible.value = true;
};

// 显示编辑对话框
const showEditDialog = (group: UserGroup) => {
    isEdit.value = true;
    Object.assign(formData, group);
    dialogVisible.value = true;
};

// 删除分组
const handleDelete = async (group: UserGroup) => {
    if (group.userCount > 0) {
        ElMessage.error('该分组下还有用户，无法删除');
        return;
    }

    try {
        await ElMessageBox.confirm('确定要删除该分组吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 实际应该调用API
        const index = groupList.value.findIndex(g => g.id === group.id);
        if (index > -1) {
            groupList.value.splice(index, 1);
        }

        ElMessage.success('删除成功');
        updateChart();
    } catch {
        // 用户取消
    }
};

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        if (isEdit.value) {
            // 编辑
            const index = groupList.value.findIndex(g => g.id === formData.id);
            if (index > -1) {
                groupList.value[index] = {
                    ...formData,
                    userCount: groupList.value[index].userCount,
                    createTime: groupList.value[index].createTime
                };
            }
            ElMessage.success('编辑成功');
        } else {
            // 新增
            const newGroup: UserGroup = {
                ...formData,
                id: Date.now(),
                userCount: 0,
                createTime: new Date().toISOString().split('T')[0]
            };
            groupList.value.push(newGroup);
            ElMessage.success('新增成功');
        }

        dialogVisible.value = false;
        updateChart();
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
        description: '',
        color: '#409EFF'
    });
};

// 初始化图表
const initChart = () => {
    nextTick(() => {
        if (!chartRef.value) return;

        const chart = echarts.init(chartRef.value);
        const option = {
            tooltip: {
                trigger: 'item'
            },
            legend: {
                orient: 'vertical',
                left: 'left'
            },
            series: [
                {
                    name: '用户分组',
                    type: 'pie',
                    radius: '50%',
                    data: groupList.value.map(group => ({
                        value: group.userCount,
                        name: group.name,
                        itemStyle: {
                            color: group.color
                        }
                    })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };

        chart.setOption(option);

        // 响应式处理
        window.addEventListener('resize', () => {
            chart.resize();
        });
    });
};

// 更新图表
const updateChart = () => {
    nextTick(() => {
        if (!chartRef.value) return;

        const chart = echarts.getInstanceByDom(chartRef.value);
        if (chart) {
            const option = {
                series: [
                    {
                        data: groupList.value.map(group => ({
                            value: group.userCount,
                            name: group.name,
                            itemStyle: {
                                color: group.color
                            }
                        }))
                    }
                ]
            };
            chart.setOption(option);
        } else {
            initChart();
        }
    });
};

onMounted(() => {
    getGroupData();
    getUserData();
    initChart();
});
</script>

<style scoped>
.group-management {
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
}

.group-list {
    height: 100%;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.total-count {
    color: #666;
    font-size: 14px;
}

.group-name {
    display: flex;
    align-items: center;
}

.group-stats {
    height: 100%;
}

.stats-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid #f0f0f0;
}

.stats-item:last-child {
    border-bottom: none;
}

.stats-label {
    color: #666;
    font-size: 14px;
}

.stats-value {
    font-size: 18px;
    font-weight: bold;
    color: #409EFF;
}

.chart-container {
    margin-top: 20px;
}

.chart {
    width: 100%;
    height: 300px;
}

.color-picker {
    display: flex;
    align-items: center;
    gap: 15px;
}

.color-preview {
    color: #666;
    font-size: 14px;
}

.user-list {
    padding: 10px 0;
}

.user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.add-user-content {
    padding: 10px 0;
}
</style>