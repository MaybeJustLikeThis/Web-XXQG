<template>
    <div class="dashboard">
        <!-- 欢迎区域 -->
        <div class="welcome-section">
            <div class="welcome-content">
                <h1 class="welcome-title">欢迎回来，管理员</h1>
                <p class="welcome-subtitle">山西省高校网络思政中心小程序后台管理系统</p>
            </div>
            <div class="welcome-actions">
                <el-button type="primary" @click="fetchStatistics" :loading="statsLoading" size="large">
                    <el-icon><Refresh /></el-icon>
                    刷新数据
                </el-button>
            </div>
        </div>

        <!-- 统计卡片区域 -->
        <div class="stats-section">
            <el-row :gutter="24">
                <el-col :xs="24" :sm="12" :md="6" v-for="(stat, index) in statsCards" :key="index">
                    <div class="stat-card" :class="`stat-card-${index + 1}`">
                        <div class="stat-icon">
                            <component :is="stat.icon" />
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">
                                <countup :end="stat.value" :duration="2" />
                            </div>
                            <div class="stat-label">{{ stat.label }}</div>
                        </div>
                    </div>
                </el-col>
            </el-row>
        </div>

        <!-- 主要内容区域 -->
        <div class="main-content">
            <el-row :gutter="24">
                <!-- 左侧内容 -->
                <el-col :xs="24" :lg="16">
                    <!-- 图表区域 -->
                    <div class="chart-section">
                        <el-card shadow="never" class="chart-card">
                            <template #header>
                                <div class="chart-header">
                                    <div class="chart-title">
                                        <el-icon><TrendCharts /></el-icon>
                                        <span>数据概览</span>
                                    </div>
                                    <el-radio-group v-model="chartView" size="small">
                                        <el-radio-button value="both">全部显示</el-radio-button>
                                        <el-radio-button value="ranking">用户排行</el-radio-button>
                                        <el-radio-button value="schools">学校排行</el-radio-button>
                                        <el-radio-button value="trend">趋势图</el-radio-button>
                                    </el-radio-group>
                                </div>
                            </template>

                            <div class="chart-content" v-show="chartView === 'both' || chartView === 'ranking'">
                                <div class="chart-item">
                                    <div class="chart-item-header">
                                        <h3>用户积分排行榜</h3>
                                        <el-button type="primary" size="small" @click="refreshRanking" :loading="rankingLoading">
                                            <el-icon><Refresh /></el-icon>
                                            刷新
                                        </el-button>
                                    </div>
                                    <div ref="rankingChart" class="chart-container ranking-chart"></div>
                                </div>
                            </div>

                            <div class="chart-content" v-show="chartView === 'both' || chartView === 'schools'">
                                <div class="chart-item">
                                    <div class="chart-item-header">
                                        <h3>学校积分排行榜</h3>
                                        <el-button type="primary" size="small" @click="refreshSchoolRanking" :loading="schoolRankingLoading">
                                            <el-icon><Refresh /></el-icon>
                                            刷新
                                        </el-button>
                                    </div>
                                    <div ref="schoolRankingChart" class="chart-container school-ranking-chart"></div>
                                </div>
                            </div>

                            <div class="chart-content" v-show="chartView === 'both' || chartView === 'trend'">
                                <div class="chart-item">
                                    <div class="chart-item-header">
                                        <h3>积分趋势图</h3>
                                        <div class="chart-controls">
                                            <el-select v-model="trendDays" @change="refreshTrend" size="small">
                                                <el-option label="最近7天" :value="7"></el-option>
                                                <el-option label="最近10天" :value="10"></el-option>
                                                <el-option label="最近15天" :value="15"></el-option>
                                                <el-option label="最近30天" :value="30"></el-option>
                                            </el-select>
                                            <el-button type="primary" size="small" @click="refreshTrend" :loading="trendLoading">
                                                <el-icon><Refresh /></el-icon>
                                                刷新
                                            </el-button>
                                        </div>
                                    </div>
                                    <div ref="trendChart" class="chart-container trend-chart"></div>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </el-col>

                <!-- 右侧内容 -->
                <el-col :xs="24" :lg="8">
                    <!-- 系统动态 -->
                    <div class="activity-section">
                        <el-card shadow="never" class="activity-card">
                            <template #header>
                                <div class="card-header">
                                    <div class="card-title">
                                        <el-icon><TrendCharts /></el-icon>
                                        <span>系统动态</span>
                                    </div>
                                    <el-button link size="small">查看全部</el-button>
                                </div>
                            </template>

                            <div class="activity-list">
                                <div v-for="(activity, index) in activities" :key="index" class="activity-item">
                                    <div class="activity-icon" :style="{ backgroundColor: activity.color + '20', color: activity.color }">
                                        <el-icon><TrendCharts /></el-icon>
                                    </div>
                                    <div class="activity-content">
                                        <div class="activity-title">{{ activity.content }}</div>
                                        <div class="activity-description">{{ activity.description }}</div>
                                        <div class="activity-time">{{ activity.timestamp }}</div>
                                    </div>
                                </div>
                            </div>
                        </el-card>
                    </div>

                    <!-- 快捷操作 -->
                    <div class="actions-section">
                        <el-card shadow="never" class="actions-card">
                            <template #header>
                                <div class="card-header">
                                    <div class="card-title">
                                        <el-icon><ShoppingBag /></el-icon>
                                        <span>快捷操作</span>
                                    </div>
                                </div>
                            </template>

                            <div class="quick-actions-grid">
                                <div class="action-item" @click="$router.push('/organization')">
                                    <div class="action-icon bg-primary">
                                        <el-icon><User /></el-icon>
                                    </div>
                                    <div class="action-text">
                                        <div class="action-title">组织管理</div>
                                        <div class="action-desc">管理用户和部门</div>
                                    </div>
                                </div>

                                <div class="action-item" @click="$router.push('/content/articles')">
                                    <div class="action-icon bg-success">
                                        <el-icon><ChatDotRound /></el-icon>
                                    </div>
                                    <div class="action-text">
                                        <div class="action-title">内容管理</div>
                                        <div class="action-desc">管理文章和专题</div>
                                    </div>
                                </div>

                                <div class="action-item" @click="$router.push('/question/questions')">
                                    <div class="action-icon bg-warning">
                                        <el-icon><Goods /></el-icon>
                                    </div>
                                    <div class="action-text">
                                        <div class="action-title">题目管理</div>
                                        <div class="action-desc">管理题库和试卷</div>
                                    </div>
                                </div>

                                <div class="action-item" @click="$router.push('/points/rules')">
                                    <div class="action-icon bg-info">
                                        <el-icon><ShoppingBag /></el-icon>
                                    </div>
                                    <div class="action-text">
                                        <div class="action-title">积分管理</div>
                                        <div class="action-desc">管理积分规则</div>
                                    </div>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup lang="ts" name="dashboard">
import { ref, reactive, markRaw, onMounted, onUnmounted, nextTick } from 'vue';
import { User, ChatDotRound, Goods, ShoppingBag, TrendCharts, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import countup from '@/components/countup.vue';
import { getTopUsers, getRecentPointRecords, getQuestionNum, getRichTextNum, getUserNum, getTopSchools } from '@/api/dashboard';

const activities = [
    {
        content: '新增文章',
        description: '张老师发布了新的思想理论学习文章',
        timestamp: '30分钟前',
        color: '#00bcd4',
    },
    {
        content: '题目审核',
        description: '李老师审核通过了5道思政题目',
        timestamp: '55分钟前',
        color: '#1ABC9C',
    },
    {
        content: '学习活动',
        description: '组织了"青年大学习"主题活动',
        timestamp: '1小时前',
        color: '#3f51b5',
    },
    {
        content: '积分发放',
        description: '为积极参与学习的同学发放了学习积分',
        timestamp: '15小时前',
        color: '#F39C12',
    },
];

// ECharts相关
const rankingChart = ref();
let chartInstance: echarts.ECharts | null = null;
const rankingLoading = ref(false);

// 学校积分排名图相关
const schoolRankingChart = ref();
let schoolRankingChartInstance: echarts.ECharts | null = null;
const schoolRankingLoading = ref(false);

// 积分趋势图相关
const trendChart = ref();
let trendChartInstance: echarts.ECharts | null = null;
const trendLoading = ref(false);
const trendDays = ref(10);
const statsLoading = ref(false);
const chartView = ref('both');

// 统计数据
const statistics = reactive({
    activeUsers: 6666,
    articles: 168,
    questionNum: 888,
    pointRecords: 234
});

// 统计卡片配置
const statsCards = reactive([
    {
        icon: markRaw(User),
        value: 0, // 将在fetchStatistics中更新
        label: '活跃用户'
    },
    {
        icon: markRaw(ChatDotRound),
        value: 0,
        label: '思想文章'
    },
    {
        icon: markRaw(Goods),
        value: 0,
        label: '题目数量'
    },
    {
        icon: markRaw(ShoppingBag),
        value: 0,
        label: '积分记录'
    }
]);

// 获取统计数据
const fetchStatistics = async () => {
    statsLoading.value = true;
    try {
        // 并行获取统计数据
        const [questionResponse, articleResponse, userResponse] = await Promise.all([
            getQuestionNum(),
            getRichTextNum(),
            getUserNum()
        ]);

        // 获取用户数量
        if (userResponse.data?.code === 200) {
            const userCount = userResponse.data.data || 0;
            statistics.activeUsers = userCount;
            statsCards[0].value = userCount;
        }

        // 获取文章数量
        if (articleResponse.data?.code === 200) {
            const articleCount = articleResponse.data.data || 0;
            statistics.articles = articleCount;
            statsCards[1].value = articleCount;
        }

        // 获取问题总数
        if (questionResponse.data?.code === 200) {
            const questionCount = questionResponse.data.data || 0;
            statistics.questionNum = questionCount;
            statsCards[2].value = questionCount;
        }

        // 积分记录暂时使用模拟数据
        const pointRecordCount = 234;
        statistics.pointRecords = pointRecordCount;
        statsCards[3].value = pointRecordCount;

    } catch (error) {
        console.error('获取统计数据失败:', error);
        ElMessage.error('获取统计数据失败');
    } finally {
        statsLoading.value = false;
    }
};

// 获取用户积分排行榜数据
const fetchRankingData = async () => {
    rankingLoading.value = true;
    try {
        const response = await getTopUsers();
        const data = response.data?.data || response.data || [];

        if (Array.isArray(data) && data.length > 0) {
            // 处理数据，提取用户名和积分
            const rankingData = data.map((item: any) => ({
                name: item.user?.name || '未知用户',
                points: item.total_points || 0
            })).sort((a: any, b: any) => b.points - a.points); // 按积分降序排列

            initRankingChart(rankingData);
        } else {
            // 如果没有数据，显示空数据图表
            initEmptyChart();
        }
    } catch (error) {
        console.error('获取排行榜数据失败:', error);
        ElMessage.error('获取排行榜数据失败');
        initEmptyChart();
    } finally {
        rankingLoading.value = false;
    }
};

// 初始化排行榜图表
const initRankingChart = (data: Array<{ name: string; points: number }>) => {
    if (!rankingChart.value) return;

    // 如果已存在图表实例，先销毁
    if (chartInstance) {
        chartInstance.dispose();
    }

    // 创建图表实例
    chartInstance = echarts.init(rankingChart.value);

    // 准备图表数据
    const names = data.map(item => item.name);
    const points = data.map(item => item.points);

    // 图表配置
    const option = {
        title: {
            text: 'TOP 10 用户积分排行榜',
            left: 'center',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params: any) {
                const data = params[0];
                return `<div style="font-weight: bold;">${data.name}</div>
                        <div style="color: #409eff;">积分：${data.value} 分</div>
                        <div style="color: #909399;">排名：第 ${data.dataIndex + 1} 名</div>`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: names,
            axisLabel: {
                interval: 0,
                rotate: 45,
                fontSize: 12,
                color: '#666'
            },
            axisLine: {
                lineStyle: {
                    color: '#ddd'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '积分',
            nameTextStyle: {
                color: '#666',
                fontSize: 14
            },
            axisLabel: {
                color: '#666',
                fontSize: 12
            },
            splitLine: {
                lineStyle: {
                    color: '#f0f0f0',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: '积分',
                type: 'bar',
                data: points,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#83bff6' },
                        { offset: 0.5, color: '#188df0' },
                        { offset: 1, color: '#188df0' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#2378f7' },
                            { offset: 0.7, color: '#2378f7' },
                            { offset: 1, color: '#83bff6' }
                        ])
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}',
                    color: '#409eff',
                    fontSize: 12,
                    fontWeight: 'bold'
                }
            }
        ]
    };

    // 设置图表配置
    chartInstance.setOption(option);

    // 响应式处理
    window.addEventListener('resize', handleResize);
};

// 初始化空数据图表
const initEmptyChart = () => {
    if (!rankingChart.value) return;

    if (chartInstance) {
        chartInstance.dispose();
    }

    chartInstance = echarts.init(rankingChart.value);

    const option = {
        title: {
            text: '用户积分排行榜',
            left: 'center',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333'
            }
        },
        graphic: [
            {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: '暂无排行榜数据',
                    fontSize: 16,
                    fill: '#999'
                }
            }
        ]
    };

    chartInstance.setOption(option);
};

// 窗口大小改变时重新调整图表
const handleResize = () => {
    if (chartInstance) {
        chartInstance.resize();
    }
};

// 刷新排行榜
const refreshRanking = () => {
    fetchRankingData();
};

// 获取积分趋势数据
const fetchTrendData = async () => {
    trendLoading.value = true;
    try {
        const response = await getRecentPointRecords(trendDays.value);
        const data = response.data?.data || response.data || [];

        if (Array.isArray(data) && data.length > 0) {
            // 处理数据，按日期排序（从早到晚）
            const sortedData = data.sort((a: any, b: any) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            initTrendChart(sortedData);
        } else {
            // 如果没有数据，显示空数据图表
            initEmptyTrendChart();
        }
    } catch (error) {
        console.error('获取积分趋势数据失败:', error);
        ElMessage.error('获取积分趋势数据失败');
        initEmptyTrendChart();
    } finally {
        trendLoading.value = false;
    }
};

// 初始化积分趋势图
const initTrendChart = (data: Array<{ date: string; total_points: number }>) => {
    if (!trendChart.value) return;

    // 如果已存在图表实例，先销毁
    if (trendChartInstance) {
        trendChartInstance.dispose();
    }

    // 创建图表实例
    trendChartInstance = echarts.init(trendChart.value);

    // 准备图表数据
    const dates = data.map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const points = data.map(item => item.total_points);

    // 图表配置
    const option = {
        title: {
            text: `最近${trendDays.value}天积分趋势`,
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold',
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(50, 50, 50, 0.9)',
            borderColor: '#409eff',
            borderWidth: 1,
            textStyle: {
                color: '#fff'
            },
            formatter: function(params: any) {
                const data = params[0];
                const originalDataItem = data.data;
                return `<div style="font-weight: bold; margin-bottom: 5px;">${originalDataItem.fullDate}</div>
                        <div style="color: #409eff;">积分：${originalDataItem.value} 分</div>
                        <div style="color: #909399; font-size: 12px;">${originalDataItem.weekday}</div>`;
            },
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: '#409eff',
                    width: 1
                }
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '12%',
            top: '20%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            boundaryGap: false,
            axisLabel: {
                color: '#666',
                fontSize: 11
            },
            axisLine: {
                lineStyle: {
                    color: '#ddd'
                }
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            name: '积分',
            nameTextStyle: {
                color: '#666',
                fontSize: 12
            },
            axisLabel: {
                color: '#666',
                fontSize: 11
            },
            splitLine: {
                lineStyle: {
                    color: '#f0f0f0',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: '积分',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                data: data.map(item => ({
                    value: item.total_points,
                    fullDate: item.date,
                    weekday: getWeekday(item.date)
                })),
                itemStyle: {
                    color: '#409eff',
                    borderColor: '#fff',
                    borderWidth: 2
                },
                lineStyle: {
                    color: '#409eff',
                    width: 3
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
                        { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
                    ])
                },
                emphasis: {
                    itemStyle: {
                        color: '#66b1ff',
                        borderColor: '#fff',
                        borderWidth: 3,
                        shadowBlur: 10,
                        shadowColor: 'rgba(64, 158, 255, 0.5)'
                    }
                }
            }
        ]
    };

    // 设置图表配置
    trendChartInstance.setOption(option);

    // 响应式处理
    window.addEventListener('resize', handleTrendResize);
};

// 获取星期几
const getWeekday = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
};

// 初始化空数据趋势图
const initEmptyTrendChart = () => {
    if (!trendChart.value) return;

    if (trendChartInstance) {
        trendChartInstance.dispose();
    }

    trendChartInstance = echarts.init(trendChart.value);

    const option = {
        title: {
            text: `最近${trendDays.value}天积分趋势`,
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold',
                color: '#333'
            }
        },
        graphic: [
            {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: '暂无趋势数据',
                    fontSize: 14,
                    fill: '#999'
                }
            }
        ]
    };

    trendChartInstance.setOption(option);
};

// 窗口大小改变时重新调整趋势图
const handleTrendResize = () => {
    if (trendChartInstance) {
        trendChartInstance.resize();
    }
};

// 刷新趋势图
const refreshTrend = () => {
    fetchTrendData();
};

// 获取学校积分排行榜数据
const fetchSchoolRankingData = async () => {
    schoolRankingLoading.value = true;
    try {
        const response = await getTopSchools();
        const data = response.data?.data || response.data || [];

        if (Array.isArray(data) && data.length > 0) {
            // 处理数据，按积分降序排列
            const sortedData = data.sort((a: any, b: any) => b.total_points - a.total_points);

            // 提取学校名和积分
            const schoolRankingData = sortedData.map((item: any) => ({
                name: item.school?.name || '未知学校',
                points: item.total_points || 0
            }));

            initSchoolRankingChart(schoolRankingData);
        } else {
            // 如果没有数据，显示空数据图表
            initEmptySchoolChart();
        }
    } catch (error) {
        console.error('获取学校排行榜数据失败:', error);
        ElMessage.error('获取学校排行榜数据失败');
        initEmptySchoolChart();
    } finally {
        schoolRankingLoading.value = false;
    }
};

// 初始化学校排行榜图表
const initSchoolRankingChart = (data: Array<{ name: string; points: number }>) => {
    if (!schoolRankingChart.value) return;

    // 如果已存在图表实例，先销毁
    if (schoolRankingChartInstance) {
        schoolRankingChartInstance.dispose();
    }

    // 创建图表实例
    schoolRankingChartInstance = echarts.init(schoolRankingChart.value);

    // 准备图表数据
    const names = data.map(item => item.name);
    const points = data.map(item => item.points);

    // 图表配置
    const option = {
        title: {
            text: '学校积分排行榜',
            left: 'center',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params: any) {
                const data = params[0];
                return `<div style="font-weight: bold;">${data.name}</div>
                        <div style="color: #409eff;">积分：${data.value} 分</div>
                        <div style="color: #909399;">排名：第 ${data.dataIndex + 1} 名</div>`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: names,
            axisLabel: {
                interval: 0,
                rotate: 45,
                fontSize: 12,
                color: '#666'
            },
            axisLine: {
                lineStyle: {
                    color: '#ddd'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '积分',
            nameTextStyle: {
                color: '#666',
                fontSize: 14
            },
            axisLabel: {
                color: '#666',
                fontSize: 12
            },
            splitLine: {
                lineStyle: {
                    color: '#f0f0f0',
                    type: 'dashed'
                }
            }
        },
        series: [
            {
                name: '积分',
                type: 'bar',
                data: points,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#87CEEB' },
                        { offset: 0.5, color: '#4682B4' },
                        { offset: 1, color: '#4682B4' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#5F9EA0' },
                            { offset: 0.7, color: '#5F9EA0' },
                            { offset: 1, color: '#87CEEB' }
                        ])
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}',
                    color: '#4682B4',
                    fontSize: 12,
                    fontWeight: 'bold'
                }
            }
        ]
    };

    // 设置图表配置
    schoolRankingChartInstance.setOption(option);

    // 响应式处理
    window.addEventListener('resize', handleSchoolRankingResize);
};

// 初始化空数据学校图表
const initEmptySchoolChart = () => {
    if (!schoolRankingChart.value) return;

    if (schoolRankingChartInstance) {
        schoolRankingChartInstance.dispose();
    }

    schoolRankingChartInstance = echarts.init(schoolRankingChart.value);

    const option = {
        title: {
            text: '学校积分排行榜',
            left: 'center',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333'
            }
        },
        graphic: [
            {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: '暂无学校排行榜数据',
                    fontSize: 16,
                    fill: '#999'
                }
            }
        ]
    };

    schoolRankingChartInstance.setOption(option);
};

// 窗口大小改变时重新调整学校排名图表
const handleSchoolRankingResize = () => {
    if (schoolRankingChartInstance) {
        schoolRankingChartInstance.resize();
    }
};

// 刷新学校排行榜
const refreshSchoolRanking = () => {
    fetchSchoolRankingData();
};

// 组件挂载后初始化图表
onMounted(() => {
    nextTick(() => {
        fetchStatistics();
        fetchRankingData();
        fetchSchoolRankingData();
        fetchTrendData();
    });
});

// 组件卸载前清理
onUnmounted(() => {
    if (chartInstance) {
        chartInstance.dispose();
    }
    if (schoolRankingChartInstance) {
        schoolRankingChartInstance.dispose();
    }
    if (trendChartInstance) {
        trendChartInstance.dispose();
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('resize', handleSchoolRankingResize);
    window.removeEventListener('resize', handleTrendResize);
});
</script>

<style scoped>
.dashboard {
    padding: 24px;
    background: var(--dashboard-bg);
    min-height: calc(100vh - 84px);
    transition: background-color 0.3s ease;
}

/* 欢迎区域 */
.welcome-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding: 32px;
    background: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--card-border);
    transition: all 0.3s ease;
}

.welcome-content h1 {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    transition: color 0.3s ease;
}

.welcome-subtitle {
    margin: 0;
    color: var(--text-secondary);
    font-size: 16px;
    transition: color 0.3s ease;
}

/* 统计卡片区域 */
.stats-section {
    margin-bottom: 32px;
}

.stat-card {
    background: var(--card-bg);
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    border: 1px solid var(--card-border);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card-1 .stat-icon {
    background: #3b82f6;
}

.stat-card-2 .stat-icon {
    background: #10b981;
}

.stat-card-3 .stat-icon {
    background: #f59e0b;
}

.stat-card-4 .stat-icon {
    background: #8b5cf6;
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    color: white;
    font-size: 24px;
}

.stat-content {
    flex: 1;
}

.stat-value {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
    line-height: 1;
    transition: color 0.3s ease;
}

.stat-label {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    transition: color 0.3s ease;
}

/* 主要内容区域 */
.main-content {
    margin-bottom: 24px;
}

.chart-section,
.activity-section,
.actions-section {
    margin-bottom: 24px;
}

.chart-card,
.activity-card,
.actions-card {
    border: 1px solid var(--card-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border-radius: 8px;
    background: var(--card-bg);
    transition: all 0.3s ease;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chart-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    transition: color 0.3s ease;
}

.chart-content {
    margin-bottom: 24px;
}

.chart-content:last-child {
    margin-bottom: 0;
}

.chart-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.chart-item-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    transition: color 0.3s ease;
}

.chart-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.chart-container {
    width: 100%;
    height: 350px;
}

.ranking-chart {
    height: 350px;
}

.trend-chart {
    height: 350px;
}

.school-ranking-chart {
    height: 350px;
}

/* 系统动态 */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    transition: color 0.3s ease;
}

.activity-list {
    max-height: 300px;
    overflow-y: auto;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: border-color 0.3s ease;
}

.activity-item:last-child {
    border-bottom: none;
}

.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.activity-content {
    flex: 1;
}

.activity-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
    transition: color 0.3s ease;
}

.activity-description {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 4px;
    transition: color 0.3s ease;
}

.activity-time {
    color: var(--text-muted);
    font-size: 12px;
    transition: color 0.3s ease;
}

/* 快捷操作 */
.quick-actions-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
}

.action-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--card-border);
}

.action-item:hover {
    background: var(--el-fill-color-light);
    transform: translateX(2px);
}

.action-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    flex-shrink: 0;
}

.bg-primary {
    background: #3b82f6;
}

.bg-success {
    background: #10b981;
}

.bg-warning {
    background: #f59e0b;
}

.bg-info {
    background: #8b5cf6;
}

.action-text {
    flex: 1;
}

.action-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
    transition: color 0.3s ease;
}

.action-desc {
    color: var(--text-secondary);
    font-size: 14px;
    transition: color 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .welcome-section {
        flex-direction: column;
        text-align: center;
        gap: 16px;
    }

    .chart-container {
        height: 300px;
    }
}

@media (max-width: 768px) {
    .dashboard {
        padding: 16px;
    }

    .welcome-section {
        padding: 20px;
        margin-bottom: 24px;
    }

    .welcome-content h1 {
        font-size: 24px;
    }

    .stat-card {
        padding: 20px;
    }

    .stat-icon {
        width: 56px;
        height: 56px;
        font-size: 24px;
    }

    .stat-value {
        font-size: 28px;
    }

    .chart-container {
        height: 250px;
    }
}

/* 滚动条样式 */
.activity-list::-webkit-scrollbar {
    width: 4px;
}

.activity-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
}

.activity-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
}

.activity-list::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>