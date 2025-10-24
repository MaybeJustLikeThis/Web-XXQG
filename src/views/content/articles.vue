<template>
    <div class="container">
        <div class="handle-box">
            <el-button type="primary" :icon="Plus" @click="handleCreate">新增文章</el-button>
            <el-input v-model="query.title" placeholder="文章标题" class="handle-input mr10" @keyup.enter="handleSearch"></el-input>
            <el-select v-model="query.status" placeholder="状态" class="handle-select mr10">
                <el-option label="全部" value=""></el-option>
                <el-option label="已发布" value="published"></el-option>
                <el-option label="草稿" value="draft"></el-option>
                <el-option label="已撤稿" value="withdrawn"></el-option>
            </el-select>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header">
            <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
            <el-table-column prop="title" label="标题" show-overflow-tooltip></el-table-column>
            <el-table-column prop="summary" label="摘要" show-overflow-tooltip></el-table-column>
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
            <el-table-column label="标签" width="150" align="center">
                <template #default="scope">
                    <el-tag v-for="tag in scope.row.tags" :key="tag" size="small" class="mr5">{{ tag }}</el-tag>
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
            <el-table-column prop="publishTime" label="发布时间" width="160" align="center"></el-table-column>
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
                <el-form-item label="文章摘要" prop="summary">
                    <el-input v-model="form.summary" type="textarea" rows="3" placeholder="请输入文章摘要"></el-input>
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
                            :key="item"
                            :label="item"
                            :value="item"
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

<script setup lang="ts" name="articles">
import { ref, reactive, onMounted, shallowRef } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search, Remove } from '@element-plus/icons-vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import type { Article, ArticleQuery } from '@/types/content';

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

// 查询参数
const query = reactive<ArticleQuery>({
    page: 1,
    pageSize: 10,
    title: '',
    status: undefined,
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

// 标签选项
const tagOptions = ref(['技术', '前端', '后端', '数据库', '算法', '架构', '运维']);

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

// 获取文章列表
const getArticles = () => {
    // 模拟数据
    const mockData: Article[] = [
        {
            id: '1',
            title: 'Vue3 Composition API 最佳实践',
            content: '<p>Vue3 Composition API 最佳实践内容...</p>',
            summary: '本文介绍了Vue3 Composition API的最佳实践方法',
            cover: 'https://via.placeholder.com/300x200/4CAF50/ffffff?text=Vue3',
            tags: ['技术', '前端', 'Vue3'],
            status: 'published',
            author: 'admin',
            publishTime: '2024-01-15 10:30:00',
            updateTime: '2024-01-15 10:30:00',
            viewCount: 1250,
        },
        {
            id: '2',
            title: 'TypeScript 高级类型详解',
            content: '<p>TypeScript 高级类型详解内容...</p>',
            summary: '深入理解TypeScript的高级类型系统',
            cover: '',
            tags: ['技术', '前端', 'TypeScript'],
            status: 'draft',
            author: 'admin',
            publishTime: '',
            updateTime: '2024-01-14 15:20:00',
            viewCount: 0,
        },
    ];

    tableData.value = mockData;
    pageTotal.value = mockData.length;
};

// 搜索
const handleSearch = () => {
    query.page = 1;
    getArticles();
};

// 分页切换
const handlePageChange = (val: number) => {
    query.page = val;
    getArticles();
};

// 新增文章
const handleCreate = () => {
    dialogTitle.value = '新增文章';
    dialogVisible.value = true;
    resetForm();
};

// 编辑文章
const handleEdit = (row: Article) => {
    dialogTitle.value = '编辑文章';
    dialogVisible.value = true;
    Object.assign(form, row);
};

// 撤稿
const handleWithdraw = (row: Article) => {
    ElMessageBox.confirm('确定要撤稿这篇文章吗？', '提示', {
        type: 'warning',
    }).then(() => {
        // 模拟撤稿操作
        ElMessage.success('撤稿成功');
        getArticles();
    });
};

// 删除文章
const handleDelete = (row: Article) => {
    ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', {
        type: 'warning',
    }).then(() => {
        // 模拟删除操作
        ElMessage.success('删除成功');
        getArticles();
    });
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
const submitForm = () => {
    formRef.value.validate((valid: boolean) => {
        if (valid) {
            // 模拟提交操作
            ElMessage.success(form.id ? '更新成功' : '创建成功');
            dialogVisible.value = false;
            getArticles();
        }
    });
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
    getArticles();
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
</style>