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

            <div class="table-wrapper">
                <el-table :data="filteredTableData" border class="table" header-cell-class-name="table-header" stripe>
                    <el-table-column prop="id" label="ID" width="70" align="center">
                        <template #default="scope">
                            <span style="font-weight: 600; color: #409eff;">{{ scope.row.id }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="name" label="专题名称" min-width="180" show-overflow-tooltip>
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
                            <el-tag type="warning" size="small">{{ scope.row.questions?.length || 0 }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100" align="center">
                        <template #default="scope">
                            <el-tag :type="statusType(scope.row.status)" effect="dark">
                                {{ statusText(scope.row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="有效期" min-width="280" align="center">
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
                                    @click="handleDelete(scope.row)"
                                    :loading="deletingIds.has(Number(scope.row.id))"
                                    :disabled="deletingIds.has(Number(scope.row.id))">
                                    {{ deletingIds.has(Number(scope.row.id)) ? '删除中...' : '删除' }}
                                </el-button>
                            </el-button-group>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

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
                            <el-table-column label="操作" width="120" align="center">
                                <template #default="scope">
                                    <el-button v-if="isArticleInTopic(scope.row)"
                                        type="danger" size="small"
                                        @click="removeArticleFromTopic(scope.row)"
                                        :loading="articleOperations[scope.row.id]">
                                        <el-icon><Delete /></el-icon>
                                        移除
                                    </el-button>
                                    <el-button v-else
                                        type="success" size="small"
                                        @click="addArticleToTopic(scope.row)"
                                        :loading="articleOperations[scope.row.id]">
                                        <el-icon><Plus /></el-icon>
                                        添加
                                    </el-button>
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
                                style="width: 120px; margin-left: 10px;" @change="searchQuestions">
                                <el-option label="全部" :value="undefined"></el-option>
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
                            <el-table-column label="操作" width="120" align="center">
                                <template #default="scope">
                                    <el-button v-if="isQuestionInTopic(scope.row.id)"
                                        type="danger" size="small"
                                        @click="removeQuestionFromTopic(scope.row)"
                                        :loading="questionOperations[scope.row.id]">
                                        <el-icon><Delete /></el-icon>
                                        移除
                                    </el-button>
                                    <el-button v-else
                                        type="success" size="small"
                                        @click="addQuestionToTopic(scope.row)"
                                        :loading="questionOperations[scope.row.id]">
                                        <el-icon><Plus /></el-icon>
                                        添加
                                    </el-button>
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

                <!-- 部门管理 -->
                <el-tab-pane label="部门管理" name="departments">
                    <div class="content-management" v-loading="refreshingData" element-loading-text="正在刷新数据...">
                        <!-- 第一部分：专题应用状态 -->
                        <div class="department-status-section">
                            <div class="status-header">
                                <h3 class="section-title">
                                    <el-icon><OfficeBuilding /></el-icon>
                                    专题应用状态
                                </h3>
                            </div>

                            <!-- 已应用部门 -->
                            <div class="applied-departments-section" v-if="appliedDepartments.length > 0">
                                <div class="subsection-title">
                                    <el-icon><Check /></el-icon>
                                    已应用于 {{ appliedDepartments.length }} 个部门：
                                </div>
                                <div class="applied-departments-list">
                                    <el-tag
                                        v-for="dept in appliedDepartments"
                                        :key="dept.id"
                                        type="success"
                                        size="default"
                                        class="applied-dept-tag"
                                        effect="light">
                                        <el-icon class="tag-icon"><OfficeBuilding /></el-icon>
                                        <span class="dept-full-path">{{ dept.fullPath }}</span>
                                        <span class="dept-description" v-if="dept.description">（{{ dept.description }}）</span>
                                    </el-tag>
                                </div>
                            </div>

                            <!-- 未应用部门提示 -->
                            <div class="no-applied-departments" v-else>
                                <el-empty description="此专题尚未应用于任何部门" :image-size="80">
                                    <el-button type="primary" @click="showAddDepartmentDialog">立即设置应用部门</el-button>
                                </el-empty>
                            </div>
                        </div>

                        <!-- 第二部分：部门关系管理 -->
                        <div class="department-management-section">
                            <div class="management-header">
                                <h3 class="section-title">
                                    <el-icon><Setting /></el-icon>
                                    部门关系管理
                                    <el-tag type="info" size="small" style="margin-left: 8px;">
                                        已关联 {{ departmentTotal }} 个部门
                                    </el-tag>
                                </h3>
                                <el-button type="primary" @click="showAddDepartmentDialog">
                                    <el-icon><Plus /></el-icon>
                                    添加部门关联
                                </el-button>
                            </div>

                            <div class="search-box">
                                <el-input v-model="departmentSearch" placeholder="搜索部门" class="search-input"
                                    @keyup.enter="searchDepartments" clearable>
                                    <template #prefix>
                                        <el-icon>
                                            <Search />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </div>

                            <div class="table-container" v-if="availableDepartments.length > 0">
                                <el-table :data="availableDepartments" max-height="400">
                                    <el-table-column prop="name" label="部门名称" show-overflow-tooltip min-width="250">
                                        <template #default="scope">
                                            <div class="department-name-cell">
                                                <el-icon class="dept-icon"><OfficeBuilding /></el-icon>
                                                <span>{{ scope.row.fullPath }}</span>
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <el-table-column prop="description" label="描述" show-overflow-tooltip min-width="150"></el-table-column>
                                    <el-table-column label="关联状态" width="120" align="center">
                                        <template #default="scope">
                                            <el-tag type="success" size="small" effect="light">
                                                <el-icon><Link /></el-icon>
                                                已关联
                                            </el-tag>
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="操作" width="120" align="center">
                                        <template #default="scope">
                                            <el-button type="danger" size="small" @click="handleRemoveDepartment(scope.row)">
                                                <el-icon><Delete /></el-icon>
                                                移除
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <div class="pagination">
                                    <el-pagination background layout="total, prev, pager, next" :current-page="departmentPage"
                                        :page-size="departmentPageSize" :total="departmentTotal"
                                        @current-change="handleDepartmentPageChange" />
                                </div>
                            </div>

                            <div class="no-data" v-else>
                                <el-empty description="暂无关联部门" :image-size="60"></el-empty>
                            </div>
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

        <!-- 添加部门弹窗 -->
        <el-dialog title="添加部门到专题" v-model="addDepartmentDialogVisible" width="50%" destroy-on-close>
            <el-form ref="addDepartmentFormRef" :model="addDepartmentForm" label-width="100px">
                <el-form-item label="选择部门" prop="department_id"
                    :rules="[{ required: true, message: '请选择部门', trigger: 'change' }]">
                    <el-tree-select
                        v-model="addDepartmentForm.department_id"
                        :data="departmentTreeOptions"
                        :props="departmentTreeProps"
                        placeholder="请选择部门"
                        style="width: 100%;"
                        filterable
                        check-strictly
                        :render-after-expand="false"
                        :default-expanded-keys="[]"
                        node-key="id"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="addDepartmentDialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="handleAddDepartment">确 定</el-button>
                </span>
            </template>
        </el-dialog>

      </div>
</template>

<script setup lang="ts" name="topics">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search, Document, Clock, OfficeBuilding, Check, Setting, Link } from '@element-plus/icons-vue';
import type { Topic } from '@/types/content';
import { getSubjects, updateSubject, addSubject, deleteSubject, addSubjectDepartment, deleteSubjectDepartment } from '@/api/subject';
import { getAllArticles } from '@/api/article';
import { getAllQuestions } from '@/api/question';
import { getAllDepartments } from '@/api/department';

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

// 删除操作状态
const deletingIds = ref<Set<number>>(new Set());

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

// 部门管理
const departmentSearch = ref('');
const departmentPage = ref(1);
const departmentPageSize = ref(10);
const departmentTotal = ref(0);
const availableDepartments = ref<any[]>([]);
const appliedDepartments = ref<any[]>([]); // 当前专题应用的部门详情

// 添加部门弹窗
const addDepartmentDialogVisible = ref(false);
const addDepartmentForm = reactive({
    department_id: null as number | null,
});
const addDepartmentFormRef = ref();
const allDepartments = ref<any[]>([]);

// 部门树配置
const departmentTreeOptions = ref<any[]>([]);
const departmentTreeProps = {
    children: 'children',
    label: 'name',
    value: 'id'
};

// 数据刷新loading状态
const refreshingData = ref(false);

// 文章和题目操作loading状态
const articleOperations = ref<Record<number, boolean>>({});
const questionOperations = ref<Record<number, boolean>>({});

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
                texts: (item.text_list || []).filter(id => id !== null && id !== undefined),        // 过滤掉null值
                questions: (item.question_list || []).filter(id => id !== null && id !== undefined), // 过滤掉null值
                status: item.status,
                begin_time: item.begin_time,
                end_time: item.end_time,
                applied_departments_id: item.applied_departments_id || [],
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

// 刷新当前专题数据
const refreshTopicData = async () => {
    if (!currentTopic.value) return;

    try {
        refreshingData.value = true;

        const res = await getSubjects();
        const data = res.data.data || res.data;

        if (data && Array.isArray(data)) {
            const updatedTopic = data.find((item: any) => item.id.toString() === currentTopic.value!.id.toString());
            if (updatedTopic) {
                // 更新当前专题数据
                currentTopic.value.applied_departments_id = updatedTopic.applied_departments_id || [];
                currentTopic.value.texts = updatedTopic.texts || [];
                currentTopic.value.question_list = updatedTopic.question_list || [];
                currentTopic.value.status = updatedTopic.status;
                currentTopic.value.begin_time = updatedTopic.begin_time;
                currentTopic.value.end_time = updatedTopic.end_time;

                // 同时更新表格中的对应数据
                const topicIndex = tableData.value.findIndex((item: any) => item.id === currentTopic.value!.id.toString());
                if (topicIndex !== -1) {
                    tableData.value[topicIndex] = {
                        ...tableData.value[topicIndex],
                        applied_departments_id: updatedTopic.applied_departments_id || [],
                        texts: updatedTopic.texts || [],
                        question_list: updatedTopic.question_list || [],
                        status: updatedTopic.status,
                        begin_time: updatedTopic.begin_time,
                        end_time: updatedTopic.end_time
                    };
                }

                // 重新获取应用部门列表
                await getAppliedDepartments();
            }
        }
    } catch (error) {
        console.error('刷新专题数据失败:', error);
        ElMessage.error('刷新数据失败，请稍后重试');
    } finally {
        refreshingData.value = false;
    }
};

// 通用操作后刷新数据
const refreshAfterOperation = async (operation: string) => {
    try {
        refreshingData.value = true;
        console.log(`执行${operation}操作后刷新数据...`);

        // 刷新当前专题数据
        await refreshTopicData();

        console.log(`${operation}操作后数据刷新完成`);
    } catch (error) {
        console.error(`${operation}操作后刷新数据失败:`, error);
    } finally {
        refreshingData.value = false;
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
        await ElMessageBox.confirm(
            `确定要删除专题"${row.name}"吗？删除后将无法恢复。`,
            '删除确认',
            {
                type: 'warning',
                confirmButtonText: '确定删除',
                cancelButtonText: '取消',
                confirmButtonClass: 'el-button--danger'
            }
        );

        // 添加到删除中状态
        deletingIds.value.add(Number(row.id));

        // 调用删除API
        await deleteSubject(Number(row.id));

        ElMessage.success('专题删除成功');

        // 重新获取专题列表
        await getTopics();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除专题失败:', error);
            ElMessage.error('删除专题失败，请稍后重试');
        }
    } finally {
        // 移除删除中状态
        deletingIds.value.delete(Number(row.id));
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

    // 获取文章、题目和部门列表
    await getAvailableArticles();
    await getAvailableQuestions();
    await getAvailableDepartments();
    await getAppliedDepartments(); // 获取专题应用的部门
    await getAllDepartmentsList();

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
        const params: any = {
            page: questionPage.value - 1,
            size: questionPageSize.value
        };

        // 添加搜索关键词
        if (questionSearch.value) {
            params.key_word = questionSearch.value;
        }

        // 添加题型筛选
        if (questionFilter.type !== undefined && questionFilter.type !== null) {
            params.type = questionFilter.type;
        }

        const res = await getAllQuestions(params);
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

    const texts = currentTopic.value.texts || [];
    if (!Array.isArray(texts)) return false;

    return texts.some((text: any) => {
        // 处理对象格式：{ id: 1, ... }
        if (typeof text === 'object' && text !== null && text.id !== undefined) {
            return text.id === article.id;
        }
        // 处理ID数组格式：[1, 2, 3]
        if (typeof text === 'number' || typeof text === 'string') {
            return Number(text) === Number(article.id);
        }
        // 处理ID字符串格式：'1'
        if (typeof text === 'string' && /^\d+$/.test(text)) {
            return Number(text) === Number(article.id);
        }
        return false;
    });
};

// 判断题目是否在专题内
const isQuestionInTopic = (questionId: number) => {
    if (!currentTopic.value) return false;

    const questionList = currentTopic.value.questions || []; // 使用映射后的questions字段
    if (!Array.isArray(questionList)) return false;

    return questionList.some((question: any) => {
        // 处理对象格式：{ id: 1, ... }
        if (typeof question === 'object' && question !== null && question.id !== undefined) {
            return question.id === questionId;
        }
        // 处理ID数组格式：[1, 2, 3]
        if (typeof question === 'number' || typeof question === 'string') {
            return Number(question) === questionId;
        }
        // 处理ID字符串格式：'1'
        if (typeof question === 'string' && /^\d+$/.test(question)) {
            return Number(question) === questionId;
        }
        return false;
    });
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

// 获取专题关联的部门列表（用于管理操作）
const getAvailableDepartments = async () => {
    try {
        if (!currentTopic.value || !currentTopic.value.applied_departments_id || currentTopic.value.applied_departments_id.length === 0) {
            availableDepartments.value = [];
            departmentTotal.value = 0;
            return;
        }

        // 获取所有部门，筛选出当前专题应用的部门
        const res = await getAllDepartments();
        const allDepts = res.data.data || res.data || [];

        // 筛选出当前专题应用的部门
        const appliedDeptIds = currentTopic.value.applied_departments_id;
        const appliedDepts = allDepts.filter((dept: any) => appliedDeptIds.includes(dept.id));

        // 为每个部门添加完整路径信息
        availableDepartments.value = appliedDepts.map((dept: any) => ({
            ...dept,
            fullPath: buildDepartmentPath(dept, allDepts)
        }));
        departmentTotal.value = availableDepartments.value.length;
    } catch (error) {
        ElMessage.error('获取关联部门列表失败');
        console.error('获取关联部门列表失败:', error);
        availableDepartments.value = [];
        departmentTotal.value = 0;
    }
};

// 获取专题应用的部门详情
const getAppliedDepartments = async () => {
    if (!currentTopic.value || !currentTopic.value.applied_departments_id || currentTopic.value.applied_departments_id.length === 0) {
        appliedDepartments.value = [];
        return;
    }

    try {
        const res = await getAllDepartments();
        const allDepts = res.data.data || res.data || [];

        // 筛选出当前专题应用的部门
        const appliedDeptIds = currentTopic.value.applied_departments_id;
        const appliedDepts = allDepts.filter((dept: any) => appliedDeptIds.includes(dept.id));

        // 为每个应用部门添加完整路径
        appliedDepartments.value = appliedDepts.map((dept: any) => ({
            ...dept,
            fullPath: buildDepartmentPath(dept, allDepts)
        }));
    } catch (error) {
        ElMessage.error('获取应用部门列表失败');
        console.error('获取应用部门列表失败:', error);
        appliedDepartments.value = [];
    }
};

// 获取所有部门列表（用于添加）
const getAllDepartmentsList = async () => {
    try {
        const res = await getAllDepartments();
        const data = res.data.data || res.data;
        allDepartments.value = data || [];

        // 构建部门树结构
        departmentTreeOptions.value = buildDepartmentTree(allDepartments.value);
    } catch (error) {
        ElMessage.error('获取所有部门列表失败');
        console.error('获取所有部门列表失败:', error);
    }
};

// 构建部门树结构
const buildDepartmentTree = (departments: any[]): any[] => {
    if (!Array.isArray(departments)) return [];

    const map = new Map<number, any>();
    const tree: any[] = [];

    // 创建映射
    departments.forEach(dept => {
        map.set(dept.id, {
            ...dept,
            children: [],
            name: dept.name || '未命名部门'
        });
    });

    // 构建树
    departments.forEach(dept => {
        const node = map.get(dept.id)!;
        const parentId = dept.parent_department_id;

        if (parentId === -1 || parentId === null || parentId === 0) {
            // 根节点
            tree.push(node);
        } else {
            // 子节点
            const parent = map.get(parentId);
            if (parent) {
                parent.children.push(node);
            } else {
                // 如果找不到父节点，作为根节点
                tree.push(node);
            }
        }
    });

    return tree;
};

// 构建部门完整层级路径
const buildDepartmentPath = (department: any, allDepartments: any[]): string => {
    if (!department || !allDepartments || allDepartments.length === 0) {
        return department?.name || '未知部门';
    }

    const path: string[] = [];
    let currentDept = department;
    const deptMap = new Map(allDepartments.map(dept => [dept.id, dept]));

    // 向上追溯父级部门
    while (currentDept) {
        path.unshift(currentDept.name || '未命名部门');

        const parentId = currentDept.parent_department_id;
        if (parentId === -1 || parentId === null || parentId === 0) {
            break;
        }

        currentDept = deptMap.get(parentId);
        if (!currentDept) {
            break;
        }
    }

    return path.join(' / ');
};

// 搜索部门
const searchDepartments = () => {
    getAvailableDepartments();
};

// 部门分页
const handleDepartmentPageChange = async (val: number) => {
    departmentPage.value = val;
    await getAvailableDepartments();
};

// 显示添加部门弹窗
const showAddDepartmentDialog = () => {
    addDepartmentDialogVisible.value = true;
    addDepartmentForm.department_id = null;
};

// 添加部门到专题
const handleAddDepartment = async () => {
    if (!addDepartmentForm.department_id) {
        ElMessage.warning('请选择部门');
        return;
    }

    if (!currentTopic.value) return;

    try {
        await addSubjectDepartment({
            subject_id: Number(currentTopic.value.id),
            department_id: addDepartmentForm.department_id
        });

        ElMessage.success('部门添加成功');
        addDepartmentDialogVisible.value = false;

        // 刷新专题数据以获取最新的 applied_departments_id
        await refreshAfterOperation('添加部门');

        // 刷新部门列表
        await getAvailableDepartments();
    } catch (error) {
        ElMessage.error('添加部门失败');
        console.error('添加部门失败:', error);
    }
};

// 移除部门
const handleRemoveDepartment = async (department: any) => {
    if (!currentTopic.value) return;

    try {
        await ElMessageBox.confirm(`确定要将部门"${department.name}"从专题中移除吗？`, '警告', {
            type: 'warning',
            confirmButtonText: '确定移除',
            cancelButtonText: '取消'
        });

        // 调用删除部门关系的接口
        await deleteSubjectDepartment({
            subject_id: Number(currentTopic.value.id),
            department_id: department.id
        });

        ElMessage.success('部门移除成功');

        // 刷新专题数据以获取最新的 applied_departments_id
        await refreshAfterOperation('移除部门');

        // 刷新部门列表
        await getAvailableDepartments();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('移除部门失败');
            console.error('移除部门失败:', error);
        }
    }
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

        // 刷新专题数据以确保获取最新的状态
        await refreshAfterOperation('保存专题内容');
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

// ================== 文章管理功能 ==================

// 添加文章到专题
const addArticleToTopic = async (article: any) => {
    if (!currentTopic.value) return;

    try {
        articleOperations.value[article.id] = true;

        const currentArticles = currentTopic.value.texts || [];
        const isAlreadyAdded = currentArticles.some((text: any) => {
            // 处理数字ID格式
            if (typeof text === 'number' || (typeof text === 'string' && /^\d+$/.test(text))) {
                return Number(text) === Number(article.id);
            }
            // 处理对象格式 {id: xxx}
            if (typeof text === 'object' && text !== null && text.id !== undefined) {
                return Number(text.id) === Number(article.id);
            }
            return false;
        });

        if (isAlreadyAdded) {
            ElMessage.warning('文章已在专题中');
            return;
        }

        // 保持数据格式一致：使用纯数字ID数组
        const updatedArticles = [...currentArticles, article.id];

        await updateSubject({
            id: Number(currentTopic.value.id),
            name: currentTopic.value.name,
            begin_time: currentTopic.value.begin_time ?
                Math.floor(new Date(currentTopic.value.begin_time).getTime() / 1000) : 0,
            end_time: currentTopic.value.end_time ?
                Math.floor(new Date(currentTopic.value.end_time).getTime() / 1000) : 0,
            question_list: (currentTopic.value.questions || []).map((q: any) => {
                // 处理题目ID格式
                if (typeof q === 'number' || (typeof q === 'string' && /^\d+$/.test(q))) {
                    return Number(q);
                }
                if (typeof q === 'object' && q !== null && q.id !== undefined) {
                    return Number(q.id);
                }
                return Number(q);
            }),
            text_list: updatedArticles.map((t: any) => {
                // 处理文章ID格式
                if (typeof t === 'number' || (typeof t === 'string' && /^\d+$/.test(t))) {
                    return Number(t);
                }
                if (typeof t === 'object' && t !== null && t.id !== undefined) {
                    return Number(t.id);
                }
                return Number(t);
            })
        });

        // 更新当前专题数据
        currentTopic.value.texts = updatedArticles;

        // 更新表格数据
        const topicIndex = tableData.value.findIndex((item: any) => item.id === currentTopic.value.id);
        if (topicIndex !== -1) {
            tableData.value[topicIndex].texts = updatedArticles;
        }

        ElMessage.success('文章添加成功');
    } catch (error) {
        ElMessage.error('添加文章失败');
        console.error('添加文章失败:', error);
    } finally {
        articleOperations.value[article.id] = false;
    }
};

// 从专题移除文章
const removeArticleFromTopic = async (article: any) => {
    if (!currentTopic.value) return;

    try {
        articleOperations.value[article.id] = true;

        const currentArticles = currentTopic.value.texts || [];
        const updatedArticles = currentArticles.filter((text: any) => {
            // 处理数字ID格式
            if (typeof text === 'number' || (typeof text === 'string' && /^\d+$/.test(text))) {
                return Number(text) !== Number(article.id);
            }
            // 处理对象格式 {id: xxx}
            if (typeof text === 'object' && text !== null && text.id !== undefined) {
                return Number(text.id) !== Number(article.id);
            }
            return true; // 保留无法识别格式的数据
        });

        await updateSubject({
            id: Number(currentTopic.value.id),
            name: currentTopic.value.name,
            begin_time: currentTopic.value.begin_time ?
                Math.floor(new Date(currentTopic.value.begin_time).getTime() / 1000) : 0,
            end_time: currentTopic.value.end_time ?
                Math.floor(new Date(currentTopic.value.end_time).getTime() / 1000) : 0,
            question_list: (currentTopic.value.questions || []).map((q: any) => {
                // 处理题目ID格式
                if (typeof q === 'number' || (typeof q === 'string' && /^\d+$/.test(q))) {
                    return Number(q);
                }
                if (typeof q === 'object' && q !== null && q.id !== undefined) {
                    return Number(q.id);
                }
                return Number(q);
            }),
            text_list: updatedArticles.map((t: any) => {
                // 处理文章ID格式
                if (typeof t === 'number' || (typeof t === 'string' && /^\d+$/.test(t))) {
                    return Number(t);
                }
                if (typeof t === 'object' && t !== null && t.id !== undefined) {
                    return Number(t.id);
                }
                return Number(t);
            })
        });

        // 更新当前专题数据
        currentTopic.value.texts = updatedArticles;

        // 更新表格数据
        const topicIndex = tableData.value.findIndex((item: any) => item.id === currentTopic.value.id);
        if (topicIndex !== -1) {
            tableData.value[topicIndex].texts = updatedArticles;
        }

        ElMessage.success('文章移除成功');
    } catch (error) {
        ElMessage.error('移除文章失败');
        console.error('移除文章失败:', error);
    } finally {
        articleOperations.value[article.id] = false;
    }
};

// ================== 题目管理功能 ==================

// 添加题目到专题
const addQuestionToTopic = async (question: any) => {
    if (!currentTopic.value) return;

    try {
        questionOperations.value[question.id] = true;

        const currentQuestions = currentTopic.value.questions || [];
        const isAlreadyAdded = currentQuestions.some((q: any) => {
            // 处理数字ID格式
            if (typeof q === 'number' || (typeof q === 'string' && /^\d+$/.test(q))) {
                return Number(q) === Number(question.id);
            }
            // 处理对象格式 {id: xxx}
            if (typeof q === 'object' && q !== null && q.id !== undefined) {
                return Number(q.id) === Number(question.id);
            }
            return false;
        });

        if (isAlreadyAdded) {
            ElMessage.warning('题目已在专题中');
            return;
        }

        // 保持数据格式一致：使用纯数字ID数组
        const updatedQuestions = [...currentQuestions, question.id];

        await updateSubject({
            id: Number(currentTopic.value.id),
            name: currentTopic.value.name,
            begin_time: currentTopic.value.begin_time ?
                Math.floor(new Date(currentTopic.value.begin_time).getTime() / 1000) : 0,
            end_time: currentTopic.value.end_time ?
                Math.floor(new Date(currentTopic.value.end_time).getTime() / 1000) : 0,
            question_list: updatedQuestions.map((q: any) => {
                // 处理题目ID格式
                if (typeof q === 'number' || (typeof q === 'string' && /^\d+$/.test(q))) {
                    return Number(q);
                }
                if (typeof q === 'object' && q !== null && q.id !== undefined) {
                    return Number(q.id);
                }
                return Number(q);
            }),
            text_list: (currentTopic.value.texts || []).map((t: any) => {
                // 处理文章ID格式
                if (typeof t === 'number' || (typeof t === 'string' && /^\d+$/.test(t))) {
                    return Number(t);
                }
                if (typeof t === 'object' && t !== null && t.id !== undefined) {
                    return Number(t.id);
                }
                return Number(t);
            })
        });

        // 更新当前专题数据
        currentTopic.value.questions = updatedQuestions;

        // 更新表格数据
        const topicIndex = tableData.value.findIndex((item: any) => item.id === currentTopic.value.id);
        if (topicIndex !== -1) {
            tableData.value[topicIndex].questions = updatedQuestions;
        }

        ElMessage.success('题目添加成功');
    } catch (error) {
        ElMessage.error('添加题目失败');
        console.error('添加题目失败:', error);
    } finally {
        questionOperations.value[question.id] = false;
    }
};

// 从专题移除题目
const removeQuestionFromTopic = async (question: any) => {
    if (!currentTopic.value) return;

    try {
        questionOperations.value[question.id] = true;

        const currentQuestions = currentTopic.value.questions || [];
        const updatedQuestions = currentQuestions.filter((q: any) => {
            // 处理数字ID格式
            if (typeof q === 'number' || (typeof q === 'string' && /^\d+$/.test(q))) {
                return Number(q) !== Number(question.id);
            }
            // 处理对象格式 {id: xxx}
            if (typeof q === 'object' && q !== null && q.id !== undefined) {
                return Number(q.id) !== Number(question.id);
            }
            return true; // 保留无法识别格式的数据
        });

        await updateSubject({
            id: Number(currentTopic.value.id),
            name: currentTopic.value.name,
            begin_time: currentTopic.value.begin_time ?
                Math.floor(new Date(currentTopic.value.begin_time).getTime() / 1000) : 0,
            end_time: currentTopic.value.end_time ?
                Math.floor(new Date(currentTopic.value.end_time).getTime() / 1000) : 0,
            question_list: updatedQuestions.map((q: any) => {
                // 处理题目ID格式
                if (typeof q === 'number' || (typeof q === 'string' && /^\d+$/.test(q))) {
                    return Number(q);
                }
                if (typeof q === 'object' && q !== null && q.id !== undefined) {
                    return Number(q.id);
                }
                return Number(q);
            }),
            text_list: (currentTopic.value.texts || []).map((t: any) => {
                // 处理文章ID格式
                if (typeof t === 'number' || (typeof t === 'string' && /^\d+$/.test(t))) {
                    return Number(t);
                }
                if (typeof t === 'object' && t !== null && t.id !== undefined) {
                    return Number(t.id);
                }
                return Number(t);
            })
        });

        // 更新当前专题数据
        currentTopic.value.questions = updatedQuestions;

        // 更新表格数据
        const topicIndex = tableData.value.findIndex((item: any) => item.id === currentTopic.value.id);
        if (topicIndex !== -1) {
            tableData.value[topicIndex].questions = updatedQuestions;
        }

        ElMessage.success('题目移除成功');
    } catch (error) {
        ElMessage.error('移除题目失败');
        console.error('移除题目失败:', error);
    } finally {
        questionOperations.value[question.id] = false;
    }
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
    transition: all 0.3s ease;
}

/* 暗色模式下的容器 */
:root.dark .container {
    background-color: var(--dashboard-bg, #0f0f0f);
}

/* 主卡片容器 */
.main-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    transition: all 0.3s ease;
}

/* 暗色模式下的主卡片 */
:root.dark .main-card {
    background: var(--card-bg, #1a1a1a);
    border: 1px solid var(--card-border, #2d2d2d);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 操作区域 */
.handle-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
    transition: all 0.3s ease;
}

/* 暗色模式下的操作区域 */
:root.dark .handle-box {
    border-bottom-color: var(--el-border-color, #4c4d4f);
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

/* 表格包装器 */
.table-wrapper {
    width: 100%;
    overflow-x: auto;
}

/* 表格区域 */
.el-table {
    border: none;
    width: 100%;
    min-width: 100%;
}

:deep(.el-table__inner-wrapper) {
    width: 100% !important;
}

.table {
    width: 100%;
    font-size: 14px;
}

:deep(.table-header) {
    background-color: #fafafa;
    color: #333;
    font-weight: 600;
    transition: all 0.3s ease;
}

/* 暗色模式下的表格头部 */
:root.dark :deep(.table-header) {
    background-color: var(--el-fill-color-light, #262727);
    color: var(--text-primary, #e5eaf3);
}

:deep(.el-table th) {
    padding: 16px 0;
}

:deep(.el-table td) {
    padding: 12px 0;
}

:deep(.el-table__cell) {
    border-bottom: 1px solid #ebeef5;
    transition: all 0.3s ease;
}

/* 暗色模式下的表格单元格 */
:root.dark :deep(.el-table__cell) {
    border-bottom-color: var(--el-border-color-light, #414243);
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
    transition: color 0.3s ease;
}

/* 暗色模式下的表格内文本 */
:root.dark .text-muted {
    color: var(--text-muted, #6c6e72);
}

/* 时间范围 */
.time-range {
    font-size: 12px;
    color: #606266;
    transition: color 0.3s ease;
}

/* 暗色模式下的时间范围 */
:root.dark .time-range {
    color: var(--text-secondary, #a3a6ad);
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
    transition: all 0.3s ease;
}

/* 暗色模式下的分页 */
:root.dark .pagination {
    border-top-color: var(--el-border-color, #4c4d4f);
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
    transition: color 0.3s ease;
}

/* 暗色模式下的表单标签 */
:root.dark :deep(.el-form-item__label) {
    color: var(--text-primary, #e5eaf3);
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
    transition: color 0.3s ease;
}

/* 暗色模式下的表单提示 */
:root.dark .form-tip {
    color: var(--text-muted, #6c6e72);
}

/* 部门树选择器样式 */
:deep(.el-tree-select) {
    width: 100%;
}

:deep(.el-tree-select .el-select__wrapper) {
    min-height: 32px;
}

/* 暗色模式下的树选择器 */
:root.dark :deep(.el-tree-select .el-select__wrapper) {
    background-color: var(--el-fill-color-blank, #1a1a1a);
    border-color: var(--el-border-color, #4c4d4f);
}

:root.dark :deep(.el-tree-select .el-select__wrapper:hover) {
    border-color: var(--el-color-primary, #409eff);
}

:root.dark :deep(.el-tree-select.is-focus .el-select__wrapper) {
    border-color: var(--el-color-primary, #409eff);
}

/* 树形下拉面板样式 */
:deep(.el-select-dropdown) {
    max-height: 400px;
}

:deep(.el-tree) {
    max-height: 350px;
    overflow-y: auto;
}

/* 树节点缩进优化 */
:deep(.el-tree-node__content) {
    padding-left: 10px;
}

:deep(.el-tree-node__expand-icon) {
    padding: 6px;
}

/* 节点名称样式 */
:deep(.el-tree-node__label) {
    font-size: 14px;
    color: var(--text-primary, #1f2937);
    transition: color 0.3s ease;
}

/* 暗色模式下的节点名称 */
:root.dark :deep(.el-tree-node__label) {
    color: var(--text-primary, #e5eaf3);
}

:deep(.el-tree-node__content:hover .el-tree-node__label) {
    color: var(--el-color-primary, #409eff);
}

/* 部门管理新排版样式 */
.department-status-section,
.department-management-section {
    margin-bottom: 24px;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter, #e9ecef);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

/* 暗色模式下的区域 */
:root.dark .department-status-section,
:root.dark .department-management-section {
    background: var(--card-bg, #1a1a1a);
    border-color: var(--el-border-color, #4c4d4f);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.status-header,
.management-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter, #e9ecef);
}

/* 暗色模式下的头部边框 */
:root.dark .status-header,
:root.dark .management-header {
    border-bottom-color: var(--el-border-color, #4c4d4f);
}

.section-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #1f2937);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: color 0.3s ease;
}

/* 暗色模式下的标题 */
:root.dark .section-title {
    color: var(--text-primary, #e5eaf3);
}

.subsection-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary, #606266);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.3s ease;
}

/* 暗色模式下的子标题 */
:root.dark .subsection-title {
    color: var(--text-secondary, #a3a6ad);
}

.applied-departments-section {
    padding: 16px;
    background-color: var(--el-color-success-light-9, #f0f9ff);
    border-radius: 6px;
    border: 1px solid var(--el-color-success-light-7, #b3d8ff);
    transition: all 0.3s ease;
}

/* 暗色模式下的应用部门区域 */
:root.dark .applied-departments-section {
    background-color: var(--el-color-success-light-9, #1a3a1a);
    border-color: var(--el-color-success-light-7, #2d5a2d);
}

.applied-departments-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.applied-dept-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    font-weight: 500;
    border-radius: 4px;
    background-color: var(--el-color-success-light-8, #e8f5e8);
    border-color: var(--el-color-success-light-6, #95d692);
    color: var(--el-color-success, #67c23a);
    transition: all 0.3s ease;
}

/* 暗色模式下的标签 */
:root.dark .applied-dept-tag {
    background-color: var(--el-color-success-light-9, #1e3e1e);
    border-color: var(--el-color-success-light-7, #2d5a2d);
}

.applied-dept-tag:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(103, 194, 58, 0.2);
}

.no-applied-departments {
    text-align: center;
    padding: 20px;
}

.table-container {
    margin-top: 16px;
}

.department-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dept-icon {
    color: var(--el-color-primary, #409eff);
    font-size: 16px;
}

.no-data {
    text-align: center;
    padding: 40px 20px;
}

.tag-icon {
    font-size: 14px;
}

.dept-full-path {
    font-weight: 500;
}

.dept-description {
    font-size: 12px;
    opacity: 0.8;
    font-weight: normal;
}

/* 搜索框样式调整 */
.search-box {
    margin-bottom: 16px;
}

/* 选项样式 */
.option-item {
    margin-bottom: 12px;
}

:deep(.option-item .el-input__wrapper) {
    transition: all 0.3s ease;
}

:deep(.option-item .el-input__wrapper:hover) {
    border-color: var(--el-color-primary, #409eff);
}

/* 暗色模式下的选项 */
:root.dark .option-item :deep(.el-input__wrapper) {
    background-color: var(--el-fill-color-blank, #1a1a1a);
    border-color: var(--el-border-color, #4c4d4f);
}

:root.dark .option-item :deep(.el-input__wrapper:hover) {
    border-color: var(--el-color-primary, #409eff);
}

/* 按钮组优化 */
:deep(.el-button-group) {
    display: flex;
    gap: 0;
    border-radius: 4px;
    overflow: hidden;
}

:deep(.el-button-group .el-button) {
    margin-left: 0;
    border-radius: 0;
    border-right-width: 1px;
}

:deep(.el-button-group .el-button:first-child) {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}

:deep(.el-button-group .el-button:last-child) {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-right-width: 0;
}

:deep(.el-button-group .el-button:hover) {
    z-index: 1;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .search-box {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }

    .search-input {
        width: 100%;
    }

    :deep(.el-button-group) {
        flex-direction: column;
    }

    :deep(.el-button-group .el-button) {
        border-radius: 4px;
        border-right-width: 1px;
        margin-bottom: 5px;
    }

    :deep(.el-button-group .el-button:last-child) {
        margin-bottom: 0;
    }
}
</style>