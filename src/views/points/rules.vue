<template>
    <div class="container">
        <div class="handle-box">
            <el-button type="primary" :icon="Edit" @click="handleEdit">编辑积分配置</el-button>
            <el-button type="success" :icon="Refresh" @click="handleRefresh">刷新</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header">
            <el-table-column prop="type" label="积分类型" width="150" align="center"></el-table-column>
            <el-table-column prop="score" label="单次积分" width="120" align="center">
                <template #default="scope">
                    <span class="score-text">{{ scope.row.score }}</span>
                </template>
            </el-table-column>
            <el-table-column prop="limit" label="每日上限" width="150" align="center">
                <template #default="scope">
                    <span v-if="scope.row.limit === 0 || scope.row.limit === null" class="no-limit">无限制</span>
                    <span v-else>{{ scope.row.limit }}</span>
                </template>
            </el-table-column>
            <el-table-column label="说明" min-width="200">
                <template #default="scope">
                    <span class="description">{{ scope.row.description }}</span>
                </template>
            </el-table-column>
        </el-table>

        <!-- 编辑弹窗 -->
        <el-dialog title="编辑积分配置" v-model="dialogVisible" width="60%" destroy-on-close>
            <el-form :model="editConfig" label-width="120px">
                <el-form-item label="登录积分">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <span>单次积分：</span>
                            <el-input-number v-model="editConfig.login.score" :min="0" :max="1000" placeholder="请输入单次积分"
                                style="width: 200px"></el-input-number>
                        </el-col>
                        <el-col :span="12">
                            <span>每日上限：</span>
                            <el-input-number v-model="editConfig.login.limit" :min="0" placeholder="0表示无限制"
                                style="width: 200px"></el-input-number>
                        </el-col>
                    </el-row>
                </el-form-item>

                <el-form-item label="阅读积分">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <span>单次积分：</span>
                            <el-input-number v-model="editConfig.read.score" :min="0" :max="1000" placeholder="请输入单次积分"
                                style="width: 200px"></el-input-number>
                        </el-col>
                        <el-col :span="12">
                            <span>每日上限：</span>
                            <el-input-number v-model="editConfig.read.limit" :min="0" placeholder="0表示无限制"
                                style="width: 200px"></el-input-number>
                        </el-col>
                    </el-row>
                </el-form-item>

                <el-form-item label="答题积分">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <span>单次积分：</span>
                            <el-input-number v-model="editConfig.answer.score" :min="0" :max="1000"
                                placeholder="请输入单次积分" style="width: 200px"></el-input-number>
                        </el-col>
                        <el-col :span="12">
                            <span>每日上限：</span>
                            <el-input-number v-model="editConfig.answer.limit" :min="0" placeholder="0表示无限制"
                                style="width: 200px"></el-input-number>
                        </el-col>
                    </el-row>
                </el-form-item>

                <el-form-item label="PK积分">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <span>单次积分：</span>
                            <el-input-number v-model="editConfig.competition.score" :min="0" :max="1000"
                                placeholder="请输入单次积分" style="width: 200px"></el-input-number>
                        </el-col>
                        <el-col :span="12">
                            <span>每日上限：</span>
                            <el-input-number v-model="editConfig.competition.limit" :min="0" placeholder="0表示无限制"
                                style="width: 200px"></el-input-number>
                        </el-col>
                    </el-row>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="handleSave">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="points-rules">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Edit, Refresh } from '@element-plus/icons-vue';
import type { PointConfig } from '@/api/points';
import { getPointConfig, setPointConfig } from '@/api/points';

// 表格数据
interface TableDataItem {
    type: string;
    score: number;
    limit: number;
    description: string;
}

// 积分配置
const config = reactive<PointConfig>({
    login: { score: 0, limit: 0 },
    read: { score: 0, limit: 0 },
    answer: { score: 0, limit: 0 },
    competition: { score: 0, limit: 0 }
});

// 编辑弹窗显示的配置
const editConfig = reactive<PointConfig>({
    login: { score: 0, limit: 0 },
    read: { score: 0, limit: 0 },
    answer: { score: 0, limit: 0 },
    competition: { score: 0, limit: 0 }
});

// 弹窗控制
const dialogVisible = ref(false);

// 表格数据（从config计算）
const tableData = computed<TableDataItem[]>(() => {
    return [
        {
            type: '登录',
            score: config.login.score,
            limit: config.login.limit,
            description: '用户每次登录获得的积分'
        },
        {
            type: '阅读',
            score: config.read.score,
            limit: config.read.limit,
            description: '用户阅读文章获得的积分'
        },
        {
            type: '答题',
            score: config.answer.score,
            limit: config.answer.limit,
            description: '用户答题获得的积分'
        },
        {
            type: 'PK',
            score: config.competition.score,
            limit: config.competition.limit,
            description: '用户参与PK获得的积分'
        }
    ];
});

// 获取积分配置
const getConfig = async () => {
    try {
        const res = await getPointConfig();
        // API 返回的数据结构是 { code: 200, msg: null, data: {...} }
        const data = res.data.data || res.data;
        // 处理数据
        config.login = data.login || { score: 0, limit: 0 };
        config.read = data.read || { score: 0, limit: 0 };
        config.answer = data.answer || { score: 0, limit: 0 };
        config.competition = data.competition || { score: 0, limit: 0 };
    } catch (error) {
        ElMessage.error('获取配置失败');
        console.error('获取积分配置失败:', error);
    }
};

// 刷新配置
const handleRefresh = async () => {
    await getConfig();
    ElMessage.success('刷新成功');
};

// 编辑
const handleEdit = () => {
    // 复制当前配置到编辑表单
    Object.assign(editConfig, JSON.parse(JSON.stringify(config)));
    dialogVisible.value = true;
};

// 保存配置
const handleSave = async () => {
    try {
        await setPointConfig(editConfig);
        // 更新表格显示的配置
        Object.assign(config, JSON.parse(JSON.stringify(editConfig)));
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        // 重新获取最新配置
        await getConfig();
    } catch (error) {
        ElMessage.error('保存失败');
        console.error('保存积分配置失败:', error);
    }
};

onMounted(() => {
    getConfig();
});
</script>

<style scoped>
.handle-box {
    margin-bottom: 20px;
}

.table {
    width: 100%;
    font-size: 14px;
}

.score-text {
    font-weight: bold;
    color: #409eff;
}

.no-limit {
    color: #909399;
}

.description {
    color: #606266;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}
</style>