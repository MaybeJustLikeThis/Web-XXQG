<template>
    <div>
        <div class="user-container">
            <el-card class="user-profile" shadow="hover" :body-style="{ padding: '0px' }">
                <div class="user-profile-bg"></div>
                <div class="user-avatar-wrap">
                    <el-avatar class="user-avatar" :size="120" :src="avatarImg" />
                </div>
                <div class="user-info">
                    <div class="info-name">{{ name }}</div>
                    <div class="info-desc">
                        <span>管理员</span>
                    </div>
                    <div class="info-desc">山西省高校网络思政中心</div>
                </div>
            </el-card>
            <el-card
                class="user-content"
                shadow="hover"
                :body-style="{ padding: '20px 50px', height: '100%', boxSizing: 'border-box' }"
            >
                <el-tabs tab-position="left" v-model="activeName">
                    <el-tab-pane name="label1" label="消息通知" class="user-tabpane">
                        <div class="notification-content">
                            <el-empty description="暂无消息通知" />
                        </div>
                    </el-tab-pane>
                    <el-tab-pane name="label2" label="我的头像" class="user-tabpane">
                        <div class="avatar-content">
                            <p>头像上传功能暂时不可用</p>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane name="label3" label="修改密码" class="user-tabpane">
                        <el-form class="w500" label-position="top" :model="form">
                            <el-form-item label="旧密码：">
                                <el-input
                                    type="password"
                                    v-model="form.old"
                                    placeholder="请输入当前密码"
                                    show-password
                                    @keyup.enter="onSubmit"
                                />
                            </el-form-item>
                            <el-form-item label="新密码：">
                                <el-input
                                    type="password"
                                    v-model="form.new"
                                    placeholder="请输入新密码（至少6位）"
                                    show-password
                                    @keyup.enter="onSubmit"
                                />
                            </el-form-item>
                            <el-form-item label="确认新密码：">
                                <el-input
                                    type="password"
                                    v-model="form.new1"
                                    placeholder="请再次输入新密码"
                                    show-password
                                    @keyup.enter="onSubmit"
                                />
                            </el-form-item>
                            <el-form-item>
                                <el-button
                                    type="primary"
                                    @click="onSubmit"
                                    :loading="loading"
                                    :disabled="!form.old || !form.new || !form.new1"
                                >
                                    {{ loading ? '修改中...' : '修改密码' }}
                                </el-button>
                                <el-button @click="resetForm">重置</el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                </el-tabs>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts" name="ucenter">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { updatePassword } from '@/api/auth';
// import { VueCropper } from 'vue-cropper';
// import 'vue-cropper/dist/index.css';
import avatar from '@/assets/img/img.jpg';
// import TabsComp from '../element/tabs.vue';

const name = localStorage.getItem('vuems_name');
const loading = ref(false);

const form = reactive({
    new1: '',
    new: '',
    old: '',
});

// 重置表单
const resetForm = () => {
    form.old = '';
    form.new = '';
    form.new1 = '';
};

const onSubmit = async () => {
    // 表单验证
    if (!form.old) {
        ElMessage.warning('请输入旧密码');
        return;
    }

    if (!form.new) {
        ElMessage.warning('请输入新密码');
        return;
    }

    if (form.new.length < 6) {
        ElMessage.warning('新密码长度不能少于6位');
        return;
    }

    if (form.new !== form.new1) {
        ElMessage.warning('两次输入的新密码不一致');
        return;
    }

    if (form.old === form.new) {
        ElMessage.warning('新密码不能与旧密码相同');
        return;
    }

    loading.value = true;
    try {
        const response = await updatePassword({
            password: form.new
        });

        if (response.data && response.data.code === 200) {
            ElMessage.success('密码修改成功');
            // 清空表单
            resetForm();
        } else {
            ElMessage.error(response.data?.msg || '密码修改失败');
        }
    } catch (error) {
        console.error('修改密码错误:', error);
        ElMessage.error('修改密码失败，请稍后重试');
    } finally {
        loading.value = false;
    }
};

const activeName = ref('label1');

const avatarImg = ref(avatar);
const imgSrc = ref(avatar);
const cropImg = ref('');
const cropper: any = ref();

// const setImage = (e: any) => {
//     const file = e.target.files[0];
//     if (!file.type.includes('image/')) {
//         return;
//     }
//     const reader = new FileReader();
//     reader.onload = (event: any) => {
//         imgSrc.value = event.target.result;
//         cropper.value && cropper.value.replace(event.target.result);
//     };
//     reader.readAsDataURL(file);
// };

// const cropImage = () => {
//     cropImg.value = cropper.value?.getCroppedCanvas().toDataURL();
// };

// const saveAvatar = () => {
//     avatarImg.value = cropImg.value;
// };
</script>

<style scoped>
.user-container {
    display: flex;
}

.user-profile {
    position: relative;
}

.user-profile-bg {
    width: 100%;
    height: 200px;
    background-image: url('../../assets/img/ucenter-bg.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.user-profile {
    width: 500px;
    margin-right: 20px;
    flex: 0 0 auto;
    align-self: flex-start;
}

.user-avatar-wrap {
    position: absolute;
    top: 135px;
    width: 100%;
    text-align: center;
}

.user-avatar {
    border: 5px solid #fff;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 7px 12px 0 rgba(62, 57, 107, 0.16);
}

.user-info {
    text-align: center;
    padding: 80px 0 30px;
}

.info-name {
    margin: 0 0 20px;
    font-size: 22px;
    font-weight: 500;
    color: #373a3c;
}

.info-desc {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 5px;
}

.info-desc,
.info-desc a {
    font-size: 18px;
    color: #55595c;
}

.info-icon {
    margin-top: 10px;
}

.info-icon i {
    font-size: 30px;
    margin: 0 10px;
    color: #343434;
}

.user-content {
    flex: 1;
}

.user-tabpane {
    padding: 10px 20px;
}

.crop-wrap {
    width: 600px;
    height: 350px;
    margin-bottom: 20px;
}

.crop-demo-btn {
    position: relative;
}

.crop-input {
    position: absolute;
    width: 100px;
    height: 40px;
    left: 0;
    top: 0;
    opacity: 0;
    cursor: pointer;
}

.w500 {
    width: 500px;
}
</style>

<style>
.el-tabs.el-tabs--left {
    height: 100%;
}
</style>
