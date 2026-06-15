<template>
    <el-dialog
        :model-value="visible"
        :title="mode === 'add' ? '新增用户信息' : '编辑用户信息'"
        width="480px"
        :close-on-click-modal="false"
        @close="handleClose"
    >
        <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
            <el-form-item label="用户名" prop="name">
                <el-input v-model="form.name" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="性别" prop="sex">
                <el-select v-model="form.sex" placeholder="请选择性别" style="width: 100%">
                    <el-option v-for="opt in SEX_OPTIONS" :key="opt" :label="opt" :value="opt" />
                </el-select>
            </el-form-item>
            <el-form-item label="民族" prop="race">
                <el-input v-model="form.race" placeholder="请输入民族" />
            </el-form-item>
            <el-form-item label="政治面貌" prop="political_status">
                <el-input v-model="form.political_status" placeholder="请输入政治面貌" />
            </el-form-item>
            <el-form-item label="手机号" prop="id_number">
                <el-input v-model="form.id_number" placeholder="请输入手机号" />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { createUser, updateUserByAdmin } from '@/api/user';
import { showError } from '@/utils/errorHandler';
import type { DepartmentUser } from '@/types/organization';

// 性别可选项。若后端要求数字编码，仅需把此处改成 [{ label: '男', value: 1 }, ...] 并同步 value 绑定。
const SEX_OPTIONS = ['男', '女'] as const;

const props = defineProps<{
    visible: boolean;
    mode: 'add' | 'edit';
    departmentId: number | null;
    user: DepartmentUser | null;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
    'success': [];
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);

interface MemberForm {
    name: string;
    sex: string;
    race: string;
    political_status: string;
    id_number: string;
}

const form = reactive<MemberForm>({
    name: '',
    sex: '',
    race: '',
    political_status: '',
    id_number: ''
});

const rules: FormRules = {
    name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    id_number: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
};

watch(
    () => props.visible,
    (v) => {
        if (!v) return;
        if (props.mode === 'edit' && props.user) {
            form.name = props.user.name || '';
            form.sex = props.user.sex || '';
            form.race = props.user.race || '';
            form.political_status = props.user.political_status || '';
            form.id_number = props.user.id_number || '';
        } else {
            form.name = '';
            form.sex = '';
            form.race = '';
            form.political_status = '';
            form.id_number = '';
        }
        formRef.value?.clearValidate();
    }
);

const handleClose = () => emit('update:visible', false);

const handleSubmit = async () => {
    if (!formRef.value) return;
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    submitting.value = true;
    try {
        if (props.mode === 'add') {
            if (!props.departmentId) {
                ElMessage.warning('未选择部门');
                return;
            }
            const res = await createUser({
                department_id: props.departmentId,
                ...form
            });
            if (res.data && res.data.code === 200) {
                ElMessage.success('新增成功');
                emit('success');
                handleClose();
            } else {
                showError(res, '新增失败');
            }
        } else {
            if (!props.user) return;
            const res = await updateUserByAdmin(props.user.id, { ...form });
            if (res.data && res.data.code === 200) {
                ElMessage.success('修改成功');
                emit('success');
                handleClose();
            } else {
                showError(res, '修改失败');
            }
        }
    } catch (error) {
        showError(error, props.mode === 'add' ? '新增失败' : '修改失败');
    } finally {
        submitting.value = false;
    }
};
</script>
