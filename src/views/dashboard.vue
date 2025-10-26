<template>
    <div class="dashboard">
        <el-row :gutter="20" class="mgb20">
            <el-col :span="6">
                <el-card shadow="hover" body-class="card-body">
                    <el-icon class="card-icon bg1">
                        <User />
                    </el-icon>
                    <div class="card-content">
                        <countup class="card-num color1" :end="6666" />
                        <div>活跃用户</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" body-class="card-body">
                    <el-icon class="card-icon bg2">
                        <ChatDotRound />
                    </el-icon>
                    <div class="card-content">
                        <countup class="card-num color2" :end="168" />
                        <div>思想文章</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" body-class="card-body">
                    <el-icon class="card-icon bg3">
                        <Goods />
                    </el-icon>
                    <div class="card-content">
                        <countup class="card-num color3" :end="888" />
                        <div>题目数量</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" body-class="card-body">
                    <el-icon class="card-icon bg4">
                        <ShoppingBag />
                    </el-icon>
                    <div class="card-content">
                        <countup class="card-num color4" :end="234" />
                        <div>积分记录</div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="20" class="mgb20">
            <el-col :span="12">
                <el-card shadow="hover">
                    <div class="card-header">
                        <span>系统动态</span>
                        <el-button type="primary" size="small">更多</el-button>
                    </div>
                    <div class="card-body">
                        <el-timeline>
                            <el-timeline-item
                                v-for="(activity, index) in activities"
                                :key="index"
                                :icon="TrendCharts"
                                :color="activity.color"
                                :timestamp="activity.timestamp"
                            >
                                {{ activity.content }}
                                <p>{{ activity.description }}</p>
                            </el-timeline-item>
                        </el-timeline>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="12">
                <el-card shadow="hover">
                    <div class="card-header">
                        <span>快捷操作</span>
                    </div>
                    <div class="card-body">
                        <div class="quick-actions">
                            <el-button type="primary" @click="$router.push('/organization')">
                                组织管理
                            </el-button>
                            <el-button type="success" @click="$router.push('/content/articles')">
                                内容管理
                            </el-button>
                            <el-button type="warning" @click="$router.push('/question/questions')">
                                题目管理
                            </el-button>
                            <el-button type="info" @click="$router.push('/points/rules')">
                                积分管理
                            </el-button>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts" name="dashboard">
import { User, ChatDotRound, Goods, ShoppingBag, TrendCharts } from '@element-plus/icons-vue';
import countup from '@/components/countup.vue';

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
</script>

<style scoped>
.dashboard {
    padding: 20px;
}

.mgb20 {
    margin-bottom: 20px;
}

.card-body {
    min-height: 180px;
    display: flex;
    align-items: center;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.card-icon {
    font-size: 30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
}

.bg1 {
    background: linear-gradient(120deg, #f093fb 0%, #f5576c 100%);
    color: #fff;
}

.bg2 {
    background: linear-gradient(120deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
}

.bg3 {
    background: linear-gradient(120deg, #43e97b 0%, #38f9d7 100%);
    color: #fff;
}

.bg4 {
    background: linear-gradient(120deg, #fa709a 0%, #fee140 100%);
    color: #fff;
}

.card-content {
    flex: 1;
}

.card-num {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 10px;
}

.color1 {
    color: #f5576c;
}

.color2 {
    color: #00f2fe;
}

.color3 {
    color: #38f9d7;
}

.color4 {
    color: #fee140;
}

.quick-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

.quick-actions .el-button {
    margin-bottom: 15px;
    height: 50px;
    font-size: 16px;
}
</style>