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
                    <span class="score-text">{{ scope.row.score }}分</span>
                </template>
            </el-table-column>
            <el-table-column prop="times" label="获取次数上限" width="130" align="center">
                <template #default="scope">
                    <span v-if="scope.row.limit === 0 || scope.row.limit === null || scope.row.score === 0" class="no-limit">无限制</span>
                    <span v-else class="times-text">{{ scope.row.times }}次</span>
                </template>
            </el-table-column>
            <el-table-column prop="limit" label="总共积分上限" width="150" align="center">
                <template #default="scope">
                    <span v-if="scope.row.limit === 0 || scope.row.limit === null" class="no-limit">无限制</span>
                    <span v-else class="limit-text">{{ scope.row.limit }}分</span>
                </template>
            </el-table-column>
            <el-table-column label="说明" min-width="200">
                <template #default="scope">
                    <span class="description">{{ scope.row.description }}</span>
                </template>
            </el-table-column>
        </el-table>

        <!-- 编辑弹窗 -->
        <el-dialog
            title="编辑积分配置"
            v-model="dialogVisible"
            width="800px"
            destroy-on-close
            class="points-config-dialog">

            <div class="config-container">
                <!-- 配置说明 -->
                <div class="config-notice">
                    <el-alert
                        title="配置说明"
                        type="info"
                        :closable="false"
                        description="单次积分：每次操作获得的积分；获取次数：每日可获得积分的最大次数；总上限：每日可获得的总积分上限，由前两者自动计算得出。"
                        show-icon />
                </div>

                <div class="config-grid">
                    <!-- 登录积分配置卡片 -->
                    <div class="config-card">
                        <div class="card-header">
                            <el-icon class="card-icon"><User /></el-icon>
                            <span class="card-title">登录积分</span>
                        </div>
                        <div class="card-content">
                            <div class="form-row">
                                <label class="form-label">单次积分</label>
                                <el-input-number
                                    v-model="editConfig.login.score"
                                    :min="0" :max="1000"
                                    placeholder="积分值"
                                    size="small"
                                    @change="calculateLoginLimit"
                                    class="form-input" />
                            </div>
                            <div class="form-row">
                                <label class="form-label">获取次数</label>
                                <el-input-number
                                    v-model="editConfig.login.times"
                                    :min="editConfig.login.score > 0 ? 1 : 0"
                                    placeholder="0=无限制"
                                    size="small"
                                    @change="calculateLoginLimit"
                                    class="form-input" />
                            </div>
                            <div class="form-row result-row">
                                <label class="form-label">总上限</label>
                                <div class="result-display">
                                    <span class="result-value">{{ editConfig.login.displayLimit }}</span>
                                    <el-icon class="result-icon"><Coin /></el-icon>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 阅读积分配置卡片 -->
                    <div class="config-card">
                        <div class="card-header">
                            <el-icon class="card-icon"><Reading /></el-icon>
                            <span class="card-title">阅读积分</span>
                        </div>
                        <div class="card-content">
                            <div class="form-row">
                                <label class="form-label">单次积分</label>
                                <el-input-number
                                    v-model="editConfig.read.score"
                                    :min="0" :max="1000"
                                    placeholder="积分值"
                                    size="small"
                                    @change="calculateReadLimit"
                                    class="form-input" />
                            </div>
                            <div class="form-row">
                                <label class="form-label">获取次数</label>
                                <el-input-number
                                    v-model="editConfig.read.times"
                                    :min="editConfig.read.score > 0 ? 1 : 0"
                                    placeholder="0=无限制"
                                    size="small"
                                    @change="calculateReadLimit"
                                    class="form-input" />
                            </div>
                            <div class="form-row result-row">
                                <label class="form-label">总上限</label>
                                <div class="result-display">
                                    <span class="result-value">{{ editConfig.read.displayLimit }}</span>
                                    <el-icon class="result-icon"><Coin /></el-icon>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 答题积分配置卡片 -->
                    <div class="config-card">
                        <div class="card-header">
                            <el-icon class="card-icon"><EditPen /></el-icon>
                            <span class="card-title">答题积分</span>
                        </div>
                        <div class="card-content">
                            <div class="form-row">
                                <label class="form-label">单次积分</label>
                                <el-input-number
                                    v-model="editConfig.answer.score"
                                    :min="0" :max="1000"
                                    placeholder="积分值"
                                    size="small"
                                    @change="calculateAnswerLimit"
                                    class="form-input" />
                            </div>
                            <div class="form-row">
                                <label class="form-label">获取次数</label>
                                <el-input-number
                                    v-model="editConfig.answer.times"
                                    :min="editConfig.answer.score > 0 ? 1 : 0"
                                    placeholder="0=无限制"
                                    size="small"
                                    @change="calculateAnswerLimit"
                                    class="form-input" />
                            </div>
                            <div class="form-row result-row">
                                <label class="form-label">总上限</label>
                                <div class="result-display">
                                    <span class="result-value">{{ editConfig.answer.displayLimit }}</span>
                                    <el-icon class="result-icon"><Coin /></el-icon>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PK积分配置卡片 -->
                    <div class="config-card">
                        <div class="card-header">
                            <el-icon class="card-icon"><Trophy /></el-icon>
                            <span class="card-title">PK积分</span>
                        </div>
                        <div class="card-content">
                            <div class="form-row">
                                <label class="form-label">单次积分</label>
                                <el-input-number
                                    v-model="editConfig.competition.score"
                                    :min="0" :max="1000"
                                    placeholder="积分值"
                                    size="small"
                                    @change="calculateCompetitionLimit"
                                    class="form-input" />
                            </div>
                            <div class="form-row">
                                <label class="form-label">获取次数</label>
                                <el-input-number
                                    v-model="editConfig.competition.times"
                                    :min="editConfig.competition.score > 0 ? 1 : 0"
                                    placeholder="0=无限制"
                                    size="small"
                                    @change="calculateCompetitionLimit"
                                    class="form-input" />
                            </div>
                            <div class="form-row result-row">
                                <label class="form-label">总上限</label>
                                <div class="result-display">
                                    <span class="result-value">{{ editConfig.competition.displayLimit }}</span>
                                    <el-icon class="result-icon"><Coin /></el-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
import { Edit, Refresh, User, Reading, EditPen, Trophy, Coin } from '@element-plus/icons-vue';
import type { PointConfig } from '@/api/points';
import { getPointConfig, setPointConfig } from '@/api/points';

// 表格数据
interface TableDataItem {
    type: string;
    score: number;
    times: number;
    limit: number;
    description: string;
}

// 编辑配置项（包含额外的显示字段）
interface EditConfigItem {
    score: number;
    limit: number;
    times: number;
    displayLimit: string;
}

// 编辑配置
interface EditPointConfig {
    login: EditConfigItem;
    read: EditConfigItem;
    answer: EditConfigItem;
    competition: EditConfigItem;
}

// 积分配置
const config = reactive<PointConfig>({
    login: { score: 0, limit: 0 },
    read: { score: 0, limit: 0 },
    answer: { score: 0, limit: 0 },
    competition: { score: 0, limit: 0 }
});

// 编辑弹窗显示的配置
const editConfig = reactive<EditPointConfig>({
    login: { score: 0, limit: 0, times: 0, displayLimit: '无限制' },
    read: { score: 0, limit: 0, times: 0, displayLimit: '无限制' },
    answer: { score: 0, limit: 0, times: 0, displayLimit: '无限制' },
    competition: { score: 0, limit: 0, times: 0, displayLimit: '无限制' }
});

// 弹窗控制
const dialogVisible = ref(false);

// 计算获取次数的辅助函数
const calculateTimes = (score: number, limit: number): number => {
    if (score === 0 || limit === 0 || limit === null) {
        return 0; // 表示无限制
    }
    return Math.floor(limit / score);
};

// 计算总上限的辅助函数
const calculateLimitDisplay = (score: number, times: number): string => {
    if (score === 0 || times === 0) {
        return '无限制';
    }
    const totalLimit = score * times;
    return `${totalLimit}分`;
};

// 各类型的计算函数
const calculateLoginLimit = () => {
    editConfig.login.limit = editConfig.login.score * editConfig.login.times;
    editConfig.login.displayLimit = calculateLimitDisplay(editConfig.login.score, editConfig.login.times);
};

const calculateReadLimit = () => {
    editConfig.read.limit = editConfig.read.score * editConfig.read.times;
    editConfig.read.displayLimit = calculateLimitDisplay(editConfig.read.score, editConfig.read.times);
};

const calculateAnswerLimit = () => {
    editConfig.answer.limit = editConfig.answer.score * editConfig.answer.times;
    editConfig.answer.displayLimit = calculateLimitDisplay(editConfig.answer.score, editConfig.answer.times);
};

const calculateCompetitionLimit = () => {
    editConfig.competition.limit = editConfig.competition.score * editConfig.competition.times;
    editConfig.competition.displayLimit = calculateLimitDisplay(editConfig.competition.score, editConfig.competition.times);
};

// 表格数据（从config计算）
const tableData = computed<TableDataItem[]>(() => {
    return [
        {
            type: '登录',
            score: config.login.score,
            times: calculateTimes(config.login.score, config.login.limit),
            limit: config.login.limit,
            description: '用户每次登录获得的积分'
        },
        {
            type: '阅读',
            score: config.read.score,
            times: calculateTimes(config.read.score, config.read.limit),
            limit: config.read.limit,
            description: '用户阅读文章获得的积分'
        },
        {
            type: '答题',
            score: config.answer.score,
            times: calculateTimes(config.answer.score, config.answer.limit),
            limit: config.answer.limit,
            description: '用户答题获得的积分'
        },
        {
            type: 'PK',
            score: config.competition.score,
            times: calculateTimes(config.competition.score, config.competition.limit),
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
    // 数据转换：从config转换到editConfig
    const convertConfigToEdit = (source: any) => {
        return {
            score: source.score,
            limit: source.limit,
            times: calculateTimes(source.score, source.limit),
            displayLimit: calculateLimitDisplay(source.score, calculateTimes(source.score, source.limit))
        };
    };

    editConfig.login = convertConfigToEdit(config.login);
    editConfig.read = convertConfigToEdit(config.read);
    editConfig.answer = convertConfigToEdit(config.answer);
    editConfig.competition = convertConfigToEdit(config.competition);

    dialogVisible.value = true;
};

// 简单的数值验证函数
const validateConfig = () => {
    const types = ['login', 'read', 'answer', 'competition'] as const;

    for (const type of types) {
        const item = editConfig[type];
        const typeName = type === 'login' ? '登录' : type === 'read' ? '阅读' : type === 'answer' ? '答题' : 'PK';

        if (item.score < 0 || item.score > 1000) {
            ElMessage.error(`${typeName}积分必须在0-1000之间`);
            return false;
        }

        if (item.times < 0) {
            ElMessage.error(`${typeName}获取次数不能小于0`);
            return false;
        }

        // 如果单次积分大于0，获取次数不能为0（除非是有意设置无限制）
        if (item.score > 0 && item.times === 0) {
            ElMessage.error(`${typeName}单次积分大于0时，获取次数不能为0（如需无限制请设置合理的次数值）`);
            return false;
        }
    }

    return true;
};

// 保存配置
const handleSave = async () => {
    try {
        // 自定义验证
        if (!validateConfig()) {
            return;
        }

        // 数据转换：从editConfig转换到API需要的格式
        const apiData = {
            login: {
                score: editConfig.login.score,
                limit: editConfig.login.limit
            },
            read: {
                score: editConfig.read.score,
                limit: editConfig.read.limit
            },
            answer: {
                score: editConfig.answer.score,
                limit: editConfig.answer.limit
            },
            competition: {
                score: editConfig.competition.score,
                limit: editConfig.competition.limit
            }
        };

        await setPointConfig(apiData);

        // 更新本地config数据
        config.login = { ...apiData.login };
        config.read = { ...apiData.read };
        config.answer = { ...apiData.answer };
        config.competition = { ...apiData.competition };

        ElMessage.success('保存成功');
        dialogVisible.value = false;

        // 重新获取最新配置以确保数据一致性
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

.times-text {
    font-weight: bold;
    color: #67c23a;
}

.limit-text {
    font-weight: bold;
    color: #e6a23c;
}

.no-limit {
    color: #909399;
    font-style: italic;
}

.description {
    color: #606266;
}

.readonly-input {
    background-color: #f5f7fa;
    border-color: #e4e7ed;
    color: #606266;
    cursor: not-allowed;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

/* 弹窗样式优化 */
.points-config-dialog :deep(.el-dialog__body) {
    padding: 20px;
}

.config-container {
    max-height: 70vh;
    overflow-y: auto;
}

.config-notice {
    margin-bottom: 20px;
}

.config-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

.config-card {
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #409eff 0%, #5dade2 100%);
    color: white;
}

.card-icon {
    font-size: 20px;
    margin-right: 10px;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
}

.card-content {
    padding: 20px;
    background: white;
}

.form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    min-height: 32px;
}

.form-row:last-child {
    margin-bottom: 0;
}

.form-label {
    flex: 0 0 80px;
    font-size: 14px;
    color: #606266;
    font-weight: 500;
}

.form-input {
    flex: 1;
    max-width: 140px;
}

.result-row {
    border-top: 1px dashed #e4e7ed;
    padding-top: 16px;
    margin-top: 16px;
}

.result-display {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 140px;
    padding: 8px 12px;
    background: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    min-height: 32px;
}

.result-value {
    font-weight: 600;
    color: #409eff;
    font-size: 14px;
}

.result-icon {
    color: #67c23a;
    font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    .config-grid {
        grid-template-columns: 1fr;
    }

    .points-config-dialog {
        width: 95% !important;
        margin: 0 auto;
    }

    .form-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .form-input {
        max-width: 100%;
        width: 100%;
    }

    .result-display {
        max-width: 100%;
        width: 100%;
    }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
    .config-card {
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        border-color: #4a5568;
    }

    .card-content {
        background: #1a202c;
    }

    .form-label {
        color: #e2e8f0;
    }

    .result-display {
        background: #2d3748;
        border-color: #4a5568;
    }

    .result-value {
        color: #63b3ed;
    }
}
</style>