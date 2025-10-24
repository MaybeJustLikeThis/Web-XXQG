<template>
    <div class="container">
        <div class="handle-box">
            <el-input v-model="query.userName" placeholder="用户名" class="handle-input mr10" @keyup.enter="handleSearch"></el-input>
            <el-input v-model="query.userId" placeholder="用户ID" class="handle-input mr10" @keyup.enter="handleSearch"></el-input>
            <el-select v-model="query.eventType" placeholder="事件类型" class="handle-select mr10">
                <el-option label="全部" value=""></el-option>
                <el-option v-for="(label, value) in eventTypeLabels" :key="value" :label="label" :value="value"></el-option>
            </el-select>
            <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                class="mr10"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
            ></el-date-picker>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
            <el-button type="success" :icon="Download" @click="handleExport">导出Excel</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header">
            <el-table-column prop="id" label="记录ID" width="80" align="center"></el-table-column>
            <el-table-column prop="userId" label="用户ID" width="100" align="center"></el-table-column>
            <el-table-column prop="userName" label="用户名" width="120" align="center"></el-table-column>
            <el-table-column label="事件类型" width="120" align="center">
                <template #default="scope">
                    <el-tag size="small">{{ eventTypeLabels[scope.row.eventType] }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="ruleName" label="规则名称" min-width="150" show-overflow-tooltip></el-table-column>
            <el-table-column label="积分变化" width="120" align="center">
                <template #default="scope">
                    <span :class="scope.row.points > 0 ? 'color1' : 'color3'">
                        {{ scope.row.points > 0 ? '+' : '' }}{{ scope.row.points }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column label="余额变化" width="140" align="center">
                <template #default="scope">
                    <div class="balance-change">
                        <div>{{ scope.row.balanceBefore }} →</div>
                        <div :class="scope.row.balanceAfter > scope.row.balanceBefore ? 'color1' : 'color3'">
                            {{ scope.row.balanceAfter }}
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip></el-table-column>
            <el-table-column label="关联对象" width="120" align="center">
                <template #default="scope">
                    <el-tag v-if="scope.row.relatedId" type="info" size="small">{{ scope.row.relatedId }}</el-tag>
                    <span v-else class="no-relation">无关联</span>
                </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="160" align="center"></el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
                <template #default="scope">
                    <el-button type="info" :icon="View" @click="handleViewDetail(scope.row)">详情</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination">
            <el-pagination
                background
                layout="total, prev, pager, next"
                :current-page="query.page"
                :page-size="query.pageSize"
                :total="pageTotal"
                @current-change="handlePageChange"
            ></el-pagination>
        </div>

        <!-- 详情弹窗 -->
        <el-dialog title="积分记录详情" v-model="detailVisible" width="60%" destroy-on-close>
            <el-descriptions :column="2" border>
                <el-descriptions-item label="记录ID">{{ currentRecord.id }}</el-descriptions-item>
                <el-descriptions-item label="用户ID">{{ currentRecord.userId }}</el-descriptions-item>
                <el-descriptions-item label="用户名">{{ currentRecord.userName }}</el-descriptions-item>
                <el-descriptions-item label="事件类型">{{ eventTypeLabels[currentRecord.eventType] }}</el-descriptions-item>
                <el-descriptions-item label="规则名称">{{ currentRecord.ruleName }}</el-descriptions-item>
                <el-descriptions-item label="积分变化">
                    <span :class="currentRecord.points > 0 ? 'color1' : 'color3'">
                        {{ currentRecord.points > 0 ? '+' : '' }}{{ currentRecord.points }}
                    </span>
                </el-descriptions-item>
                <el-descriptions-item label="操作前余额">{{ currentRecord.balanceBefore }}</el-descriptions-item>
                <el-descriptions-item label="操作后余额">
                    <span :class="currentRecord.balanceAfter > currentRecord.balanceBefore ? 'color1' : 'color3'">
                        {{ currentRecord.balanceAfter }}
                    </span>
                </el-descriptions-item>
                <el-descriptions-item label="关联对象">{{ currentRecord.relatedId || '无' }}</el-descriptions-item>
                <el-descriptions-item label="IP地址">{{ currentRecord.ip || '未知' }}</el-descriptions-item>
                <el-descriptions-item label="用户代理" :span="2">
                    <div class="user-agent">{{ currentRecord.userAgent || '未知' }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="描述" :span="2">{{ currentRecord.description }}</el-descriptions-item>
                <el-descriptions-item label="创建时间" :span="2">{{ currentRecord.createTime }}</el-descriptions-item>
                <el-descriptions-item label="额外信息" :span="2">
                    <el-tag v-for="(value, key) in currentRecord.metadata" :key="key" class="mr5 mb5" size="small">
                        {{ key }}: {{ value }}
                    </el-tag>
                    <span v-if="!currentRecord.metadata || Object.keys(currentRecord.metadata).length === 0">无</span>
                </el-descriptions-item>
            </el-descriptions>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="detailVisible = false">关闭</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="points-records">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Download, View } from '@element-plus/icons-vue';
import type { UserPointRecord, UserPointRecordQuery, PointEventType } from '@/types/points';
import { getPointRecords, getPointRecordDetail, exportPointRecords } from '@/api/points';

// 查询参数
const query = reactive<UserPointRecordQuery>({
    page: 1,
    pageSize: 10,
    userName: '',
    userId: '',
    eventType: undefined,
    startDate: '',
    endDate: '',
    minPoints: undefined,
    maxPoints: undefined,
});

// 日期范围
const dateRange = ref<[string, string] | null>(null);

// 表格数据
const tableData = ref<UserPointRecord[]>([]);
const pageTotal = ref(0);

// 详情弹窗
const detailVisible = ref(false);
const currentRecord = ref<UserPointRecord>({
    id: '',
    userId: '',
    userName: '',
    eventType: 'login' as PointEventType,
    ruleName: '',
    points: 0,
    balanceBefore: 0,
    balanceAfter: 0,
    description: '',
    relatedId: undefined,
    metadata: undefined,
    createTime: '',
    ip: undefined,
    userAgent: undefined,
});

// 事件类型标签
const eventTypeLabels = {
    login: '登录',
    daily_login: '每日登录',
    article_read: '阅读文章',
    article_complete: '完播文章',
    article_comment: '评论文章',
    question_answer: '答题',
    question_correct: '答对题目',
    question_wrong: '答错题目',
    challenge_win: '挑战胜利',
    challenge_lose: '挑战失败',
    pk_win: 'PK胜利',
    pk_lose: 'PK失败',
    share_content: '分享内容',
    invite_user: '邀请用户',
    system_reward: '系统奖励',
    system_penalty: '系统惩罚'
};

// 获取积分记录列表
const getRecords = async () => {
    try {
        // 处理日期范围
        if (dateRange.value) {
            query.startDate = dateRange.value[0];
            query.endDate = dateRange.value[1];
        } else {
            query.startDate = '';
            query.endDate = '';
        }

        const res = await getPointRecords(query);
        tableData.value = res.data.list;
        pageTotal.value = res.data.total;
    } catch (error) {
        ElMessage.error('获取积分记录列表失败');
        // 开发阶段使用模拟数据
        const mockData: UserPointRecord[] = [
            {
                id: '1',
                userId: '1001',
                userName: '张三',
                eventType: 'daily_login' as PointEventType,
                ruleName: '每日登录奖励',
                points: 10,
                balanceBefore: 150,
                balanceAfter: 160,
                description: '用户每日首次登录获得积分奖励',
                metadata: {
                    device: 'mobile',
                    platform: 'iOS'
                },
                createTime: '2024-01-15 09:30:00',
                ip: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
            },
            {
                id: '2',
                userId: '1002',
                userName: '李四',
                eventType: 'article_read' as PointEventType,
                ruleName: '阅读文章奖励',
                points: 2,
                balanceBefore: 80,
                balanceAfter: 82,
                description: '用户阅读文章获得积分奖励',
                relatedId: 'article_123',
                metadata: {
                    articleId: 'article_123',
                    articleTitle: 'Vue3 Composition API 最佳实践',
                    readDuration: 120
                },
                createTime: '2024-01-15 10:15:00',
                ip: '192.168.1.101',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        ];
        tableData.value = mockData;
        pageTotal.value = mockData.length;
    }
};

// 搜索
const handleSearch = () => {
    query.page = 1;
    getRecords();
};

// 分页切换
const handlePageChange = (val: number) => {
    query.page = val;
    getRecords();
};

// 查看详情
const handleViewDetail = async (row: UserPointRecord) => {
    try {
        const res = await getPointRecordDetail(row.id);
        currentRecord.value = res.data;
    } catch (error) {
        ElMessage.error('获取记录详情失败');
        currentRecord.value = { ...row };
    }
    detailVisible.value = true;
};

// 导出Excel
const handleExport = async () => {
    try {
        const res = await exportPointRecords(query);
        // 创建下载链接
        const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `积分记录_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        ElMessage.success('导出成功');
    } catch (error) {
        ElMessage.error('导出失败');
    }
};

onMounted(() => {
    getRecords();
});
</script>

<style scoped>
.handle-box {
    margin-bottom: 20px;
}

.handle-select {
    width: 120px;
}

.handle-input {
    width: 200px;
    display: inline-block;
}

.mr10 {
    margin-right: 10px;
}

.table {
    width: 100%;
    font-size: 14px;
}

.color1 {
    color: #67c23a;
    font-weight: bold;
}

.color3 {
    color: #f56c6c;
    font-weight: bold;
}

.balance-change {
    font-size: 12px;
    line-height: 1.2;
}

.no-relation {
    color: #999;
    font-size: 12px;
}

.user-agent {
    word-break: break-all;
    font-size: 12px;
    color: #666;
}

.mr5 {
    margin-right: 5px;
}

.mb5 {
    margin-bottom: 5px;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}
</style>