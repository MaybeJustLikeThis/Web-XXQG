<template>
    <div class="container">
        <div class="handle-box">
            <el-button type="primary" :icon="Plus" @click="handleCreate">新增题目</el-button>
            <el-button type="success" :icon="Upload" @click="handleImport">批量导入</el-button>
            <el-button type="danger" :icon="Delete" @click="handleBatchDelete"
                :disabled="!multipleSelection.length">批量删除</el-button>
            <el-button v-if="permiss.isSuperAdmin" type="warning" :icon="UserFilled" @click="questionAdmin.openDialog()">添加题目管理员</el-button>
            <el-input v-model="query.title" placeholder="题目标题" class="handle-input mr10"
                @keyup.enter="handleSearch"></el-input>
            <el-select v-model="query.type" placeholder="题型" class="handle-select mr10">
                <el-option label="全部" value=""></el-option>
                <el-option label="单选题" value="single_choice"></el-option>
                <el-option label="多选题" value="multiple_choice"></el-option>
                <el-option label="填空题" value="fill_blank"></el-option>
                <el-option label="判断题" value="judge"></el-option>
                <el-option label="简答题" value="essay"></el-option>
            </el-select>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header"
            @selection-change="handleSelectionChange">
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
            <el-table-column label="公开" width="80" align="center">
                <template #default="scope">
                    <el-tag :type="scope.row.public === true ? 'success' : scope.row.public === false ? 'info' : 'warning'">
                        {{ scope.row.public === true ? '公开' : scope.row.public === false ? '私有' : '未知' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
                <template #default="scope">
                    <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button type="info" size="small" @click="handleView(scope.row)">预览</el-button>
                    <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination">
            <el-pagination background layout="total, sizes, prev, pager, next, jumper" :current-page="query.page + 1"
                :page-size="query.pageSize" :page-sizes="[10, 20, 50, 100]" :total="pageTotal"
                @current-change="handlePageChange" @size-change="handleSizeChange"></el-pagination>
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
                            <el-select v-model="form.type" placeholder="请选择题型" style="width: 100%"
                                @change="handleTypeChange">
                                <el-option label="单选题" :value="1"></el-option>
                                <el-option label="多选题" :value="2"></el-option>
                                <el-option label="简答题" :value="3"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item label="是否公开">
                            <el-switch v-model="form.public"></el-switch>
                        </el-form-item>
                    </el-col>
                </el-row>


                <!-- 选择题选项 -->
                <el-form-item v-if="isChoiceQuestion" label="选项配置">
                    <div class="options-container">
                        <div v-for="(option, index) in form.detail.options" :key="index" class="option-item">
                            <span class="option-label">{{ getOptionLabel(index) }}.</span>
                            <el-input v-model="form.detail.options[index]"
                                type="textarea"
                                resize="none"
                                :autosize="{ minRows: 1, maxRows: 4 }"
                                :placeholder="`选项${getOptionLabel(index)}`" />
                            <el-button
                                :icon="Delete"
                                circle
                                :disabled="form.detail.options.length <= MIN_OPTION_COUNT"
                                @click="removeOption(index)" />
                        </div>
                        <el-button
                            type="primary"
                            plain
                            :icon="Plus"
                            :disabled="form.detail.options.length >= MAX_OPTION_COUNT"
                            @click="addOption">
                            添加选项
                        </el-button>
                    </div>
                </el-form-item>

                <!-- 单选题正确答案 -->
                <el-form-item v-if="form.type === 1" label="正确答案">
                    <el-radio-group v-model="form.detail.standard_answer[0]">
                        <el-radio v-for="(option, index) in form.detail.options" :key="index"
                            :label="getOptionLabel(index)">
                            {{ getOptionLabel(index) }}. {{ option }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- 多选题正确答案 -->
                <el-form-item v-if="form.type === 2" label="正确答案">
                    <el-checkbox-group v-model="form.detail.standard_answer">
                        <el-checkbox v-for="(option, index) in form.detail.options" :key="index"
                            :label="getOptionLabel(index)">
                            {{ getOptionLabel(index) }}. {{ option }}
                        </el-checkbox>
                    </el-checkbox-group>
                </el-form-item>

                <!-- 简答题答案 -->
                <el-form-item v-if="form.type === 3" label="正确答案" prop="correctAnswer">
                    <el-input v-model="form.detail.standard_answer[0]" type="textarea" rows="2"
                        placeholder="请输入正确答案"></el-input>
                </el-form-item>

                <el-form-item label="答案解析">
                    <el-input v-model="form.detail.reference_answer" type="textarea" rows="3"
                        placeholder="请输入答案解析（可选）"></el-input>
                </el-form-item>

            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <span>
                        <el-button @click="dialogVisible = false">取 消</el-button>
                        <el-button v-if="!form.id" type="info" @click="handleSaveDraft">保存草稿</el-button>
                        <el-button v-if="!form.id" type="success" plain @click="handleSubmitAndContinue">
                            继续添加题目
                        </el-button>
                        <el-button type="primary" @click="handleSubmit">确 定</el-button>
                    </span>
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
                        <div class="preview-option" :class="{ 'is-correct': option.isCorrect }">
                            {{ option.text }}
                        </div>
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
                        <el-input v-model="reviewForm.reviewComment" type="textarea" rows="4"
                            placeholder="请输入评审意见"></el-input>
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

        <!-- 批量导入弹窗 -->
        <el-dialog v-model="importDialogVisible" title="批量导入题目" width="500px" :close-on-click-modal="false">
            <el-form ref="importFormRef" :model="importForm" label-width="100px">
                <el-form-item label="题目类型" prop="questionType"
                    :rules="[{ required: true, message: '请选择题目类型', trigger: 'change' }]">
                    <el-select v-model="importForm.questionType" placeholder="请选择题目类型" style="width: 100%">
                        <el-option label="单选题" :value="1"></el-option>
                        <el-option label="多选题" :value="2"></el-option>
                        <el-option label="简答题" :value="3"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="是否公开">
                    <el-switch v-model="importForm.isPublic"></el-switch>
                </el-form-item>
                <el-form-item label="上传文件" prop="file"
                    :rules="[{ required: true, message: '请选择要上传的文件', trigger: 'change' }]">
                    <el-upload ref="uploadRef" :auto-upload="false" :show-file-list="true" :limit="1"
                        accept=".xlsx,.xls" :on-change="handleFileChange" :before-upload="beforeUpload"
                        style="width: 100%">
                        <el-button type="primary">选择文件</el-button>
                        <template #tip>
                            <div class="el-upload__tip">
                                <span style="color: #f56c6c;">请上传 .xlsx 或 .xls 格式的 Excel 文件，必须使用下方模板填写</span>
                                <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
                                    <span style="color: #f56c6c;">下载模板：</span>
                                    <el-link type="primary" :underline="false"
                                        @click="handleDownloadTemplate('upload_questions_choice.xls')">
                                        单选题模板
                                    </el-link>
                                    <el-link type="primary" :underline="false"
                                        @click="handleDownloadTemplate('upload_questions_multi_choice.xls')">
                                        多选题模板
                                    </el-link>
                                    <el-link type="primary" :underline="false"
                                        @click="handleDownloadTemplate('upload_questions_qa.xls')">
                                        简答题模板
                                    </el-link>
                                </div>
                            </div>
                        </template>
                    </el-upload>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="importDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="uploading" @click="handleImportSubmit">导入</el-button>
            </template>
        </el-dialog>

        <!-- 批量删除确认弹窗 -->
        <el-dialog v-model="batchDeleteVisible" title="批量删除确认" width="500px" :close-on-click-modal="false">
            <div class="batch-delete-content">
                <el-icon class="warning-icon" size="24" color="#E6A23C">
                    <Warning />
                </el-icon>
                <p>您确定要删除选中的 <strong>{{ multipleSelection.length }}</strong> 道题目吗？</p>
                <p class="warning-text">此操作不可恢复，请谨慎操作！</p>

                <!-- 显示选中题目列表 -->
                <div class="selected-questions" v-if="multipleSelection.length > 0">
                    <h4>选中的题目：</h4>
                    <ul>
                        <li v-for="(item, index) in multipleSelection.slice(0, 10)" :key="item.id">
                            {{ item.detail?.title || item.title }}
                        </li>
                        <li v-if="multipleSelection.length > 10" class="more-items">
                            ... 还有 {{ multipleSelection.length - 10 }} 道题目
                        </li>
                    </ul>
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="batchDeleteVisible = false">取 消</el-button>
                    <el-button type="danger" @click="confirmBatchDelete" :loading="batchDeleting">
                        确认删除 ({{ multipleSelection.length }})
                    </el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 题目管理员弹窗 -->
        <el-dialog v-model="questionAdmin.adminDialogVisible.value" title="题目管理员管理" width="450px" destroy-on-close>
            <el-form label-width="80px">
                <el-form-item label="选择部门">
                    <el-select v-model="questionAdmin.selectedDepartmentId.value" filterable placeholder="请先选择部门" style="width: 100%"
                        @change="questionAdmin.handleDepartmentChange">
                        <el-option v-for="dept in questionAdmin.allDepartments.value" :key="dept.id" :label="dept.name" :value="dept.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="选择用户">
                    <el-select v-model="questionAdmin.adminUserId.value" filterable placeholder="请搜索用户姓名" style="width: 100%"
                        :disabled="!questionAdmin.selectedDepartmentId.value">
                        <el-option v-for="user in questionAdmin.departmentUsers.value" :key="user.id" :label="user.name" :value="user.id" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="questionAdmin.closeDialog()">关闭</el-button>
                <el-button type="success" @click="questionAdmin.handleGrant()">授权</el-button>
                <el-button type="danger" @click="questionAdmin.handleRevoke()">撤销</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="question-questions">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search, Upload, Warning, UserFilled } from '@element-plus/icons-vue';
import type { QuestionQuery } from '@/types/question';
import { getAllQuestions, addQuestion, editQuestion, deleteQuestion, addQuestionsByFile } from '@/api/question';
import { grantQuestionEdit, revokeQuestionEdit } from '@/api/user';
import { downloadTemplate } from '@/utils/download';
import { transformQuestionData } from '@/types/question';
import { usePermissStore } from '@/store/permiss';
import { useAdminDialog } from '@/composables/useAdminDialog';
import { showError, getErrorMessage } from '@/utils/errorHandler';

const permiss = usePermissStore();

// 题目管理员弹窗
const questionAdmin = useAdminDialog({
    grantFn: grantQuestionEdit,
    revokeFn: revokeQuestionEdit,
    permissionName: '题目管理员',
});

// 查询参数
const query = reactive<QuestionQuery>({
    page: 0,
    pageSize: 10,
    title: '',
    type: undefined,
});

// 存储所有题目数据（用于客户端分页）
const allQuestionsData = ref<any[]>([]);
const QUESTION_FETCH_SIZE = 10000;

// 表格数据
const tableData = ref<any[]>([]);
const pageTotal = ref(0);

// 弹窗控制
const dialogVisible = ref(false);
const previewVisible = ref(false);
const reviewVisible = ref(false);
const dialogTitle = ref('新增题目');
const formRef = ref();
const MIN_OPTION_COUNT = 2;
const MAX_OPTION_COUNT = 26;
const DEFAULT_OPTION_COUNT = 4;

const getOptionLabel = (index: number) => String.fromCharCode(65 + index);
const getOptionIndex = (label: string) => label.charCodeAt(0) - 65;
const createDefaultOptions = (count = DEFAULT_OPTION_COUNT) =>
    Array.from({ length: Math.min(Math.max(count, MIN_OPTION_COUNT), MAX_OPTION_COUNT) }, (_, index) => `选项${getOptionLabel(index)}`);
const createEmptyOptions = (count = DEFAULT_OPTION_COUNT) =>
    Array.from({ length: Math.min(Math.max(count, MIN_OPTION_COUNT), MAX_OPTION_COUNT) }, () => '');
const normalizeOptions = (options?: string[], fallbackCount = DEFAULT_OPTION_COUNT) => {
    const normalized = options?.length ? options.slice(0, MAX_OPTION_COUNT) : createDefaultOptions(fallbackCount);
    while (normalized.length < MIN_OPTION_COUNT) {
        normalized.push('');
    }
    return normalized;
};
const buildPreviewOptions = (detail: any, type: string | number) => {
    const numericType = normalizeQuestionType(type);
    if (numericType === 3) return [];

    const answers = detail?.standard_answer || [];
    return normalizeOptions(detail?.options).map((option, index) => {
        const label = getOptionLabel(index);
        return {
            id: label,
            text: `${label}. ${option || `选项${label}`}`,
            isCorrect: answers.includes(label),
        };
    });
};
const formatCorrectAnswer = (detail: any, type: string | number) => {
    const answers = detail?.standard_answer || [];
    if (normalizeQuestionType(type) === 2) {
        return answers.join('、');
    }
    return answers[0] || '';
};
const normalizeQuestionType = (type: string | number) => {
    if (typeof type !== 'string') return type;
    if (type === 'single_choice') return 1;
    if (type === 'multiple_choice') return 2;
    return 3;
};

// 表单数据
const form = reactive({
    id: '',
    creator: 'admin',
    type: 1,
    detail: {
        title: '',
        options: createDefaultOptions(),
        fixed_answer: true,
        standard_answer: [],
        reference_answer: ''
    },
    public: true,
    publicFieldKnown: true,
    status: 1,
});

// 表单验证规则
const rules = computed(() => {
    const baseRules = {
        'detail.title': [{ required: true, message: '请输入题目标题', trigger: 'blur' }],
        type: [{ required: true, message: '请选择题型', trigger: 'change' }],
    };

    // 选择题需要验证答案
    if (isChoiceQuestion.value) {
        return {
            ...baseRules,
            'detail.standard_answer': [
                {
                    required: true,
                    validator: (rule: any, value: any, callback: any) => {
                        if (!value || (Array.isArray(value) && value.length === 0)) {
                            callback(new Error('请选择正确答案'));
                        } else {
                            callback();
                        }
                    },
                    trigger: 'change'
                }
            ],
            'detail.options': [
                {
                    required: true,
                    validator: (rule: any, value: any, callback: any) => {
                        if (!value || !Array.isArray(value) || value.length < 2) {
                            callback(new Error('至少需要2个选项'));
                        } else if (value.some((opt: string) => !opt || !opt.trim())) {
                            callback(new Error('所有选项都不能为空'));
                        } else {
                            callback();
                        }
                    },
                    trigger: 'blur'
                }
            ]
        };
    }

    // 简答题需要验证答案内容
    return {
        ...baseRules,
        'detail.standard_answer': [
            {
                required: true,
                validator: (rule: any, value: any, callback: any) => {
                    if (!value || !Array.isArray(value) || value.length === 0 || !value[0] || !value[0].trim()) {
                        callback(new Error('请输入正确答案'));
                    } else {
                        callback();
                    }
                },
                trigger: 'blur'
            }
        ]
    };
});

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

// 批量导入相关
const importDialogVisible = ref(false);
const importFormRef = ref();
const uploadRef = ref();
const uploading = ref(false);
const fileList = ref([]);
const importForm = reactive({
    questionType: null as number | null,
    isPublic: true,
    file: null as File | null
});

const handleDownloadTemplate = async (fileName: string) => {
    try {
        await downloadTemplate(fileName);
    } catch (error: any) {
        showError(error, "模板下载失败");
    }
};

// 批量删除相关
const multipleSelection = ref<any[]>([]);
const batchDeleteVisible = ref(false);
const batchDeleting = ref(false);

// 计算属性
const isChoiceQuestion = computed(() => {
    return form.type === 1 || form.type === 2;
});

const getQueryTypeValue = () => {
    if (!query.type) return undefined;
    return normalizeQuestionType(query.type);
};

const buildQuestionTableRow = (item: any) => {
    const transformedData = transformQuestionData(item);

    return {
        ...transformedData,
        originalData: item,
        title: transformedData.detail.title,
        type: transformedData.type,
        typeText: getQuestionTypeText(transformedData.type),
        difficulty: 'medium',
        status: transformedData.status,
        statusText: transformedData.status === 1 ? 'active' : 'inactive',
        content: transformedData.detail.title,
        options: buildPreviewOptions(transformedData.detail, transformedData.type),
        correctAnswer: formatCorrectAnswer(transformedData.detail, transformedData.type),
        explanation: transformedData.detail.reference_answer || '',
        points: 10,
        fixed_answer: transformedData.detail.fixed_answer,
        answered: false,
        creatorId: transformedData.creator,
        createTime: '',
        updateTime: '',
    };
};

const getFilteredQuestions = () => {
    const keyword = query.title?.trim().toLowerCase();
    const selectedType = getQueryTypeValue();

    return allQuestionsData.value.filter((item: any) => {
        const title = (item.detail?.title || item.title || '').toLowerCase();
        const matchesTitle = !keyword || title.includes(keyword);
        const matchesType = !selectedType || item.type === selectedType;
        return matchesTitle && matchesType;
    });
};

// 获取题目列表
const getQuestions = async () => {
    try {
        // ?? admin ??????????????????????????????
        const params = {
            page: 0,
            size: QUESTION_FETCH_SIZE
        };

        const res = await getAllQuestions(params);

        if (res.data && res.data.code === 200) {
            const apiData = res.data.data;
            let rawQuestions: any[] = [];

            if (Array.isArray(apiData)) {
                rawQuestions = apiData;
            } else if (apiData && apiData.list && Array.isArray(apiData.list)) {
                rawQuestions = apiData.list;
            } else {
                throw new Error('API?????????');
            }

            allQuestionsData.value = rawQuestions.map(buildQuestionTableRow);
            applyClientPagination();
        } else {
            throw new Error('API?????????');
        }
    } catch (error) {
        showError(error, '????????');
        console.error('????????:', error);

        allQuestionsData.value = [];
        tableData.value = [];
        pageTotal.value = 0;
    }
};

// 搜索
const handleSearch = async () => {
    query.page = 0; // 重置到第一页
    if (allQuestionsData.value.length > 0) {
        applyClientPagination();
    } else {
        await getQuestions();
    }
};

// 分页切换
const handlePageChange = (val: number) => {
    query.page = val - 1; // 前端分页从1开始，后端从0开始
    applyClientPagination();
};

// 客户端分页处理
const applyClientPagination = () => {
    const filteredQuestions = getFilteredQuestions();
    const startIndex = query.page * query.pageSize;
    const endIndex = startIndex + query.pageSize;
    tableData.value = filteredQuestions.slice(startIndex, endIndex);
    pageTotal.value = filteredQuestions.length;
};

// 分页大小切换
const handleSizeChange = async (val: number) => {
    query.pageSize = val;
    query.page = 0; // 重置到第一页
    applyClientPagination();
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
        const normalizedData = transformQuestionData(originalData);

        // 将数据赋值给form对象，使用新的数据结构
        form.id = normalizedData.id;
        form.creator = normalizedData.creator || 'admin';
        // 确保type是数字格式
        form.type = normalizedData.type;

        // 更新详情数据 - 直接从原始数据获取
        form.detail = {
            title: normalizedData.detail.title,
            options: normalizeOptions(normalizedData.detail.options),
            fixed_answer: normalizedData.detail.fixed_answer,
            standard_answer: keepAnswerFormat(normalizedData.detail.standard_answer || []),
            reference_answer: normalizedData.detail.reference_answer || ''
        };

        form.publicFieldKnown = typeof normalizedData.public === 'boolean';
        form.public = normalizedData.public ?? true;
        form.status = normalizedData.status;

        // 确保选择题有选项
        if (isChoiceQuestion.value && (!form.detail.options || form.detail.options.length === 0)) {
            form.detail.options = createDefaultOptions();
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
        options: buildPreviewOptions(row.detail, row.type),
        correctAnswer: formatCorrectAnswer(row.detail, row.type),
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
        options: buildPreviewOptions(row.detail, row.type),
        correctAnswer: formatCorrectAnswer(row.detail, row.type),
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

        // 调用删除API
        await deleteQuestion(row.id);

        ElMessage.success('删除成功');
        await getQuestions();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除题目失败:', error);
            showError(error, '删除失败');
        }
    }
};

// 表格选择变化处理
const handleSelectionChange = (selection: any[]) => {
    multipleSelection.value = selection;
};

// 批量删除按钮点击处理
const handleBatchDelete = () => {
    if (multipleSelection.value.length === 0) {
        ElMessage.warning('请先选择要删除的题目');
        return;
    }
    batchDeleteVisible.value = true;
};

// 确认批量删除
const confirmBatchDelete = async () => {
    if (multipleSelection.value.length === 0) {
        ElMessage.warning('请先选择要删除的题目');
        return;
    }

    // 再次确认
    try {
        await ElMessageBox.confirm(
            `即将删除 ${multipleSelection.value.length} 道题目，此操作不可恢复！\n是否继续？`,
            '最后确认',
            {
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                type: 'error',
                confirmButtonClass: 'el-button--danger'
            }
        );
    } catch (error) {
        return; // 用户取消
    }

    batchDeleting.value = true;
    const totalToDelete = multipleSelection.value.length;
    let successCount = 0;
    let failCount = 0;
    const failedItems: string[] = [];

    try {
        // 逐个删除题目，调用单个删除接口
        for (let i = 0; i < multipleSelection.value.length; i++) {
            const item = multipleSelection.value[i];
            try {
                await deleteQuestion(item.id);
                successCount++;
            } catch (error) {
                failCount++;
                failedItems.push(item.detail?.title || item.title);
                console.error(`删除题目失败 (ID: ${item.id}):`, error);
            }
        }

        // 显示删除结果
        if (failCount === 0) {
            ElMessage.success(`成功删除 ${successCount} 道题目`);
        } else if (successCount === 0) {
            ElMessage.error(`删除失败，未能删除任何题目`);
        } else {
            ElMessage.warning(`删除完成：成功 ${successCount} 道题目，失败 ${failCount} 道题目`);
            if (failedItems.length > 0) {
            }
        }

        // 关闭弹窗并刷新列表
        batchDeleteVisible.value = false;
        await getQuestions();

    } catch (error) {
        console.error('批量删除过程中发生错误:', error);
        showError(error, '批量删除过程中发生错误，请重试');
    } finally {
        batchDeleting.value = false;
    }
};

// 题型变化处理
const handleTypeChange = (type: number) => {
    // 重置答案和选项
    form.type = type;
    form.detail.standard_answer = [];

    if (type === 1 || type === 2) { // 单选题或多选题
        form.detail.options = createDefaultOptions();
        form.detail.fixed_answer = true;
    } else { // 简答题
        form.detail.options = [];
        form.detail.fixed_answer = false;
    }
};

const addOption = () => {
    if (form.detail.options.length >= MAX_OPTION_COUNT) {
        ElMessage.warning('选项最多添加到 Z');
        return;
    }
    form.detail.options.push('');
};

const removeOption = (index: number) => {
    if (form.detail.options.length <= MIN_OPTION_COUNT) return;

    form.detail.options.splice(index, 1);
    form.detail.standard_answer = form.detail.standard_answer
        .map((answer: string) => {
            const answerIndex = getOptionIndex(answer);
            if (answerIndex === index) return '';
            return answerIndex > index ? getOptionLabel(answerIndex - 1) : answer;
        })
        .filter(Boolean);
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

const handleSubmitAndContinue = () => {
    form.status = 1;
    submitForm(true);
};

// 提交表单逻辑
const submitForm = async (continueAdding = false) => {
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

        // 确保标准答案格式正确
        let standard_answer = form.detail.standard_answer;

        // 对于单选题，确保只有一个答案
        if (form.type === 1 && Array.isArray(standard_answer)) {
            standard_answer = standard_answer.length > 0 ? [standard_answer[0]] : [];
        }

        // 对于多选题，确保答案去重
        if (form.type === 2 && Array.isArray(standard_answer)) {
            standard_answer = [...new Set(standard_answer)];
        }

        // 构造提交数据，符合API要求的数据结构
        const submitData: any = {
            type: form.type,
            detail: {
                title: form.detail.title,
                options: form.detail.options,
                fixed_answer: form.detail.fixed_answer,
                standard_answer: standard_answer,
                reference_answer: form.detail.reference_answer || undefined
            },
            status: form.status
        };

        if (!form.id || form.publicFieldKnown) {
            submitData.public = form.public;
        }

        // 只有编辑时才添加id字段
        if (form.id) {
            submitData.id = parseInt(form.id);
        }


        // 根据是否有ID判断是新增还是编辑
        if (form.id) {
            await editQuestion(submitData);
            ElMessage.success('更新成功');
        } else {
            await addQuestion(submitData);
            ElMessage.success('创建成功');
        }

        if (continueAdding && !form.id) {
            resetFormKeepTypeAndOptionCount();
            await nextTick();
            formRef.value?.clearValidate?.();
        } else {
            dialogVisible.value = false;
        }
        // 创建成功后重置到第一页
        if (!form.id) {
            query.page = 0;
        }
        await getQuestions();
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('提交失败:', error);
            // 显示更详细的错误信息
            const errorMessage = getErrorMessage(error, '操作失败');
            ElMessage.error(form.id ? `更新失败: ${errorMessage}` : `创建失败: ${errorMessage}`);
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
            options: createDefaultOptions(),
            fixed_answer: true,
            standard_answer: [],
            reference_answer: ''
        },
        public: true,
        publicFieldKnown: true,
        status: 1,
    });
};

const resetFormKeepTypeAndOptionCount = () => {
    const currentType = form.type;
    const optionCount = isChoiceQuestion.value ? form.detail.options.length : DEFAULT_OPTION_COUNT;

    Object.assign(form, {
        id: '',
        creator: 'admin',
        type: currentType,
        detail: {
            title: '',
            options: currentType === 1 || currentType === 2 ? createEmptyOptions(optionCount) : [],
            fixed_answer: currentType === 1 || currentType === 2,
            standard_answer: [],
            reference_answer: ''
        },
        public: true,
        publicFieldKnown: true,
        status: 1,
    });
};

// 批量导入相关方法
const handleImport = () => {
    importDialogVisible.value = true;
    resetImportForm();
};

const resetImportForm = () => {
    Object.assign(importForm, {
        questionType: null,
        isPublic: true,
        file: null
    });
    fileList.value = [];
};

const handleFileChange = (uploadFile: any) => {
    fileList.value = [uploadFile];
    importForm.file = uploadFile.raw || uploadFile;
};

const beforeUpload = (uploadFile: any) => {
    const isExcel = uploadFile.type === 'application/vnd.ms-excel' ||
        uploadFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (!isExcel) {
        ElMessage.error('只能上传 Excel 文件!');
        return false;
    }
    return true;
};

const handleImportSubmit = async () => {
    if (!importFormRef.value) return;

    try {
        await importFormRef.value.validate();

        if (!importForm.questionType) {
            ElMessage.error('请选择题目类型');
            return;
        }

        if (!importForm.file) {
            ElMessage.error('请选择要上传的文件');
            return;
        }

        uploading.value = true;

        const response = await addQuestionsByFile(importForm.file, importForm.questionType, importForm.isPublic);

        // 检查响应类型，如果是JSON错误响应则处理错误
        if (response.data instanceof Blob && response.data.type === 'application/json') {
            const errorText = await response.data.text();
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.message || '服务器返回错误');
        }

        // 直接下载返回的文件（无论成功或失败）
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `批量导入结果_${new Date().toLocaleDateString()}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // 检查导入结果并显示相应消息
        const importSuccess = response.headers['x-import-success'] || response.headers['X-Import-Success'];

        if (importSuccess === 'true' || importSuccess === true) {
            ElMessage.success('批量导入成功，处理结果已下载');
            await getQuestions(); // 刷新题目列表
        } else {
            ElMessage.warning('导入处理完成，请查看下载的结果文件了解详情');
        }

        importDialogVisible.value = false;
        resetImportForm();
    } catch (error: any) {
        console.error('批量导入失败:', error);

        // 尝试从错误响应中提取详细错误信息
        let errorMessage = '文件上传失败，请重试';
        if (error.response?.data instanceof Blob) {
            try {
                const errorText = await error.response.data.text();
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (parseError) {
                console.error('解析错误响应失败:', parseError);
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        ElMessage.error(errorMessage);
    } finally {
        uploading.value = false;
    }
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
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 10px;
}

.option-label {
    flex: 0 0 28px;
    padding-top: 6px;
    color: #606266;
    font-weight: 500;
    text-align: right;
}

.option-item .el-textarea {
    flex: 1;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    width: 100%;
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

.preview-option {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: #fff;
    color: #606266;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.preview-option.is-correct {
    border-color: #b3e19d;
    background: #f0f9eb;
    color: #529b2e;
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

.batch-delete-content {
    text-align: center;
    padding: 20px 0;
}

.warning-icon {
    margin-bottom: 16px;
}

.batch-delete-content p {
    margin: 10px 0;
    font-size: 16px;
}

.warning-text {
    color: #E6A23C;
    font-weight: bold;
}

.selected-questions {
    margin-top: 20px;
    text-align: left;
    background: #f5f7fa;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
}

.selected-questions h4 {
    margin: 0 0 10px 0;
    color: #303133;
    font-size: 14px;
}

.selected-questions ul {
    margin: 0;
    padding-left: 20px;
    list-style-type: decimal;
}

.selected-questions li {
    margin: 5px 0;
    color: #606266;
    font-size: 13px;
    line-height: 1.4;
}

.selected-questions .more-items {
    color: #909399;
    font-style: italic;
}
</style>
