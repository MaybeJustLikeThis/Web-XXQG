# 权限管理系统使用指南

## 概述

基于你的API数据结构，我们重新设计了一个灵活的权限管理系统，支持多种角色和细粒度的权限控制。

## 用户角色定义

### 1. 超级管理员 (`is_super_admin: true`)
- **权限范围**: 所有功能权限
- **权限码**: 全部权限码
- **特点**: 拥有系统最高权限，可以管理所有模块

### 2. 内容管理员 (`edit_text: true`)
- **权限范围**: 内容管理相关功能
- **权限码**:
  - `15` - 内容管理模块
  - `151` - 文章管理
  - `152` - 专题管理
  - `153` - 专栏管理
  - `291` - 富文本编辑器
  - `292` - Markdown编辑器
  - `22` - 上传功能

### 3. 题目管理员 (`edit_question: true`)
- **权限范围**: 题目管理相关功能
- **权限码**:
  - `16` - 题目管理
  - `21` - 表单
  - `32` - 可编辑表格
  - `33` - 导入Excel

### 4. 部门管理员 (`manage_departments: [1, 2, ...]`)
- **权限范围**: 组织管理和指定部门管理
- **权限码**:
  - `10` - 组织管理
  - `173` - 积分统计
- **特殊权限**: 可管理指定ID的部门

### 5. 普通用户
- **权限范围**: 基础功能
- **权限码**:
  - `0` - 系统首页
  - `1` - 系统基础
  - `5` - 图标查看

## 使用方法

### 1. 用户登录后设置权限

```typescript
import { permission } from '@/utils/permission';
import type { UserProfile } from '@/store/permiss';

// 登录成功后设置用户信息
const userData: UserProfile = {
    id: 1006,
    wx_id: "oj8Jj49y1qTxqRsXbOCMWHfd2BKU",
    name: "朱刚国荣",
    sex: "女",
    race: "保安族",
    political_status: "无党派人士",
    id_number: "277290198502194940",
    department: "研发部",
    points: 15,
    is_super_admin: false,
    edit_text: true,
    edit_question: false,
    manage_departments: [1, 2]
};

permission.setUserInfo(userData);
```

### 2. 组件中使用权限指令

```vue
<template>
  <!-- 基础权限控制 -->
  <el-button v-permiss="'151'">文章管理</el-button>

  <!-- 复合权限控制 -->
  <div v-permiss="'16'">
    <h3>题目管理功能</h3>
    <el-button>添加题目</el-button>
    <el-button>编辑题目</el-button>
  </div>
</template>
```

### 3. 在JavaScript/TypeScript中检查权限

```typescript
import { permission } from '@/utils/permission';

// 检查单个权限
if (permission.hasPermission('151')) {
  console.log('有文章管理权限');
}

// 检查内容管理权限
if (permission.canManageContent()) {
  console.log('可以管理内容');
}

// 检查题目管理权限
if (permission.canManageQuestions()) {
  console.log('可以管理题目');
}

// 检查部门管理权限
if (permission.canManageDepartment(1)) {
  console.log('可以管理部门1');
}

// 检查是否为超级管理员
if (permission.isSuperAdmin()) {
  console.log('超级管理员权限');
}

// 获取用户角色
const roles = permission.getUserRoles();
console.log('当前用户角色:', roles);
```

### 4. 在路由中使用权限

```typescript
// router/index.ts 中的路由守卫会自动检查权限
const routes = [
  {
    path: '/content/articles',
    meta: {
      title: '文章管理',
      permiss: '151' // 需要文章管理权限
    },
    component: () => import('../views/content/articles.vue')
  }
];
```

## 权限码对照表

| 权限码 | 功能模块 | 描述 |
|--------|----------|------|
| 0 | 系统首页 | 基础权限 |
| 1 | 系统管理 | 基础权限 |
| 5 | 图标 | 图标查看 |
| 7 | 主题 | 主题设置 |
| 10 | 组织管理 | 部门管理员权限 |
| 13 | 菜单管理 | 超级管理员权限 |
| 15 | 内容管理 | 内容管理模块 |
| 151 | 文章管理 | 内容管理员权限 |
| 152 | 专题管理 | 内容管理员权限 |
| 153 | 专栏管理 | 内容管理员权限 |
| 16 | 题目管理 | 题目管理员权限 |
| 17 | 积分管理 | 积分管理模块 |
| 171 | 积分规则 | 积分管理权限 |
| 172 | 积分记录 | 积分管理权限 |
| 173 | 积分统计 | 部门管理员权限 |
| 21 | 表单 | 基础组件 |
| 22 | 上传 | 文件上传 |
| 291 | 富文本编辑器 | 内容管理员权限 |
| 292 | Markdown编辑器 | 内容管理员权限 |
| 31 | 基础表格 | 基础功能 |
| 32 | 可编辑表格 | 题目管理员权限 |
| 33 | 导入Excel | 题目管理员权限 |
| 34 | 导出Excel | 基础功能 |
| 41 | Schart图表 | 基础功能 |
| 42 | ECharts图表 | 基础功能 |

## 最佳实践

### 1. 权限检查原则
- **路由级**: 控制页面访问
- **组件级**: 控制功能按钮显示
- **数据级**: 在API调用前检查权限

### 2. 角色组合
一个用户可以同时具有多个角色：
```json
{
  "is_super_admin": false,
  "edit_text": true,
  "edit_question": true,
  "manage_departments": [1, 2]
}
```

### 3. 部门权限
- 部门管理员只能管理指定部门ID的数据
- 在数据查询时需要添加部门ID过滤

### 4. 权限更新
当用户信息变更时，调用 `permission.setUserInfo()` 更新权限：
```typescript
// 角色变更后
permission.setUserInfo(newUserData);
```

## 扩展权限系统

如果需要添加新的角色或权限码：

1. 在 `PERMISSION_CODES` 中添加新的权限码
2. 在 `ROLE_PERMISSIONS` 中定义角色权限映射
3. 在路由和组件中使用新的权限码

```typescript
// 添加新的权限码
const PERMISSION_CODES = {
  // ... 现有权限码
  NEW_FEATURE: '999', // 新功能权限
};

// 定义新角色权限
const ROLE_PERMISSIONS = {
  // ... 现有角色
  NEW_ROLE: [
    PERMISSION_CODES.DASHBOARD,
    PERMISSION_CODES.NEW_FEATURE,
  ],
};
```