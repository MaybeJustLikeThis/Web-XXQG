<template>
    <el-dialog
        v-model="visible"
        title="修改密码"
        width="450px"
        :close-on-click-modal="false"
    >
        <div class="reset-pwd-user-info">
            <span class="label">当前用户：</span>
            <span class="value">{{ user?.name || '—' }}</span>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
            <el-form-item label="新密码" prop="password">
                <el-input
                    v-model="form.password"
                    type="password"
                    placeholder="请输入新密码（至少8位）"
                    show-password
                />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                    v-model="form.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="visible = false">取消</el-button>
            <el-button type="primary" :loading="loading" @click="handleSubmit">
                确认修改
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { adminUpdatePassword } from '@/api/user';
import { showError } from '@/utils/errorHandler';

interface PasswordForm {
    password: string;
    confirmPassword: string;
}

const props = defineProps<{
    modelValue: boolean;
    user: { id: number; name: string } | null;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    'success': [];
}>();

const visible = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();

const form = reactive<PasswordForm>({
    password: '',
    confirmPassword: ''
});

const validateConfirmPassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (value !== form.password) {
        callback(new Error('两次输入的密码不一致'));
    } else {
        callback();
    }
};

const rules: FormRules = {
    password: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 8, message: '密码长度不能少于8位', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
    ]
};

watch(() => props.modelValue, (newVal) => {
    visible.value = newVal;
    if (newVal) {
        form.password = '';
        form.confirmPassword = '';
        formRef.value?.resetFields();
    }
});

watch(visible, (newVal) => {
    if (!newVal) {
        emit('update:modelValue', false);
    }
});

const handleSubmit = async () => {
    if (!formRef.value || !props.user) return;

    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    loading.value = true;
    try {
        const response = await adminUpdatePassword({
            user_id: props.user.id,
            password: form.password
        });
        if (response.data && response.data.code === 200) {
            ElMessage.success('密码修改成功');
            emit('success');
            emit('update:modelValue', false);
        } else {
            showError(response, '密码修改失败');
        }
    } catch (error) {
        console.error('修改密码错误:', error);
        showError(error, '密码修改失败');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.reset-pwd-user-info {
    margin-bottom: 20px;
    padding: 10px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 14px;
}

.reset-pwd-user-info .label {
    color: #606266;
}

.reset-pwd-user-info .value {
    color: #303133;
    font-weight: 500;
}
</style>
