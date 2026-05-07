# Admin Reset Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在组织管理 - 成员管理弹窗中新增管理员修改用户密码功能

**Architecture:** 三层改动 — API 层新增 `adminUpdatePassword` 函数，新建 `AdminResetPasswordDialog` 独立组件，在 `DepartmentManagement.vue` 中集成按钮、选中追踪和组件调用

**Tech Stack:** Vue 3 + TypeScript + Composition API, Element Plus, Axios

---

### Task 1: API Layer — 新增 adminUpdatePassword 函数

**Files:**
- Modify: `src/api/user.ts` (在文件末尾追加)

- [ ] **Step 1: 在 `src/api/user.ts` 末尾追加函数**

在 `getPointRecordForAdmin` 函数之后追加：

```typescript
// 管理员修改用户密码
export const adminUpdatePassword = (data: { user_id: number; password: string }) => {
    return request({
        url: '/user/update_password_admin',
        method: 'post',
        data
    });
};
```

- [ ] **Step 2: 提交**

```bash
git add src/api/user.ts
git commit -m "feat: add adminUpdatePassword API function

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
"
```

---

### Task 2: 新建 AdminResetPasswordDialog 组件

**Files:**
- Create: `src/components/AdminResetPasswordDialog.vue`

- [ ] **Step 1: 创建组件文件**

```vue
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
                    placeholder="请输入新密码（至少6位）"
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
```

- [ ] **Step 2: 构建验证**

```bash
npm run build 2>&1 | tail -10
```

确认构建通过（新增组件后先验证一次，及早发现问题）。

- [ ] **Step 3: 提交**

```bash
git add src/components/AdminResetPasswordDialog.vue
git commit -m "feat: add AdminResetPasswordDialog component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
"
```

---

### Task 3: DepartmentManagement.vue 集成

**Files:**
- Modify: `src/views/organization/components/DepartmentManagement.vue`

- [ ] **Step 1: 添加 import**

在约第 466 行附近追加组件导入：
```typescript
import AdminResetPasswordDialog from '@/components/AdminResetPasswordDialog.vue';
```

- [ ] **Step 2: 添加按钮和弹窗组件（template 部分）**

在第 227 行（批量导出 `</el-button>` 之后，`<el-button v-if="permiss.isSuperAdmin" type="warning" @click="textAdmin.openDialog()">` 之前）插入：

```html
                    <el-button type="danger" @click="handleShowResetPassword">
                        <el-icon>
                            <Edit />
                        </el-icon>
                        修改密码
                    </el-button>
```

在成员管理弹窗 `</el-dialog>` 结束标签（约第 312 行）之前插入：

```html

        <!-- 修改密码弹窗 -->
        <AdminResetPasswordDialog
            v-model="resetPwdDialogVisible"
            :user="selectedUserForReset"
            @success="handleResetPasswordSuccess"
        />
```

- [ ] **Step 3: 添加表格选中事件和 ref**

表格标签（约第 252 行）添加 `ref` 和 `@selection-change`：

将：
```html
                    <el-table :data="memberTableData" border style="width: 100%" v-loading="memberLoading">
```

改为：
```html
                    <el-table ref="memberTableRef" :data="memberTableData" border style="width: 100%" v-loading="memberLoading"
                        @selection-change="handleMemberSelectionChange">
```

- [ ] **Step 4: 添加 script 状态和方法**

在成员管理弹窗相关变量区（约第 634 行 `memberDialogVisible` 附近）追加：

```typescript
const memberTableRef = ref();
const selectedUsers = ref<DepartmentUser[]>([]);
const resetPwdDialogVisible = ref(false);
const selectedUserForReset = ref<{ id: number; name: string } | null>(null);

const handleMemberSelectionChange = (rows: DepartmentUser[]) => {
    selectedUsers.value = rows;
};

const handleShowResetPassword = () => {
    if (selectedUsers.value.length === 0) {
        ElMessage.warning('请选择一位用户');
        return;
    }
    if (selectedUsers.value.length > 1) {
        ElMessage.warning('只能选择一位用户');
        return;
    }
    const user = selectedUsers.value[0];
    selectedUserForReset.value = { id: user.id, name: user.name };
    resetPwdDialogVisible.value = true;
};

const handleResetPasswordSuccess = () => {
    memberTableRef.value?.clearSelection();
    selectedUsers.value = [];
};
```

- [ ] **Step 5: Icon import 补充**

`Edit` 图标在第 461 行（`import { Plus, Upload, Download } from '@element-plus/icons-vue'`）中可能不存在，确认并添加：

若当前为：
```typescript
import { Plus, Upload, Download } from '@element-plus/icons-vue';
```

改为：
```typescript
import { Plus, Upload, Download, Edit } from '@element-plus/icons-vue';
```

- [ ] **Step 6: 构建验证**

```bash
npm run build 2>&1 | tail -10
```

确认构建通过。

- [ ] **Step 7: 提交**

```bash
git add src/views/organization/components/DepartmentManagement.vue
git commit -m "feat: integrate admin reset password in DepartmentManagement

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
"
```

---

## Verification Checklist

- [ ] `npm run build` 通过（vue-tsc --noEmit + vite build）
- [ ] 成员管理弹窗操作区显示"修改密码"按钮
- [ ] 未选用户点击提示"请选择一位用户"
- [ ] 多选用户点击提示"只能选择一位用户"
- [ ] 单选用户后弹出修改密码对话框，显示用户姓名
- [ ] 新密码为空时提交提示必填
- [ ] 新密码少于 6 位时提示长度不足
- [ ] 两次密码不一致时提示不一致
- [ ] 修改成功后关闭弹窗、清空表格选中
