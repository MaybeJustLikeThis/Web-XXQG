<template>
    <el-dialog
        v-model="visible"
        title="修改密码"
        width="400px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
    >
        <div class="password-tips">
            <el-alert
                title="检测到您使用的是初始密码，为了账户安全，请修改密码"
                type="warning"
                :closable="false"
                show-icon
            />
        </div>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
            <el-form-item label="新密码" prop="password">
                <el-input
                    v-model="form.password"
                    type="password"
                    placeholder="请输入新密码（至少6位）"
                    show-password
                    @keyup.enter="handleSubmit"
                />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                    v-model="form.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码进行确认"
                    show-password
                    @keyup.enter="handleSubmit"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button type="primary" :loading="loading" @click="handleSubmit">
                    确认修改
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { updatePassword } from '@/api/auth';

interface PasswordForm {
    password: string;
    confirmPassword: string;
}

const props = defineProps<{
    modelValue: boolean;
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

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
    if (value !== form.password) {
        callback(new Error('两次输入的密码不一致'));
    } else {
        callback();
    }
};

const rules: FormRules = {
    password: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
    ]
};

watch(() => props.modelValue, (newVal) => {
    visible.value = newVal;
    if (newVal) {
        // 重置表单
        form.password = '';
        form.confirmPassword = '';
        formRef.value?.resetFields();
    }
});

const handleSubmit = async () => {
    if (!formRef.value) return;

    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    loading.value = true;
    try {
        const response = await updatePassword({ password: form.password });
        if (response.data && response.data.code === 200) {
            ElMessage.success('密码修改成功');
            emit('success');
            emit('update:modelValue', false);
        } else {
            ElMessage.error(response.data?.msg || '密码修改失败');
        }
    } catch (error) {
        console.error('修改密码错误:', error);
        ElMessage.error('密码修改失败，请重试');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.password-tips {
    margin-bottom: 20px;
}

.dialog-footer {
    display: flex;
    justify-content: center;
}
</style>