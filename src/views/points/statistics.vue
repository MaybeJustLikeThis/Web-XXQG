<template>
    <div class="container">
        <!-- 统计卡片 -->
        <el-row :gutter="20" class="mgb20">
            <el-col :span="6">
                <div class="grid-content bg1">
                    <div class="grid-content-header">
                        <i class="el-icon-coin bg1-icon"></i>
                        <span>总发放积分</span>
                    </div>
                    <div class="grid-content-body">{{ statistics.totalDistributed.toLocaleString() }}</div>
                </div>
            </el-col>
            <el-col :span="6">
                <div class="grid-content bg2">
                    <div class="grid-content-header">
                        <i class="el-icon-trend-charts bg2-icon"></i>
                        <span>今日发放</span>
                    </div>
                    <div class="grid-content-body">{{ statistics.todayDistributed.toLocaleString() }}</div>
                </div>
            </el-col>
            <el-col :span="6">
                <div class="grid-content bg3">
                    <div class="grid-content-header">
                        <i class="el-icon-user bg3-icon"></i>
                        <span>活跃用户</span>
                    </div>
                    <div class="grid-content-body">{{ statistics.activeUsers.toLocaleString() }}</div>
                </div>
            </el-col>
            <el-col :span="6">
                <div class="grid-content bg4">
                    <div class="grid-content-header">
                        <i class="el-icon-trophy bg4-icon"></i>
                        <span>平均积分</span>
                    </div>
                    <div class="grid-content-body">{{ statistics.averagePoints.toLocaleString() }}</div>
                </div>
            </el-col>
        </el-row>

        <!-- 图表区域 -->
        <el-row :gutter="20" class="mgb20">
            <el-col :span="12">
                <div class="chart-box">
                    <div class="chart-header">
                        <span>积分发放趋势</span>
                        <el-select v-model="trendPeriod" size="small" style="width: 120px">
                            <el-option label="近7天" value="7d"></el-option>
                            <el-option label="近30天" value="30d"></el-option>
                            <el-option label="近3个月" value="3m"></el-option>
                        </el-select>
                    </div>
                    <div class="chart-content" ref="trendChartRef" style="height: 300px"></div>
                </div>
            </el-col>
            <el-col :span="12">
                <div class="chart-box">
                    <div class="chart-header">
                        <span>事件类型分布</span>
                        <el-select v-model="eventTypePeriod" size="small" style="width: 120px">
                            <el-option label="今日" value="today"></el-option>
                            <el-option label="本周" value="week"></el-option>
                            <el-option label="本月" value="month"></el-option>
                        </el-select>
                    </div>
                    <div class="chart-content" ref="pieChartRef" style="height: 300px"></div>
                </div>
            </el-col>
        </el-row>

        <!-- 排行榜 -->
        <el-row :gutter="20" class="mgb20">
            <el-col :span="12">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span>积分排行榜 TOP 10</span>
                            <el-button type="text" @click="refreshRank('points')">刷新</el-button>
                        </div>
                    </template>
                    <el-table :data="topPointsUsers" style="width: 100%" size="small">
                        <el-table-column width="60" align="center">
                            <template #default="scope">
                                <div class="rank-badge" :class="getRankClass(scope.$index + 1)">
                                    {{ scope.$index + 1 }}
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="userName" label="用户名" show-overflow-tooltip></el-table-column>
                        <el-table-column prop="totalPoints" label="总积分" width="100" align="center">
                            <template #default="scope">
                                <span class="color1">{{ scope.row.totalPoints.toLocaleString() }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="todayEarned" label="今日获得" width="100" align="center">
                            <template #default="scope">
                                <span class="success">+{{ scope.row.todayEarned }}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>
            <el-col :span="12">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span>活跃度排行榜 TOP 10</span>
                            <el-button type="text" @click="refreshRank('activity')">刷新</el-button>
                        </div>
                    </template>
                    <el-table :data="topActiveUsers" style="width: 100%" size="small">
                        <el-table-column width="60" align="center">
                            <template #default="scope">
                                <div class="rank-badge" :class="getRankClass(scope.$index + 1)">
                                    {{ scope.$index + 1 }}
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="userName" label="用户名" show-overflow-tooltip></el-table-column>
                        <el-table-column prop="activityCount" label="活跃次数" width="100" align="center">
                            <template #default="scope">
                                <span class="warning">{{ scope.row.activityCount }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="lastActiveTime" label="最后活跃" width="120" align="center">
                            <template #default="scope">
                                <span class="last-active">{{ formatTime(scope.row.lastActiveTime) }}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>
        </el-row>

        <!-- 详细统计表格 -->
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <span>事件统计详情</span>
                    <div>
                        <el-date-picker
                            v-model="dateRange"
                            type="daterange"
                            range-separator="至"
                            start-placeholder="开始日期"
                            end-placeholder="结束日期"
                            size="small"
                            format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD"
                            @change="handleDateChange"
                        ></el-date-picker>
                        <el-button type="primary" size="small" @click="handleExport">导出报表</el-button>
                    </div>
                </div>
            </template>
            <el-table :data="eventStatistics" border class="table" header-cell-class-name="table-header">
                <el-table-column prop="eventType" label="事件类型" width="120" align="center">
                    <template #default="scope">
                        <el-tag size="small">{{ eventTypeLabels[scope.row.eventType] }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="totalCount" label="发生次数" width="100" align="center">
                    <template #default="scope">
                        <span class="color1">{{ scope.row.totalCount.toLocaleString() }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="totalPoints" label="总积分" width="120" align="center">
                    <template #default="scope">
                        <span :class="scope.row.totalPoints > 0 ? 'color1' : 'color3'">
                            {{ scope.row.totalPoints > 0 ? '+' : '' }}{{ scope.row.totalPoints.toLocaleString() }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="uniqueUsers" label="参与用户" width="100" align="center">
                    <template #default="scope">
                        <span>{{ scope.row.uniqueUsers.toLocaleString() }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="averagePoints" label="平均积分" width="100" align="center">
                    <template #default="scope">
                        <span>{{ scope.row.averagePoints.toFixed(2) }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="peakHour" label="高峰时段" width="100" align="center">
                    <template #default="scope">
                        <span class="warning">{{ scope.row.peakHour }}:00</span>
                    </template>
                </el-table-column>
                <el-table-column prop="growthRate" label="增长率" width="100" align="center">
                    <template #default="scope">
                        <span :class="scope.row.growthRate > 0 ? 'success' : 'danger'">
                            {{ scope.row.growthRate > 0 ? '+' : '' }}{{ scope.row.growthRate.toFixed(1) }}%
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="handleViewDetail(scope.row)">查看详情</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup lang="ts" name="points-statistics">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import {
    getPointStatistics,
    getPointTrendData,
    getPointDistribution,
    getPointRankings,
    getPointEventStatistics,
    exportPointStatistics
} from '@/api/points';

// 统计数据
const statistics = reactive({
    totalDistributed: 258690,
    todayDistributed: 3245,
    activeUsers: 1247,
    averagePoints: 207.5
});

// 图表相关
const trendChartRef = ref();
const pieChartRef = ref();
const trendPeriod = ref('7d');
const eventTypePeriod = ref('today');

// 日期范围
const dateRange = ref<[string, string] | null>(null);

// 排行榜数据
const topPointsUsers = ref([
    { userName: '张三', totalPoints: 5890, todayEarned: 150 },
    { userName: '李四', totalPoints: 4760, todayEarned: 80 },
    { userName: '王五', totalPoints: 3520, todayEarned: 120 },
    { userName: '赵六', totalPoints: 2890, todayEarned: 45 },
    { userName: '钱七', totalPoints: 2340, todayEarned: 60 },
    { userName: '孙八', totalPoints: 1980, todayEarned: 30 },
    { userName: '周九', totalPoints: 1650, todayEarned: 90 },
    { userName: '吴十', totalPoints: 1420, todayEarned: 55 },
    { userName: '郑十一', totalPoints: 1280, todayEarned: 25 },
    { userName: '王十二', totalPoints: 1150, todayEarned: 40 }
]);

const topActiveUsers = ref([
    { userName: '张三', activityCount: 45, lastActiveTime: '2024-01-15 15:30:00' },
    { userName: '李四', activityCount: 38, lastActiveTime: '2024-01-15 14:20:00' },
    { userName: '王五', activityCount: 32, lastActiveTime: '2024-01-15 16:10:00' },
    { userName: '赵六', activityCount: 28, lastActiveTime: '2024-01-15 13:45:00' },
    { userName: '钱七', activityCount: 25, lastActiveTime: '2024-01-15 12:30:00' },
    { userName: '孙八', activityCount: 22, lastActiveTime: '2024-01-15 11:15:00' },
    { userName: '周九', activityCount: 20, lastActiveTime: '2024-01-15 10:40:00' },
    { userName: '吴十', activityCount: 18, lastActiveTime: '2024-01-15 09:25:00' },
    { userName: '郑十一', activityCount: 15, lastActiveTime: '2024-01-15 08:50:00' },
    { userName: '王十二', activityCount: 12, lastActiveTime: '2024-01-15 07:30:00' }
]);

// 事件统计数据
const eventStatistics = ref([
    {
        eventType: 'daily_login',
        totalCount: 1247,
        totalPoints: 12470,
        uniqueUsers: 1247,
        averagePoints: 10.0,
        peakHour: 9,
        growthRate: 12.5
    },
    {
        eventType: 'article_read',
        totalCount: 3456,
        totalPoints: 6912,
        uniqueUsers: 892,
        averagePoints: 2.0,
        peakHour: 14,
        growthRate: 8.3
    },
    {
        eventType: 'question_correct',
        totalCount: 567,
        totalPoints: 2835,
        uniqueUsers: 234,
        averagePoints: 5.0,
        peakHour: 16,
        growthRate: 15.7
    },
    {
        eventType: 'pk_win',
        totalCount: 89,
        totalPoints: 1780,
        uniqueUsers: 67,
        averagePoints: 20.0,
        peakHour: 20,
        growthRate: 25.2
    },
    {
        eventType: 'article_complete',
        totalCount: 234,
        totalPoints: 1170,
        uniqueUsers: 156,
        averagePoints: 5.0,
        peakHour: 15,
        growthRate: 6.8
    }
]);

// 事件类型标签
const eventTypeLabels = {
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

// 获取排名样式
const getRankClass = (rank: number) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-normal';
};

// 格式化时间
const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
};

// 初始化趋势图
const initTrendChart = () => {
    if (!trendChartRef.value) return;

    const chart = echarts.init(trendChartRef.value);
    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['发放积分', '活跃用户']
        },
        xAxis: {
            type: 'category',
            data: ['01-09', '01-10', '01-11', '01-12', '01-13', '01-14', '01-15']
        },
        yAxis: [
            {
                type: 'value',
                name: '积分',
                position: 'left'
            },
            {
                type: 'value',
                name: '用户',
                position: 'right'
            }
        ],
        series: [
            {
                name: '发放积分',
                type: 'line',
                data: [2100, 2800, 2450, 3200, 2890, 3150, 3245],
                smooth: true,
                itemStyle: { color: '#409EFF' }
            },
            {
                name: '活跃用户',
                type: 'line',
                yAxisIndex: 1,
                data: [890, 1020, 950, 1180, 1090, 1210, 1247],
                smooth: true,
                itemStyle: { color: '#67C23A' }
            }
        ]
    };

    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
};

// 初始化饼图
const initPieChart = () => {
    if (!pieChartRef.value) return;

    const chart = echarts.init(pieChartRef.value);
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left'
        },
        series: [
            {
                name: '积分分布',
                type: 'pie',
                radius: '60%',
                data: [
                    { value: 12470, name: '每日登录' },
                    { value: 6912, name: '阅读文章' },
                    { value: 2835, name: '答对题目' },
                    { value: 1780, name: 'PK胜利' },
                    { value: 1200, name: '其他' }
                ],
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
    window.addEventListener('resize', () => chart.resize());
};

// 获取统计数据
const fetchStatistics = async () => {
    try {
        const res = await getPointStatistics();
        Object.assign(statistics, res.data);
    } catch (error) {
        ElMessage.error('获取统计数据失败');
    }
};

// 获取趋势图数据
const fetchTrendData = async () => {
    try {
        const res = await getPointTrendData(trendPeriod.value);
        // 更新趋势图
        updateTrendChart(res.data);
    } catch (error) {
        console.error('获取趋势数据失败', error);
    }
};

// 获取分布数据
const fetchDistributionData = async () => {
    try {
        const res = await getPointDistribution(eventTypePeriod.value);
        // 更新饼图
        updatePieChart(res.data);
    } catch (error) {
        console.error('获取分布数据失败', error);
    }
};

// 获取排行榜数据
const fetchRankings = async () => {
    try {
        const [pointsRes, activityRes] = await Promise.all([
            getPointRankings('points', 10),
            getPointRankings('activity', 10)
        ]);
        topPointsUsers.value = pointsRes.data;
        topActiveUsers.value = activityRes.data;
    } catch (error) {
        ElMessage.error('获取排行榜数据失败');
    }
};

// 获取事件统计
const fetchEventStatistics = async () => {
    try {
        const params = {
            startDate: dateRange.value?.[0],
            endDate: dateRange.value?.[1]
        };
        const res = await getPointEventStatistics(params);
        eventStatistics.value = res.data;
    } catch (error) {
        ElMessage.error('获取事件统计失败');
    }
};

// 刷新排行榜
const refreshRank = async (type: string) => {
    try {
        const res = await getPointRankings(type, 10);
        if (type === 'points') {
            topPointsUsers.value = res.data;
        } else {
            topActiveUsers.value = res.data;
        }
        ElMessage.success(`${type === 'points' ? '积分' : '活跃度'}排行榜已刷新`);
    } catch (error) {
        ElMessage.error('刷新失败');
    }
};

// 日期变化处理
const handleDateChange = async () => {
    await fetchEventStatistics();
    ElMessage.success('统计数据已更新');
};

// 查看详情
const handleViewDetail = (row: any) => {
    ElMessage.info(`查看${eventTypeLabels[row.eventType]}的详细信息`);
};

// 导出报表
const handleExport = async () => {
    try {
        const params = {
            startDate: dateRange.value?.[0],
            endDate: dateRange.value?.[1]
        };
        const res = await exportPointStatistics(params);
        // 创建下载链接
        const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `积分统计_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        ElMessage.success('导出成功');
    } catch (error) {
        ElMessage.error('导出失败');
    }
};

// 更新趋势图
const updateTrendChart = (data: any) => {
    if (!trendChartRef.value) return;
    const chart = echarts.getInstanceByDom(trendChartRef.value);
    if (chart) {
        chart.setOption({
            xAxis: { data: data.dates },
            series: data.series
        });
    }
};

// 更新饼图
const updatePieChart = (data: any) => {
    if (!pieChartRef.value) return;
    const chart = echarts.getInstanceByDom(pieChartRef.value);
    if (chart) {
        chart.setOption({
            series: [{ data: data }]
        });
    }
};

onMounted(() => {
    nextTick(() => {
        initTrendChart();
        initPieChart();
        // 初始化数据
        fetchStatistics();
        fetchRankings();
        fetchEventStatistics();
        fetchTrendData();
        fetchDistributionData();
    });
});
</script>

<style scoped>
.container {
    padding: 20px;
}

.mgb20 {
    margin-bottom: 20px;
}

/* 统计卡片样式 */
.grid-content {
    border-radius: 8px;
    padding: 20px;
    color: #fff;
}

.bg1 {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bg2 {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.bg3 {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.bg4 {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.grid-content-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    font-size: 14px;
    opacity: 0.9;
}

.grid-content-header i {
    font-size: 24px;
    margin-right: 10px;
}

.grid-content-body {
    font-size: 28px;
    font-weight: bold;
}

/* 图表样式 */
.chart-box {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    font-weight: bold;
}

/* 卡片样式 */
.box-card {
    border-radius: 8px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 排行榜样式 */
.rank-badge {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    font-size: 12px;
}

.rank-gold {
    background: linear-gradient(135deg, #FFD700, #FFA500);
}

.rank-silver {
    background: linear-gradient(135deg, #C0C0C0, #808080);
}

.rank-bronze {
    background: linear-gradient(135deg, #CD7F32, #8B4513);
}

.rank-normal {
    background: linear-gradient(135deg, #909399, #606266);
}

/* 表格样式 */
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

.success {
    color: #67c23a;
    font-weight: bold;
}

.warning {
    color: #e6a23c;
    font-weight: bold;
}

.danger {
    color: #f56c6c;
    font-weight: bold;
}

.last-active {
    color: #909399;
    font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .grid-content {
        margin-bottom: 10px;
    }

    .chart-box {
        margin-bottom: 10px;
    }
}
</style>