<template>
    <div class="container">
        <!-- 权限检查 -->
        <div v-if="!permiss.isSuperAdmin" class="no-permission">
            <el-empty description="无权限访问，仅超级管理员可查看此页面" />
        </div>

        <div v-else class="user-management">
            <!-- 工具栏 -->
            <div class="table-toolbar">
                <div class="table-toolbar-left">
                    <el-button type="primary" @click="exportToExcel" :loading="exportLoading">
                        <el-icon><Download /></el-icon>
                        导出Excel
                    </el-button>
                    <el-button @click="fetchData" :loading="loading">
                        <el-icon><Refresh /></el-icon>
                        刷新
                    </el-button>
                </div>
                <div class="table-toolbar-right">
                    <span class="total-info">共 {{ pagination.total }} 条数据</span>
                </div>
            </div>

            <!-- 主表格 -->
            <el-table
                :data="displayData"
                v-loading="loading"
                border
                stripe
                style="width: 100%"
                :default-sort="{ prop: 'points', order: 'descending' }"
            >
                <el-table-column type="index" label="序号" width="60" align="center">
                    <template #default="{ $index }">
                        {{ ($index + 1) + (pagination.page - 1) * pagination.size }}
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="姓名" min-width="120" show-overflow-tooltip />
                <el-table-column prop="department" label="部门" min-width="300" show-overflow-tooltip />
                <el-table-column
                    prop="points"
                    label="积分"
                    width="120"
                    sortable
                    align="center"
                >
                    <template #default="{ row }">
                        <el-tag type="primary" size="large">{{ row.points }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button type="primary" size="small" @click="viewDetails(row)">
                            <el-icon><View /></el-icon>
                            查看详情
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination-wrapper">
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

            <!-- 积分详情弹窗 -->
            <el-dialog
                v-model="detailDialogVisible"
                :title="`${selectedUser?.name || '用户'} - 积分明细`"
                width="900px"
                destroy-on-close
                :close-on-click-modal="false"
            >
                <!-- 用户信息摘要 -->
                <div class="user-summary" v-if="selectedUser">
                    <el-descriptions :column="3" border>
                        <el-descriptions-item label="用户ID">{{ selectedUser.user_id }}</el-descriptions-item>
                        <el-descriptions-item label="姓名">{{ selectedUser.name }}</el-descriptions-item>
                        <el-descriptions-item label="总积分">
                            <el-tag type="primary" size="large">{{ selectedUser.points }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="部门" :span="3">{{ selectedUser.department }}</el-descriptions-item>
                    </el-descriptions>
                </div>

                <!-- 积分记录表格 -->
                <el-divider content-position="left">
                    <el-icon><List /></el-icon>
                    积分记录
                </el-divider>

                <el-table
                    :data="pointRecords"
                    v-loading="detailLoading"
                    border
                    stripe
                    max-height="400"
                    style="width: 100%"
                >
                    <el-table-column type="index" label="序号" width="60" align="center" />
                    <el-table-column prop="create_time" label="时间" width="180" />
                    <el-table-column prop="type" label="类型" min-width="150" show-overflow-tooltip />
                    <el-table-column prop="point" label="积分" width="100" align="center">
                        <template #default="{ row }">
                            <el-tag :type="row.point > 0 ? 'success' : 'danger'" size="large">
                                {{ row.point > 0 ? '+' : '' }}{{ row.point }}
                            </el-tag>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 空状态 -->
                <el-empty v-if="!detailLoading && pointRecords.length === 0" description="暂无积分记录" />

                <template #footer>
                    <el-button @click="detailDialogVisible = false">关闭</el-button>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup lang="ts" name="system-user-management">
import { ref, reactive, computed, onMounted } from 'vue';
import { usePermissStore } from '@/store/permiss';
import { ElMessage } from 'element-plus';
import { Download, Refresh, View, List } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { getPointAllList, getPointRecordForAdmin } from '@/api/user';

const permiss = usePermissStore();

// 状态管理
const loading = ref(false);
const exportLoading = ref(false);
const allData = ref<any[]>([]);

// 分页
const pagination = reactive({
    page: 1,
    size: 20,
    total: 0
});

// 计算当前页显示的数据
const displayData = computed(() => {
    const start = (pagination.page - 1) * pagination.size;
    const end = start + pagination.size;
    return allData.value.slice(start, end);
});

// 详情弹窗
const detailDialogVisible = ref(false);
const detailLoading = ref(false);
const selectedUser = ref<any>(null);
const pointRecords = ref<any[]>([]);

// 获取所有用户积分数据
const fetchData = async () => {
    loading.value = true;
    try {
        const res = await getPointAllList();
        if (res.data && res.data.code === 200) {
            allData.value = res.data.data || [];
            pagination.total = res.data.data?.length || 0;
            ElMessage.success('数据加载成功');
        } else {
            ElMessage.error(res.data?.msg || '获取数据失败');
        }
    } catch (error: any) {
        console.error('获取用户积分列表失败:', error);
        ElMessage.error(error.message || '获取数据失败');
    } finally {
        loading.value = false;
    }
};

// 查看积分详情
const viewDetails = async (row: any) => {
    selectedUser.value = row;
    detailDialogVisible.value = true;
    detailLoading.value = true;
    pointRecords.value = [];

    try {
        const res = await getPointRecordForAdmin(row.user_id);
        if (res.data && res.data.code === 200) {
            pointRecords.value = res.data.data || [];
        } else {
            ElMessage.error(res.data?.msg || '获取积分明细失败');
        }
    } catch (error: any) {
        console.error('获取积分记录失败:', error);
        ElMessage.error(error.message || '获取积分明细失败');
    } finally {
        detailLoading.value = false;
    }
};

// 分页处理
const handleSizeChange = (val: number) => {
    pagination.size = val;
    pagination.page = 1; // 重置到第一页
};

const handleCurrentChange = (val: number) => {
    pagination.page = val;
};

// 导出Excel
const exportToExcel = () => {
    if (allData.value.length === 0) {
        ElMessage.warning('暂无数据可导出');
        return;
    }

    exportLoading.value = true;

    try {
        // 准备导出数据
        const data = allData.value.map((item: any, index: number) => ({
            '序号': index + 1,
            '用户ID': item.user_id,
            '姓名': item.name,
            '部门': item.department,
            '积分': item.points
        }));

        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(data);

        // 设置列宽
        ws['!cols'] = [
            { wch: 8 },  // 序号
            { wch: 12 }, // 用户ID
            { wch: 15 }, // 姓名
            { wch: 40 }, // 部门
            { wch: 10 }  // 积分
        ];

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '用户积分列表');

        // 生成文件名
        const fileName = `用户积分列表_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;

        // 下载文件
        XLSX.writeFile(wb, fileName);

        ElMessage.success('导出成功');
    } catch (error) {
        console.error('导出Excel失败:', error);
        ElMessage.error('导出失败');
    } finally {
        exportLoading.value = false;
    }
};

// 页面加载时获取数据
onMounted(() => {
    fetchData();
});
</script>

<style scoped>
.container {
    padding: 20px;
}

.no-permission {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
}

.user-management {
    background: #fff;
    padding: 20px;
    border-radius: 4px;
}

.table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.table-toolbar-left {
    display: flex;
    gap: 10px;
}

.table-toolbar-right {
    display: flex;
    align-items: center;
}

.total-info {
    color: #606266;
    font-size: 14px;
}

.pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

.user-summary {
    margin-bottom: 20px;
}

/* 暗色模式适配 */
:root.dark .user-management {
    background: #1a1a1a;
}

:root.dark .total-info {
    color: #a3a6ad;
}
</style>
