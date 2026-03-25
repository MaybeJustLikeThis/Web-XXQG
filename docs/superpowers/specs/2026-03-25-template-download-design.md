# Template Download Feature Design

## Summary

Add template download buttons in the batch import dialogs so users can download the required Excel templates before importing.

## Background

The backend provides `GET /template/get_template?file_name=<name>` to download import templates. Currently, the frontend has no way to download these templates — users must know the format through external channels.

## Scope

Two pages, three files changed:

1. **New file**: `src/api/template.ts` — API call for template download
2. **Modified**: `src/views/question/questions.vue` — Add 3 template links in import dialog
3. **Modified**: `src/views/organization/components/DepartmentManagement.vue` — Add 1 template link in import dialog

## Design

### API Layer (`src/api/template.ts`)

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

### Template File Names

| Purpose | fileName |
|---------|----------|
| Single choice | `upload_questions_choice.xls` |
| Multiple choice | `upload_questions_multi_choice.xls` |
| Essay | `upload_questions_qa.xls` |
| Users | `upload_users.xls` |

### UI: Questions Import Dialog (`questions.vue`)

Inside the existing batch import dialog (`el-dialog` with `importDialogVisible`), update the `el-upload__tip` area:

```
请上传 .xlsx 或 .xls 格式的 Excel 文件，必须使用下方模板填写
下载模板：[单选题模板] [多选题模板] [简答题模板]
```

The three template names are rendered as clickable text links (using `el-link` component), placed inline after "下载模板：" label.

### UI: Department Import Dialog (`DepartmentManagement.vue`)

Inside the existing batch import members dialog, update the `el-upload__tip` area:

```
请上传 .xlsx 或 .xls 格式的 Excel 文件，必须使用下方模板填写
下载模板：[用户导入模板]
```

### Download Logic

Each page handles its own download via a shared pattern:

1. Call `getTemplate(fileName)` to get blob response
2. Create an `<a>` element with `URL.createObjectURL(blob)`
3. Set `download` attribute to the original template file name
4. Click programmatically, then revoke the object URL
5. Show `ElMessage.success` on success, `ElMessage.error` on failure

## Approach

Chosen: **方案 A — 各页面内联处理** (inline per-page handling).

Rationale: Only 2 pages need this feature. A shared component would be over-engineering for the current scope.
