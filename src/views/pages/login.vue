<template>
    <div class="login-bg">
        <div class="login-container">
            <div class="login-header">
                <img class="logo mr10" src="../../assets/img/logo.svg" alt="" />
                <div class="login-title">山西省高校网络思政中心小程序后台管理系统</div>
            </div>
            <el-form :model="param" :rules="rules" ref="loginForm" size="large">
                <el-form-item prop="id_number">
                    <el-input v-model="param.id_number" placeholder="手机号">
                        <template #prepend>
                            <el-icon>
                                <User />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input type="password" placeholder="密码" v-model="param.password" @keyup.enter="handleEnterSubmit"
                        show-password>
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
                <el-button class="login-btn" type="primary" size="large" :loading="loading"
                    @click="submitForm(loginForm)">
                    <span v-if="!loading">登录</span>
                    <span v-else>登录中...</span>
                </el-button>
                <p class="login-tips">Tips : 请输入有效的手机号和密码。</p>
                <p class="login-text">
                    没有账号？<el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
                </p>
            </el-form>
        </div>
    </div>

    <!-- 修改密码弹窗 -->
    <UpdatePasswordDialog
        v-model="showUpdatePasswordDialog"
        @success="handlePasswordUpdateSuccess"
    />
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
import UpdatePasswordDialog from '@/components/UpdatePasswordDialog.vue';
import { isInitialPassword } from '@/utils/password';

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
    id_number: defParam ? defParam.id_number || defParam.username || defParam.phone : '',
    password: defParam ? defParam.password || defParam.code : '',
});

const rules: FormRules = {
    id_number: [
        {
            required: true,
            message: '请输入手机号',
            trigger: 'blur',
        },
        {
            pattern: /^1[3-9]\d{9}$/,
            message: '请输入正确的手机号格式',
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

                    // 保存完整的用户信息到permiss store
                    try {
                        if (response.data.data) {

                            // 保存用户信息到store和localStorage
                            permiss.setUserProfile(response.data.data);

                            // 设置用户名到localStorage（用于登录状态检查）
                            localStorage.setItem('vuems_name', response.data.data.name || param.id_number);

                            // 设置一个默认token（如果后端没有返回token的话）
                            if (response.data.data.token) {
                                localStorage.setItem('token', response.data.data.token);
                            } else {
                                // 如果API没有返回token，生成一个默认的用于本地状态管理
                                const defaultToken = `token-${response.data.data.id}-${Date.now()}`;
                                localStorage.setItem('token', defaultToken);
                            }
                        } else {
                            ElMessage.error('登录失败：服务器返回数据异常');
                            loading.value = false;
                            return;
                        }
                    } catch (error) {
                        ElMessage.error('登录失败：保存用户信息出错');
                        loading.value = false;
                        return;
                    }
                    // 检测是否为初始密码
                    const isInitial = isInitialPassword(param.id_number, param.password);

                    if (isInitial) {
                        // 显示修改密码弹窗前先重置loading状态
                        loading.value = false;
                        // 显示修改密码弹窗
                        showUpdatePasswordDialog.value = true;
                    } else {
                        // 直接跳转到首页
                        router.push('/');
                    }

                    if (checked.value) {
                        localStorage.setItem('login-param', JSON.stringify(param));
                    } else {
                        localStorage.removeItem('login-param');
                    }
                } else {
                    ElMessage.error(response.data?.msg || '登录失败');
                }
            } catch (error) {
                ElMessage.error('登录失败，请检查手机号和密码');
                return false;
            } finally {
                loading.value = false;
            }
        } else {
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

// 密码修改弹窗相关
const showUpdatePasswordDialog = ref(false);

// 密码修改成功后的处理
const handlePasswordUpdateSuccess = () => {
    ElMessage.success('密码修改成功，请重新登录');
    showUpdatePasswordDialog.value = false;
    // 清空记住的密码
    param.password = '';
    checked.value = false;
    localStorage.removeItem('login-param');
};
</script>

<style scoped>
.login-bg {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;
    background: url(../../assets/img/login-bg.jpg) center/cover no-repeat;
    transition: all 0.3s ease;
}

/* 暗色模式下的登录背景 */
:root.dark .login-bg {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
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
    transition: color 0.3s ease;
}

/* 暗色模式下的标题 */
:root.dark .login-title {
    color: #e5eaf3;
}

.login-container {
    width: 450px;
    border-radius: 5px;
    background: #fff;
    padding: 40px 50px;
    box-sizing: border-box;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

/* 暗色模式下的登录容器 */
:root.dark .login-container {
    background: #1a1a1a;
    border: 1px solid #2d2d2d;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.pwd-tips {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    margin: -10px 0 10px;
    color: #787878;
    transition: color 0.3s ease;
}

/* 暗色模式下的提示文字 */
:root.dark .pwd-tips {
    color: #a3a6ad;
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
    transition: color 0.3s ease;
}

/* 暗色模式下的提示信息 */
:root.dark .login-tips {
    color: #6c6e72;
}

.login-text {
    display: flex;
    align-items: center;
    margin-top: 20px;
    font-size: 14px;
    color: #787878;
    transition: color 0.3s ease;
}

/* 暗色模式下的注册链接文字 */
:root.dark .login-text {
    color: #a3a6ad;
}
</style>