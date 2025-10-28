<template>
    <div class="container">
        <!-- 搜索操作区 -->
        <div class="main-card">
            <div class="handle-box">
                <div class="handle-left">
                    <el-button type="primary" :icon="Plus" @click="handleCreate">新增专题</el-button>
                </div>
                <div class="handle-right">
                    <el-input v-model="query.name" placeholder="专题名称" class="handle-input" clearable
                        @keyup.enter="handleSearch">
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                    <el-select v-model="query.status" placeholder="状态" class="handle-select">
                        <el-option label="全部" value=""></el-option>
                        <el-option label="未开始" :value="0"></el-option>
                        <el-option label="进行中" :value="1"></el-option>
                        <el-option label="已过期" :value="2"></el-option>
                    </el-select>
                    <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
                </div>
            </div>

            <el-table :data="filteredTableData" border class="table" header-cell-class-name="table-header" stripe>
                <el-table-column prop="id" label="ID" width="70" align="center">
                    <template #default="scope">
                        <span style="font-weight: 600; color: #409eff;">{{ scope.row.id }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="专题名称" width="180" show-overflow-tooltip>
                    <template #default="scope">
                        <span style="font-weight: 500;">{{ scope.row.name }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="creator" label="创建者" width="100" align="center"></el-table-column>
                <el-table-column label="文章数量" width="100" align="center">
                    <template #default="scope">
                        <el-tag type="info" size="small">{{ scope.row.texts?.length || 0 }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="题目数量" width="100" align="center">
                    <template #default="scope">
                        <el-tag type="warning" size="small">{{ scope.row.question_list?.length || 0 }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100" align="center">
                    <template #default="scope">
                        <el-tag :type="statusType(scope.row.status)" effect="dark">
                            {{ statusText(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="有效期" width="280" align="center">
                    <template #default="scope">
                        <span v-if="scope.row.begin_time || scope.row.end_time" class="time-range">
                            {{ formatTimeRange(scope.row.begin_time, scope.row.end_time) }}
                        </span>
                        <span v-else class="text-muted">未设置</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="240" align="center" fixed="right">
                    <template #default="scope">
                        <el-button-group>
                            <el-button type="primary" size="small" :icon="Edit"
                                @click="handleEdit(scope.row)">编辑</el-button>
                            <el-button type="success" size="small" :icon="Document"
                                @click="handleManageContent(scope.row)">管理</el-button>
                            <el-button type="danger" size="small" :icon="Delete"
                                @click="handleDelete(scope.row)">删除</el-button>
                        </el-button-group>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination">
                <el-pagination background layout="total, prev, pager, next" :current-page="query.page"
                    :page-size="query.pageSize" :total="filteredPageTotal"
                    @current-change="handlePageChange"></el-pagination>
            </div>
        </div>

        <!-- 新增/编辑专题弹窗 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="50%" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="专题名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入专题名称"></el-input>
                </el-form-item>
                <el-form-item label="有效期设置">
                    <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至"
                        start-placeholder="开始时间" end-placeholder="结束时间" format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss" @change="handleDateChange" style="width: 100%;" />
                    <div class="form-tip">设置专题的有效时间范围</div>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="handleSubmit">确 定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 内容管理弹窗 -->
        <el-dialog title="专题内容管理" v-model="contentDialogVisible" width="80%" destroy-on-close>
            <el-tabs v-model="activeTab" type="border-card">
                <!-- 文章管理 -->
                <el-tab-pane label="文章管理" name="articles">
                    <div class="content-management">
                        <div class="search-box">
                            <el-input v-model="articleSearch" placeholder="搜索文章" class="search-input"
                                @keyup.enter="searchArticles" clearable>
                                <template #prefix>
                                    <el-icon>
                                        <Search />
                                    </el-icon>
                                </template>
                            </el-input>
                        </div>
                        <el-table :data="availableArticles" @selection-change="handleArticleSelectionChange"
                            max-height="500" ref="articleTableRef">
                            <el-table-column type="selection" width="55"></el-table-column>
                            <el-table-column prop="title" label="标题" show-overflow-tooltip
                                min-width="200"></el-table-column>
                            <el-table-column label="已包含" width="80" align="center">
                                <template #default="scope">
                                    <el-tag v-if="isArticleInTopic(scope.row)" type="success" size="small">已添加</el-tag>
                                    <el-tag v-else type="info" size="small">未添加</el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                        <div class="pagination">
                            <el-pagination background layout="total, prev, pager, next" :current-page="articlePage"
                                :page-size="articlePageSize" :total="articleTotal"
                                @current-change="handleArticlePageChange" />
                        </div>
                    </div>
                </el-tab-pane>

                <!-- 题目管理 -->
                <el-tab-pane label="题目管理" name="questions">
                    <div class="content-management">
                        <div class="search-box">
                            <el-input v-model="questionSearch" placeholder="搜索题目" class="search-input"
                                @keyup.enter="searchQuestions" clearable>
                                <template #prefix>
                                    <el-icon>
                                        <Search />
                                    </el-icon>
                                </template>
                            </el-input>
                            <el-select v-model="questionFilter.type" placeholder="题型"
                                style="width: 120px; margin-left: 10px;">
                                <el-option label="全部" value=""></el-option>
                                <el-option label="单选" :value="1"></el-option>
                                <el-option label="多选" :value="2"></el-option>
                                <el-option label="简答" :value="3"></el-option>
                            </el-select>
                        </div>
                        <el-table :data="availableQuestions" @selection-change="handleQuestionSelectionChange"
                            max-height="500" ref="questionTableRef">
                            <el-table-column type="selection" width="55"></el-table-column>
                            <el-table-column label="题目标题" show-overflow-tooltip min-width="200">
                                <template #default="scope">
                                    {{ scope.row.detail?.title || '无标题' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="题型" width="100" align="center">
                                <template #default="scope">
                                    <el-tag size="small" :type="getQuestionTypeColor(scope.row.type)">
                                        {{ getQuestionTypeText(scope.row.type) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="已包含" width="80" align="center">
                                <template #default="scope">
                                    <el-tag v-if="isQuestionInTopic(scope.row.id)" type="success"
                                        size="small">已添加</el-tag>
                                    <el-tag v-else type="info" size="small">未添加</el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                        <div class="pagination">
                            <el-pagination background layout="total, prev, pager, next" :current-page="questionPage"
                                :page-size="questionPageSize" :total="questionTotal"
                                @current-change="handleQuestionPageChange" />
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="contentDialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="saveTopicContent">保 存</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="topics">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search, Document, Clock } from '@element-plus/icons-vue';
import type { Topic } from '@/types/content';
import { getSubjects, updateSubject, addSubject, deleteSubject } from '@/api/subject';
import { getAllArticles } from '@/api/article';
import { getAllQuestions } from '@/api/question';

// 查询参数
const query = reactive<{
    page: number;
    pageSize: number;
    name: string;
    status: number | string | undefined;
}>({
    page: 1,
    pageSize: 10,
    name: '',
    status: '',
});

// 表格数据
const tableData = ref<any[]>([]);
const pageTotal = ref(0);

// 筛选后的数据
const filteredTableData = computed(() => {
    let result = tableData.value;

    // 按名称筛选
    if (query.name) {
        result = result.filter(item => item.name.includes(query.name));
    }

    // 按状态筛选（空字符串表示全部）
    if (query.status !== '' && query.status !== undefined && query.status !== null) {
        result = result.filter(item => item.status === query.status);
    }

    return result;
});

// 筛选后的总数
const filteredPageTotal = computed(() => filteredTableData.value.length);

// 弹窗控制
const dialogVisible = ref(false);
const contentDialogVisible = ref(false);
const activeTab = ref('articles');
const dialogTitle = ref('新增专题');
const formRef = ref();

// 表单数据
const form = reactive<any>({
    id: '',
    name: '',
    begin_time: '',
    end_time: '',
});

// 表单验证规则
const rules: any = {
    name: [{ required: true, message: '请输入专题名称', trigger: 'blur' }],
};

// 日期范围
const dateRange = ref<[string, string]>(['', '']);

// 当前专题
const currentTopic = ref<any>(null);
const originalTopicArticles = ref<number[]>([]);
const originalTopicQuestions = ref<number[]>([]);

// 文章管理
const articleSearch = ref('');
const articlePage = ref(1);
const articlePageSize = ref(10);
const articleTotal = ref(0);
const availableArticles = ref<any[]>([]);
const selectedArticles = ref<any[]>([]);
const articleTableRef = ref();

// 题目管理
const questionSearch = ref('');
const questionPage = ref(1);
const questionPageSize = ref(10);
const questionTotal = ref(0);
const availableQuestions = ref<any[]>([]);
const selectedQuestions = ref<any[]>([]);
const questionTableRef = ref();
const questionFilter = reactive({
    type: undefined as number | undefined,
});

// 获取专题列表
const getTopics = async () => {
    try {
        const res = await getSubjects();
        const data = res.data.data || res.data;

        if (data && Array.isArray(data)) {
            // 按ID排序，保持顺序稳定
            const mappedData = data.map((item: any) => ({
                id: item.id.toString(),
                name: item.name,
                creator: item.creator_name || '未知',
                texts: item.texts || [],
                question_list: item.question_list || [],
                status: item.status,
                begin_time: item.begin_time,
                end_time: item.end_time,
            }));

            // 按ID倒序排列（最新在前）
            mappedData.sort((a: any, b: any) => Number(b.id) - Number(a.id));

            tableData.value = mappedData;
            pageTotal.value = data.length;
        }
    } catch (error) {
        ElMessage.error('获取专题列表失败');
        console.error('获取专题列表失败:', error);
    }
};

// 搜索（前端筛选）
const handleSearch = () => {
    query.page = 1;
    // 筛选功能由computed自动处理
};

// 分页切换（前端处理）
const handlePageChange = (val: number) => {
    query.page = val;
};

// 新增专题
const handleCreate = () => {
    dialogTitle.value = '新增专题';
    dialogVisible.value = true;
    resetForm();
};

// 保存当前编辑的行数据
const editingRow = ref<any>(null);

// 编辑专题
const handleEdit = (row: any) => {
    dialogTitle.value = '编辑专题';
    dialogVisible.value = true;
    form.id = row.id;
    form.name = row.name;
    // 保存当前行的完整数据
    editingRow.value = row;
    if (row.begin_time && row.end_time) {
        dateRange.value = [row.begin_time, row.end_time];
    }
};

// 删除专题
const handleDelete = async (row: any) => {
    try {
        await ElMessageBox.confirm(`确定要删除专题"${row.name}"吗？删除后无法恢复！`, '警告', {
            type: 'warning',
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            confirmButtonClass: 'el-button--danger'
        });

        // 调用删除接口
        await deleteSubject(row.id);

        ElMessage.success('删除成功');

        // 从列表中移除该行，而不是刷新整个列表
        const index = tableData.value.findIndex((item: any) => item.id === row.id);
        if (index !== -1) {
            tableData.value.splice(index, 1);
        }
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
            console.error('删除专题失败:', error);
        }
    }
};

// 日期变化
const handleDateChange = (dates: [string, string]) => {
    if (dates) {
        form.begin_time = dates[0];
        form.end_time = dates[1];
    }
};

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        // 时间格式转换（转换为秒级时间戳）
        const beginTime = form.begin_time ? Math.floor(new Date(form.begin_time).getTime() / 1000) : 0;
        const endTime = form.end_time ? Math.floor(new Date(form.end_time).getTime() / 1000) : 0;

        if (!form.id) {
            // 新增专题
            await addSubject({
                name: form.name,
                begin_time: beginTime,
                end_time: endTime,
                question_list: [],
                text_list: []
            });
            ElMessage.success('新增成功');
            await getTopics();
        } else {
            // 更新专题
            const questionList = editingRow.value?.question_list?.map((q: any) => Number(q.id)) || [];
            const textList = editingRow.value?.texts?.map((t: any) => Number(t.id)) || [];

            await updateSubject({
                id: Number(form.id),
                name: form.name,
                begin_time: beginTime,
                end_time: endTime,
                question_list: questionList,
                text_list: textList
            });

            // 更新当前行数据
            const topicIndex = tableData.value.findIndex((item: any) => item.id === form.id);
            if (topicIndex !== -1) {
                tableData.value[topicIndex].name = form.name;
                tableData.value[topicIndex].begin_time = form.begin_time;
                tableData.value[topicIndex].end_time = form.end_time;
            }
            ElMessage.success('更新成功');
        }

        dialogVisible.value = false;
        editingRow.value = null;
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error(form.id ? '更新失败' : '新增失败');
            console.error('提交失败:', error);
        }
    }
};

// 重置表单
const resetForm = () => {
    form.id = '';
    form.name = '';
    form.begin_time = '';
    form.end_time = '';
    dateRange.value = ['', ''];
    editingRow.value = null;
};

// 管理内容
const handleManageContent = async (row: any) => {
    currentTopic.value = row;
    contentDialogVisible.value = true;
    activeTab.value = 'articles';

    // 保存原始数据
    originalTopicArticles.value = (row.texts || []).map((text: any) => text.id);
    originalTopicQuestions.value = (row.question_list || []).map((question: any) => question.id);

    // 获取文章和题目列表
    await getAvailableArticles();
    await getAvailableQuestions();

    // 设置已选状态
    await nextTick();
    setArticleSelection();
    setQuestionSelection();
};

// 获取可选文章列表
const getAvailableArticles = async () => {
    try {
        const res = await getAllArticles();
        const data = res.data.data || res.data;
        availableArticles.value = data || [];
        articleTotal.value = data?.length || 0;
    } catch (error) {
        ElMessage.error('获取文章列表失败');
        console.error('获取文章列表失败:', error);
    }
};

// 获取可选题目列表
const getAvailableQuestions = async () => {
    try {
        const res = await getAllQuestions({
            page: questionPage.value - 1,
            size: questionPageSize.value
        });
        const data = res.data.data || res.data;
        availableQuestions.value = data?.list || [];
        questionTotal.value = data?.total || 0;
    } catch (error) {
        ElMessage.error('获取题目列表失败');
        console.error('获取题目列表失败:', error);
    }
};

// 判断文章是否在专题内
const isArticleInTopic = (article: any) => {
    if (!currentTopic.value) return false;
    return currentTopic.value.texts?.some((text: any) => text.id === article.id);
};

// 判断题目是否在专题内
const isQuestionInTopic = (questionId: number) => {
    if (!currentTopic.value) return false;
    return currentTopic.value.question_list?.some((question: any) => question.id === questionId);
};

// 设置文章选择状态
const setArticleSelection = () => {
    if (!articleTableRef.value) return;
    const rows = availableArticles.value.filter(article => isArticleInTopic(article));
    rows.forEach((row: any) => {
        articleTableRef.value.toggleRowSelection(row, true);
    });
};

// 设置题目选择状态
const setQuestionSelection = () => {
    if (!questionTableRef.value) return;
    const rows = availableQuestions.value.filter(question => isQuestionInTopic(question.id));
    rows.forEach((row: any) => {
        questionTableRef.value.toggleRowSelection(row, true);
    });
};

// 搜索文章
const searchArticles = () => {
    getAvailableArticles();
};

// 文章选择变化
const handleArticleSelectionChange = (selection: any[]) => {
    selectedArticles.value = selection;
};

// 题目搜索
const searchQuestions = () => {
    questionPage.value = 1;
    getAvailableQuestions();
};

// 题目选择变化
const handleQuestionSelectionChange = (selection: any[]) => {
    selectedQuestions.value = selection;
};

// 文章分页
const handleArticlePageChange = async (val: number) => {
    articlePage.value = val;
    await getAvailableArticles();
};

// 题目分页
const handleQuestionPageChange = async (val: number) => {
    questionPage.value = val;
    await getAvailableQuestions();
};

// 格式化时间范围
const formatTimeRange = (beginTime?: string, endTime?: string) => {
    const format = (time: string) => {
        if (!time) return '';
        // 如果格式是 "2025-05-19 22:53:37"，只取日期部分
        return time.split(' ')[0];
    };

    const begin = format(beginTime || '');
    const end = format(endTime || '');

    if (begin && end) {
        return `${begin} - ${end}`;
    } else if (begin) {
        return `${begin} - 无限制`;
    } else if (end) {
        return `无限制 - ${end}`;
    }
    return '未设置';
};

// 保存专题内容
const saveTopicContent = async () => {
    if (!currentTopic.value) return;

    try {
        // 获取选中的文章和题目ID
        const textList = selectedArticles.value.map(a => Number(a.id));
        const questionList = selectedQuestions.value.map(q => Number(q.id));

        // 获取当前专题的开始和结束时间戳（转换为秒级时间戳）
        const beginTime = currentTopic.value.begin_time
            ? Math.floor(new Date(currentTopic.value.begin_time).getTime() / 1000)
            : 0;
        const endTime = currentTopic.value.end_time
            ? Math.floor(new Date(currentTopic.value.end_time).getTime() / 1000)
            : 0;

        // 调用API保存
        await updateSubject({
            id: Number(currentTopic.value.id),
            name: currentTopic.value.name,
            begin_time: beginTime,
            end_time: endTime,
            question_list: questionList,
            text_list: textList
        });

        // 更新当前行数据，而不是刷新整个列表
        const topicIndex = tableData.value.findIndex((item: any) => item.id === currentTopic.value.id);
        if (topicIndex !== -1) {
            // 更新文章和题目列表（用于显示数量）
            tableData.value[topicIndex].texts = selectedArticles.value.map((a: any) => ({ id: a.id }));
            tableData.value[topicIndex].question_list = selectedQuestions.value.map((q: any) => ({ id: q.id }));

            // 同时更新currentTopic，以便下次打开时显示最新的数据
            currentTopic.value.texts = tableData.value[topicIndex].texts;
            currentTopic.value.question_list = tableData.value[topicIndex].question_list;
        }

        ElMessage.success('内容保存成功');
        contentDialogVisible.value = false;
    } catch (error) {
        ElMessage.error('保存失败');
        console.error('保存专题内容失败:', error);
    }
};

// 状态类型
const statusType = (status: any) => {
    const types: Record<number, string> = {
        0: 'info',    // 未开始
        1: 'success', // 进行中
        2: 'warning', // 已过期
    };
    return types[status] || 'info';
};

// 状态文本
const statusText = (status: any) => {
    const texts: Record<number, string> = {
        0: '未开始',
        1: '进行中',
        2: '已过期'
    };
    return texts[status] || '未知状态';
};

// 题目类型文本
const getQuestionTypeText = (type: number) => {
    const types: Record<number, string> = {
        1: '单选',
        2: '多选',
        3: '简答'
    };
    return types[type] || '未知';
};

// 题目类型颜色
const getQuestionTypeColor = (type: number) => {
    const colors: Record<number, string> = {
        1: 'primary',
        2: 'success',
        3: 'warning'
    };
    return colors[type] || 'info';
};

onMounted(async () => {
    await getTopics();
});
</script>

<style scoped>
.container {
    padding: 20px;
    background-color: #f5f7fa;
    min-height: calc(100vh - 84px);
}

/* 主卡片容器 */
.main-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
    overflow: hidden;
}

/* 操作区域 */
.handle-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
}

.handle-left {
    flex: 0 0 auto;
}

.handle-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    justify-content: flex-end;
}

.handle-input {
    width: 250px;
}

.handle-select {
    width: 130px;
}

/* 表格区域 */
.el-table {
    border: none;
}

.table {
    width: 100%;
    font-size: 14px;
}

:deep(.table-header) {
    background-color: #fafafa;
    color: #333;
    font-weight: 600;
}

:deep(.el-table th) {
    padding: 16px 0;
}

:deep(.el-table td) {
    padding: 12px 0;
}

:deep(.el-table__cell) {
    border-bottom: 1px solid #ebeef5;
}

/* 表格操作按钮 */
:deep(.el-button + .el-button) {
    margin-left: 8px;
}

:deep(.el-button--small) {
    padding: 7px 12px;
}

/* 表格内文本 */
.text-muted {
    color: #999;
    font-size: 12px;
}

/* 时间范围 */
.time-range {
    font-size: 12px;
    color: #606266;
}

/* 按钮组优化 */
:deep(.el-button-group) {
    display: flex;
    gap: 0;
}

:deep(.el-button-group .el-button) {
    margin-left: 0;
    border-radius: 0;
}

:deep(.el-button-group .el-button:first-child) {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}

:deep(.el-button-group .el-button:last-child) {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
}

/* 内容管理区域 */
.content-management {
    min-height: 300px;
}

.search-box {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-input {
    width: 300px;
}

/* 分页 */
.pagination {
    display: flex;
    justify-content: flex-end;
    padding: 15px 20px;
    border-top: 1px solid #ebeef5;
}

/* 弹窗表单优化 */
:deep(.el-dialog__body) {
    padding: 25px;
}

:deep(.el-form-item) {
    margin-bottom: 20px;
}

:deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
}
</style>