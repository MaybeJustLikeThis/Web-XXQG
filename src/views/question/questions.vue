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
                <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
            <el-table-column prop="title" label="题目标题" min-width="200" show-overflow-tooltip>
                <template #default="scope">
                    {{ scope.row.detail.title || scope.row.title }}
                </template>
            </el-table-column>
            <el-table-column prop="type" label="题型" width="100" align="center">
                <template #default="scope">
                    <el-tag>
                        {{ getQuestionTypeText(scope.row.type) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="难度" width="80" align="center">
                <template #default="scope">
                    <el-tag :type="getDifficultyColor('medium')">
                        {{ getDifficultyText('medium') }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="points" label="分值" width="80" align="center"></el-table-column>
                  <el-table-column label="操作" width="220" align="center" fixed="right">
                <template #default="scope">
                    <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button type="info" size="small" @click="handleView(scope.row)">预览</el-button>
                    <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination">
            <el-pagination
                background
                layout="total, sizes, prev, pager, next, jumper"
                :current-page="query.page + 1"
                :page-size="query.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="pageTotal"
                @current-change="handlePageChange"
                @size-change="handleSizeChange"
            ></el-pagination>
        </div>

        <!-- 新增/编辑题目弹窗 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="80%" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="题目标题" prop="detail.title">
                            <el-input v-model="form.detail.title" placeholder="请输入题目标题"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="题型" prop="type">
                            <el-select v-model="form.type" placeholder="请选择题型" style="width: 100%" @change="handleTypeChange">
                                <el-option label="单选题" :value="1"></el-option>
                                <el-option label="多选题" :value="2"></el-option>
                                <el-option label="简答题" :value="3"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="难度">
                            <el-select value="medium" disabled style="width: 100%">
                                <el-option label="中等" value="medium"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- 调试信息 -->
                <el-form-item label="调试信息">
                    <div style="background: #f0f0f0; padding: 10px; font-size: 12px;">
                        <p>题型: {{ form.type }} ({{ isChoiceQuestion ? '选择题' : '非选择题' }})</p>
                        <p>选项数量: {{ form.detail.options?.length || 0 }}</p>
                        <p>正确答案: {{ form.detail.standard_answer }}</p>
                        <p>选项内容: {{ JSON.stringify(form.detail.options) }}</p>
                    </div>
                </el-form-item>

                <!-- 选择题选项 -->
                <el-form-item v-if="isChoiceQuestion" label="选项配置">
                    <div class="options-container">
                        <div v-for="(option, index) in form.detail.options" :key="index" class="option-item">
                            <el-input v-model="form.detail.options[index]" :placeholder="`选项${String.fromCharCode(65 + index)}`">
                                <template #prepend>{{ String.fromCharCode(65 + index) }}.</template>
                            </el-input>
                        </div>
                    </div>
                </el-form-item>

                <!-- 单选题正确答案 -->
                <el-form-item v-if="form.type === 1" label="正确答案">
                    <el-radio-group v-model="form.detail.standard_answer[0]">
                        <el-radio v-for="(option, index) in form.detail.options" :key="index" :label="String.fromCharCode(65 + index)">
                            {{ String.fromCharCode(65 + index) }}. {{ option }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- 多选题正确答案 -->
                <el-form-item v-if="form.type === 2" label="正确答案">
                    <el-checkbox-group v-model="form.detail.standard_answer">
                        <el-checkbox v-for="(option, index) in form.detail.options" :key="index" :label="String.fromCharCode(65 + index)">
                            {{ String.fromCharCode(65 + index) }}. {{ option }}
                        </el-checkbox>
                    </el-checkbox-group>
                </el-form-item>

                <!-- 简答题答案 -->
                <el-form-item v-if="form.type === 3" label="正确答案" prop="correctAnswer">
                    <el-input v-model="form.detail.standard_answer[0]" type="textarea" rows="2" placeholder="请输入正确答案"></el-input>
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="分值">
                            <el-input-number :value="10" disabled style="width: 100%"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="时间限制(秒)">
                            <el-input-number :value="undefined" disabled style="width: 100%"></el-input-number>
                        </el-form-item>
                    </el-col>
                  </el-row>

                <el-form-item label="答案解析">
                    <el-input v-model="form.detail.reference_answer" type="textarea" rows="3" placeholder="请输入答案解析（可选）"></el-input>
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
                        <el-tag>
                            {{ previewQuestion.type }}
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
                            <el-tag>
                                {{ reviewQuestion.type }}
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue';
import type { QuestionQuery } from '@/types/question';
import { getAllQuestions, addQuestion, editQuestion } from '@/api/question';
import { transformQuestionData } from '@/types/question';

// 查询参数
const query = reactive<QuestionQuery>({
    page: 0,
    pageSize: 10,
    title: '',
    type: undefined,
    difficulty: undefined,
});

// 存储所有题目数据（用于客户端分页）
const allQuestionsData = ref<any[]>([]);

// 表格数据
const tableData = ref<any[]>([]);
const pageTotal = ref(0);

// 弹窗控制
const dialogVisible = ref(false);
const previewVisible = ref(false);
const reviewVisible = ref(false);
const dialogTitle = ref('新增题目');
const formRef = ref();

// 表单数据
const form = reactive({
    id: '',
    creator: 'admin',
    type: 1,
    detail: {
        title: '',
        options: ['选项一', '选项二', '选项三', '选项四'],
        fixed_answer: true,
        standard_answer: [],
        reference_answer: ''
    },
    public: true,
    status: 1,
});

// 表单验证规则
const rules = {
    'detail.title': [{ required: true, message: '请输入题目标题', trigger: 'blur' }],
    type: [{ required: true, message: '请选择题型', trigger: 'change' }],
    points: [{ required: true, message: '请输入分值', trigger: 'blur' }],
};

// 预览相关
const previewQuestion = ref({
    id: '',
    title: '',
    type: 'single_choice',
    difficulty: 'medium',
    status: 'active',
    content: '',
    options: [],
    correctAnswer: '',
    explanation: '',
    points: 10,
});

// 评审相关
const reviewQuestion = ref({
    id: '',
    title: '',
    type: 'single_choice',
    difficulty: 'medium',
    status: 'active',
    content: '',
    options: [],
    correctAnswer: '',
    explanation: '',
    points: 10,
});

const reviewForm = reactive({
    status: 'active',
    reviewComment: ''
});

// 计算属性
const isChoiceQuestion = computed(() => {
    return form.type === 1 || form.type === 2;
});

// 获取题目列表
const getQuestions = async () => {
    try {
        // 构造分页参数
        const params = {
            page: query.page,
            size: query.pageSize
        };

        const res = await getAllQuestions(params);

        if (res.data && res.data.code === 200) {
            // 检查是否是分页数据结构
            const apiData = res.data.data;
            let questionsData: any[] = [];
            let totalCount = 0;

  
            if (Array.isArray(apiData)) {
                // 直接返回数组（无分页）- 进行客户端分页
  
                // 转换所有数据
                const allQuestions = apiData.map((item: any) => {
                    const transformedData = transformQuestionData(item);

                    // 创建兼容对象，包含旧格式的字段
                    return {
                        ...transformedData,
                        // 保存原始数据用于编辑
                        originalData: item,
                        // 兼容旧字段
                        title: transformedData.detail.title,
                        type: (() => {
                            // 将数字类型转换为前端需要的字符串类型
                            switch (transformedData.type) {
                                case 1: return 'single_choice';
                                case 2: return 'multiple_choice';
                                case 3: return 'essay';
                                default: return 'single_choice';
                            }
                        })(),
                        difficulty: 'medium', // API没有返回难度信息
                        status: transformedData.status === 1 ? 'active' : 'inactive',
                        content: transformedData.detail.title,
                        options: transformedData.type === 3 ? [] : (transformedData.detail.options?.map((opt: string, index: number) => ({
                            id: (index + 1).toString(),
                            text: opt,
                            isCorrect: transformedData.detail.standard_answer?.includes(index.toString()) || false
                        })) || []),
                        correctAnswer: (() => {
                            if (transformedData.type === 1) { // 单选题
                                return transformedData.detail.standard_answer?.[0] || '';
                            } else if (transformedData.type === 2) { // 多选题
                                return transformedData.detail.standard_answer?.join(',') || '';
                            } else {
                                return transformedData.detail.standard_answer?.[0] || '';
                            }
                        })(),
                        explanation: transformedData.detail.reference_answer || '',
                        points: 10, // API没有返回分值
                        fixed_answer: transformedData.detail.fixed_answer,
                        answered: false, // API没有返回此字段
                        // 兼容原有字段
                        creatorId: transformedData.creator,
                        createTime: '',
                        updateTime: '',
                    };
                });

                // 保存所有数据
                allQuestionsData.value = allQuestions;
                totalCount = allQuestions.length;

                // 应用客户端分页
                const startIndex = query.page * query.pageSize;
                const endIndex = startIndex + query.pageSize;
                questionsData = allQuestions.slice(startIndex, endIndex);

            } else if (apiData && apiData.list && Array.isArray(apiData.list)) {
                // 分页数据结构 { list: [], total: number }
                    questionsData = apiData.list.map((item: any) => {
                    const transformedData = transformQuestionData(item);
                    return {
                        ...transformedData,
                        // 兼容旧字段转换...
                        title: transformedData.detail.title,
                        type: (() => {
                            switch (transformedData.type) {
                                case 1: return 'single_choice';
                                case 2: return 'multiple_choice';
                                case 3: return 'essay';
                                default: return 'single_choice';
                            }
                        })(),
                        difficulty: 'medium',
                        status: transformedData.status === 1 ? 'active' : 'inactive',
                        content: transformedData.detail.title,
                        options: transformedData.type === 3 ? [] : (transformedData.detail.options?.map((opt: string, index: number) => ({
                            id: (index + 1).toString(),
                            text: opt,
                            isCorrect: transformedData.detail.standard_answer?.includes(index.toString()) || false
                        })) || []),
                        correctAnswer: (() => {
                            if (transformedData.type === 1) {
                                return transformedData.detail.standard_answer?.[0] || '';
                            } else if (transformedData.type === 2) {
                                return transformedData.detail.standard_answer?.join(',') || '';
                            } else {
                                return transformedData.detail.standard_answer?.[0] || '';
                            }
                        })(),
                        explanation: transformedData.detail.reference_answer || '',
                        points: 10,
                        fixed_answer: transformedData.detail.fixed_answer,
                        answered: false,
                        creatorId: transformedData.creator,
                        createTime: '',
                        updateTime: '',
                    };
                });
                totalCount = apiData.total || apiData.list.length;
            } else {
                      throw new Error('API返回数据格式不正确');
            }

            tableData.value = questionsData;
            pageTotal.value = totalCount;
        } else {
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        ElMessage.error('获取题目列表失败');
        console.error('获取题目列表错误:', error);

        // 使用模拟数据作为fallback
        tableData.value = [];
        pageTotal.value = 0;
    }
};

// 搜索
const handleSearch = async () => {
    query.page = 0; // 重置到第一页
    await getQuestions();
};

// 分页切换
const handlePageChange = (val: number) => {
        query.page = val - 1; // 前端分页从1开始，后端从0开始

    // 如果有全量数据，直接进行客户端分页
    if (allQuestionsData.value.length > 0) {
        applyClientPagination();
    } else {
        getQuestions();
    }
};

// 客户端分页处理
const applyClientPagination = () => {
    const startIndex = query.page * query.pageSize;
    const endIndex = startIndex + query.pageSize;
    tableData.value = allQuestionsData.value.slice(startIndex, endIndex);
    pageTotal.value = allQuestionsData.value.length;
};

// 分页大小切换
const handleSizeChange = async (val: number) => {
    query.pageSize = val;
    query.page = 0; // 重置到第一页

    // 如果有全量数据，直接进行客户端分页
    if (allQuestionsData.value.length > 0) {
        applyClientPagination();
    } else {
        await getQuestions();
    }
};

// 新增题目
const handleCreate = () => {
    dialogTitle.value = '新增题目';
    dialogVisible.value = true;
    resetForm();
};

// 编辑题目
const handleEdit = (row: any) => {
    dialogTitle.value = '编辑题目';
    dialogVisible.value = true;

    // 获取原始数据
    const originalData = row.originalData || row;

    // 不转换答案格式，保持原始的字母格式 ["A"]
    const keepAnswerFormat = (answers: string[]) => {
        return answers || [];
    };

    // 使用 nextTick 确保数据更新后视图重新渲染
    nextTick(() => {
        // 将数据赋值给form对象，使用新的数据结构
        form.id = row.id;
        form.creator = originalData.creator || 'admin';
        // 确保type是数字格式
        form.type = typeof originalData.type === 'string' ?
            (originalData.type === 'single_choice' ? 1 : originalData.type === 'multiple_choice' ? 2 : 3) :
            (originalData.type || 1);

        // 更新详情数据 - 直接从原始数据获取
        form.detail = {
            title: originalData.detail?.title || '',
            options: [...(originalData.detail?.options || ['选项一', '选项二', '选项三', '选项四'])],
            fixed_answer: originalData.detail?.fixed_answer !== undefined ? originalData.detail.fixed_answer : true,
            standard_answer: keepAnswerFormat(originalData.detail?.standard_answer || []),
            reference_answer: originalData.detail?.reference_answer || ''
        };

        form.public = originalData.public !== undefined ? originalData.public : true;
        form.status = originalData.status || 1;

        // 确保选择题有选项
        if (isChoiceQuestion.value && (!form.detail.options || form.detail.options.length === 0)) {
            form.detail.options = ['选项一', '选项二', '选项三', '选项四'];
        }
    });
};

// 预览题目
const handleView = (row: any) => {
    previewQuestion.value = {
        id: row.id,
        title: row.detail?.title || row.title || '',
        type: getQuestionTypeText(row.type),
        difficulty: 'medium',
        status: row.status === 1 ? 'active' : 'inactive',
        content: row.detail?.title || row.title || '',
        options: row.options || [],
        correctAnswer: row.detail?.standard_answer?.[0] || '',
        explanation: row.detail?.reference_answer || '',
        points: 10,
    };
    previewVisible.value = true;
};

// 评审题目
const handleReview = (row: any) => {
    reviewQuestion.value = {
        id: row.id,
        title: row.detail?.title || row.title || '',
        type: getQuestionTypeText(row.type),
        difficulty: 'medium',
        status: row.status === 1 ? 'active' : 'inactive',
        content: row.detail?.title || row.title || '',
        options: row.options || [],
        correctAnswer: row.detail?.standard_answer?.[0] || '',
        explanation: row.detail?.reference_answer || '',
        points: 10,
    };
    reviewForm.status = 'active';
    reviewForm.reviewComment = '';
    reviewVisible.value = true;
};

// 删除题目
const handleDelete = async (row: any) => {
    try {
        await ElMessageBox.confirm(`确定要删除题目"${row.detail?.title || row.title}"吗？`, '提示', {
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
const handleTypeChange = (type: number) => {
    // 重置答案和选项
    form.type = type;
    form.detail.standard_answer = [];

    if (type === 1 || type === 2) { // 单选题或多选题
        form.detail.options = ['选项一', '选项二', '选项三', '选项四'];
        form.detail.fixed_answer = true;
    } else { // 简答题
        form.detail.options = [];
        form.detail.fixed_answer = false;
    }
};


// 保存草稿
const handleSaveDraft = () => {
    form.status = 0; // 使用数字类型
    submitForm();
};

// 提交表单
const handleSubmit = () => {
    form.status = form.id ? 1 : 1; // 使用数字类型
    submitForm();
};

// 提交表单逻辑
const submitForm = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        // 验证选择题的选项
        if (isChoiceQuestion.value) {
            const hasCorrectOption = form.detail.standard_answer && form.detail.standard_answer.length > 0;
            if (!hasCorrectOption) {
                ElMessage.error('请至少选择一个正确答案');
                return;
            }

            const hasEmptyOption = form.detail.options?.some(opt => !opt.trim());
            if (hasEmptyOption) {
                ElMessage.error('请填写所有选项内容');
                return;
            }
        }

        // 构造提交数据，符合API要求的数据结构
        const submitData = {
            id: parseInt(form.id),
            type: form.type,
            detail: {
                title: form.detail.title,
                options: form.detail.options,
                fixed_answer: form.detail.fixed_answer,
                standard_answer: form.detail.standard_answer,
                reference_answer: form.detail.reference_answer || undefined
            },
            public: form.public,
            status: form.status
        };

  
        // 根据是否有ID判断是新增还是编辑
        if (form.id) {
            await editQuestion(submitData);
            ElMessage.success('更新成功');
        } else {
            await addQuestion(submitData);
            ElMessage.success('创建成功');
        }

        dialogVisible.value = false;
        // 创建成功后重置到第一页
        if (!form.id) {
            query.page = 0;
        }
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
        creator: 'admin',
        type: 1,
        detail: {
            title: '',
            options: ['选项一', '选项二', '选项三', '选项四'],
            fixed_answer: true,
            standard_answer: [],
            reference_answer: ''
        },
        public: true,
        status: 1,
    });
};

// 辅助方法
const getQuestionTypeText = (type: string | number) => {
    // 转换为数字类型处理
    const numericType = typeof type === 'string' ?
        (type === 'single_choice' ? 1 : type === 'multiple_choice' ? 2 : type === 'essay' ? 3 : 1) :
        type;

    const types = {
        1: '单选',
        2: '多选',
        3: '简答'
    };
    return types[numericType as keyof typeof types] || '未知';
};

const getQuestionTypeColor = (type: string | number) => {
    // 转换为数字类型处理
    const numericType = typeof type === 'string' ?
        (type === 'single_choice' ? 1 : type === 'multiple_choice' ? 2 : type === 'essay' ? 3 : 1) :
        type;

    const colors = {
        1: 'primary',
        2: 'success',
        3: 'danger'
    };
    return colors[numericType as keyof typeof colors] || 'info';
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