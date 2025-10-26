<template>
    <div class="container">
        <div class="handle-box">
            <el-select v-model="selectedTagId" placeholder="请选择专栏" @change="handleTagChange" style="width: 200px;">
                <el-option
                    v-for="tag in tagOptions"
                    :key="tag.id"
                    :label="tag.name"
                    :value="tag.id"
                ></el-option>
            </el-select>
            <el-input v-model="query.title" placeholder="文章标题" class="handle-input" @keyup.enter="handleSearch"></el-input>
            <el-button type="primary" :icon="Search" @click="handleSearch">
                搜索
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleCreate" v-if="selectedTagId">
                新增文章
            </el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header" v-loading="loading">
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
            <el-table-column label="作者" width="120" align="center">
                <template #default="scope">
                    {{ scope.row.author }}
                </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="scope">
                    <el-tag :type="statusType(scope.row.status)">
                        {{ statusText(scope.row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="viewCount" label="浏览量" width="100" align="center"></el-table-column>
            <el-table-column prop="commentCount" label="评论数" width="100" align="center"></el-table-column>
            <el-table-column prop="publishTime" label="更新时间" width="160" align="center"></el-table-column>
            <el-table-column label="操作" width="220" align="center">
                <template #default="scope">
                    <el-button type="primary" :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button
                        v-if="scope.row.status === 'published'"
                        type="warning"
                        :icon="Remove"
                        @click="handleWithdraw(scope.row)"
                    >
                        撤稿
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
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="80%" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="文章标题" prop="title">
                    <el-input v-model="form.title" placeholder="请输入文章标题"></el-input>
                </el-form-item>
                <el-form-item label="所属专栏">
                    <el-input :value="getCurrentTagName()" readonly></el-input>
                </el-form-item>
                <el-form-item label="文章封面" prop="cover">
                    <el-upload
                        class="cover-uploader"
                        :action="uploadUrl"
                        :show-file-list="false"
                        :on-success="handleCoverSuccess"
                        :before-upload="beforeCoverUpload"
                    >
                        <img v-if="form.cover" :src="form.cover" class="cover-uploader-img" />
                        <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
                    </el-upload>
                </el-form-item>
                <el-form-item label="标签" prop="tags">
                    <el-select
                        v-model="form.tags"
                        multiple
                        filterable
                        allow-create
                        default-first-option
                        placeholder="请选择或输入标签"
                    >
                        <el-option
                            v-for="item in tagOptions"
                            :key="item.id"
                            :label="item.name"
                            :value="item.name"
                        ></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="文章内容" prop="content">
                    <div style="border: 1px solid #ccc">
                        <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig" />
                        <Editor
                            style="height: 400px; overflow-y: hidden"
                            v-model="form.content"
                            :defaultConfig="editorConfig"
                            @onCreated="handleCreated"
                        />
                    </div>
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
    </div>
</template>

<script setup lang="ts" name="columns">
import { ref, reactive, onMounted, shallowRef, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search, Remove } from '@element-plus/icons-vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import type { Article, ArticleQuery } from '@/types/content';
import { getArticlesByTagId, deleteArticle, updateArticle, createArticle } from '@/api/article';

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

// 加载状态
const loading = ref(false);

// 选中的专栏ID
const selectedTagId = ref<number | null>(null);

// 查询参数
const query = reactive<ArticleQuery>({
    page: 1,
    pageSize: 10,
    title: '',
});

// 表格数据
const tableData = ref<Article[]>([]);
const pageTotal = ref(0);

// 弹窗控制
const dialogVisible = ref(false);
const dialogTitle = ref('新增文章');
const formRef = ref();

// 表单数据
const form = reactive<Article>({
    id: '',
    title: '',
    content: '',
    summary: '',
    cover: '',
    tags: [],
    status: 'draft',
    author: 'admin',
    publishTime: '',
    updateTime: '',
    viewCount: 0,
});

// 表单验证规则
const rules = {
    title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }],
};

// 专栏选项（8个专栏 + 全部选项）
const tagOptions = ref([
    { id: null, name: '全部专栏' },
    { id: 1, name: '通知公告' },
    { id: 2, name: '思政要闻' },
    { id: 3, name: '政策文件' },
    { id: 4, name: '高校风采' },
    { id: 5, name: '工作动态' },
    { id: 6, name: '典型经验' },
    { id: 7, name: '案例分享' },
    { id: 8, name: '榜样力量' }
]);

// 上传地址
const uploadUrl = '/api/upload';

// 编辑器配置
const toolbarConfig = {
    toolbarKeys: [
        'headerSelect',
        'bold',
        'italic',
        'underline',
        'through',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'indent',
        'delIndent',
        'insertLink',
        'uploadImage',
        'insertVideo',
        'insertTable',
        'codeBlock',
        'divider',
        'undo',
        'redo',
    ],
};

const editorConfig = {
    placeholder: '请输入文章内容...',
    MENU_CONF: {
        uploadImage: {
            server: '/api/upload/image',
            fieldName: 'file',
        },
    },
};

// 获取当前选中的专栏名称
const getCurrentTagName = computed(() => {
    if (selectedTagId.value === null) return '全部专栏';
    const tag = tagOptions.value.find(t => t.id === selectedTagId.value);
    return tag ? tag.name : '';
});

// 根据专栏获取文章列表
const getArticlesByTag = async () => {
    // 如果没有选择专栏（选择的是"全部专栏"），则获取所有文章
    if (selectedTagId.value === null) {
        loading.value = true;
        try {
            // 调用获取所有文章的接口
            const { getAllArticles } = await import('@/api/article');
            const res = await getAllArticles();

            if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
                // 将API数据转换为前端需要的格式
                const articles = res.data.data.map((item: any) => {
                    return {
                        id: item.id.toString(),
                        title: item.title || '未命名文章',
                        content: item.text || '',
                        cover: item.head_image || '',
                        tags: item.tags || [],
                        status: 'published',
                        author: item.creator || '未知作者',
                        publishTime: item.update_time || '',
                        updateTime: item.update_time || '',
                        viewCount: item.comments ? item.comments.length : 0,
                        commentCount: item.comments ? item.comments.length : 0,
                        raw: item
                    };
                });

                // 应用筛选条件
                let filteredData = articles.filter((article: any) => {
                    if (query.title && !article.title.includes(query.title)) return false;
                    return true;
                });

                tableData.value = filteredData;
                pageTotal.value = filteredData.length;
            } else {
                ElMessage.error('获取文章列表失败');
                tableData.value = [];
                pageTotal.value = 0;
            }
        } catch (error) {
            ElMessage.error('获取文章列表失败');
            console.error('获取文章列表错误:', error);
            tableData.value = [];
            pageTotal.value = 0;
        } finally {
            loading.value = false;
        }
        return;
    }

    // 如果选择了具体专栏，则按专栏ID获取文章
    loading.value = true;
    try {
        const res = await getArticlesByTagId(selectedTagId.value);

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            // 将API数据转换为前端需要的格式
            const articles = res.data.data.map((item: any) => {
                return {
                    id: item.id.toString(),
                    title: item.title || '未命名文章',
                    content: item.text || '',
                    cover: item.head_image || '',
                    tags: item.tags || [],
                    status: 'published',
                    author: item.creator || '未知作者',
                    publishTime: item.update_time || '',
                    updateTime: item.update_time || '',
                    viewCount: item.comments ? item.comments.length : 0,
                    commentCount: item.comments ? item.comments.length : 0,
                    raw: item
                };
            });

            // 应用筛选条件
            let filteredData = articles.filter((article: any) => {
                if (query.title && !article.title.includes(query.title)) return false;
                return true;
            });

            tableData.value = filteredData;
            pageTotal.value = filteredData.length;
        } else {
            ElMessage.error('获取文章列表失败');
            tableData.value = [];
            pageTotal.value = 0;
        }
    } catch (error) {
        ElMessage.error('获取文章列表失败');
        console.error('获取文章列表错误:', error);
        tableData.value = [];
        pageTotal.value = 0;
    } finally {
        loading.value = false;
    }
};

// 搜索
const handleSearch = async () => {
    query.page = 1;
    await getArticlesByTag();
};

// 专栏切换
const handleTagChange = () => {
    tableData.value = [];
    pageTotal.value = 0;
    // 无论选择哪个专栏（包括"全部专栏"），都触发数据加载
    getArticlesByTag();
};

// 分页切换
const handlePageChange = async (val: number) => {
    query.page = val;
    await getArticlesByTag();
};

// 新增文章
const handleCreate = () => {
    dialogTitle.value = '新增文章';
    dialogVisible.value = true;
    resetForm();
    // 设置默认专栏标签
    if (selectedTagId.value) {
        const currentTag = tagOptions.value.find(t => t.id === selectedTagId.value);
        if (currentTag) {
            form.tags = [currentTag.name];
        }
    }
};

// 编辑文章
const handleEdit = (row: Article) => {
    dialogTitle.value = '编辑文章';
    dialogVisible.value = true;
    Object.assign(form, row);
};

// 撤稿
const handleWithdraw = async (row: Article) => {
    try {
        await ElMessageBox.confirm('确定要撤稿这篇文章吗？', '提示', {
            type: 'warning',
        });

        // TODO: 调用撤稿API
        // await updateArticleStatus(row.id, 'withdrawn');

        ElMessage.success('撤稿成功');
        await getArticlesByTag();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('撤稿失败');
        }
    }
};

// 删除文章
const handleDelete = async (row: Article) => {
    try {
        await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', {
            type: 'warning',
        });

        // 调用删除API
        await deleteArticle(parseInt(row.id));

        ElMessage.success('删除成功');
        await getArticlesByTag();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
        }
    }
};

// 保存草稿
const handleSaveDraft = () => {
    form.status = 'draft';
    submitForm();
};

// 提交表单
const handleSubmit = () => {
    form.status = 'published';
    submitForm();
};

// 提交表单逻辑
const submitForm = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        // 调用创建或更新API
        if (form.id) {
            const updateData = {
                id: parseInt(form.id),
                title: form.title,
                text: form.content,
                head_image: form.cover || undefined
            };
            await updateArticle(updateData);
        } else {
            await createArticle(form);
        }

        ElMessage.success(form.id ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        await getArticlesByTag();
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
        title: '',
        content: '',
        summary: '',
        cover: '',
        tags: [],
        status: 'draft',
        author: 'admin',
        publishTime: '',
        updateTime: '',
        viewCount: 0,
    });
};

// 封面上传成功
const handleCoverSuccess = (res: any) => {
    form.cover = res.url;
};

// 封面上传前检查
const beforeCoverUpload = (file: File) => {
    const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
    const isLt2M = file.size / 1024 / 1024 < 2;

    if (!isJPG) {
        ElMessage.error('封面图片只能是 JPG/PNG 格式!');
    }
    if (!isLt2M) {
        ElMessage.error('封面图片大小不能超过 2MB!');
    }
    return isJPG && isLt2M;
};

// 编辑器创建
const handleCreated = (editor: any) => {
    editorRef.value = editor;
};

// 状态类型
const statusType = (status: string) => {
    const types = {
        published: 'success',
        draft: 'info',
        withdrawn: 'warning',
    };
    return types[status as keyof typeof types] || 'info';
};

// 状态文本
const statusText = (status: string) => {
    const texts = {
        published: '已发布',
        draft: '草稿',
        withdrawn: '已撤稿',
    };
    return texts[status as keyof typeof texts] || '未知';
};

onMounted(() => {
    // 页面加载时不自动加载数据，等待用户选择专栏
});
</script>

<style scoped>
.handle-box {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
    align-items: center;
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

.cover-img {
    width: 60px;
    height: 40px;
    border-radius: 4px;
}

.no-cover {
    color: #999;
    font-size: 12px;
}

.cover-uploader {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: 0.2s;
}

.cover-uploader:hover {
    border-color: #409eff;
}

.cover-uploader-img {
    width: 178px;
    height: 178px;
    display: block;
}

.cover-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>