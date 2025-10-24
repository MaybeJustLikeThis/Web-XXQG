<template>
    <div class="invitation-management">
        <div class="header">
            <h2>邀请码管理</h2>
            <div class="header-actions">
                <el-button type="success" @click="batchGenerateCodes">
                    <el-icon><Key /></el-icon>
                    批量生成邀请码
                </el-button>
                <el-button type="primary" @click="showAddDialog">
                    <el-icon><Plus /></el-icon>
                    生成邀请码
                </el-button>
            </div>
        </div>

        <!-- 搜索区域 -->
        <div class="search-area">
            <el-form :model="searchForm" inline>
                <el-form-item label="邀请码">
                    <el-input
                        v-model="searchForm.code"
                        placeholder="请输入邀请码"
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
                        <el-option label="未使用" value="unused" />
                        <el-option label="已使用" value="used" />
                        <el-option label="已过期" value="expired" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button @click="resetSearch">重置</el-button>
                    <el-button type="warning" @click="handleExport">导出Excel</el-button>
                </el-form-item>
            </el-form>
        </div>

        <!-- 统计信息 -->
        <div class="stats-area">
            <el-row :gutter="20">
                <el-col :span="6">
                    <el-card class="stats-card">
                        <div class="stats-content">
                            <div class="stats-icon unused">
                                <el-icon><Key /></el-icon>
                            </div>
                            <div class="stats-info">
                                <div class="stats-value">{{ stats.unused }}</div>
                                <div class="stats-label">未使用</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card class="stats-card">
                        <div class="stats-content">
                            <div class="stats-icon used">
                                <el-icon><CircleCheck /></el-icon>
                            </div>
                            <div class="stats-info">
                                <div class="stats-value">{{ stats.used }}</div>
                                <div class="stats-label">已使用</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card class="stats-card">
                        <div class="stats-content">
                            <div class="stats-icon expired">
                                <el-icon><Clock /></el-icon>
                            </div>
                            <div class="stats-info">
                                <div class="stats-value">{{ stats.expired }}</div>
                                <div class="stats-label">已过期</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
                <el-col :span="6">
                    <el-card class="stats-card">
                        <div class="stats-content">
                            <div class="stats-icon total">
                                <el-icon><DataLine /></el-icon>
                            </div>
                            <div class="stats-info">
                                <div class="stats-value">{{ stats.total }}</div>
                                <div class="stats-label">总计</div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 表格区域 -->
        <div class="table-area">
            <el-table
                :data="tableData"
                border
                style="width: 100%"
                v-loading="loading"
                @selection-change="handleSelectionChange"
            >
                <el-table-column type="selection" width="55" />
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="code" label="邀请码" width="150">
                    <template #default="{ row }">
                        <div class="code-cell">
                            <el-input
                                v-model="row.code"
                                size="small"
                                readonly
                                style="width: 100px"
                            />
                            <el-button
                                type="text"
                                size="small"
                                @click="copyCode(row.code)"
                            >
                                复制
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="departmentName" label="部门" width="120" />
                <el-table-column prop="groupName" label="用户分组" width="120" />
                <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)">
                            {{ getStatusText(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="usedBy" label="使用人" width="120" />
                <el-table-column prop="usedTime" label="使用时间" width="160" />
                <el-table-column prop="expireTime" label="过期时间" width="160" />
                <el-table-column prop="createTime" label="创建时间" width="160" />
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button
                            v-if="row.status === 'unused'"
                            type="primary"
                            size="small"
                            @click="showEditDialog(row)"
                        >
                            编辑
                        </el-button>
                        <el-button
                            v-if="row.status === 'unused'"
                            type="warning"
                            size="small"
                            @click="invalidateCode(row)"
                        >
                            设为过期
                        </el-button>
                        <el-button
                            v-if="row.status === 'expired'"
                            type="success"
                            size="small"
                            @click="reactivateCode(row)"
                        >
                            重新激活
                        </el-button>
                        <el-button
                            type="danger"
                            size="small"
                            @click="handleDelete(row)"
                            :disabled="row.status === 'used'"
                        >
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 批量操作 -->
            <div class="batch-actions" v-if="selectedCodes.length > 0">
                <span>已选择 {{ selectedCodes.length }} 个邀请码</span>
                <el-button type="warning" @click="batchInvalidate">批量设为过期</el-button>
                <el-button type="danger" @click="batchDelete">批量删除</el-button>
            </div>

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

        <!-- 生成邀请码弹窗 -->
        <el-dialog
            v-model="dialogVisible"
            :title="isEdit ? '编辑邀请码' : '生成邀请码'"
            width="500px"
            @close="resetForm"
        >
            <el-form
                ref="formRef"
                :model="formData"
                :rules="formRules"
                label-width="100px"
            >
                <el-form-item v-if="!isEdit" label="生成数量" prop="count">
                    <el-input-number
                        v-model="formData.count"
                        :min="1"
                        :max="100"
                        placeholder="请输入生成数量"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-form-item v-else label="邀请码">
                    <el-input v-model="formData.code" readonly />
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
                        v-model="formData.groupId"
                        placeholder="请选择用户分组"
                        clearable
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
                <el-form-item label="过期时间">
                    <el-date-picker
                        v-model="formData.expireTime"
                        type="datetime"
                        placeholder="请选择过期时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">
                    {{ isEdit ? '保存' : '生成' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- 批量生成弹窗 -->
        <el-dialog
            v-model="batchDialogVisible"
            title="批量生成邀请码"
            width="600px"
        >
            <div class="batch-content">
                <el-form :model="batchForm" label-width="100px">
                    <el-form-item label="生成数量">
                        <el-input-number
                            v-model="batchForm.count"
                            :min="1"
                            :max="500"
                            style="width: 100%"
                        />
                    </el-form-item>
                    <el-form-item label="所属部门">
                        <el-tree-select
                            v-model="batchForm.departmentId"
                            :data="departmentOptions"
                            :props="treeProps"
                            placeholder="请选择部门"
                            check-strictly
                            style="width: 100%"
                        />
                    </el-form-item>
                    <el-form-item label="用户分组">
                        <el-select
                            v-model="batchForm.groupId"
                            placeholder="请选择用户分组"
                            clearable
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
                    <el-form-item label="过期时间">
                        <el-date-picker
                            v-model="batchForm.expireTime"
                            type="datetime"
                            placeholder="请选择过期时间"
                            format="YYYY-MM-DD HH:mm:ss"
                            value-format="YYYY-MM-DD HH:mm:ss"
                            style="width: 100%"
                        />
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <el-button @click="batchDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleBatchGenerate">确认生成</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Key, Plus, CircleCheck, Clock, DataLine } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { InvitationCode, Department, UserGroup } from '@/types/organization';
import * as XLSX from 'xlsx';

// 响应式数据
const loading = ref(false);
const dialogVisible = ref(false);
const batchDialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const selectedCodes = ref<InvitationCode[]>([]);

const searchForm = reactive({
    code: '',
    departmentId: null as number | null,
    groupId: null as number | null,
    status: ''
});

const formData = reactive({
    id: 0,
    code: '',
    count: 1,
    departmentId: null as number | null,
    groupId: null as number | null,
    expireTime: ''
});

const batchForm = reactive({
    count: 10,
    departmentId: null as number | null,
    groupId: null as number | null,
    expireTime: ''
});

const pagination = reactive({
    page: 1,
    size: 10,
    total: 0
});

const tableData = ref<InvitationCode[]>([]);
const departmentOptions = ref<Department[]>([]);
const groupOptions = ref<UserGroup[]>([]);

const treeProps = {
    children: 'children',
    label: 'name',
    value: 'id'
};

// 表单验证规则
const formRules = {
    count: [
        { required: true, message: '请输入生成数量', trigger: 'blur' }
    ],
    departmentId: [
        { required: true, message: '请选择部门', trigger: 'change' }
    ]
};

// 统计数据
const stats = computed(() => {
    const allCodes = tableData.value;
    return {
        unused: allCodes.filter(c => c.status === 'unused').length,
        used: allCodes.filter(c => c.status === 'used').length,
        expired: allCodes.filter(c => c.status === 'expired').length,
        total: allCodes.length
    };
});

// 获取邀请码数据
const getInvitationData = async () => {
    loading.value = true;
    try {
        // 模拟数据
        const mockData: InvitationCode[] = [
            {
                id: 1,
                code: 'INV001',
                departmentId: 2,
                departmentName: '技术部',
                groupId: 1,
                groupName: '开发者',
                status: 'used',
                usedBy: '张三',
                usedTime: '2023-10-20 14:30:00',
                expireTime: '2023-12-31 23:59:59',
                createTime: '2023-10-01 10:00:00'
            },
            {
                id: 2,
                code: 'INV002',
                departmentId: 2,
                departmentName: '技术部',
                groupId: 1,
                groupName: '开发者',
                status: 'unused',
                expireTime: '2023-12-31 23:59:59',
                createTime: '2023-10-02 10:00:00'
            },
            {
                id: 3,
                code: 'INV003',
                departmentId: 3,
                departmentName: '市场部',
                groupId: 3,
                groupName: '营销',
                status: 'expired',
                expireTime: '2023-10-15 23:59:59',
                createTime: '2023-10-03 10:00:00'
            },
            {
                id: 4,
                code: 'INV004',
                departmentId: 4,
                departmentName: '设计部',
                groupId: 4,
                groupName: '设计',
                status: 'unused',
                expireTime: '2024-01-31 23:59:59',
                createTime: '2023-10-04 10:00:00'
            }
        ];

        // 应用筛选条件
        let filteredData = mockData.filter(code => {
            if (searchForm.code && !code.code.includes(searchForm.code)) return false;
            if (searchForm.departmentId && code.departmentId !== searchForm.departmentId) return false;
            if (searchForm.groupId && code.groupId !== searchForm.groupId) return false;
            if (searchForm.status && code.status !== searchForm.status) return false;
            return true;
        });

        pagination.total = filteredData.length;
        const start = (pagination.page - 1) * pagination.size;
        const end = start + pagination.size;
        tableData.value = filteredData.slice(start, end);
    } catch (error) {
        ElMessage.error('获取邀请码数据失败');
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
                },
                {
                    id: 4,
                    name: '设计部',
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
            id: 3,
            name: '营销',
            description: '市场营销人员',
            userCount: 3,
            createTime: '2023-01-01'
        },
        {
            id: 4,
            name: '设计',
            description: 'UI/UX设计师',
            userCount: 4,
            createTime: '2023-01-01'
        }
    ];
};

// 获取状态类型
const getStatusType = (status: string) => {
    switch (status) {
        case 'unused':
            return 'success';
        case 'used':
            return 'info';
        case 'expired':
            return 'danger';
        default:
            return 'info';
    }
};

// 获取状态文本
const getStatusText = (status: string) => {
    switch (status) {
        case 'unused':
            return '未使用';
        case 'used':
            return '已使用';
        case 'expired':
            return '已过期';
        default:
            return '未知';
    }
};

// 搜索
const handleSearch = () => {
    pagination.page = 1;
    getInvitationData();
};

// 重置搜索
const resetSearch = () => {
    Object.assign(searchForm, {
        code: '',
        departmentId: null,
        groupId: null,
        status: ''
    });
    handleSearch();
};

// 分页处理
const handleSizeChange = (size: number) => {
    pagination.size = size;
    getInvitationData();
};

const handleCurrentChange = (page: number) => {
    pagination.page = page;
    getInvitationData();
};

// 选择处理
const handleSelectionChange = (selection: InvitationCode[]) => {
    selectedCodes.value = selection;
};

// 复制邀请码
const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
        ElMessage.success('邀请码已复制到剪贴板');
    }).catch(() => {
        ElMessage.error('复制失败');
    });
};

// 显示新增对话框
const showAddDialog = () => {
    isEdit.value = false;
    resetForm();
    dialogVisible.value = true;
};

// 显示编辑对话框
const showEditDialog = (code: InvitationCode) => {
    isEdit.value = true;
    Object.assign(formData, {
        id: code.id,
        code: code.code,
        departmentId: code.departmentId,
        groupId: code.groupId,
        expireTime: code.expireTime
    });
    dialogVisible.value = true;
};

// 批量生成
const batchGenerateCodes = () => {
    batchForm.count = 10;
    batchForm.departmentId = null;
    batchForm.groupId = null;
    batchForm.expireTime = '';
    batchDialogVisible.value = true;
};

// 设为过期
const invalidateCode = async (code: InvitationCode) => {
    try {
        await ElMessageBox.confirm('确定要将该邀请码设为过期吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        code.status = 'expired';
        ElMessage.success('操作成功');
    } catch {
        // 用户取消
    }
};

// 重新激活
const reactivateCode = async (code: InvitationCode) => {
    try {
        await ElMessageBox.confirm('确定要重新激活该邀请码吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        code.status = 'unused';
        ElMessage.success('操作成功');
    } catch {
        // 用户取消
    }
};

// 删除邀请码
const handleDelete = async (code: InvitationCode) => {
    try {
        await ElMessageBox.confirm('确定要删除该邀请码吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 实际应该调用API
        const index = tableData.value.findIndex(c => c.id === code.id);
        if (index > -1) {
            tableData.value.splice(index, 1);
        }

        ElMessage.success('删除成功');
        getInvitationData();
    } catch {
        // 用户取消
    }
};

// 批量设为过期
const batchInvalidate = async () => {
    try {
        await ElMessageBox.confirm(`确定要将选中的 ${selectedCodes.value.length} 个邀请码设为过期吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        selectedCodes.value.forEach(code => {
            if (code.status === 'unused') {
                code.status = 'expired';
            }
        });

        ElMessage.success('批量操作成功');
        selectedCodes.value = [];
    } catch {
        // 用户取消
    }
};

// 批量删除
const batchDelete = async () => {
    const unusedCodes = selectedCodes.value.filter(c => c.status !== 'used');
    if (unusedCodes.length === 0) {
        ElMessage.warning('没有可删除的邀请码');
        return;
    }

    try {
        await ElMessageBox.confirm(`确定要删除选中的 ${unusedCodes.length} 个未使用的邀请码吗？`, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 实际应该调用API
        unusedCodes.forEach(code => {
            const index = tableData.value.findIndex(c => c.id === code.id);
            if (index > -1) {
                tableData.value.splice(index, 1);
            }
        });

        ElMessage.success('批量删除成功');
        selectedCodes.value = [];
        getInvitationData();
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
            // 编辑邀请码
            const index = tableData.value.findIndex(c => c.id === formData.id);
            if (index > -1) {
                tableData.value[index] = {
                    ...tableData.value[index],
                    departmentId: formData.departmentId,
                    groupId: formData.groupId,
                    expireTime: formData.expireTime
                };
            }
            ElMessage.success('编辑成功');
        } else {
            // 生成邀请码
            for (let i = 0; i < formData.count; i++) {
                const newCode: InvitationCode = {
                    id: Date.now() + i,
                    code: 'INV' + Date.now().toString().slice(-6) + i,
                    departmentId: formData.departmentId!,
                    departmentName: departmentOptions.value.find(d => d.id === formData.departmentId)?.name || '',
                    groupId: formData.groupId,
                    groupName: groupOptions.value.find(g => g.id === formData.groupId)?.name,
                    status: 'unused',
                    expireTime: formData.expireTime,
                    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
                };
                tableData.value.unshift(newCode);
            }
            ElMessage.success(`成功生成 ${formData.count} 个邀请码`);
        }

        dialogVisible.value = false;
        getInvitationData();
    } catch (error) {
        console.error('表单验证失败:', error);
    }
};

// 批量生成
const handleBatchGenerate = async () => {
    try {
        for (let i = 0; i < batchForm.count; i++) {
            const newCode: InvitationCode = {
                id: Date.now() + i,
                code: 'INV' + Date.now().toString().slice(-6) + i,
                departmentId: batchForm.departmentId!,
                departmentName: departmentOptions.value.find(d => d.id === batchForm.departmentId)?.name || '',
                groupId: batchForm.groupId,
                groupName: groupOptions.value.find(g => g.id === batchForm.groupId)?.name,
                status: 'unused',
                expireTime: batchForm.expireTime,
                createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
            };
            tableData.value.unshift(newCode);
        }

        ElMessage.success(`成功生成 ${batchForm.count} 个邀请码`);
        batchDialogVisible.value = false;
        getInvitationData();
    } catch (error) {
        ElMessage.error('批量生成失败');
    }
};

// 导出Excel
const handleExport = () => {
    const exportData = tableData.value.map((item, index) => [
        index + 1,
        item.code,
        item.departmentName,
        item.groupName || '',
        getStatusText(item.status),
        item.usedBy || '',
        item.usedTime || '',
        item.expireTime || '',
        item.createTime
    ]);

    const ws = XLSX.utils.aoa_to_sheet([
        ['序号', '邀请码', '部门', '用户分组', '状态', '使用人', '使用时间', '过期时间', '创建时间'],
        ...exportData
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '邀请码列表');
    XLSX.writeFile(wb, `邀请码列表_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// 重置表单
const resetForm = () => {
    if (formRef.value) {
        formRef.value.resetFields();
    }
    Object.assign(formData, {
        id: 0,
        code: '',
        count: 1,
        departmentId: null,
        groupId: null,
        expireTime: ''
    });
};

onMounted(() => {
    getDepartmentData();
    getGroupData();
    getInvitationData();
});
</script>

<style scoped>
.invitation-management {
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

.stats-area {
    margin-bottom: 20px;
}

.stats-card {
    height: 100px;
}

.stats-content {
    display: flex;
    align-items: center;
    height: 100%;
}

.stats-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-size: 24px;
    color: #fff;
}

.stats-icon.unused {
    background: linear-gradient(135deg, #67C23A, #85CE61);
}

.stats-icon.used {
    background: linear-gradient(135deg, #409EFF, #66B1FF);
}

.stats-icon.expired {
    background: linear-gradient(135deg, #F56C6C, #F78989);
}

.stats-icon.total {
    background: linear-gradient(135deg, #909399, #B1B3B8);
}

.stats-value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
}

.stats-label {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
}

.table-area {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
}

.code-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.batch-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 15px 0;
    padding: 10px;
    background: #f5f7fa;
    border-radius: 4px;
}

.pagination {
    margin-top: 20px;
    text-align: right;
}

.batch-content {
    padding: 10px 0;
}
</style>