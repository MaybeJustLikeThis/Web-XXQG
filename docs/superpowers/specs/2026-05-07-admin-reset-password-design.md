# Admin Reset User Password

**Date:** 2026-05-07
**Status:** approved
**API:** `POST /user/update_password_admin`

## Summary

在组织管理 - 成员管理弹窗中，新增"修改密码"按钮。管理员选中一位用户后，弹出修改密码对话框，输入两次新密码完成修改。

## API Layer

在 `src/api/user.ts` 新增：

```typescript
export const adminUpdatePassword = (data: { user_id: number; password: string }) => {
    return request({
        url: '/user/update_password_admin',
        method: 'post',
        data
    });
};
```

请求体对应 `AdminUpdateUserPasswordDTO`，含 `user_id` 和 `password` 两个字段。

## Component: AdminResetPasswordDialog

新建 `src/components/AdminResetPasswordDialog.vue`。

**Props:**
- `modelValue: boolean` — 控制弹窗显隐
- `user: object` — 被修改密码的用户对象（含 `name`, `id` 等）

**Emits:**
- `update:modelValue` — 双向绑定显隐
- `success` — 修改成功后通知父组件

**表单字段：**
- 当前用户（只读文本，展示用户姓名）
- 新密码（`type="password"`, `show-password`）
- 确认密码（`type="password"`, `show-password`）

**校验规则：**
- 新密码必填，min 6 位
- 确认密码必填，与新密码一致

**成功/错误处理：**
- 成功：`ElMessage.success`，emit `success`，关闭弹窗
- 失败：调用 `showError` 统一处理

## DepartmentManagement.vue 集成

**操作区按钮：** 在"批量导出"按钮之后、"添加文章管理员"按钮之前，新增"修改密码"按钮和 `AdminResetPasswordDialog` 组件。

**表格选中追踪：**
- 表格新增 `@selection-change="handleSelectionChange"`
- `selectedUsers` ref 存储当前选中行数组
- 点击"修改密码"时判断：
  - 0 人选中 → 提示"请选择一位用户"
  - >1 人选中 → 提示"只能选择一位用户"
  - 1 人选中 → 打开 `AdminResetPasswordDialog`

**成功后行为：** 调用表格 ref `clearSelection()` 清空选中。

## New Files

- `src/components/AdminResetPasswordDialog.vue`

## Modified Files

- `src/api/user.ts` — 新增 `adminUpdatePassword` 函数
- `src/views/organization/components/DepartmentManagement.vue` — 集成按钮 + 组件 + 选中逻辑
