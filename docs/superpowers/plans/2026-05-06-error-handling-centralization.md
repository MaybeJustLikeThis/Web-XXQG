# 集中化错误处理 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一前端错误处理，优先展示后端返回的 `msg` 字段，后端无消息时兜底显示简洁通用提示。

**Architecture:** 三层改造 — interceptor 规范化所有错误为 `Error`（确保 `error.message` 始终是有效中文消息）→ 工具函数 `getErrorMessage`/`showError` 统一提取和展示 → 调用方一行替换。

**Tech Stack:** Vue 3 + TypeScript + Element Plus + Axios

**Based on spec:** `docs/superpowers/specs/2026-05-06-error-handling-centralization-design.md`

---

## File Structure

| 文件 | 责任 |
|------|------|
| `src/utils/errorHandler.ts` | 新增集中错误消息提取和展示工具 |
| `src/utils/request.ts` | 规范化 Axios interceptor 的 HTTP / 网络 / 认证错误 |
| `src/utils/upload.ts` | 移除内部错误 toast，保留 throw 给调用方处理 |
| `src/views/content/topics.vue` | 改造专题管理错误提示 |
| `src/views/organization/components/DepartmentManagement.vue` | 改造部门管理错误提示，保留 Blob 特殊逻辑 |
| `src/views/question/questions.vue` | 改造题库错误提示，保留 Blob 特殊逻辑 |
| `src/views/content/articles.vue` | 改造文章和上传错误提示 |
| `src/views/dashboard.vue` | 改造仪表盘错误提示 |
| `src/views/content/columns.vue` | 改造专栏文章错误提示 |
| `src/views/system/user-management.vue` | 改造用户管理错误提示，处理 AxiosResponse 场景 |
| `src/views/content/column-management.vue` | 改造专栏管理错误提示 |
| `src/views/pages/login.vue` | 改造登录错误提示 |
| `src/views/pages/ucenter.vue` | 改造用户中心密码错误提示 |
| `src/views/points/rules.vue` | 改造积分规则错误提示 |
| `src/components/RichTextEditor.vue` | 改造富文本上传错误提示 |
| `src/components/UpdatePasswordDialog.vue` | 改造修改密码弹窗错误提示 |
| `src/composables/useAdminDialog.ts` | 改造管理员授权错误提示 |

---

### Task 1: 创建 errorHandler.ts 工具函数

**Files:**
- Create: `src/utils/errorHandler.ts`

- [ ] **Step 1: 写入完整文件**

```typescript
import { ElMessage } from 'element-plus';

/**
 * 从任意 error/response 对象中提取可读的错误消息。
 * 优先级：error.message → error.data.msg → error.response.data.msg → fallback
 *
 * 注意：ElMessage 默认转义 HTML，此函数的返回值直接传入是安全的。
 * 禁止将返回值与 dangerouslyUseHTMLString 一起使用。
 */
export function getErrorMessage(error: unknown, fallback = '操作失败'): string {
    if (!error) return fallback;

    const err = error as Record<string, unknown>;

    // 1. interceptor 规范化后的消息（覆盖 try/catch 的 catch 路径）
    if (typeof err.message === 'string' && err.message) {
        return err.message;
    }

    // 2. AxiosResponse 直接传入（if/else 分支中的 res.data?.msg 场景）
    if (typeof err.data?.msg === 'string' && (err.data.msg as string).trim()) {
        return err.data.msg as string;
    }

    // 3. 兜底：未经过 interceptor 的原始 AxiosError
    try {
        const response = err.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;
        if (typeof data?.msg === 'string' && (data.msg as string).trim()) {
            return data.msg as string;
        }
    } catch {
        // 忽略类型访问错误
    }

    // 4. 最终兜底
    return fallback;
}

/**
 * 提取错误消息并用 ElMessage.error 展示。
 */
export function showError(error: unknown, fallback = '操作失败'): void {
    ElMessage.error(getErrorMessage(error, fallback));
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/errorHandler.ts
git commit -m "feat: add centralized error handler utility functions"
```

---

### Task 2: 改造 request.ts 的 errorInterceptor

**Files:**
- Modify: `src/utils/request.ts:73-81,89-106,115`

- [ ] **Step 1: 替换业务码 401 调用**

```typescript
// 改造前：
if (code === 401) {
    handleAuthError('业务码401');
    return Promise.reject(new Error('用户未登录'));
}

// 改造后：
if (code === 401) {
    handleAuthError();
    return Promise.reject(new Error(msg || '用户未登录'));
}
```

- [ ] **Step 2: 替换 errorInterceptor 函数体**

```typescript
const errorInterceptor = (error: AxiosError) => {
    if (axios.isCancel(error) || (error as any).code === 'ERR_CANCELED') {
        return Promise.reject(error);
    }

    if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data as Record<string, unknown> | undefined;

        if (status === 401 || status === 403) {
            handleAuthError();
            const msg = typeof responseData?.msg === 'string' ? responseData.msg : '登录已过期，请重新登录';
            return Promise.reject(new Error(msg));
        }

        console.error(`请求错误: HTTP ${status}`, error.response.data);
        const backendMsg = typeof responseData?.msg === 'string' ? responseData.msg : undefined;
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

- [ ] **Step 3: 清理 handleAuthError 的未使用参数**

```typescript
// 改造前：
const handleAuthError = (errorType?: string) => {

// 改造后：
const handleAuthError = () => {
```

- [ ] **Step 4: 提交**

```bash
git add src/utils/request.ts
git commit -m "refactor: normalize error interceptor to wrap all errors as Error with readable message"
```

---

### Task 3: 修复 upload.ts 双重报错

**Files:**
- Modify: `src/utils/upload.ts:61-65`

- [ ] **Step 1: 移除内部 ElMessage.error，保留 throw**

```typescript
// 改造前：
    } catch (error) {
        console.error(`文件上传失败：${error.message}`);
        ElMessage.error(`文件上传失败: ${error.message || '未知错误'}`);
        throw error;
    }

// 改造后：
    } catch (error) {
        console.error(`文件上传失败：${(error as Error).message}`);
        throw error;
    }
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/upload.ts
git commit -m "fix: remove duplicate error toast in uploadFile, let callers handle display"
```

---

### Task 4: 改造业务调用方

**Files:**
- Modify: `src/views/content/topics.vue`
- Modify: `src/views/organization/components/DepartmentManagement.vue`
- Modify: `src/views/question/questions.vue`
- Modify: `src/views/content/articles.vue`
- Modify: `src/views/dashboard.vue`
- Modify: `src/views/content/columns.vue`
- Modify: `src/views/system/user-management.vue`
- Modify: `src/views/content/column-management.vue`
- Modify: `src/views/pages/login.vue`
- Modify: `src/views/pages/ucenter.vue`
- Modify: `src/views/points/rules.vue`
- Modify: `src/components/RichTextEditor.vue`
- Modify: `src/components/UpdatePasswordDialog.vue`
- Modify: `src/composables/useAdminDialog.ts`

- [ ] **Step 1: 在每个需要改造的文件中添加 import**

大多数文件添加：

```typescript
import { showError } from '@/utils/errorHandler';
```

需要组合消息的文件添加：

```typescript
import { showError, getErrorMessage } from '@/utils/errorHandler';
```

涉及 `getErrorMessage` 的文件：
- `src/views/question/questions.vue`
- `src/views/pages/login.vue`

- [ ] **Step 2: 改造普通 catch 块**

统一模式：

```typescript
// 改造前：
} catch (error) {
    console.error('获取数据失败:', error);
    ElMessage.error(error?.response?.data?.msg || error?.message || '获取数据失败');
}

// 改造后：
} catch (error) {
    console.error('获取数据失败:', error);
    showError(error, '获取数据失败');
}
```

适用文件：
- `src/views/content/topics.vue`
- `src/views/organization/components/DepartmentManagement.vue`
- `src/views/question/questions.vue`
- `src/views/content/articles.vue`
- `src/views/dashboard.vue`
- `src/views/content/columns.vue`
- `src/views/system/user-management.vue`
- `src/views/content/column-management.vue`
- `src/views/pages/ucenter.vue`
- `src/views/points/rules.vue`
- `src/components/RichTextEditor.vue`
- `src/components/UpdatePasswordDialog.vue`
- `src/composables/useAdminDialog.ts`

- [ ] **Step 3: 改造 hardcoded-only catch 块**

统一模式：

```typescript
// 改造前：
} catch (error) {
    ElMessage.error('获取专题列表失败');
}

// 改造后：
} catch (error) {
    showError(error, '获取专题列表失败');
}
```

重点文件：
- `src/views/content/topics.vue` 全部 17 处
- `src/views/organization/components/DepartmentManagement.vue` 多处
- `src/views/question/questions.vue` 多处

- [ ] **Step 4: 改造 cancel 判断场景**

统一模式：

```typescript
// 改造前：
} catch (error) {
    if (error !== 'cancel') {
        ElMessage.error(error?.response?.data?.msg || error?.message || '删除失败');
    }
}

// 改造后：
} catch (error) {
    if (error !== 'cancel') {
        showError(error, '删除失败');
    }
}
```

重点文件：
- `src/views/content/topics.vue`
- `src/views/organization/components/DepartmentManagement.vue`

- [ ] **Step 5: 改造动态 fallback 场景**

统一模式：

```typescript
// 改造前：
ElMessage.error(error?.response?.data?.msg || error?.message || (form.id ? '更新失败' : '创建失败'));

// 改造后：
showError(error, form.id ? '更新失败' : '添加失败');
```

适用文件：
- `src/views/content/topics.vue`
- `src/views/organization/components/DepartmentManagement.vue`
- `src/views/content/column-management.vue`

- [ ] **Step 6: 改造 AxiosResponse else 分支**

统一模式：

```typescript
// 改造前：
} else {
    ElMessage.error(res.data?.msg || '获取数据失败');
}

// 改造后：
} else {
    showError(res, '获取数据失败');
}
```

适用文件：
- `src/views/system/user-management.vue`
- `src/views/pages/login.vue`
- `src/views/pages/ucenter.vue`
- `src/components/UpdatePasswordDialog.vue`

- [ ] **Step 7: 改造 questions.vue 的动态前缀**

```typescript
// 改造前：
const errorMessage = error.response?.data?.message || error.message || '操作失败';
ElMessage.error(form.id ? `更新失败: ${errorMessage}` : `创建失败: ${errorMessage}`);

// 改造后：
const errorMessage = getErrorMessage(error, '操作失败');
ElMessage.error(form.id ? `更新失败: ${errorMessage}` : `创建失败: ${errorMessage}`);
```

- [ ] **Step 8: 保留 Blob 错误解析逻辑**

以下两处不做简单 `showError` 替换，保留 `Blob` 检测、`.text()` 解析、`JSON.parse`：
- `src/views/question/questions.vue` 批量导入 catch 块
- `src/views/organization/components/DepartmentManagement.vue` 批量导入 catch 块

- [ ] **Step 9: 提交**

```bash
git add src/views/content/topics.vue src/views/organization/components/DepartmentManagement.vue src/views/question/questions.vue src/views/content/articles.vue src/views/dashboard.vue src/views/content/columns.vue src/views/system/user-management.vue src/views/content/column-management.vue src/views/pages/login.vue src/views/pages/ucenter.vue src/views/points/rules.vue src/components/RichTextEditor.vue src/components/UpdatePasswordDialog.vue src/composables/useAdminDialog.ts
git commit -m "refactor: centralize API error display across admin pages"
```

---

### Task 5: TypeScript 编译验证

- [ ] **Step 1: 运行类型检查**

```bash
npx vue-tsc --noEmit
```

Expected: 通过，无类型错误。

- [ ] **Step 2: 若失败，修复类型错误**

常见修复：
- `error.message` 改为 `(error as Error).message`
- 未使用的 `ElMessage` import 删除
- 新增 `showError` import 路径修正为 `@/utils/errorHandler`

---

### Task 6: Vite 构建验证

- [ ] **Step 1: 运行生产构建**

```bash
npm run build
```

Expected: 构建成功，无错误。

---

### Task 7: 集中功能测试

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 测试创建同名部门**

操作：部门管理 → 新增子部门 → 填写已存在名称 → 提交。  
预期：展示后端 msg，例如：`当前父部门下已存在相同名称的部门`。

- [ ] **Step 3: 测试登录失败**

操作：登录页输入错误密码。  
预期：展示后端 msg，而不是固定的 `登录失败，请检查手机号和密码`。

- [ ] **Step 4: 测试网络断开**

操作：打开 DevTools Network → Offline → 执行任意接口操作。  
预期：展示 `网络连接失败，请检查网络`。

- [ ] **Step 5: 测试页面切换取消请求**

操作：打开数据加载较慢的页面，加载中快速切换菜单。  
预期：不弹出 `网络连接失败，请检查网络`。

- [ ] **Step 6: 测试 upload.ts 单次报错**

操作：触发图片/视频上传失败。  
预期：只显示一次错误提示。

- [ ] **Step 7: 测试正常操作**

操作：成功创建/编辑/删除一个专题、文章或部门。  
预期：成功提示正常，错误提示不误弹。

- [ ] **Step 8: 验证 console.error 保留**

操作：触发一个接口错误，打开浏览器 console。  
预期：对应 `console.error` 仍输出调试日志。

---

## Self-Review Checklist

1. **Spec coverage**:
   - ✓ Interceptor 三场景改造（HTTP error / 网络错误 / 取消检测）
   - ✓ handleAuthError 参数清理
   - ✓ 新建 errorHandler.ts（getErrorMessage + showError）
   - ✓ upload.ts 移除内部 ElMessage.error，保留 throw
   - ✓ 所有 14 个调用方文件改造
   - ✓ 普通 catch / hardcoded-only / cancel / dynamic fallback / AxiosResponse / Blob 特殊场景
   - ✓ TypeScript 编译 + 构建 + 功能测试

2. **Placeholder scan**:
   - ✓ 无 TBD / TODO / implement later
   - ✓ 所有代码步骤给出可直接执行的替换模式
   - ✓ 所有验证命令明确

3. **Type consistency**:
   - ✓ `showError(error: unknown, fallback?: string): void`
   - ✓ `getErrorMessage(error: unknown, fallback?: string): string`
   - ✓ import 路径统一为 `@/utils/errorHandler`
