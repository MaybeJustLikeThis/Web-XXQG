# 集中化错误处理 — 设计方案

**日期**: 2026-05-06  
**状态**: 待审查  
**目标**: 系统中所有 API 错误提示统一优先展示后端返回的 `msg` 字段，后端无消息时兜底显示简洁通用提示。

---

## 1. 问题分析

### 1.1 后端错误响应格式

```json
{ "code": 500, "msg": "当前父部门下已存在相同名称的部门", "data": null }
```

### 1.2 当前核心问题

| 问题 | 严重程度 | 描述 |
|------|---------|------|
| HTTP error interceptor 不提取 msg | 高 | 4xx/5xx 响应直接 reject 原始 AxiosError，调用方被迫写 `error?.response?.data?.msg` |
| 25% 的错误处理完全忽略后端 msg | 高 | `topics.vue` 全部 17 处、`DepartmentManagement.vue` 大量使用纯硬编码 |
| business error 包装丢弃 AxiosError | 中 | interceptor 中 `new Error(msg)` 后调用方 `error?.response?.data?.msg` 拿不到值 |
| 无统一工具函数 | 中 | 每个 catch 块独立写提取 / 展示逻辑，写法不一致 |
| upload.ts 双重报错 | 低 | 内部 ElMessage.error 后又 throw error，调用方再报一次 |

### 1.3 影响范围

共 **75+ 处**错误处理点，涉及 **15 个文件**。

---

## 2. 设计方案

### 2.1 整体思路

```
后端返回 msg
     │
     ▼
┌─ request.ts interceptor ──────────┐
│ 统一提取 msg → 包装为 Error        │
│ 确保 error.message = 有效中文消息   │
└──────────────┬────────────────────┘
               │
               ▼
┌─ errorHandler.ts 工具函数 ─────────┐
│ getErrorMessage(error, fallback)   │
│ showError(error, fallback)         │
└──────────────┬────────────────────┘
               │
               ▼
┌─ 各调用方 catch 块 ────────────────┐
│ showError(error, '操作失败')       │
│ 一行代码完成错误提取 + 展示         │
└───────────────────────────────────┘
```

**Interceptor 负责规范化，工具函数负责提取和展示。**

### 2.2 Interceptor 改造（`src/utils/request.ts`）

改动范围：response interceptor 的 `errorInterceptor` 函数。

**（A）HTTP 4xx/5xx 错误** — 当前只打 log 原样 reject，改为提取 msg 包装为 Error。

改造前：
```typescript
const errorInterceptor = (error: AxiosError) => {
    if (error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403) {
            handleAuthError(`HTTP ${status}`);
        } else {
            console.error(`请求错误: HTTP ${status}`, error.response.data);
        }
    } else if (error.request) {
        console.error('网络错误: 请求发送失败', error.message);
    } else {
        console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
};
```

改造后：
```typescript
const errorInterceptor = (error: AxiosError) => {
    if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data as Record<string, unknown> | undefined;
        const backendMsg = typeof responseData?.msg === 'string' ? responseData.msg : undefined;

        if (status === 401 || status === 403) {
            handleAuthError();
            if (backendMsg) {
                return Promise.reject(new Error(backendMsg));
            }
            return Promise.reject(new Error('登录已过期，请重新登录'));
        }

        console.error(`请求错误: HTTP ${status}`, error.response.data);
        return Promise.reject(new Error(backendMsg || '服务器异常，请稍后重试'));
    }

    if (error.request) {
        console.error('网络错误: 请求发送失败', error.message);
        return Promise.reject(new Error('网络连接失败，请检查网络'));
    }

    console.error('请求配置错误:', error.message);
    return Promise.reject(new Error('请求配置错误，请稍后重试'));
};
```

**（B）业务错误 code≠200** — 保持现有逻辑不变，已经正确提取 msg。

**（C）`handleAuthError` 清理** — 移除未使用的 `errorType` 参数。

### 2.3 新增工具函数（`src/utils/errorHandler.ts`）

```typescript
import { ElMessage } from 'element-plus';

/**
 * 从任意 error 对象中提取可读的中文错误消息。
 * 优先级：error.message → error.response.data.msg → fallback
 */
export function getErrorMessage(error: unknown, fallback = '操作失败'): string {
    if (!error) return fallback;

    const err = error as Record<string, unknown>;

    // 1. interceptor 规范化后的消息（覆盖所有场景）
    if (typeof err.message === 'string' && err.message) {
        return err.message;
    }

    // 2. 兜底：未经过 interceptor 的原始 AxiosError
    try {
        const response = err.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;
        if (typeof data?.msg === 'string' && data.msg) {
            return data.msg;
        }
    } catch {
        // 忽略类型访问错误
    }

    // 3. 最终兜底
    return fallback;
}

/**
 * 提取错误消息并用 ElMessage.error 展示。
 */
export function showError(error: unknown, fallback = '操作失败'): void {
    ElMessage.error(getErrorMessage(error, fallback));
}
```

### 2.4 调用方改造策略

#### 时机一：直接用 `showError`（覆盖 ~85% 场景）

绝大多数 catch 块直接替换：

```typescript
// 改造前
} catch (error) {
    ElMessage.error(error?.response?.data?.msg || error?.message || '获取专题列表失败');
}

// 改造后
} catch (error) {
    showError(error, '获取专题列表失败');
}
```

#### 时机二：配合 cancel 判断

DepartmentManagement.vue 中大量 `ElMessageBox.confirm` 取消需要区分：

```typescript
// 改造前
}).catch((error) => {
    if (error !== 'cancel') {
        ElMessage.error(error?.response?.data?.msg || error?.message || '删除失败');
    }
});

// 改造后
}).catch((error) => {
    if (error !== 'cancel') {
        showError(error, '删除失败');
    }
});
```

#### 时机三：使用 `getErrorMessage` 赋值给变量

需要把错误消息赋给变量再组合使用的场景：

```typescript
// 改造前
const msg = error?.response?.data?.msg || error?.message || '批量添加失败';
ElMessage.error(msg);

// 改造后
const msg = getErrorMessage(error, '批量添加失败');
ElMessage.error(msg);
// 或直接用 showError(error, '批量添加失败');
```

#### 时机四：特殊场景保留结构

- **`login.vue`**: 保持现有分段错误逻辑（服务器返回数据异常 / 保存用户信息出错），改用 `getErrorMessage` 提取
- **`upload.ts`**: 内部只用 `getErrorMessage` 提取消息，移除 throw 避免双重报错

### 2.5 fallback 文案规范

| 场景 | fallback |
|------|----------|
| 获取列表数据 | `获取数据失败` |
| 删除操作 | `删除失败` |
| 创建/新增 | `添加失败` |
| 更新/编辑 | `更新失败` |
| 保存 | `保存失败` |
| 上传文件 | `上传失败` |
| 下载文件 | `下载失败` |
| 导出 | `导出失败` |
| 导入/批量操作 | `导入失败` |
| 鉴权相关 | `操作失败` |
| 通用 | `操作失败` |

### 2.6 改造文件清单

| 文件 | 错误点数量 | 主要改造方式 |
|------|----------|-------------|
| `src/utils/request.ts` | 1（errorInterceptor） | HTTP error 分支改造 + handleAuthError 清理 |
| `src/utils/errorHandler.ts` | 新建 | 创建工具函数 |
| `src/views/content/topics.vue` | 17 | 全部 → `showError` |
| `src/views/organization/components/DepartmentManagement.vue` | 15 | `showError` + 保留 cancel 判断 |
| `src/views/question/questions.vue` | 8 | `showError` |
| `src/views/content/articles.vue` | 5 | `showError` |
| `src/views/dashboard.vue` | 4 | `showError` |
| `src/views/content/columns.vue` | 4 | `showError` |
| `src/views/system/user-management.vue` | 5 | `showError`（含 `res.data?.msg` 场景） |
| `src/views/content/column-management.vue` | 3 | `showError` |
| `src/views/pages/login.vue` | 4 | `getErrorMessage` |
| `src/views/pages/ucenter.vue` | 2 | `showError` |
| `src/views/points/rules.vue` | 2 | `showError` |
| `src/components/RichTextEditor.vue` | 2 | `showError` |
| `src/components/UpdatePasswordDialog.vue` | 2 | `showError` |
| `src/composables/useAdminDialog.ts` | 2 | `showError` |
| `src/utils/upload.ts` | 2 | `getErrorMessage`，移除 throw |

---

## 3. 测试计划

改造完成后，以下典型场景需要验证：

### 3.1 功能测试

| 序号 | 测试场景 | 操作 | 预期结果 |
|------|---------|------|---------|
| 1 | 创建同名部门 | 部门管理 → 新增 → 输入已存在名称 | 展示后端 msg："当前父部门下已存在相同名称的部门" |
| 2 | HTTP 500 错误 | 模拟后端返回 500 无 body | 展示："服务器异常，请稍后重试" |
| 3 | 网络断开 | 断网后操作 | 展示："网络连接失败，请检查网络" |
| 4 | 401 鉴权过期 | token 过期后操作 | 展示登录过期提示并跳转登录页 |
| 5 | 删除专题 | 专题管理 → 删除有依赖的专题 | 展示后端 msg（如 "该专题已被其他管理员删除"） |
| 6 | 正常操作 | 成功创建/编辑/删除 | 正常完成，无错误提示 |
| 7 | user-management 业务错误 | 获取用户列表时后端返回 code≠200 | 展示后端 msg，而非"获取数据失败" |
| 8 | login 登录失败 | 错误密码登录 | 展示后端 msg，而非"登录失败，请检查手机号和密码" |

### 3.2 非功能验证

- TypeScript 编译通过（`vue-tsc --noEmit`）
- Vite 构建通过（`npm run build`）
- 所有页面无 console 报错

---

## 4. 实现顺序

1. 新建 `src/utils/errorHandler.ts`
2. 改造 `src/utils/request.ts` 的 `errorInterceptor`
3. 改造 `src/utils/upload.ts`（移除重复报错）
4. 按文件逐批改造调用方（从最严重的 topics.vue 开始）
5. TypeScript 编译验证
6. 构建验证
7. 功能回归测试

---

## 5. 风险与约束

- **不可改变现有 API 响应结构** — 仅修改前端错误展示逻辑
- **不可引入新依赖** — 仅使用已有的 Element Plus `ElMessage`
- **Auth 跳转行为不变** — 401/403 仍然清理 token 跳转登录页，仅增加消息提示
- **`handleAuthError` 移除死参数** — `errorType` 参数从未使用，直接删除
