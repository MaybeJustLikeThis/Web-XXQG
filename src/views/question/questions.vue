<template>
    <div class="container">
        <div class="handle-box">
            <el-button type="primary" :icon="Plus" @click="handleCreate">新增题目</el-button>
            <el-input v-model="query.title" placeholder="题目标题" class="handle-input mr10" @keyup.enter="handleSearch"></el-input>
            <el-select v-model="query.type" placeholder="题型" class="handle-select mr10">
                <el-option label="全部" value=""></el-option>
                <el-option label="单选题" value="single_choice"></el-option>
                <el-option label="多选题" value="multiple_choice"></el-option>
                <el-option label="填空题" value="fill_blank"></el-option>
                <el-option label="判断题" value="judge"></el-option>
                <el-option label="简答题" value="essay"></el-option>
            </el-select>
            <el-select v-model="query.difficulty" placeholder="难度" class="handle-select mr10">
                <el-option label="全部" value=""></el-option>
                <el-option label="简单" value="easy"></el-option>
                <el-option label="中等" value="medium"></el-option>
                <el-option label="困难" value="hard"></el-option>
            </el-select>
            <el-select v-model="query.status" placeholder="状态" class="handle-select mr10">
                <el-option label="全部" value=""></el-option>
                <el-option label="启用" value="active"></el-option>
                <el-option label="禁用" value="inactive"></el-option>
                <el-option label="待评审" value="pending_review"></el-option>
                <el-option label="已拒绝" value="rejected"></el-option>
            </el-select>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
            <el-table-column prop="title" label="题目标题" min-width="200" show-overflow-tooltip></el-table-column>
            <el-table-column prop="type" label="题型" width="100" align="center">
                <template #default="scope">
                    <el-tag :type="getQuestionTypeColor(scope.row.type)">
                        {{ getQuestionTypeText(scope.row.type) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="difficulty" label="难度" width="80" align="center">
                <template #default="scope">
                    <el-tag :type="getDifficultyColor(scope.row.difficulty)">
                        {{ getDifficultyText(scope.row.difficulty) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="points" label="分值" width="80" align="center"></el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="scope">
                    <el-tag :type="getStatusColor(scope.row.status)">
                        {{ getStatusText(scope.row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160" align="center"></el-table-column>
            <el-table-column label="操作" width="250" align="center" fixed="right">
                <template #default="scope">
                    <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button v-if="scope.row.status === 'pending_review'" type="success" size="small" @click="handleReview(scope.row)">评审</el-button>
                    <el-button type="info" size="small" @click="handleView(scope.row)">预览</el-button>
                    <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
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

        <!-- 新增/编辑题目弹窗 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="80%" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="题目标题" prop="title">
                            <el-input v-model="form.title" placeholder="请输入题目标题"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="题型" prop="type">
                            <el-select v-model="form.type" placeholder="请选择题型" style="width: 100%" @change="handleTypeChange">
                                <el-option label="单选题" value="single_choice"></el-option>
                                <el-option label="多选题" value="multiple_choice"></el-option>
                                <el-option label="填空题" value="fill_blank"></el-option>
                                <el-option label="判断题" value="judge"></el-option>
                                <el-option label="简答题" value="essay"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="难度" prop="difficulty">
                            <el-select v-model="form.difficulty" placeholder="请选择难度" style="width: 100%">
                                <el-option label="简单" value="easy"></el-option>
                                <el-option label="中等" value="medium"></el-option>
                                <el-option label="困难" value="hard"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="题目内容" prop="content">
                    <el-input v-model="form.content" type="textarea" rows="3" placeholder="请输入题目内容"></el-input>
                </el-form-item>

                <!-- 选择题选项 -->
                <el-form-item v-if="isChoiceQuestion" label="选项配置">
                    <div class="options-container">
                        <div v-for="(option, index) in form.options" :key="option.id" class="option-item">
                            <el-input v-model="option.text" placeholder="选项内容">
                                <template #prepend>
                                    <el-checkbox v-model="option.isCorrect">正确</el-checkbox>
                                </template>
                                <template #append>
                                    <el-button type="danger" :icon="Delete" @click="removeOption(index)" :disabled="form.options!.length <= 2"></el-button>
                                </template>
                            </el-input>
                        </div>
                        <el-button type="primary" :icon="Plus" @click="addOption" style="margin-top: 10px">添加选项</el-button>
                    </div>
                </el-form-item>

                <!-- 判断题特殊处理 -->
                <el-form-item v-if="form.type === 'judge'" label="正确答案">
                    <el-radio-group v-model="form.correctAnswer">
                        <el-radio label="true">正确</el-radio>
                        <el-radio label="false">错误</el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- 其他题型答案 -->
                <el-form-item v-if="!isChoiceQuestion && form.type !== 'judge'" label="正确答案" prop="correctAnswer">
                    <el-input v-model="form.correctAnswer" type="textarea" rows="2" placeholder="请输入正确答案"></el-input>
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="分值" prop="points">
                            <el-input-number v-model="form.points" :min="1" :max="100" style="width: 100%"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="时间限制(秒)">
                            <el-input-number v-model="form.timeLimit" :min="0" style="width: 100%"></el-input-number>
                        </el-form-item>
                    </el-col>
                  </el-row>

                <el-form-item label="答案解析">
                    <el-input v-model="form.explanation" type="textarea" rows="3" placeholder="请输入答案解析（可选）"></el-input>
                </el-form-item>

              </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button v-if="!form.id" type="info" @click="handleSaveDraft">保存草稿</el-button>
                    <el-button type="primary" @click="handleSubmit">确 定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 题目预览弹窗 -->
        <el-dialog title="题目预览" v-model="previewVisible" width="60%">
            <div class="question-preview">
                <div class="question-header">
                    <h3>{{ previewQuestion.title }}</h3>
                    <div class="question-meta">
                        <el-tag :type="getQuestionTypeColor(previewQuestion.type)">
                            {{ getQuestionTypeText(previewQuestion.type) }}
                        </el-tag>
                        <el-tag :type="getDifficultyColor(previewQuestion.difficulty)">
                            {{ getDifficultyText(previewQuestion.difficulty) }}
                        </el-tag>
                        <span>分值：{{ previewQuestion.points }}分</span>
                    </div>
                </div>
                <div class="question-content">
                    <p>{{ previewQuestion.content }}</p>
                </div>
                <div v-if="previewQuestion.options" class="question-options">
                    <div v-for="option in previewQuestion.options" :key="option.id" class="option-item">
                        <el-tag :type="option.isCorrect ? 'success' : 'info'">
                            {{ option.text }}
                        </el-tag>
                    </div>
                </div>
                <div class="question-answer">
                    <p><strong>正确答案：</strong>{{ previewQuestion.correctAnswer }}</p>
                    <p v-if="previewQuestion.explanation"><strong>解析：</strong>{{ previewQuestion.explanation }}</p>
                </div>
            </div>
        </el-dialog>

        <!-- 评审弹窗 -->
        <el-dialog title="题目评审" v-model="reviewVisible" width="60%">
            <div class="review-content">
                <div class="question-preview">
                    <div class="question-header">
                        <h3>{{ reviewQuestion.title }}</h3>
                        <div class="question-meta">
                            <el-tag :type="getQuestionTypeColor(reviewQuestion.type)">
                                {{ getQuestionTypeText(reviewQuestion.type) }}
                            </el-tag>
                            <el-tag :type="getDifficultyColor(reviewQuestion.difficulty)">
                                {{ getDifficultyText(reviewQuestion.difficulty) }}
                            </el-tag>
                        </div>
                    </div>
                    <div class="question-content">
                        <p>{{ reviewQuestion.content }}</p>
                    </div>
                </div>
                <el-form :model="reviewForm" label-width="100px">
                    <el-form-item label="评审结果">
                        <el-radio-group v-model="reviewForm.status">
                            <el-radio label="active">通过</el-radio>
                            <el-radio label="rejected">拒绝</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="评审意见">
                        <el-input v-model="reviewForm.reviewComment" type="textarea" rows="4" placeholder="请输入评审意见"></el-input>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="reviewVisible = false">取 消</el-button>
                    <el-button type="primary" @click="handleReviewSubmit">提交评审</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="question-questions">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue';
import type { Question, QuestionQuery, Option } from '@/types/question';

// 查询参数
const query = reactive<QuestionQuery>({
    page: 1,
    pageSize: 10,
    title: '',
    type: undefined,
    difficulty: undefined,
    status: undefined,
});

// 表格数据
const tableData = ref<Question[]>([]);
const pageTotal = ref(0);

// 弹窗控制
const dialogVisible = ref(false);
const previewVisible = ref(false);
const reviewVisible = ref(false);
const dialogTitle = ref('新增题目');
const formRef = ref();

// 表单数据
const form = reactive<Question>({
    id: '',
    title: '',
    type: 'single_choice',
    difficulty: 'easy',
    status: 'active',
    content: '',
    options: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false }
    ],
    correctAnswer: '',
    explanation: '',
    points: 5,
    timeLimit: undefined,
    tags: [],
    bankId: '',
    creatorId: 'admin',
    createTime: '',
    updateTime: '',
});

// 表单验证规则
const rules = {
    title: [{ required: true, message: '请输入题目标题', trigger: 'blur' }],
    type: [{ required: true, message: '请选择题型', trigger: 'change' }],
    content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
    correctAnswer: [{ required: true, message: '请输入正确答案', trigger: 'blur' }],
    points: [{ required: true, message: '请输入分值', trigger: 'blur' }],
};

// 预览相关
const previewQuestion = ref<Question>({
    id: '',
    title: '',
    type: 'single_choice',
    difficulty: 'easy',
    status: 'active',
    content: '',
    options: [],
    correctAnswer: '',
    explanation: '',
    points: 0,
    bankId: '',
    creatorId: '',
    createTime: '',
    updateTime: '',
});

// 评审相关
const reviewQuestion = ref<Question>({
    id: '',
    title: '',
    type: 'single_choice',
    difficulty: 'easy',
    status: 'active',
    content: '',
    options: [],
    correctAnswer: '',
    explanation: '',
    points: 0,
    bankId: '',
    creatorId: '',
    createTime: '',
    updateTime: '',
});

const reviewForm = reactive({
    status: 'active',
    reviewComment: ''
});

// 计算属性
const isChoiceQuestion = computed(() => {
    return form.type === 'single_choice' || form.type === 'multiple_choice';
});

// 获取题目列表
const getQuestions = () => {
    // 模拟数据
    const mockData: Question[] = [
        {
            id: '1',
            title: 'JavaScript中typeof null的结果是什么？',
            type: 'single_choice',
            difficulty: 'easy',
            status: 'active',
            content: '请选择typeof null的返回值',
            options: [
                { id: '1', text: '"null"', isCorrect: false },
                { id: '2', text: '"undefined"', isCorrect: false },
                { id: '3', text: '"object"', isCorrect: true },
                { id: '4', text: '"number"', isCorrect: false }
            ],
            correctAnswer: '3',
            explanation: '这是JavaScript的一个历史遗留问题，typeof null会返回"object"',
            points: 5,
            creatorId: 'admin',
            createTime: '2024-01-01 10:00:00',
            updateTime: '2024-01-01 10:00:00'
        },
        {
            id: '2',
            title: '请简述闭包的概念',
            type: 'essay',
            difficulty: 'medium',
            status: 'pending_review',
            content: '请详细解释什么是闭包，以及它的应用场景',
            correctAnswer: '闭包是指函数可以访问其外部作用域的变量...',
            explanation: '闭包是JavaScript中的重要概念...',
            points: 10,
            creatorId: 'admin',
            createTime: '2024-01-01 11:00:00',
            updateTime: '2024-01-01 11:00:00'
        },
        {
            id: '3',
            title: '2 + 2 = ?',
            type: 'fill_blank',
            difficulty: 'easy',
            status: 'active',
            content: '请计算：2 + 2 = ____',
            correctAnswer: '4',
            explanation: '基础加法运算',
            points: 2,
            creatorId: 'admin',
            createTime: '2024-01-02 09:00:00',
            updateTime: '2024-01-02 09:00:00'
        },
        {
            id: '4',
            title: 'Vue3的生命周期钩子有哪些？',
            type: 'multiple_choice',
            difficulty: 'medium',
            status: 'active',
            content: '请选择Vue3中的生命周期钩子',
            options: [
                { id: '1', text: 'beforeCreate', isCorrect: false },
                { id: '2', text: 'onMounted', isCorrect: true },
                { id: '3', text: 'onUpdated', isCorrect: true },
                { id: '4', text: 'onUnmounted', isCorrect: true },
                { id: '5', text: 'beforeDestroy', isCorrect: false }
            ],
            correctAnswer: ['2', '3', '4'],
            explanation: 'Vue3中使用的生命周期钩子是onMounted、onUpdated、onUnmounted等',
            points: 8,
            creatorId: 'admin',
            createTime: '2024-01-03 14:00:00',
            updateTime: '2024-01-03 14:00:00'
        },
        {
            id: '5',
            title: 'CSS中display:none和visibility:hidden的区别',
            type: 'judge',
            difficulty: 'medium',
            status: 'active',
            content: 'display:none和visibility:hidden都会使元素不可见，但它们的区别是什么？',
            correctAnswer: 'false',
            explanation: 'display:none会完全移除元素，visibility:hidden只是隐藏元素但保留空间',
            points: 3,
            creatorId: 'admin',
            createTime: '2024-01-04 16:00:00',
            updateTime: '2024-01-04 16:00:00'
        }
    ];

    // 应用筛选条件
    let filteredData = mockData.filter(question => {
        if (query.title && !question.title.includes(query.title)) return false;
        if (query.type && question.type !== query.type) return false;
        if (query.difficulty && question.difficulty !== query.difficulty) return false;
        if (query.status && question.status !== query.status) return false;
        return true;
    });

    tableData.value = filteredData;
    pageTotal.value = filteredData.length;
};

// 搜索
const handleSearch = () => {
    query.page = 1;
    getQuestions();
};

// 分页切换
const handlePageChange = (val: number) => {
    query.page = val;
    getQuestions();
};

// 新增题目
const handleCreate = () => {
    dialogTitle.value = '新增题目';
    dialogVisible.value = true;
    resetForm();
};

// 编辑题目
const handleEdit = (row: Question) => {
    dialogTitle.value = '编辑题目';
    dialogVisible.value = true;
    Object.assign(form, row);

    // 确保选择题有选项
    if (isChoiceQuestion.value && (!form.options || form.options.length === 0)) {
        form.options = [
            { id: '1', text: '', isCorrect: false },
            { id: '2', text: '', isCorrect: false }
        ];
    }
};

// 预览题目
const handleView = (row: Question) => {
    Object.assign(previewQuestion.value, row);
    previewVisible.value = true;
};

// 评审题目
const handleReview = (row: Question) => {
    Object.assign(reviewQuestion.value, row);
    reviewForm.status = 'active';
    reviewForm.reviewComment = '';
    reviewVisible.value = true;
};

// 删除题目
const handleDelete = (row: Question) => {
    ElMessageBox.confirm(`确定要删除题目"${row.title}"吗？`, '提示', {
        type: 'warning',
    }).then(() => {
        ElMessage.success('删除成功');
        getQuestions();
    });
};

// 题型变化处理
const handleTypeChange = (type: string) => {
    // 重置答案和选项
    form.correctAnswer = '';

    if (type === 'single_choice' || type === 'multiple_choice') {
        form.options = [
            { id: '1', text: '', isCorrect: false },
            { id: '2', text: '', isCorrect: false }
        ];
    } else {
        form.options = [];
    }

    if (type === 'judge') {
        form.correctAnswer = 'true';
    }
};

// 添加选项
const addOption = () => {
    if (!form.options) form.options = [];
    const newOption: Option = {
        id: Date.now().toString(),
        text: '',
        isCorrect: false
    };
    form.options.push(newOption);
};

// 移除选项
const removeOption = (index: number) => {
    if (form.options && form.options.length > 2) {
        form.options.splice(index, 1);
    }
};

// 保存草稿
const handleSaveDraft = () => {
    form.status = 'inactive';
    submitForm();
};

// 提交表单
const handleSubmit = () => {
    form.status = form.id ? 'active' : 'active';
    submitForm();
};

// 提交表单逻辑
const submitForm = () => {
    formRef.value.validate((valid: boolean) => {
        if (valid) {
            // 验证选择题的选项
            if (isChoiceQuestion.value) {
                const hasCorrectOption = form.options?.some(opt => opt.isCorrect);
                if (!hasCorrectOption) {
                    ElMessage.error('请至少选择一个正确答案');
                    return;
                }

                const hasEmptyOption = form.options?.some(opt => !opt.text.trim());
                if (hasEmptyOption) {
                    ElMessage.error('请填写所有选项内容');
                    return;
                }
            }

            ElMessage.success(form.id ? '更新成功' : '创建成功');
            dialogVisible.value = false;
            getQuestions();
        }
    });
};

// 提交评审
const handleReviewSubmit = () => {
    // 模拟评审提交
    ElMessage.success('评审提交成功');
    reviewVisible.value = false;
    getQuestions();
};

// 重置表单
const resetForm = () => {
    Object.assign(form, {
        id: '',
        title: '',
        type: 'single_choice',
        difficulty: 'easy',
        status: 'active',
        content: '',
        options: [
            { id: '1', text: '', isCorrect: false },
            { id: '2', text: '', isCorrect: false }
        ],
        correctAnswer: '',
        explanation: '',
        points: 5,
        timeLimit: undefined,
        creatorId: 'admin',
        createTime: '',
        updateTime: '',
    });
};

// 辅助方法
const getQuestionTypeText = (type: string) => {
    const types = {
        single_choice: '单选',
        multiple_choice: '多选',
        fill_blank: '填空',
        judge: '判断',
        essay: '简答'
    };
    return types[type as keyof typeof types] || '未知';
};

const getQuestionTypeColor = (type: string) => {
    const colors = {
        single_choice: 'primary',
        multiple_choice: 'success',
        fill_blank: 'warning',
        judge: 'info',
        essay: 'danger'
    };
    return colors[type as keyof typeof colors] || 'info';
};

const getDifficultyText = (difficulty: string) => {
    const texts = {
        easy: '简单',
        medium: '中等',
        hard: '困难'
    };
    return texts[difficulty as keyof typeof texts] || '未知';
};

const getDifficultyColor = (difficulty: string) => {
    const colors = {
        easy: 'success',
        medium: 'warning',
        hard: 'danger'
    };
    return colors[difficulty as keyof typeof colors] || 'info';
};

const getStatusText = (status: string) => {
    const texts = {
        active: '启用',
        inactive: '禁用',
        pending_review: '待评审',
        rejected: '已拒绝'
    };
    return texts[status as keyof typeof texts] || '未知';
};

const getStatusColor = (status: string) => {
    const colors = {
        active: 'success',
        inactive: 'info',
        pending_review: 'warning',
        rejected: 'danger'
    };
    return colors[status as keyof typeof colors] || 'info';
};

onMounted(() => {
    getQuestions();
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

.mr5 {
    margin-right: 5px;
}

.options-container {
    width: 100%;
}

.option-item {
    margin-bottom: 10px;
}

.question-preview {
    padding: 20px;
    background: #f9f9f9;
    border-radius: 8px;
}

.question-header {
    margin-bottom: 20px;
}

.question-header h3 {
    margin: 0 0 10px 0;
    color: #333;
}

.question-meta {
    display: flex;
    gap: 10px;
    align-items: center;
}

.question-content {
    margin-bottom: 20px;
}

.question-options {
    margin-bottom: 20px;
}

.question-options .option-item {
    margin-bottom: 8px;
}

.question-answer {
    border-top: 1px solid #eee;
    padding-top: 15px;
}

.question-answer p {
    margin: 5px 0;
}

.review-content {
    padding: 20px 0;
}
</style>