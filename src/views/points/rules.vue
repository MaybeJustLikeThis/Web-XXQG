<template>
    <div class="container">
        <div class="handle-box">
            <el-button type="primary" :icon="Plus" @click="handleCreate">新增规则</el-button>
            <el-input v-model="query.name" placeholder="规则名称" class="handle-input mr10" @keyup.enter="handleSearch"></el-input>
            <el-select v-model="query.eventType" placeholder="事件类型" class="handle-select mr10">
                <el-option label="全部" value=""></el-option>
                <el-option v-for="(label, value) in eventTypeLabels" :key="value" :label="label" :value="value"></el-option>
            </el-select>
            <el-select v-model="query.isActive" placeholder="状态" class="handle-select mr10">
                <el-option label="全部" value=""></el-option>
                <el-option label="启用" :value="true"></el-option>
                <el-option label="禁用" :value="false"></el-option>
            </el-select>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header">
            <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
            <el-table-column prop="name" label="规则名称" min-width="150" show-overflow-tooltip></el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip></el-table-column>
            <el-table-column label="事件类型" width="120" align="center">
                <template #default="scope">
                    <el-tag size="small">{{ eventTypeLabels[scope.row.eventType] }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="积分值" width="100" align="center">
                <template #default="scope">
                    <span :class="scope.row.points > 0 ? 'color1' : 'color3'">
                        {{ scope.row.points > 0 ? '+' : '' }}{{ scope.row.points }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="maxDailyLimit" label="每日上限" width="100" align="center">
                <template #default="scope">
                    {{ scope.row.maxDailyLimit || '无限制' }}
                </template>
            </el-table-column>
            <el-table-column prop="cooldownHours" label="冷却时间" width="100" align="center">
                <template #default="scope">
                    {{ scope.row.cooldownHours ? scope.row.cooldownHours + '小时' : '无冷却' }}
                </template>
            </el-table-column>
            <el-table-column prop="isActive" label="状态" width="100" align="center">
                <template #default="scope">
                    <el-tag :type="scope.row.isActive ? 'success' : 'danger'">
                        {{ scope.row.isActive ? '启用' : '禁用' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160" align="center"></el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
                <template #default="scope">
                    <el-button type="primary" :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button
                        :type="scope.row.isActive ? 'warning' : 'success'"
                        @click="handleToggleStatus(scope.row)"
                    >
                        {{ scope.row.isActive ? '禁用' : '启用' }}
                    </el-button>
                    <el-button type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
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

        <!-- 新增/编辑弹窗 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="60%" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
                <el-form-item label="规则名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入规则名称"></el-input>
                </el-form-item>
                <el-form-item label="规则描述" prop="description">
                    <el-input v-model="form.description" type="textarea" rows="3" placeholder="请输入规则描述"></el-input>
                </el-form-item>
                <el-form-item label="事件类型" prop="eventType">
                    <el-select v-model="form.eventType" placeholder="请选择事件类型" style="width: 100%">
                        <el-option v-for="(label, value) in eventTypeLabels" :key="value" :label="label" :value="value"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="积分值" prop="points">
                    <el-input-number
                        v-model="form.points"
                        :min="-1000"
                        :max="1000"
                        placeholder="请输入积分值"
                        style="width: 100%"
                    ></el-input-number>
                    <div class="form-tip">
                        正数为奖励积分，负数为扣除积分
                    </div>
                </el-form-item>
                <el-form-item label="每日上限" prop="maxDailyLimit">
                    <el-input-number
                        v-model="form.maxDailyLimit"
                        :min="0"
                        placeholder="0表示无限制"
                        style="width: 100%"
                    ></el-input-number>
                </el-form-item>
                <el-form-item label="冷却时间" prop="cooldownHours">
                    <el-input-number
                        v-model="form.cooldownHours"
                        :min="0"
                        placeholder="小时数，0表示无冷却"
                        style="width: 100%"
                    ></el-input-number>
                </el-form-item>
                <el-form-item label="生效时间">
                    <el-row :gutter="20">
                        <el-col :span="11">
                            <el-date-picker
                                v-model="form.effectiveStartDate"
                                type="datetime"
                                placeholder="开始时间"
                                style="width: 100%"
                            ></el-date-picker>
                        </el-col>
                        <el-col :span="2" style="text-align: center">-</el-col>
                        <el-col :span="11">
                            <el-date-picker
                                v-model="form.effectiveEndDate"
                                type="datetime"
                                placeholder="结束时间"
                                style="width: 100%"
                            ></el-date-picker>
                        </el-col>
                    </el-row>
                </el-form-item>
                <el-form-item label="用户等级限制">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-input-number
                                v-model="form.conditions.minLevel"
                                :min="1"
                                placeholder="最低等级"
                                style="width: 100%"
                            ></el-input-number>
                        </el-col>
                        <el-col :span="12">
                            <el-input-number
                                v-model="form.conditions.maxLevel"
                                :min="1"
                                placeholder="最高等级"
                                style="width: 100%"
                            ></el-input-number>
                        </el-col>
                    </el-row>
                </el-form-item>
                <el-form-item label="状态" prop="isActive">
                    <el-switch v-model="form.isActive" active-text="启用" inactive-text="禁用"></el-switch>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="handleSubmit">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="points-rules">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue';
import type { PointRule, PointRuleQuery, PointEventType } from '@/types/points';
import { getPointRules, createPointRule, updatePointRule, deletePointRule, togglePointRuleStatus } from '@/api/points';

// 查询参数
const query = reactive<PointRuleQuery>({
    page: 1,
    pageSize: 10,
    name: '',
    eventType: undefined,
    isActive: undefined,
});

// 表格数据
const tableData = ref<PointRule[]>([]);
const pageTotal = ref(0);

// 弹窗控制
const dialogVisible = ref(false);
const dialogTitle = ref('新增积分规则');
const formRef = ref();

// 表单数据
const form = reactive<PointRule>({
    id: '',
    name: '',
    description: '',
    eventType: 'login' as PointEventType,
    points: 0,
    isReward: true,
    isActive: true,
    maxDailyLimit: undefined,
    cooldownHours: undefined,
    effectiveStartDate: undefined,
    effectiveEndDate: undefined,
    conditions: {
        minLevel: undefined,
        maxLevel: undefined,
        userTags: [],
        requiredActions: []
    },
    creatorId: 'admin',
    createTime: '',
    updateTime: '',
});

// 表单验证规则
const rules = {
    name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入规则描述', trigger: 'blur' }],
    eventType: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
    points: [{ required: true, message: '请输入积分值', trigger: 'blur' }],
};

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

// 获取积分规则列表
const getRules = async () => {
    try {
        const res = await getPointRules(query);
        tableData.value = res.data.list;
        pageTotal.value = res.data.total;
    } catch (error) {
        ElMessage.error('获取积分规则列表失败');
        // 开发阶段使用模拟数据
        const mockData: PointRule[] = [
            {
                id: '1',
                name: '每日登录奖励',
                description: '用户每日首次登录获得积分奖励',
                eventType: 'daily_login' as PointEventType,
                points: 10,
                isReward: true,
                isActive: true,
                maxDailyLimit: 10,
                cooldownHours: 20,
                conditions: {
                    minLevel: 1,
                    maxLevel: 99,
                    userTags: ['active'],
                    requiredActions: ['complete_profile']
                },
                creatorId: 'admin',
                createTime: '2024-01-10 09:00:00',
                updateTime: '2024-01-10 09:00:00'
            },
            {
                id: '2',
                name: '阅读文章奖励',
                description: '用户阅读文章获得积分奖励',
                eventType: 'article_read' as PointEventType,
                points: 2,
                isReward: true,
                isActive: true,
                maxDailyLimit: 50,
                cooldownHours: 0,
                conditions: {
                    minLevel: 1
                },
                creatorId: 'admin',
                createTime: '2024-01-11 10:30:00',
                updateTime: '2024-01-11 10:30:00'
            }
        ];
        tableData.value = mockData;
        pageTotal.value = mockData.length;
    }
};

// 搜索
const handleSearch = () => {
    query.page = 1;
    getRules();
};

// 分页切换
const handlePageChange = (val: number) => {
    query.page = val;
    getRules();
};

// 新增规则
const handleCreate = () => {
    dialogTitle.value = '新增积分规则';
    dialogVisible.value = true;
    resetForm();
};

// 编辑规则
const handleEdit = (row: PointRule) => {
    dialogTitle.value = '编辑积分规则';
    dialogVisible.value = true;
    Object.assign(form, {
        ...row,
        effectiveStartDate: row.effectiveStartDate ? new Date(row.effectiveStartDate) : undefined,
        effectiveEndDate: row.effectiveEndDate ? new Date(row.effectiveEndDate) : undefined
    });
};

// 切换状态
const handleToggleStatus = async (row: PointRule) => {
    const action = row.isActive ? '禁用' : '启用';
    try {
        await ElMessageBox.confirm(`确定要${action}这个积分规则吗？`, '提示', {
            type: 'warning',
        });

        await togglePointRuleStatus(row.id, !row.isActive);
        ElMessage.success(`${action}成功`);
        getRules();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(`${action}失败`);
        }
    }
};

// 删除规则
const handleDelete = async (row: PointRule) => {
    try {
        await ElMessageBox.confirm('确定要删除这个积分规则吗？', '提示', {
            type: 'warning',
        });

        await deletePointRule(row.id);
        ElMessage.success('删除成功');
        getRules();
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

        const submitData = {
            ...form,
            isReward: form.points > 0,
            effectiveStartDate: form.effectiveStartDate ? form.effectiveStartDate.toISOString() : undefined,
            effectiveEndDate: form.effectiveEndDate ? form.effectiveEndDate.toISOString() : undefined,
        };

        if (form.id) {
            await updatePointRule(form.id, submitData);
            ElMessage.success('更新成功');
        } else {
            await createPointRule(submitData);
            ElMessage.success('创建成功');
        }

        dialogVisible.value = false;
        getRules();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(form.id ? '更新失败' : '创建失败');
        }
    }
};

// 重置表单
const resetForm = () => {
    Object.assign(form, {
        id: '',
        name: '',
        description: '',
        eventType: 'login' as PointEventType,
        points: 0,
        isReward: true,
        isActive: true,
        maxDailyLimit: undefined,
        cooldownHours: undefined,
        effectiveStartDate: undefined,
        effectiveEndDate: undefined,
        conditions: {
            minLevel: undefined,
            maxLevel: undefined,
            userTags: [],
            requiredActions: []
        },
        creatorId: 'admin',
        createTime: '',
        updateTime: '',
    });
    if (formRef.value) {
        formRef.value.clearValidate();
    }
};

onMounted(() => {
    getRules();
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
    width: 300px;
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

.form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}

.pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}
</style>