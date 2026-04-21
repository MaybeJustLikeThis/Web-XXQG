<template>
    <div class="container">
        <!-- 专栏列表展示 -->
        <div class="columns-grid" v-loading="loading">
            <div
                v-for="column in columnList"
                :key="column.id"
                class="column-card"
                :class="[
                    column.bgColor,
                    column.borderColor,
                    { active: selectedColumn?.id === column.id }
                ]"
                @click="selectColumn(column)"
            >
                <div class="column-header">
                    <div class="column-icon">{{ column.icon }}</div>
                    <div class="column-title" :class="column.titleColor">{{ column.name }}</div>
                </div>
                <div class="column-content">
                    <div class="article-count" :class="column.textColor">
                        共 {{ getArticleCount(column.id) }} 篇文章
                    </div>
                </div>
            </div>
        </div>

        <!-- 文章列表展示区域 -->
        <div class="articles-section" v-if="selectedColumn">
            <div class="section-header">
                <h3>{{ selectedColumn.name }} - 文章列表</h3>
                <div class="section-actions">
                    <el-input
                        v-model="articleQuery.title"
                        placeholder="搜索文章标题"
                        class="search-input"
                        @keyup.enter="searchArticles"
                        clearable
                    >
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                    <el-button type="primary" :icon="Edit" @click="handleEditColumn">
                        管理专栏文章
                    </el-button>
                </div>
            </div>

            <el-table :data="currentArticles" border class="table" v-loading="articleLoading">
                <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
                <el-table-column prop="title" label="标题" show-overflow-tooltip></el-table-column>
                <el-table-column label="封面" width="100" align="center">
                    <template #default="scope">
                        <el-image
                            v-if="scope.row.cover"
                            :src="scope.row.cover"
                            :preview-src-list="[scope.row.cover]"
                            class="cover-img"
                            fit="cover"
                        ></el-image>
                        <span v-else class="no-cover">无封面</span>
                    </template>
                </el-table-column>
                <el-table-column prop="author" label="作者" width="120" align="center"></el-table-column>
                <el-table-column prop="publishTime" label="更新时间" width="160" align="center"></el-table-column>
                <el-table-column label="操作" width="120" align="center">
                    <template #default="scope">
                        <el-button type="danger" size="small" @click="handleRemoveFromColumn(scope.row)">
                            移除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination" v-if="articleTotal > 0">
                <el-pagination
                    background
                    layout="total, prev, pager, next"
                    :current-page="articleQuery.page"
                    :page-size="articleQuery.pageSize"
                    :total="articleTotal"
                    @current-change="handleArticlePageChange"
                ></el-pagination>
            </div>
        </div>

        <!-- 专栏编辑弹窗 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="70%" destroy-on-close>
            <div class="content-management">
                <div class="search-box">
                    <el-input
                        v-model="articleSearchQuery"
                        placeholder="搜索文章"
                        class="search-input"
                        @keyup.enter="searchAvailableArticles"
                        clearable
                    >
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                </div>
                <el-table
                    :data="availableArticles"
                    @selection-change="handleArticleSelectionChange"
                    max-height="400"
                    ref="articleTableRef"
                    v-loading="availableArticleLoading"
                >
                    <el-table-column type="selection" width="55"></el-table-column>
                    <el-table-column prop="title" label="标题" show-overflow-tooltip min-width="200"></el-table-column>
                    <el-table-column label="已包含" width="80" align="center">
                        <template #default="scope">
                            <el-tag v-if="isArticleInColumn(scope.row)" type="success" size="small">已添加</el-tag>
                            <el-tag v-else type="info" size="small">未添加</el-tag>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="pagination">
                    <el-pagination
                        background
                        layout="total, prev, pager, next"
                        :current-page="availableArticlePage"
                        :page-size="availableArticlePageSize"
                        :total="availableArticleTotal"
                        @current-change="handleAvailableArticlePageChange"
                    />
                </div>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="saveColumnContent">保 存</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="columns">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Search } from '@element-plus/icons-vue';
import { getArticlesByTagId, addArticleToColumn, removeArticleFromColumn } from '@/api/column';
import { getAllArticles } from '@/api/article';

// 专栏列表数据
const columnList = ref([
    {
        id: 1,
        name: '通知公告',
        icon: '📢',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-600',
        titleColor: 'text-red-800',
    },
    {
        id: 2,
        name: '思政要闻',
        icon: '📰',
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-600',
        titleColor: 'text-blue-800',
    },
    {
        id: 3,
        name: '政策文件',
        icon: '📋',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-600',
        titleColor: 'text-green-800',
    },
    {
        id: 4,
        name: '高校风采',
        icon: '🎓',
        color: 'purple',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-600',
        titleColor: 'text-purple-800',
    },
    {
        id: 5,
        name: '工作动态',
        icon: '💼',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-600',
        titleColor: 'text-yellow-800',
    },
    {
        id: 6,
        name: '典型经验',
        icon: '⭐',
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-600',
        titleColor: 'text-orange-800',
    },
    {
        id: 7,
        name: '案例分享',
        icon: '💡',
        color: 'indigo',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        textColor: 'text-indigo-600',
        titleColor: 'text-indigo-800',
    },
    {
        id: 8,
        name: '榜样力量',
        icon: '🏆',
        color: 'pink',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        textColor: 'text-pink-600',
        titleColor: 'text-pink-800',
    },
]);

// 选中的专栏
const selectedColumn = ref<any>(null);

// 当前专栏的文章
const currentArticles = ref<any[]>([]);
const articleLoading = ref(false);
const articleTotal = ref(0);

// 文章查询参数
const articleQuery = reactive({
    page: 1,
    pageSize: 10,
    title: '',
});

// 编辑弹窗相关
const dialogVisible = ref(false);
const dialogTitle = ref('管理专栏文章');

// 文章管理相关
const articleSearchQuery = ref('');
const availableArticles = ref<any[]>([]);
const selectedArticles = ref<any[]>([]);
const articleTableRef = ref();
const availableArticleLoading = ref(false);
const availableArticlePage = ref(1);
const availableArticlePageSize = ref(10);
const availableArticleTotal = ref(0);

// 专栏文章缓存
const columnArticlesCache = ref<Map<number, any[]>>(new Map());

// 加载状态
const loading = ref(false);

// 获取专栏文章数量
const getArticleCount = (columnId: number) => {
    const cachedArticles = columnArticlesCache.value.get(columnId);
    return cachedArticles ? cachedArticles.length : 0;
};

// 选择专栏
const selectColumn = async (column: any) => {
    selectedColumn.value = column;
    articleQuery.page = 1;
    articleQuery.title = '';
    await loadColumnArticles();
};

// 加载专栏文章
const loadColumnArticles = async () => {
    if (!selectedColumn.value) return;

    articleLoading.value = true;
    try {
        const cacheKey = selectedColumn.value.id;

        // 先检查缓存
        if (columnArticlesCache.value.has(cacheKey)) {
            const cachedArticles = columnArticlesCache.value.get(cacheKey)!;
            filterAndPaginateArticles(cachedArticles);
            return;
        }

        // 从API获取数据
        const res = await getArticlesByTagId(selectedColumn.value.id);

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            const articles = res.data.data.map((item: any) => ({
                id: item.id.toString(),
                title: item.title || '未命名文章',
                content: item.text || '',
                cover: item.head_image || '',
                author: item.creator || '未知作者',
                publishTime: item.update_time || '',
                updateTime: item.update_time || '',
                raw: item
            }));

            // 缓存数据
            columnArticlesCache.value.set(cacheKey, articles);
            filterAndPaginateArticles(articles);
        } else {
            currentArticles.value = [];
            articleTotal.value = 0;
            ElMessage.warning('该专栏暂无文章');
        }
    } catch (error) {
        ElMessage.error('获取专栏文章失败');
        console.error('获取专栏文章错误:', error);
        currentArticles.value = [];
        articleTotal.value = 0;
    } finally {
        articleLoading.value = false;
    }
};

// 过滤和分页文章
const filterAndPaginateArticles = (articles: any[]) => {
    let filteredArticles = articles;

    // 按标题过滤
    if (articleQuery.title) {
        filteredArticles = articles.filter(article =>
            article.title.toLowerCase().includes(articleQuery.title.toLowerCase())
        );
    }

    articleTotal.value = filteredArticles.length;

    // 分页
    const start = (articleQuery.page - 1) * articleQuery.pageSize;
    const end = start + articleQuery.pageSize;
    currentArticles.value = filteredArticles.slice(start, end);
};

// 搜索文章
const searchArticles = () => {
    articleQuery.page = 1;
    loadColumnArticles();
};

// 文章分页
const handleArticlePageChange = (page: number) => {
    articleQuery.page = page;
    loadColumnArticles();
};

// 管理专栏文章
const handleEditColumn = async () => {
    if (!selectedColumn.value) return;

    dialogTitle.value = `管理专栏文章 - ${selectedColumn.value.name}`;
    dialogVisible.value = true;

    // 加载可选文章
    await loadAvailableArticles();

    // 设置初始选择状态
    await nextTick();
    // 增加一个小延迟确保表格完全渲染
    setTimeout(() => {
        setArticleSelection();
    }, 100);
};



// 从专栏移除文章
const handleRemoveFromColumn = async (article: any) => {
    if (!selectedColumn.value) return;

    try {
        await ElMessageBox.confirm(
            `确定要将文章"${article.title}"从专栏"${selectedColumn.value.name}"中移除吗？`,
            '提示',
            { type: 'warning' }
        );

        await removeArticleFromColumn(selectedColumn.value.id, parseInt(article.id));

        // 更新缓存
        const cacheKey = selectedColumn.value.id;
        const cachedArticles = columnArticlesCache.value.get(cacheKey) || [];
        const updatedArticles = cachedArticles.filter(a => a.id !== article.id);
        columnArticlesCache.value.set(cacheKey, updatedArticles);

        // 重新加载当前页
        await loadColumnArticles();

        ElMessage.success('文章已从专栏中移除');
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('移除文章失败');
        }
    }
};

// 加载可选文章列表
const loadAvailableArticles = async () => {
    availableArticleLoading.value = true;
    try {
        const res = await getAllArticles();

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            availableArticles.value = res.data.data.map((item: any) => ({
                id: item.id.toString(),
                title: item.title || '未命名文章',
                content: item.text || '',
                cover: item.head_image || '',
                author: item.creator || '未知作者',
                publishTime: item.update_time || '',
                raw: item
            }));
            availableArticleTotal.value = availableArticles.value.length;
        }
    } catch (error) {
        ElMessage.error('获取文章列表失败');
        console.error('获取文章列表错误:', error);
    } finally {
        availableArticleLoading.value = false;
    }
};

// 搜索可选文章
const searchAvailableArticles = () => {
    loadAvailableArticles();
};

// 判断文章是否在专栏内
const isArticleInColumn = (article: any) => {
    if (!selectedColumn.value) return false;
    const cachedArticles = columnArticlesCache.value.get(selectedColumn.value.id) || [];
    return cachedArticles.some(a => a.id === article.id);
};

// 设置文章选择状态
const setArticleSelection = () => {
    if (!articleTableRef.value || availableArticles.value.length === 0) return;

    // 清除所有选择状态
    articleTableRef.value.clearSelection();

    // 选中已在专栏中的文章
    const rows = availableArticles.value.filter(article => isArticleInColumn(article));

    rows.forEach((row: any) => {
        articleTableRef.value.toggleRowSelection(row, true);
    });
};

// 文章选择变化
const handleArticleSelectionChange = (selection: any[]) => {
    selectedArticles.value = selection;
};

// 可选文章分页
const handleAvailableArticlePageChange = (page: number) => {
    availableArticlePage.value = page;
};

// 保存专栏内容
const saveColumnContent = async () => {
    if (!selectedColumn.value) return;

    try {
        // 获取当前专栏中的文章ID
        const currentArticleIds = (columnArticlesCache.value.get(selectedColumn.value.id) || []).map(a => parseInt(a.id));

        // 获取选中的文章ID
        const selectedArticleIds = selectedArticles.value.map(a => parseInt(a.id));

        // 计算需要添加和移除的文章
        const toAdd = selectedArticleIds.filter(id => !currentArticleIds.includes(id));
        const toRemove = currentArticleIds.filter(id => !selectedArticleIds.includes(id));

        // 执行添加操作
        if (toAdd.length > 0) {
            await Promise.all(toAdd.map(id => addArticleToColumn(selectedColumn.value.id, id)));
        }

        // 执行移除操作
        if (toRemove.length > 0) {
            await Promise.all(toRemove.map(id => removeArticleFromColumn(selectedColumn.value.id, id)));
        }

        // 更新缓存
        const updatedArticles = availableArticles.value.filter(article =>
            selectedArticleIds.includes(parseInt(article.id))
        );
        columnArticlesCache.value.set(selectedColumn.value.id, updatedArticles);

        ElMessage.success('专栏内容保存成功');
        dialogVisible.value = false;

        // 重新加载当前专栏文章
        if (selectedColumn.value.id === selectedColumn.value?.id) {
            await loadColumnArticles();
        }
    } catch (error) {
        ElMessage.error('保存失败');
        console.error('保存专栏内容失败:', error);
    }
};

onMounted(async () => {
    // 预加载所有专栏的文章数量
    loading.value = true;
    try {
        const promises = columnList.value.map(async (column) => {
            try {
                const res = await getArticlesByTagId(column.id);
                if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
                    const articles = res.data.data.map((item: any) => ({
                        id: item.id.toString(),
                        title: item.title || '未命名文章',
                        content: item.text || '',
                        cover: item.head_image || '',
                        author: item.creator || '未知作者',
                        publishTime: item.update_time || '',
                        raw: item
                    }));
                    columnArticlesCache.value.set(column.id, articles);
                }
            } catch (error) {
                console.error(`加载专栏 ${column.name} 文章失败:`, error);
            }
        });

        await Promise.all(promises);

        // 默认选中第一个专栏
        if (columnList.value.length > 0) {
            selectedColumn.value = columnList.value[0];
            await loadColumnArticles();
        }
    } finally {
        loading.value = false;
    }
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

/* 专栏网格布局 */
.columns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

/* 专栏卡片 */
.column-card {
    border: 2px solid #e4e7ed;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    position: relative;
    overflow: hidden;
}

/* 暗色模式下的专栏卡片 */
:root.dark .column-card {
    background: var(--card-bg, #1a1a1a);
    border-color: var(--card-border, #2d2d2d);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.column-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.column-card.active {
    border-color: #409eff;
    box-shadow: 0 8px 25px rgba(64, 158, 255, 0.2);
}

/* 暗色模式下的专栏卡片hover和active状态 */
:root.dark .column-card:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
}

:root.dark .column-card.active {
    border-color: var(--el-color-primary, #409eff);
    box-shadow: 0 8px 25px rgba(64, 158, 255, 0.3);
}

.column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
}

.column-icon {
    font-size: 32px;
    margin-right: 12px;
}

.column-title {
    font-size: 18px;
    font-weight: 600;
    flex: 1;
}


.column-content {
    text-align: center;
}

.article-count {
    font-size: 14px;
    font-weight: 500;
}

/* Tailwind样式背景色 */
.bg-red-50 { background-color: #fef2f2; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-green-50 { background-color: #f0fdf4; }
.bg-purple-50 { background-color: #faf5ff; }
.bg-yellow-50 { background-color: #fefce8; }
.bg-orange-50 { background-color: #fff7ed; }
.bg-indigo-50 { background-color: #eef2ff; }
.bg-pink-50 { background-color: #fdf2f8; }

.border-red-200 { border-color: #fecaca; }
.border-blue-200 { border-color: #bfdbfe; }
.border-green-200 { border-color: #bbf7d0; }
.border-purple-200 { border-color: #e9d5ff; }
.border-yellow-200 { border-color: #fef3c7; }
.border-orange-200 { border-color: #fed7aa; }
.border-indigo-200 { border-color: #c7d2fe; }
.border-pink-200 { border-color: #fbcfe8; }

.text-red-600 { color: #dc2626; }
.text-blue-600 { color: #2563eb; }
.text-green-600 { color: #16a34a; }
.text-purple-600 { color: #9333ea; }
.text-yellow-600 { color: #ca8a04; }
.text-orange-600 { color: #ea580c; }
.text-indigo-600 { color: #4f46e5; }
.text-pink-600 { color: #db2777; }

.text-red-800 { color: #991b1b; }
.text-blue-800 { color: #1e40af; }
.text-green-800 { color: #166534; }
.text-purple-800 { color: #6b21a8; }
.text-yellow-800 { color: #a16207; }
.text-orange-800 { color: #c2410c; }
.text-indigo-800 { color: #3730a3; }
.text-pink-800 { color: #9f1239; }

/* 文章列表区域 */
.articles-section {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
}

/* 暗色模式下的文章列表区域 */
:root.dark .articles-section {
    background: var(--card-bg, #1a1a1a);
    border: 1px solid var(--card-border, #2d2d2d);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #ebeef5;
    transition: all 0.3s ease;
}

/* 暗色模式下的section header */
:root.dark .section-header {
    border-bottom-color: var(--card-border, #2d2d2d);
}

.section-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    transition: color 0.3s ease;
}

/* 暗色模式下的section标题 */
:root.dark .section-header h3 {
    color: var(--text-primary, #e5eaf3);
}

.section-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-input {
    width: 300px;
}

.table {
    width: 100%;
    font-size: 14px;
}

.cover-img {
    width: 60px;
    height: 40px;
    border-radius: 4px;
}

.no-cover {
    color: #999;
    font-size: 12px;
    transition: color 0.3s ease;
}

/* 暗色模式下的无封面文字 */
:root.dark .no-cover {
    color: var(--text-regular, #a3a6ad);
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

/* 内容管理区域 */
.content-management {
    min-height: 300px;
    transition: all 0.3s ease;
}

/* 暗色模式下的内容管理区域 */
:root.dark .content-management {
    color: var(--text-primary, #e5eaf3);
}

.search-box {
    margin-bottom: 15px;
}

.search-input {
    width: 300px;
}

/* 弹窗样式优化 */
:deep(.el-dialog__body) {
    padding: 25px;
    transition: all 0.3s ease;
}

/* 暗色模式下的弹窗内容 */
:root.dark :deep(.el-dialog__body) {
    background: var(--card-bg, #1a1a1a);
    color: var(--text-primary, #e5eaf3);
}

/* 暗色模式下的表格样式 */
:root.dark :deep(.el-table) {
    background: var(--card-bg, #1a1a1a);
    color: var(--text-primary, #e5eaf3);
}

:root.dark :deep(.el-table th.el-table__cell) {
    background: var(--table-header-bg, #262727);
    color: var(--text-primary, #e5eaf3);
    border-bottom-color: var(--card-border, #2d2d2d);
}

:root.dark :deep(.el-table td.el-table__cell) {
    border-bottom-color: var(--card-border, #2d2d2d);
}

:root.dark :deep(.el-table--border .el-table__cell) {
    border-right-color: var(--card-border, #2d2d2d);
}

:root.dark :deep(.el-table--border) {
    border-color: var(--card-border, #2d2d2d);
}

/* 暗色模式下的输入框 */
:root.dark :deep(.el-input__wrapper) {
    background: var(--input-bg, #262727);
    border-color: var(--input-border, #2d2d2d);
    box-shadow: 0 0 0 1px var(--input-border, #2d2d2d) inset;
}

:root.dark :deep(.el-input__inner) {
    color: var(--text-primary, #e5eaf3);
    background: transparent;
}

:root.dark :deep(.el-input__prefix-inner) {
    color: var(--text-regular, #a3a6ad);
}

/* 暗色模式下的按钮 */
:root.dark :deep(.el-button) {
    color: var(--text-primary, #e5eaf3);
    border-color: var(--border-color, #4c4d4f);
    background: var(--button-bg, #262727);
}

:root.dark :deep(.el-button--primary) {
    background: var(--el-color-primary, #409eff);
    border-color: var(--el-color-primary, #409eff);
    color: #fff;
}

:root.dark :deep(.el-button--danger) {
    background: var(--el-color-danger, #f56c6c);
    border-color: var(--el-color-danger, #f56c6c);
    color: #fff;
}

/* 暗色模式下的标签 */
:root.dark :deep(.el-tag) {
    background: var(--tag-bg, #373739);
    border-color: var(--tag-border, #4c4d4f);
    color: var(--text-regular, #a3a6ad);
}

:root.dark :deep(.el-tag--success) {
    background: var(--el-color-success-light-8, #1a4c2a);
    border-color: var(--el-color-success-light-6, #53a868);
    color: var(--el-color-success, #67c23a);
}

:root.dark :deep(.el-tag--info) {
    background: var(--el-color-info-light-8, #2c2c2e);
    border-color: var(--el-color-info-light-6, #6c6e71);
    color: var(--el-color-info, #909399);
}

/* 暗色模式下的分页器 */
:root.dark :deep(.el-pagination) {
    color: var(--text-primary, #e5eaf3);
}

:root.dark :deep(.el-pagination .el-pagination__total),
:root.dark :deep(.el-pagination .el-pagination__jump) {
    color: var(--text-primary, #e5eaf3);
}

:root.dark :deep(.el-pagination button:disabled) {
    background: var(--button-disabled-bg, #262727);
    color: var(--text-disabled, #6c6e71);
}

:root.dark :deep(.el-pager li) {
    background: var(--button-bg, #262727);
    color: var(--text-primary, #e5eaf3);
    border-color: var(--border-color, #4c4d4f);
}

:root.dark :deep(.el-pager li:hover) {
    background: var(--el-color-primary-light-9, #1d3a5a);
}

:root.dark :deep(.el-pager li.is-active) {
    background: var(--el-color-primary, #409eff);
    color: #fff;
}
</style>