<template>
    <div class="container">
        <div class="handle-box">
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
                  <el-table-column label="操作" width="150" align="center" fixed="right">
                <template #default="scope">
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
import { getAllQuestions } from '@/api/question';

// 查询参数
const query = reactive<QuestionQuery>({
    page: 1,
    pageSize: 10,
    title: '',
    type: undefined,
    difficulty: undefined,
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
const getQuestions = async () => {
    try {
        const res = await getAllQuestions();

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            // 将API数据转换为前端需要的格式
            const questions = res.data.data.map((item: any) => {
                // 将数字类型转换为前端需要的字符串类型
                let type = 'single_choice';
                switch (item.type) {
                    case 1:
                        type = 'single_choice';
                        break;
                    case 2:
                        type = 'multiple_choice';
                        break;
                    case 3:
                        type = 'essay';
                        break;
                    default:
                        type = 'single_choice';
                }

                // 处理选项 - 确保选择题有选项，简答题没有选项
                let options = [];
                if (item.options && Array.isArray(item.options) && item.type !== 3) {
                    options = item.options.map((option: string, index: number) => ({
                        id: (index + 1).toString(),
                        text: option,
                        isCorrect: false // API没有返回正确答案信息
                    }));
                }

                return {
                    id: item.id.toString(),
                    title: item.title,
                    type: type,
                    difficulty: 'medium', // API没有返回难度信息，使用默认值
                    status: item.answered ? 'answered' : (item.fixed_answer ? 'active' : 'inactive'), // 优先根据answered判断状态
                    content: item.title, // 使用title作为content
                    options: options,
                    correctAnswer: item.standard_answer || '',
                    explanation: item.reference_answer || '',
                    points: 10, // API没有返回分值，使用默认值
                    fixed_answer: item.fixed_answer,
                    answered: item.answered,
                    // 兼容原有字段
                    creatorId: '',
                    createTime: '',
                    updateTime: '',
                };
            });

            // 应用筛选条件
            let filteredData = questions.filter((question: any) => {
                if (query.title && !question.title.includes(query.title)) return false;
                if (query.type && question.type !== query.type) return false;
                if (query.difficulty && question.difficulty !== query.difficulty) return false;
                return true;
            });

            tableData.value = filteredData;
            pageTotal.value = filteredData.length;
        } else {
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        ElMessage.error('获取题目列表失败');
        console.error('获取题目列表错误:', error);

        // 使用模拟数据作为fallback，与真实API数据格式一致
        const mockData: Question[] = [
            {
                id: '1',
                title: '下列哪个是正确的？1',
                type: 'single_choice',
                difficulty: 'medium',
                status: 'active',
                content: '下列哪个是正确的？1',
                options: [
                    { id: '1', text: '选项一', isCorrect: false },
                    { id: '2', text: '选项二', isCorrect: false },
                    { id: '3', text: '选项三', isCorrect: false },
                    { id: '4', text: '选项四', isCorrect: false }
                ],
                correctAnswer: '',
                explanation: '',
                points: 10,
                fixed_answer: true,
                answered: false,
                creatorId: '',
                createTime: '',
                updateTime: '',
            },
            {
                id: '2',
                title: '下列哪些是正确的？13',
                type: 'multiple_choice',
                difficulty: 'medium',
                status: 'active',
                content: '下列哪些是正确的？13',
                options: [
                    { id: '1', text: '选项一', isCorrect: false },
                    { id: '2', text: '选项二', isCorrect: false },
                    { id: '3', text: '选项三', isCorrect: false },
                    { id: '4', text: '选项四', isCorrect: false }
                ],
                correctAnswer: '',
                explanation: '',
                points: 10,
                fixed_answer: true,
                answered: false,
                creatorId: '',
                createTime: '',
                updateTime: '',
            },
            {
                id: '3',
                title: '写写你对党的认识',
                type: 'essay',
                difficulty: 'medium',
                status: 'inactive',
                content: '写写你对党的认识',
                options: [],
                correctAnswer: '',
                explanation: '',
                points: 10,
                fixed_answer: false,
                answered: false,
                creatorId: '',
                createTime: '',
                updateTime: '',
            },
        ];

        // 应用筛选条件
        let filteredData = mockData.filter(question => {
            if (query.title && !question.title.includes(query.title)) return false;
            if (query.type && question.type !== query.type) return false;
            if (query.difficulty && question.difficulty !== query.difficulty) return false;
            return true;
        });

        tableData.value = filteredData;
        pageTotal.value = filteredData.length;
    }
};

// 搜索
const handleSearch = async () => {
    query.page = 1;
    await getQuestions();
};

// 分页切换
const handlePageChange = async (val: number) => {
    query.page = val;
    await getQuestions();
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
const handleDelete = async (row: Question) => {
    try {
        await ElMessageBox.confirm(`确定要删除题目"${row.title}"吗？`, '提示', {
            type: 'warning',
        });

        // TODO: 调用删除API
        // await deleteQuestion(row.id);

        ElMessage.success('删除成功');
        await getQuestions();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
        }
    }
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
const submitForm = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

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

        // TODO: 调用创建或更新API
        // if (form.id) {
        //     await updateQuestion(form.id, form);
        // } else {
        //     await createQuestion(form);
        // }

        ElMessage.success(form.id ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        await getQuestions();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(form.id ? '更新失败' : '创建失败');
        }
    }
};

// 提交评审
const handleReviewSubmit = async () => {
    // 模拟评审提交
    ElMessage.success('评审提交成功');
    reviewVisible.value = false;
    await getQuestions();
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


onMounted(async () => {
    await getQuestions();
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