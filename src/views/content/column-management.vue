<template>
    <div class="container">
        <div class="handle-box">
            <el-input v-model="query.name" placeholder="专栏名称" class="handle-input mr10" @keyup.enter="handleSearch"></el-input>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
            <el-button type="primary" :icon="Plus" @click="handleCreate">新增专栏</el-button>
        </div>

        <el-table :data="tableData" border class="table" header-cell-class-name="table-header" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
            <el-table-column prop="name" label="专栏名称" show-overflow-tooltip></el-table-column>
            <el-table-column prop="description" label="专栏描述" show-overflow-tooltip></el-table-column>
            <el-table-column label="封面" width="100" align="center">
                <template #default="scope">
                    <el-image
                        v-if="scope.row.cover_image"
                        :src="scope.row.cover_image"
                        :preview-src-list="[scope.row.cover_image]"
                        class="cover-img"
                        fit="cover"
                    ></el-image>
                    <span v-else class="no-cover">无封面</span>
                </template>
            </el-table-column>
            <el-table-column prop="article_count" label="文章数量" width="100" align="center"></el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160" align="center"></el-table-column>
            <el-table-column prop="updated_at" label="更新时间" width="160" align="center"></el-table-column>
            <el-table-column label="操作" width="180" align="center">
                <template #default="scope">
                    <el-button type="primary" :icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
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
                <el-form-item label="专栏名称" prop="name">
                    <el-input v-model="form.name" placeholder="请输入专栏名称"></el-input>
                </el-form-item>
                <el-form-item label="专栏描述" prop="description">
                    <el-input
                        v-model="form.description"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入专栏描述"
                    ></el-input>
                </el-form-item>
                <el-form-item label="专栏封面">
                    <el-upload
                        class="cover-uploader"
                        :action="uploadUrl"
                        :show-file-list="false"
                        :on-success="handleCoverSuccess"
                        :before-upload="beforeCoverUpload"
                    >
                        <img v-if="form.cover_image" :src="form.cover_image" class="cover-uploader-img" />
                        <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
                    </el-upload>
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="handleSubmit">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="column-management">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue';
import type { Column } from '@/types/column';
import { getAllColumns, createColumn, updateColumn, deleteColumn } from '@/api/column';

// 查询参数
const query = reactive({
    page: 1,
    pageSize: 10,
    name: '',
});

// 表格数据
const tableData = ref<Column[]>([]);
const pageTotal = ref(0);

// 加载状态
const loading = ref(false);

// 弹窗控制
const dialogVisible = ref(false);
const dialogTitle = ref('新增专栏');
const formRef = ref();

// 表单数据
const form = reactive<Column>({
    id: 0,
    name: '',
    description: '',
    cover_image: '',
    article_count: 0,
    created_at: '',
    updated_at: '',
});

// 表单验证规则
const rules = {
    name: [{ required: true, message: '请输入专栏名称', trigger: 'blur' }],
    description: [{ required: true, message: '请输入专栏描述', trigger: 'blur' }],
};

// 上传地址
const uploadUrl = '/api/upload';

// 获取专栏列表
const getColumns = async () => {
    loading.value = true;
    try {
        const res = await getAllColumns();

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            // 将API数据转换为前端需要的格式
            const columns = res.data.data.map((item: any) => {
                return {
                    id: item.column_id || item.id,
                    name: item.name || '未命名专栏',
                    description: item.description || '',
                    cover_image: item.cover_image || '',
                    article_count: item.article_count || 0,
                    created_at: item.created_at || '',
                    updated_at: item.updated_at || '',
                    // 保留原始API数据
                    raw: item
                };
            });

            // 应用筛选条件
            let filteredData = columns.filter((column: any) => {
                if (query.name && !column.name.includes(query.name)) return false;
                return true;
            });

            tableData.value = filteredData;
            pageTotal.value = filteredData.length;
        } else {
            // 使用模拟数据作为fallback
            const mockData: Column[] = [
                {
                    id: 1,
                    name: '通知公告',
                    description: '发布重要通知和公告信息',
                    cover_image: '',
                    article_count: 5,
                    created_at: '2025-01-01 10:00:00',
                    updated_at: '2025-01-01 10:00:00',
                },
                {
                    id: 2,
                    name: '思政要闻',
                    description: '思想政治相关重要新闻',
                    cover_image: '',
                    article_count: 3,
                    created_at: '2025-01-02 10:00:00',
                    updated_at: '2025-01-02 10:00:00',
                },
                {
                    id: 3,
                    name: '政策文件',
                    description: '相关政策文件发布',
                    cover_image: '',
                    article_count: 8,
                    created_at: '2025-01-03 10:00:00',
                    updated_at: '2025-01-03 10:00:00',
                },
                {
                    id: 4,
                    name: '高校风采',
                    description: '展示各高校的特色和成就',
                    cover_image: '',
                    article_count: 12,
                    created_at: '2025-01-04 10:00:00',
                    updated_at: '2025-01-04 10:00:00',
                },
            ];

            // 应用筛选条件
            let filteredData = mockData.filter(column => {
                if (query.name && !column.name.includes(query.name)) return false;
                return true;
            });

            tableData.value = filteredData;
            pageTotal.value = filteredData.length;
        }
    } catch (error) {
        ElMessage.error('获取专栏列表失败');
        console.error('获取专栏列表错误:', error);

        // 使用模拟数据作为fallback
        const mockData: Column[] = [
            {
                id: 1,
                name: '通知公告',
                description: '发布重要通知和公告信息',
                cover_image: '',
                article_count: 5,
                created_at: '2025-01-01 10:00:00',
                updated_at: '2025-01-01 10:00:00',
            },
            {
                id: 2,
                name: '思政要闻',
                description: '思想政治相关重要新闻',
                cover_image: '',
                article_count: 3,
                created_at: '2025-01-02 10:00:00',
                updated_at: '2025-01-02 10:00:00',
            },
            {
                id: 3,
                name: '政策文件',
                description: '相关政策文件发布',
                cover_image: '',
                article_count: 8,
                created_at: '2025-01-03 10:00:00',
                updated_at: '2025-01-03 10:00:00',
            },
            {
                id: 4,
                name: '高校风采',
                description: '展示各高校的特色和成就',
                cover_image: '',
                article_count: 12,
                created_at: '2025-01-04 10:00:00',
                updated_at: '2025-01-04 10:00:00',
            },
        ];

        // 应用筛选条件
        let filteredData = mockData.filter(column => {
            if (query.name && !column.name.includes(query.name)) return false;
            return true;
        });

        tableData.value = filteredData;
        pageTotal.value = filteredData.length;
    } finally {
        loading.value = false;
    }
};

// 搜索
const handleSearch = async () => {
    query.page = 1;
    await getColumns();
};

// 分页切换
const handlePageChange = async (val: number) => {
    query.page = val;
    await getColumns();
};

// 新增专栏
const handleCreate = () => {
    dialogTitle.value = '新增专栏';
    dialogVisible.value = true;
    resetForm();
};

// 编辑专栏
const handleEdit = (row: Column) => {
    dialogTitle.value = '编辑专栏';
    dialogVisible.value = true;
    Object.assign(form, row);
};

// 删除专栏
const handleDelete = async (row: Column) => {
    try {
        await ElMessageBox.confirm('确定要删除这个专栏吗？删除后不可恢复！', '提示', {
            type: 'warning',
        });

        // 调用删除API
        await deleteColumn(row.id);

        ElMessage.success('删除成功');
        await getColumns();
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败');
        }
    }
};

// 提交表单
const submitForm = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        // 调用创建或更新API
        if (form.id) {
            // 更新专栏
            const updateData = {
                column_id: form.id,
                name: form.name,
                description: form.description,
                cover_image: form.cover_image || undefined
            };
            await updateColumn(updateData);
        } else {
            // 创建专栏
            const createData = {
                name: form.name,
                description: form.description,
                cover_image: form.cover_image || undefined
            };
            await createColumn(createData);
        }

        ElMessage.success(form.id ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        await getColumns();
    } catch (error) {
        ElMessage.error(form.id ? '更新失败' : '创建失败');
    }
};

// 提交表单
const handleSubmit = () => {
    submitForm();
};

// 重置表单
const resetForm = () => {
    Object.assign(form, {
        id: 0,
        name: '',
        description: '',
        cover_image: '',
        article_count: 0,
        created_at: '',
        updated_at: '',
    });
};

// 封面上传成功
const handleCoverSuccess = (res: any) => {
    form.cover_image = res.url;
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

onMounted(async () => {
    await getColumns();
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

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>