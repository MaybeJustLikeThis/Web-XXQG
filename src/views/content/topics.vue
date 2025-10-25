<template>
    <div class="container">
        <div class="handle-box">
            <el-button type="primary" :icon="Plus" @click="handleCreate">新增专题</el-button>
            <el-input v-model="query.name" placeholder="专题名称" class="handle-input mr10" @keyup.enter="handleSearch"></el-input>
            <el-select v-model="query.status" placeholder="状态" class="handle-select mr10">
                <el-option label="全部" value=""></el-option>
                <el-option label="活跃" value="active"></el-option>
                <el-option label="已过期" value="expired"></el-option>
                <el-option label="已隐藏" value="hidden"></el-option>
            </el-select>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header">
            <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
            <el-table-column prop="name" label="专题名称" show-overflow-tooltip></el-table-column>
            <el-table-column prop="creator" label="创建者" width="100" align="center"></el-table-column>
            <el-table-column label="文章数量" width="100" align="center">
                <template #default="scope">
                    {{ scope.row.texts?.length || 0 }}
                </template>
            </el-table-column>
            <el-table-column label="题目数量" width="100" align="center">
                <template #default="scope">
                    {{ scope.row.question_list?.length || 0 }}
                </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="scope">
                    <el-tag :type="statusType(scope.row.status)">
                        {{ statusText(scope.row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="有效期" width="200" align="center">
                <template #default="scope">
                    <div v-if="scope.row.begin_time || scope.row.end_time">
                        <div v-if="scope.row.begin_time">开始：{{ scope.row.begin_time }}</div>
                        <div v-if="scope.row.end_time">结束：{{ scope.row.end_time }}</div>
                    </div>
                    <span v-else class="text-muted">未设置</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center">
                <template #default="scope">
                    <el-button type="primary" :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button type="info" :icon="Document" @click="handleManageArticles(scope.row)">管理文章</el-button>
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
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="50%" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="专题名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入专题名称"></el-input>
                </el-form-item>
                <el-form-item label="有效期设置">
                    <el-date-picker
                        v-model="dateRange"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        @change="handleDateChange"
                    />
                </el-form-item>
                <el-form-item label="专题状态">
                    <el-radio-group v-model="form.status">
                        <el-radio :label="0">未开始</el-radio>
                        <el-radio :label="1">进行中</el-radio>
                        <el-radio :label="2">已过期</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="handleSubmit">确 定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 文章管理弹窗 -->
        <!-- 专题内容管理弹窗 -->
        <el-dialog title="专题内容管理" v-model="articleDialogVisible" width="90%" destroy-on-close>
            <el-tabs v-model="activeTab" type="border-card">
                <!-- 文章管理 -->
                <el-tab-pane label="文章管理" name="articles">
                    <div class="article-management">
                        <el-row :gutter="20">
                            <!-- 左侧：可选文章列表 -->
                            <el-col :span="12">
                                <el-card header="可选文章">
                                    <el-input v-model="articleSearch" placeholder="搜索文章" class="mb10" @keyup.enter="searchArticles"></el-input>
                                    <el-table
                                        :data="availableArticles"
                                        @selection-change="handleSelectionChange"
                                        max-height="400"
                                    >
                                        <el-table-column type="selection" width="55"></el-table-column>
                                        <el-table-column prop="title" label="标题" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="status" label="状态" width="80">
                                            <template #default="scope">
                                                <el-tag size="small" :type="articleStatusType(scope.row.status)">
                                                    {{ articleStatusText(scope.row.status) }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </el-card>
                            </el-col>

                            <!-- 右侧：已选文章管理 -->
                            <el-col :span="12">
                                <el-card header="专题文章">
                                    <div class="article-actions">
                                        <el-button type="primary" size="small" @click="addSelectedArticles">添加选中文章</el-button>
                                        <el-button type="success" size="small" @click="saveArticleOrder">保存排序</el-button>
                                    </div>
                                    <el-table :data="topicArticles" row-key="id" max-height="400">
                                        <el-table-column prop="title" label="标题" show-overflow-tooltip></el-table-column>
                                        <el-table-column label="置顶" width="80" align="center">
                                            <template #default="scope">
                                                <el-switch
                                                    v-model="scope.row.isPinned"
                                                    @change="handlePinChange(scope.row)"
                                                ></el-switch>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="操作" width="80" align="center">
                                            <template #default="scope">
                                                <el-button type="danger" size="small" @click="removeArticle(scope.row)">移除</el-button>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </el-card>
                            </el-col>
                        </el-row>
                    </div>
                </el-tab-pane>

                <!-- 题目管理 -->
                <el-tab-pane label="题目管理" name="questions">
                    <div class="question-management">
                        <el-row :gutter="20">
                            <!-- 左侧：可选题目列表 -->
                            <el-col :span="12">
                                <el-card header="可选题目">
                                    <div class="mb10">
                                        <el-input v-model="questionSearch" placeholder="搜索题目" @keyup.enter="searchQuestions"></el-input>
                                        <div class="filter-bar">
                                            <el-select v-model="questionFilter.type" placeholder="题型" size="small" style="width: 100px; margin-right: 5px;">
                                                <el-option label="全部" value=""></el-option>
                                                <el-option label="单选" value="single_choice"></el-option>
                                                <el-option label="多选" value="multiple_choice"></el-option>
                                                <el-option label="填空" value="fill_blank"></el-option>
                                                <el-option label="判断" value="judge"></el-option>
                                                <el-option label="简答" value="essay"></el-option>
                                            </el-select>
                                            <el-select v-model="questionFilter.difficulty" placeholder="难度" size="small" style="width: 80px;">
                                                <el-option label="全部" value=""></el-option>
                                                <el-option label="简单" value="easy"></el-option>
                                                <el-option label="中等" value="medium"></el-option>
                                                <el-option label="困难" value="hard"></el-option>
                                            </el-select>
                                        </div>
                                    </div>
                                    <el-table
                                        :data="availableQuestions"
                                        @selection-change="handleQuestionSelectionChange"
                                        max-height="400"
                                    >
                                        <el-table-column type="selection" width="55"></el-table-column>
                                        <el-table-column prop="title" label="题目标题" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="type" label="题型" width="80" align="center">
                                            <template #default="scope">
                                                <el-tag size="small" :type="getQuestionTypeColor(scope.row.type)">
                                                    {{ getQuestionTypeText(scope.row.type) }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="difficulty" label="难度" width="70" align="center">
                                            <template #default="scope">
                                                <el-tag size="small" :type="getDifficultyColor(scope.row.difficulty)">
                                                    {{ getDifficultyText(scope.row.difficulty) }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="points" label="分值" width="60" align="center"></el-table-column>
                                    </el-table>
                                </el-card>
                            </el-col>

                            <!-- 右侧：已选题目配置 -->
                            <el-col :span="12">
                                <el-card header="专题题目">
                                    <div class="question-actions">
                                        <el-button type="primary" size="small" @click="addSelectedQuestions">添加选中题目</el-button>
                                        <el-button type="warning" size="small" @click="configureScoringStrategy">配置积分策略</el-button>
                                        <el-button type="info" size="small" @click="removeAllQuestions">清空所有</el-button>
                                    </div>
                                    <el-table :data="topicQuestions" max-height="400">
                                        <el-table-column prop="title" label="题目标题" show-overflow-tooltip></el-table-column>
                                        <el-table-column prop="type" label="题型" width="80" align="center">
                                            <template #default="scope">
                                                <el-tag size="small" :type="getQuestionTypeColor(scope.row.type)">
                                                    {{ getQuestionTypeText(scope.row.type) }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="points" label="分值" width="60" align="center"></el-table-column>
                                        <el-table-column label="操作" width="80" align="center">
                                            <template #default="scope">
                                                <el-button type="danger" size="small" @click="removeQuestion(scope)">移除</el-button>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </el-card>
                            </el-col>
                        </el-row>
                    </div>
                </el-tab-pane>
            </el-tabs>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="articleDialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="saveTopicContent">保 存</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 积分策略配置弹窗 -->
        <el-dialog title="积分策略配置" v-model="scoringDialogVisible" width="60%">
            <el-form :model="scoringForm" label-width="120px">
                <el-form-item label="正确得分">
                    <el-input-number v-model="scoringForm.correctPoints" :min="0" :max="100"></el-input-number>
                    <span class="ml5">分</span>
                </el-form-item>
                <el-form-item label="错误扣分">
                    <el-input-number v-model="scoringForm.wrongPoints" :min="-100" :max="0"></el-input-number>
                    <span class="ml5">分</span>
                </el-form-item>
                <el-form-item label="时间奖励">
                    <el-switch v-model="scoringForm.timeBonus" active-text="启用" inactive-text="禁用"></el-switch>
                    <div class="form-tip">启用后，答题速度越快获得的奖励分值越高</div>
                </el-form-item>
                <el-form-item label="每日挑战限制">
                    <el-input-number v-model="scoringForm.dailyLimit" :min="0" :max="100"></el-input-number>
                    <span class="ml5">次（0表示不限制）</span>
                </el-form-item>
                <el-form-item label="时间窗口">
                    <el-date-picker
                        v-model="scoringTimeRange"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                    />
                    <div class="form-tip">设置专题挑战的有效时间范围</div>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="scoringDialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="saveScoringStrategy">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="topics">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search, Document } from '@element-plus/icons-vue';
import type { Topic, TopicQuery, Article } from '@/types/content';
import type { Question, TopicQuestionConfig } from '@/types/question';
import { getSubjects } from '@/api/subject';

// 查询参数
const query = reactive<TopicQuery>({
    page: 1,
    pageSize: 10,
    name: '',
    status: undefined,
});

// 表格数据
const tableData = ref<Topic[]>([]);
const pageTotal = ref(0);

// 弹窗控制
const dialogVisible = ref(false);
const articleDialogVisible = ref(false);
const dialogTitle = ref('新增专题');
const formRef = ref();

// 表单数据
const form = reactive<Topic>({
    id: '',
    name: '',
    description: '',
    cover: '',
    articleIds: [],
    pinnedArticles: [],
    status: 1, // 默认进行中
    startTime: '',
    endTime: '',
    createTime: '',
    updateTime: '',
});

// 表单验证规则
const rules = {
    name: [{ required: true, message: '请输入专题名称', trigger: 'blur' }],
};


// 日期范围
const dateRange = ref<[string, string]>(['', '']);

// 文章管理相关
const currentTopic = ref<Topic | null>(null);
const articleSearch = ref('');
const availableArticles = ref<Article[]>([]);
const selectedArticles = ref<Article[]>([]);
const topicArticles = ref<(Article & { isPinned: boolean })[]>([]);

// 题目管理相关
const activeTab = ref('articles');
const questionSearch = ref('');
const availableQuestions = ref<Question[]>([]);
const selectedQuestions = ref<Question[]>([]);
const topicQuestions = ref<Question[]>([]);

// 积分策略相关
const scoringDialogVisible = ref(false);
const scoringForm = reactive({
    correctPoints: 10,
    wrongPoints: 0,
    timeBonus: true,
    dailyLimit: 3
});
const scoringTimeRange = ref<[string, string]>(['', '']);

// 专题题目配置
const topicQuestionConfig = ref<TopicQuestionConfig | null>(null);

// 题目筛选条件
const questionFilter = reactive({
    type: '',
    difficulty: ''
});

// 获取专题列表
const getTopics = async () => {
    try {
        const res = await getSubjects();

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            // 将API数据转换为前端需要的格式
            const topics = res.data.data.map((item: any) => ({
                id: item.id.toString(),
                name: item.name,
                description: '', // API没有返回描述字段
                creator: item.creator,
                creator_id: item.creator_id,
                texts: item.texts || [],
                question_list: item.question_list || [],
                status: item.status, // 直接使用API返回的状态（0:未开始，1:进行中，2:已过期）
                begin_time: item.begin_time,
                end_time: item.end_time,
                // 兼容原有字段
                articleIds: item.texts?.map(text => text.id.toString()) || [],
                pinnedArticles: [], // API没有返回置顶信息
                startTime: item.begin_time,
                endTime: item.end_time,
                createTime: '', // API没有返回创建时间
                updateTime: '', // API没有返回更新时间
            }));

            // 根据查询条件过滤数据
            let filteredData = topics.filter((topic: any) => {
                if (query.name && !topic.name.includes(query.name)) return false;
                if (query.status && topic.status !== query.status) return false;
                return true;
            });

            tableData.value = filteredData;
            pageTotal.value = filteredData.length;
        } else {
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        ElMessage.error('获取专题列表失败');
        console.error('获取专题列表错误:', error);

        // 开发阶段使用模拟数据作为fallback
        const mockData = [
            {
                id: '1',
                name: '10月专项学习',
                creator: '研发部',
                creator_id: 1,
                texts: [
                    { id: 2, title: '深入学习贯彻党的二十大精神', is_read: false },
                    { id: 3, title: '这是第二个文章的标题', is_read: false }
                ],
                question_list: [
                    { id: 36, title: '下列哪个是正确的？1', options: ['选项一', '选项二', '选项三', '选项四'], type: 1, fixed_answer: true, answered: false },
                    { id: 37, title: '下列哪些是正确的？13', options: ['选项一', '选项二', '选项三', '选项四'], type: 2, fixed_answer: true, answered: false }
                ],
                status: 1,
                begin_time: '2025-05-19 22:53:37',
                end_time: '2025-12-19 22:53:47',
                articleIds: ['2', '3'],
                pinnedArticles: [],
            },
        ];

        // 根据查询条件过滤模拟数据
        let filteredData = mockData.filter((topic: any) => {
            if (query.name && !topic.name.includes(query.name)) return false;
            if (query.status && topic.status !== query.status) return false;
            return true;
        });

        tableData.value = filteredData;
        pageTotal.value = filteredData.length;
    }
};

// 获取可选文章列表
const getAvailableArticles = () => {
    // 模拟文章数据
    const mockArticles: Article[] = [
        {
            id: '1',
            title: 'Vue3 基础教程',
            content: '',
            summary: 'Vue3基础教程',
            cover: '',
            tags: ['Vue3'],
            status: 'published',
            author: 'admin',
            publishTime: '2024-01-01 10:00:00',
            updateTime: '2024-01-01 10:00:00',
            viewCount: 1500,
        },
        {
            id: '2',
            title: 'Vue3 Composition API',
            content: '',
            summary: 'Composition API详解',
            cover: '',
            tags: ['Vue3', 'Composition API'],
            status: 'published',
            author: 'admin',
            publishTime: '2024-01-02 10:00:00',
            updateTime: '2024-01-02 10:00:00',
            viewCount: 800,
        },
    ];

    availableArticles.value = mockArticles.filter(article =>
        !currentTopic.value?.articleIds.includes(article.id)
    );
};

// 获取可选题目列表
const getAvailableQuestions = () => {
    // 模拟题目数据
    const mockQuestions: Question[] = [
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
            status: 'active',
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
    let filteredData = mockQuestions.filter(question => {
        if (questionSearch.value && !question.title.includes(questionSearch.value)) return false;
        if (questionFilter.type && question.type !== questionFilter.type) return false;
        if (questionFilter.difficulty && question.difficulty !== questionFilter.difficulty) return false;
        // 过滤掉已选择的题目
        if (topicQuestions.value.find(tq => tq.id === question.id)) return false;
        return true;
    });

    availableQuestions.value = filteredData;
};

// 搜索
const handleSearch = async () => {
    query.page = 1;
    await getTopics();
};

// 分页切换
const handlePageChange = async (val: number) => {
    query.page = val;
    await getTopics();
};

// 新增专题
const handleCreate = () => {
    dialogTitle.value = '新增专题';
    dialogVisible.value = true;
    resetForm();
};

// 编辑专题
const handleEdit = (row: Topic) => {
    dialogTitle.value = '编辑专题';
    dialogVisible.value = true;
    Object.assign(form, row);

    // 设置日期范围
    if (row.startTime && row.endTime) {
        dateRange.value = [row.startTime, row.endTime];
    } else {
        dateRange.value = ['', ''];
    }
};

// 删除专题
const handleDelete = async (row: Topic) => {
    try {
        await ElMessageBox.confirm('确定要删除这个专题吗？', '提示', {
            type: 'warning',
        });

        // TODO: 这里应该调用删除API
        // await deleteSubject(row.id);

        ElMessage.success('删除成功');
        await getTopics();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
        }
    }
};

// 管理文章
const handleManageArticles = (row: any) => {
    currentTopic.value = row;
    articleDialogVisible.value = true;
    activeTab.value = 'articles';

    // 设置已选文章 - 使用新的texts数据
    topicArticles.value = row.texts?.map((text: any) => {
        return {
            id: text.id.toString(),
            title: text.title,
            content: '',
            summary: '',
            cover: '',
            tags: [],
            status: text.is_read ? 'read' : 'unread', // 根据阅读状态设置
            author: '',
            publishTime: '',
            updateTime: '',
            viewCount: 0,
            isPinned: false, // API没有返回置顶信息
        };
    }) || [];

    // 设置已选题目 - 使用新的question_list数据
    topicQuestions.value = row.question_list?.map((question: any) => {
        return {
            id: question.id.toString(),
            title: question.title,
            type: question.type === 1 ? 'single_choice' : question.type === 2 ? 'multiple_choice' : 'essay',
            difficulty: 'medium', // API没有返回难度信息
            status: question.answered ? 'answered' : 'unanswered',
            content: question.title,
            options: question.options?.map((option: string, index: number) => ({
                id: (index + 1).toString(),
                text: option,
                isCorrect: false // API没有返回正确答案
            })) || [],
            correctAnswer: '',
            explanation: '',
            points: 10, // 默认分值
            creatorId: '',
            createTime: '',
            updateTime: ''
        };
    }) || [];

    getAvailableArticles();
    getAvailableQuestions();
};

// 搜索文章
const searchArticles = () => {
    getAvailableArticles();
};

// 选择文章变化
const handleSelectionChange = (selection: Article[]) => {
    selectedArticles.value = selection;
};

// 添加选中文章
const addSelectedArticles = () => {
    selectedArticles.value.forEach(article => {
        if (!topicArticles.value.find(t => t.id === article.id)) {
            topicArticles.value.push({
                ...article,
                isPinned: false,
            });
        }
    });
    ElMessage.success('文章添加成功');
};

// 移除文章
const removeArticle = (article: Article & { isPinned: boolean }) => {
    const index = topicArticles.value.findIndex(t => t.id === article.id);
    if (index > -1) {
        topicArticles.value.splice(index, 1);
        ElMessage.success('文章移除成功');
    }
};

// 置顶变化
const handlePinChange = (article: Article & { isPinned: boolean }) => {
    if (article.isPinned) {
        ElMessage.success(`${article.title} 已置顶`);
    } else {
        ElMessage.success(`${article.title} 已取消置顶`);
    }
};

// 保存文章排序
const saveArticleOrder = () => {
    ElMessage.success('文章排序保存成功');
};

// 保存专题文章
const saveTopicArticles = () => {
    if (!currentTopic.value) return;

    const articleIds = topicArticles.value.map(t => t.id);
    const pinnedArticles = topicArticles.value.filter(t => t.isPinned).map(t => t.id);

    // 这里应该调用API保存
    ElMessage.success('专题文章保存成功');
    articleDialogVisible.value = false;
    getTopics();
};

// 题目搜索
const searchQuestions = () => {
    getAvailableQuestions();
};

// 题目选择变化
const handleQuestionSelectionChange = (selection: Question[]) => {
    selectedQuestions.value = selection;
};

// 添加选中题目
const addSelectedQuestions = () => {
    selectedQuestions.value.forEach(question => {
        if (!topicQuestions.value.find(tq => tq.id === question.id)) {
            topicQuestions.value.push(question);
        }
    });
    ElMessage.success('题目添加成功');
    getAvailableQuestions();
};

// 移除题目
const removeQuestion = (question: Question) => {
    const index = topicQuestions.value.findIndex(tq => tq.id === question.id);
    if (index > -1) {
        topicQuestions.value.splice(index, 1);
        ElMessage.success('题目移除成功');
        getAvailableQuestions();
    }
};

// 清空所有题目
const removeAllQuestions = () => {
    ElMessageBox.confirm('确定要清空所有题目吗？', '提示', {
        type: 'warning',
    }).then(() => {
        topicQuestions.value = [];
        ElMessage.success('已清空所有题目');
        getAvailableQuestions();
    });
};

// 配置积分策略
const configureScoringStrategy = () => {
    scoringDialogVisible.value = true;
    // 重置表单为默认值
    Object.assign(scoringForm, {
        correctPoints: 10,
        wrongPoints: 0,
        timeBonus: true,
        dailyLimit: 3
    });
    scoringTimeRange.value = ['', ''];
};

// 保存积分策略
const saveScoringStrategy = () => {
    // 更新专题题目配置
    if (!topicQuestionConfig.value) {
        topicQuestionConfig.value = {
            id: Date.now().toString(),
            topicId: currentTopic.value?.id || '',
            questionIds: topicQuestions.value.map(q => q.id),
            timeWindow: {
                startTime: scoringTimeRange.value[0] || '',
                endTime: scoringTimeRange.value[1] || ''
            },
            scoringStrategy: { ...scoringForm },
            status: 'active',
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString()
        };
    } else {
        topicQuestionConfig.value.scoringStrategy = { ...scoringForm };
        topicQuestionConfig.value.questionIds = topicQuestions.value.map(q => q.id);
        if (scoringTimeRange.value[0] && scoringTimeRange.value[1]) {
            topicQuestionConfig.value.timeWindow = {
                startTime: scoringTimeRange.value[0],
                endTime: scoringTimeRange.value[1]
            };
        }
    }

    ElMessage.success('积分策略配置成功');
    scoringDialogVisible.value = false;
};

// 保存专题内容（包括文章和题目）
const saveTopicContent = async () => {
    if (!currentTopic.value) return;

    try {
        // 保存文章
        const articleIds = topicArticles.value.map(t => t.id);
        const pinnedArticles = topicArticles.value.filter(t => t.isPinned).map(t => t.id);

        // 保存题目配置
        if (topicQuestions.value.length > 0 && !topicQuestionConfig.value) {
            saveScoringStrategy();
        }

        // TODO: 这里应该调用API保存专题内容
        // await updateSubjectContent(currentTopic.value.id, {
        //     articleIds,
        //     pinnedArticles,
        //     questions: topicQuestions.value,
        //     config: topicQuestionConfig.value
        // });

        ElMessage.success('专题内容保存成功');
        articleDialogVisible.value = false;
        await getTopics();
    } catch (error) {
        ElMessage.error('保存失败');
    }
};

// 日期变化
const handleDateChange = (dates: [string, string]) => {
    if (dates) {
        form.startTime = dates[0];
        form.endTime = dates[1];
    }
};

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        // TODO: 这里应该调用创建或更新API
        // if (form.id) {
        //     await updateSubject(form.id, form);
        // } else {
        //     await createSubject(form);
        // }

        ElMessage.success(form.id ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        await getTopics();
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
        cover: '',
        articleIds: [],
        pinnedArticles: [],
        status: 1, // 默认进行中
        startTime: '',
        endTime: '',
        createTime: '',
        updateTime: '',
    });
    dateRange.value = ['', ''];
};


// 状态类型
const statusType = (status: number) => {
    const types = {
        0: 'info',    // 未开始
        1: 'success', // 进行中
        2: 'warning', // 已过期
    };
    return types[status as keyof typeof types] || 'info';
};

// 状态文本
const statusText = (status: number) => {
    const texts = {
        0: '未开始',
        1: '进行中',
        2: '已过期'
    };
    return texts[status as keyof typeof texts] || '未知状态';
};

// 文章状态类型
const articleStatusType = (status: string) => {
    const types = {
        published: 'success',
        draft: 'info',
        withdrawn: 'warning',
    };
    return types[status as keyof typeof types] || 'info';
};

// 文章状态文本
const articleStatusText = (status: string) => {
    const texts = {
        published: '已发布',
        draft: '草稿',
        withdrawn: '已撤稿',
    };
    return texts[status as keyof typeof texts] || '未知';
};

// 题目类型和难度辅助方法
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
    await getTopics();
    getAvailableArticles();
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

.mb10 {
    margin-bottom: 10px;
}

.table {
    width: 100%;
    font-size: 14px;
}

.text-muted {
    color: #999;
    font-size: 12px;
}

.article-management {
    min-height: 400px;
}

.article-actions {
    margin-bottom: 10px;
}

.question-management {
    min-height: 400px;
}

.question-actions {
    margin-bottom: 10px;
    display: flex;
    gap: 10px;
}

.filter-bar {
    margin-top: 10px;
    display: flex;
    gap: 5px;
}

.text-muted {
    color: #999;
    font-size: 12px;
}

.ml5 {
    margin-left: 5px;
}

.mb10 {
    margin-bottom: 10px;
}

.form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
}
</style>