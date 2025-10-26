<template>
    <div class="login-bg">
        <div class="login-container">
            <div class="login-header">
                <img class="logo mr10" src="../../assets/img/logo.svg" alt="" />
                <div class="login-title">后台管理系统</div>
            </div>
            <el-form :model="param" :rules="rules" ref="loginForm" size="large">
                <el-form-item prop="id_number">
                    <el-input v-model="param.id_number" placeholder="身份证号">
                        <template #prepend>
                            <el-icon>
                                <User />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input
                        type="password"
                        placeholder="密码"
                        v-model="param.password"
                        @keyup.enter="handleEnterSubmit"
                        show-password
                    >
                        <template #prepend>
                            <el-icon>
                                <Lock />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <div class="pwd-tips">
                    <el-checkbox class="pwd-checkbox" v-model="checked" label="记住密码" />
                    <el-link type="primary" @click="$router.push('/reset-pwd')">忘记密码</el-link>
                </div>
                <el-button class="login-btn" type="primary" size="large" :loading="loading" @click="submitForm(loginForm)">
                    <span v-if="!loading">登录</span>
                    <span v-else>登录中...</span>
                </el-button>
                <p class="login-tips">Tips : 请输入有效的身份证号和密码。</p>
                <p class="login-text">
                    没有账号？<el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
                </p>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useTabsStore } from '@/store/tabs';
import { usePermissStore } from '@/store/permiss';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { login as loginApi } from '@/api/auth';

// 加载状态
const loading = ref(false);

interface LoginInfo {
    id_number: string;
    password: string;
}

const lgStr = localStorage.getItem('login-param');
const defParam = lgStr ? JSON.parse(lgStr) : null;
const checked = ref(lgStr ? true : false);

const router = useRouter();
const param = reactive<LoginInfo>({
    id_number: defParam ? defParam.id_number || defParam.username : '',
    password: defParam ? defParam.password || defParam.code : '',
});

const rules: FormRules = {
    id_number: [
        {
            required: true,
            message: '请输入身份证号',
            trigger: 'blur',
        },
    ],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};
const permiss = usePermissStore();
const loginForm = ref<FormInstance>();

const submitForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return;

    formEl.validate(async (valid: boolean) => {
        if (valid) {
            loading.value = true;
            try {
                const response = await loginApi({
                    id_number: param.id_number,
                    password: param.password
                });

                if (response.data && response.data.code === 200) {
                    ElMessage.success('登录成功');
                    localStorage.setItem('vuems_name', param.id_number);

                    // 如果返回了token数据，保存它
                    if (response.data.data && response.data.data.token) {
                        localStorage.setItem('token', response.data.data.token);
                    }

                    // 临时：为了方便调试，默认给管理员权限
                    // TODO: 根据返回的 priority 字段判断权限
                    // const priority = response.data.data.priority || 1;
                    // const role = priority >= 10 ? 'admin' : 'user';
                    // const keys = permiss.defaultList[role];
                    // permiss.handleSet(keys);

                    // 将来根据 priority 字段设置权限的逻辑：
                    // const priority = response.data.data.priority || 1;
                    // const role = priority >= 10 ? 'admin' : 'user';
                    // const keys = permiss.defaultList[role];
                    // permiss.handleSet(keys);

                    // 如果没有返回用户信息，设置默认管理员权限（调试用）
                    const keys = permiss.defaultList['admin'];
                    permiss.handleSet(keys);

                    router.push('/');

                    if (checked.value) {
                        localStorage.setItem('login-param', JSON.stringify(param));
                    } else {
                        localStorage.removeItem('login-param');
                    }
                } else {
                    ElMessage.error(response.data?.msg || '登录失败');
                }
            } catch (error) {
                console.error('登录错误:', error);
                ElMessage.error('登录失败，请检查身份证号和密码');
                return false;
            } finally {
                loading.value = false;
            }
        } else {
            ElMessage.error('请填写完整的登录信息');
            return false;
        }
    });
};

// 监听回车键提交表单
const handleEnterSubmit = () => {
    if (!loading.value) {
        submitForm(loginForm.value);
    }
};

const tabs = useTabsStore();
tabs.clearTabs();
</script>

<style scoped>
.login-bg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
    background: url(../../assets/img/login-bg.jpg) center/cover no-repeat;
}

.login-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40px;
}

.logo {
    width: 35px;
}

.login-title {
    font-size: 22px;
    color: #333;
    font-weight: bold;
}

.login-container {
    width: 450px;
    border-radius: 5px;
    background: #fff;
    padding: 40px 50px;
    box-sizing: border-box;
}

.pwd-tips {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    margin: -10px 0 10px;
    color: #787878;
}

.pwd-checkbox {
    height: auto;
}

.login-btn {
    display: block;
    width: 100%;
}

.login-tips {
    font-size: 12px;
    color: #999;
}

.login-text {
    display: flex;
    align-items: center;
    margin-top: 20px;
    font-size: 14px;
    color: #787878;
}
</style>