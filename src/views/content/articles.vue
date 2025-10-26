<template>
    <div class="container">
        <div class="handle-box">
            <el-input v-model="query.title" placeholder="文章标题" class="handle-input mr10"
                @keyup.enter="handleSearch"></el-input>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
            <el-button type="success" :icon="Plus" @click="handleCreate" class="ml10">添加文章</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header">
            <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
            <el-table-column prop="title" label="标题" show-overflow-tooltip></el-table-column>
            <el-table-column label="封面" width="100" align="center">
                <template #default="scope">
                    <el-image v-if="scope.row.cover" :src="scope.row.cover" :preview-src-list="[scope.row.cover]"
                        class="cover-img" fit="cover"></el-image>
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
            <el-table-column label="操作" width="150" align="center">
                <template #default="scope">
                    <el-button type="primary" :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
                    <el-button type="danger" :icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination">
            <el-pagination background layout="total, prev, pager, next" :current-page="query.page"
                :page-size="query.pageSize" :total="pageTotal" @current-change="handlePageChange"></el-pagination>
        </div>

        <!-- 新增/编辑弹窗 -->
        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="80%" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="文章标题" prop="title">
                    <el-input v-model="form.title" placeholder="请输入文章标题"></el-input>
                </el-form-item>
                <el-form-item label="文章封面" prop="cover">
                    <el-upload class="cover-uploader" :auto-upload="false" :show-file-list="false"
                        :on-change="handleCoverChange" :before-upload="beforeCoverUpload">
                        <img v-if="form.cover" :src="form.cover" class="cover-uploader-img" />
                        <el-icon v-else class="cover-uploader-icon">
                            <Plus />
                        </el-icon>
                    </el-upload>
                </el-form-item>
                <el-form-item label="标签" prop="tags">
                    <el-select v-model="form.tags" multiple filterable allow-create default-first-option
                        placeholder="请选择或输入标签">
                        <el-option v-for="item in tagOptions" :key="item" :label="item" :value="item"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="文章内容" prop="content">
                    <div style="border: 1px solid #ccc">
                        <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef"
                            :defaultConfig="toolbarConfig" />
                        <Editor style="height: 400px; overflow-y: hidden" v-model="form.content"
                            :defaultConfig="editorConfig" @onCreated="handleCreated" />
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
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import type { Article, ArticleQuery } from '@/types/content';
import { getAllArticles, deleteArticle, updateArticle, addArticle } from '@/api/article';
import { uploadFile } from '@/utils/upload';

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();


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

// 自定义图片上传函数
const customUploadImage = async (file: File, insertFn: Function) => {
    try {
        const imageUrl = await uploadFile(file);
        insertFn(imageUrl, file.name, imageUrl);
    } catch (error) {
        ElMessage.error('图片上传失败');
    }
};

// 自定义视频上传函数
const customUploadVideo = async (file: File, insertFn: Function) => {
    try {
        console.log('开始上传视频:', file.name);
        console.log('视频文件信息:', {
            name: file.name,
            type: file.type,
            size: (file.size / 1024 / 1024).toFixed(2) + 'MB'
        });

        // 验证视频文件格式
        const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp4|avi|mov|wmv|mpeg)$/i)) {
            throw new Error('不支持的视频格式，请上传 MP4、AVI、MOV、WMV 或 MPEG 格式的视频');
        }

        // 验证视频文件大小（限制100MB）
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            throw new Error('视频文件过大，请上传小于100MB的视频文件');
        }

        const videoUrl = await uploadFile(file);
        console.log('视频上传成功，URL:', videoUrl);

        // wangeditor的insertVideo函数格式：insertVideo(src, poster)
        // 这会自动生成正确的<video>标签
        insertFn(videoUrl, '');
        console.log('视频已插入到编辑器，生成的标签格式：<video>');

        ElMessage.success('视频上传成功');
    } catch (error) {
        console.error('视频上传失败:', error);
        ElMessage.error(error.message || '视频上传失败');
    }
};

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
        'uploadVideo',
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
            customUpload: customUploadImage,
        },
        uploadVideo: {
            customUpload: customUploadVideo,
        },
    },
};

// 获取文章列表
const getArticles = async () => {
    try {
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
                    status: 'published', // API没有返回状态，默认为已发布
                    author: item.creator || '未知作者',
                    publishTime: item.update_time || '',
                    updateTime: item.update_time || '',
                    viewCount: item.comments ? item.comments.length : 0, // 使用评论数作为浏览量
                    commentCount: item.comments ? item.comments.length : 0, // 评论数量
                    // 保留原始API数据
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
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        ElMessage.error('获取文章列表失败');
        console.error('获取文章列表错误:', error);

        // 使用模拟数据作为fallback，与真实API数据格式一致
        const mockData: Article[] = [
            {
                id: '1',
                title: '深入学习贯彻党的二十大精神 扎实推进高校思想政治工作高质量发展',
                content: ' <h2>引言</h2>\n<p>党的二十大是在全党全国各族人民迈上全面建设社会主义现代化国家新征程、向第二个百年奋斗目标进军的关键时刻召开的一次十分重要的大会。</p>',
                cover: 'https://tyut-qiangguo.oss-cn-beijing.aliyuncs.com/%E6%88%AA%E5%B1%8F2025-10-13%2000.15.05.png',
                tags: ['思想政治', '党的二十大精神', '高校发展'],
                status: 'published',
                author: '任博轩',
                publishTime: '2025-10-13 23:49:09',
                updateTime: '2025-10-13 23:49:09',
                viewCount: 7,
            },
            {
                id: '2',
                title: '这是第二个文章的标题',
                content: '第二篇文章，第二个内容',
                cover: 'https://tyut-qiangguo.oss-cn-beijing.aliyuncs.com/%E6%88%AA%E5%B1%8F2025-10-13%2000.15.05.png',
                tags: ['教育', '学习'],
                status: 'published',
                author: '任博轩',
                publishTime: '2025-10-13 23:53:05',
                updateTime: '2025-10-13 23:53:05',
                viewCount: 5,
            },
        ];

        // 应用筛选条件
        let filteredData = mockData.filter(article => {
            if (query.title && !article.title.includes(query.title)) return false;
            return true;
        });

        tableData.value = filteredData;
        pageTotal.value = filteredData.length;
    }
};

// 搜索
const handleSearch = async () => {
    query.page = 1;
    await getArticles();
};

// 分页切换
const handlePageChange = async (val: number) => {
    query.page = val;
    await getArticles();
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


// 删除文章
const handleDelete = async (row: Article) => {
    try {
        await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', {
            type: 'warning',
        });

        // 调用删除API
        await deleteArticle(parseInt(row.id));

        ElMessage.success('删除成功');
        await getArticles();
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
            // 构造编辑接口所需的参数格式
            const updateData = {
                id: parseInt(form.id),
                title: form.title,
                text: form.content, // 富文本编辑器内容已经是HTML格式
                head_image: form.cover || undefined // 如果有封面则传递，否则不传递
            };
            await updateArticle(updateData);
            ElMessage.success('文章更新成功');
            dialogVisible.value = false;
            await getArticles();
        } else {
            // 使用add接口创建新文章
            const addData = {
                title: form.title,
                text: form.content, // 富文本编辑器内容已经是HTML格式
                head_image: form.cover || undefined // 如果有封面则传递，否则不传递
            };
            await addArticle(addData);
            ElMessage.success('文章创建成功');
            dialogVisible.value = false;
            await getArticles();
        }
    } catch (error) {
        console.error('提交文章失败:', error);
        ElMessage.error(error.message || '提交失败');
    }
};

// 编辑器创建回调
const handleCreated = (editor: any) => {
    editorRef.value = editor;
};

// 重置表单
const resetForm = () => {
    Object.assign(form, {
        id: '',
        title: '',
        content: '',
        summary: '', // 保留字段以避免类型错误
        cover: '',
        tags: [],
        status: 'draft',
        author: 'admin',
        publishTime: '',
        updateTime: '',
        viewCount: 0,
        commentCount: 0,
    });
};

// 封面处理函数
const handleCoverChange = async (file: any) => {
    try {
        const coverUrl = await uploadFile(file.raw);
        form.cover = coverUrl;
        ElMessage.success('封面上传成功');
    } catch (error) {
        ElMessage.error('封面上传失败');
    }
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


// 状态类型
const statusType = (status: string) => {
    const types = {
        published: 'success',
        draft: 'info',
    };
    return types[status as keyof typeof types] || 'info';
};

// 状态文本
const statusText = (status: string) => {
    const texts = {
        published: '已发布',
        draft: '草稿',
    };
    return texts[status as keyof typeof texts] || '未知';
};

onMounted(async () => {
    await getArticles();
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

.ml10 {
    margin-left: 10px;
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