# Template Download Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add template download links in batch import dialogs so users can download required Excel templates before importing.

**Architecture:** New API module `src/api/template.ts` for the download endpoint. Two existing dialogs (`questions.vue` import dialog and `DepartmentManagement.vue` import dialog) get template download links with `el-link` components inside the `el-upload__tip` area.

**Tech Stack:** Vue 3 Composition API, Element Plus, Axios (blob response)

---

### Task 1: Create template API module

**Files:**
- Create: `src/api/template.ts`

- [ ] **Step 1: Create `src/api/template.ts`**

```typescript
import request from '@/utils/request';

export const getTemplate = (fileName: string) => {
    return request({
        url: '/template/get_template',
        method: 'get',
        params: { file_name: fileName },
        responseType: 'blob'
    });
};
```

- [ ] **Step 2: Commit**

```bash
git add src/api/template.ts
git commit -m "feat: add template download API module"
```

---

### Task 2: Add template download links to questions import dialog

**Files:**
- Modify: `src/views/question/questions.vue:231-236` (template, el-upload__tip area)
- Modify: `src/views/question/questions.vue:284` (script, import)

- [ ] **Step 1: Add import for `getTemplate`**

At line 284, add `getTemplate` to the existing import from `@/api/question` — actually, add a new import line:

After line 284 (`import { getAllQuestions, addQuestion, editQuestion, deleteQuestion, addQuestionsByFile } from '@/api/question';`), add:

```typescript
import { getTemplate } from '@/api/template';
```

- [ ] **Step 2: Add download handler function**

After the `importForm` reactive block (around line 429), add:

```typescript
const handleDownloadTemplate = async (fileName: string) => {
    try {
        const response = await getTemplate(fileName);
        const blob = new Blob([response.data], {
            type: 'application/vnd.ms-excel'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('下载模板失败:', error);
        ElMessage.error('下载模板失败，请重试');
    }
};
```

- [ ] **Step 3: Update the el-upload__tip in the import dialog**

Replace lines 231-234 (the `<template #tip>` block inside the import dialog):

```html
                        <template #tip>
                            <div class="el-upload__tip">
                                请上传 .xlsx 或 .xls 格式的 Excel 文件，必须使用下方模板填写
                                <div style="margin-top: 4px;">
                                    下载模板：
                                    <el-link type="primary" :underline="false"
                                        @click="handleDownloadTemplate('upload_questions_choice.xls')">
                                        单选题模板
                                    </el-link>
                                    <el-link type="primary" :underline="false"
                                        @click="handleDownloadTemplate('upload_questions_multi_choice.xls')">
                                        多选题模板
                                    </el-link>
                                    <el-link type="primary" :underline="false"
                                        @click="handleDownloadTemplate('upload_questions_qa.xls')">
                                        简答题模板
                                    </el-link>
                                </div>
                            </div>
                        </template>
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/views/question/questions.vue
git commit -m "feat: add template download links to questions import dialog"
```

---

### Task 3: Add template download link to department import dialog

**Files:**
- Modify: `src/views/organization/components/DepartmentManagement.vue:297-301` (template, el-upload__tip area)
- Modify: `src/views/organization/components/DepartmentManagement.vue:352` (script, import)

- [ ] **Step 1: Add import for `getTemplate`**

After line 352 (`import { getUsersByDepartment, removeUserFromDepartment, toggleUserStatus, addUsersByFile, updateUserByAdmin } from '@/api/user';`), add:

```typescript
import { getTemplate } from '@/api/template';
```

- [ ] **Step 2: Add download handler function**

Find the batch import related section (around line 460+ where `const handleImport` is defined). Add the download handler nearby:

```typescript
const handleDownloadTemplate = async (fileName: string) => {
    try {
        const response = await getTemplate(fileName);
        const blob = new Blob([response.data], {
            type: 'application/vnd.ms-excel'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error('下载模板失败:', error);
        ElMessage.error('下载模板失败，请重试');
    }
};
```

- [ ] **Step 3: Update the el-upload__tip in the import dialog**

Replace lines 297-301 (the `<template #tip>` block inside the batch import members dialog):

```html
                        <template #tip>
                            <div class="el-upload__tip">
                                请上传 .xlsx 或 .xls 格式的 Excel 文件，必须使用下方模板填写
                                <div style="margin-top: 4px;">
                                    下载模板：
                                    <el-link type="primary" :underline="false"
                                        @click="handleDownloadTemplate('upload_users.xls')">
                                        用户导入模板
                                    </el-link>
                                </div>
                            </div>
                        </template>
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/views/organization/components/DepartmentManagement.vue
git commit -m "feat: add template download link to department import dialog"
```
