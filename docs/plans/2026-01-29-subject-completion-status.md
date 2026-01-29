# Subject Completion Status Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Completion Status" tab to the subject content management dialog that displays all users' completion progress for a selected subject, with sortable columns and Excel export capability.

**Architecture:** This feature integrates into the existing `topics.vue` component by adding a fourth tab pane. It follows the established pattern of the other three tabs (articles, questions, departments) and uses the existing XLSX library for Excel export. The data is fetched from a new backend endpoint and displayed in a sortable table with progress bars for visual completion representation.

**Tech Stack:** Vue 3 Composition API, TypeScript, Element Plus UI components, Axios for API calls, XLSX library for Excel export

---

## Task 1: Add TypeScript Type Definitions

**Files:**
- Modify: `src/types/content.ts`

**Step 1: Add type definitions for completion data**

Append these interfaces to the end of `src/types/content.ts`:

```typescript
// Subject completion data types
export interface SubjectCompletionData {
  total_items: number;  // Total articles + questions in the subject
  users: SubjectUserCompletion[];
}

export interface SubjectUserCompletion {
  id: number;           // User ID
  name: string;         // User name
  department: string;   // Department name/path
  completion_degree: number;  // Completion percentage (0-100)
}
```

**Step 2: Verify types are valid**

Run: `npm run build -- --noEmit`
Expected: No TypeScript errors related to the new types

**Step 3: Commit**

```bash
git add src/types/content.ts
git commit -m "feat: add TypeScript types for subject completion data"
```

---

## Task 2: Add API Function

**Files:**
- Modify: `src/api/subject.ts`

**Step 1: Add the API function**

Add this function to `src/api/subject.ts` after the `deleteSubjectDepartment` function (around line 125):

```typescript
// 获取专题完成情况
export const getSubjectCompletion = (subjectId: number) => {
    return request({
        url: '/subject/check_completion_degree',
        method: 'get',
        params: { subject_id: subjectId }
    });
};
```

**Step 2: Verify the function is exported**

Check that the function is properly exported and follows the same pattern as other API functions in the file.

**Step 3: Commit**

```bash
git add src/api/subject.ts
git commit -m "feat: add API function for subject completion data"
```

---

## Task 3: Add Completion Tab Pane Template

**Files:**
- Modify: `src/views/content/topics.vue`

**Step 1: Add the fourth tab pane**

Add this new tab pane after the `<!-- 部门管理 -->` tab pane (after line 343, before the closing `</el-tabs>` at line 345):

```vue
<!-- 完成情况 -->
<el-tab-pane label="完成情况" name="completion">
    <div class="content-management" v-loading="loadingCompletion" element-loading-text="正在加载完成情况...">
        <!-- 统计信息 -->
        <div class="completion-summary">
            <div class="summary-card">
                <div class="summary-item">
                    <span class="summary-label">专题内容总数</span>
                    <span class="summary-value">{{ completionData.total_items || 0 }}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">统计用户数</span>
                    <span class="summary-value">{{ completionData.users?.length || 0 }}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">平均完成度</span>
                    <span class="summary-value">{{ averageCompletion }}%</span>
                </div>
            </div>
        </div>

        <!-- 工具栏 -->
        <div class="table-toolbar">
            <div class="toolbar-left">
                <el-button type="primary" :icon="Download" @click="exportCompletionToExcel"
                    :loading="exportCompletionLoading" :disabled="!completionData.users || completionData.users.length === 0">
                    <el-icon><Download /></el-icon>
                    导出Excel
                </el-button>
                <el-button :icon="Refresh" @click="fetchCompletionData" :loading="loadingCompletion">
                    <el-icon><Refresh /></el-icon>
                    刷新
                </el-button>
            </div>
            <div class="toolbar-right">
                <span class="total-info">共 {{ completionData.users?.length || 0 }} 位用户</span>
            </div>
        </div>

        <!-- 完成情况表格 -->
        <div class="table-container">
            <el-table :data="completionData.users" border stripe style="width: 100%"
                :default-sort="{ prop: 'completion_degree', order: 'descending' }"
                v-if="completionData.users && completionData.users.length > 0">
                <el-table-column type="index" label="序号" width="70" align="center">
                    <template #default="{ $index }">
                        {{ $index + 1 }}
                    </template>
                </el-table-column>
                <el-table-column prop="id" label="用户ID" width="100" align="center" sortable>
                    <template #default="scope">
                        <span style="font-weight: 600; color: #409eff;">{{ scope.row.id }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="姓名" min-width="120" sortable show-overflow-tooltip>
                    <template #default="scope">
                        <span style="font-weight: 500;">{{ scope.row.name }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="department" label="所属部门" min-width="250" sortable
                    show-overflow-tooltip />
                <el-table-column prop="completion_degree" label="完成进度" width="200" align="center" sortable>
                    <template #default="scope">
                        <div class="progress-cell">
                            <el-progress
                                :percentage="scope.row.completion_degree"
                                :color="getProgressColor(scope.row.completion_degree)"
                                :stroke-width="18"
                                :text-inside="true"
                            />
                        </div>
                    </template>
                </el-table-column>
            </el-table>
            <el-empty v-else description="暂无完成情况数据" :image-size="100" />
        </div>
    </div>
</el-tab-pane>
```

**Step 2: Verify template structure**

Check that the tab is properly nested within the `<el-tabs>` component and follows the same structure as the other tab panes.

**Step 3: Commit**

```bash
git add src/views/content/topics.vue
git commit -m "feat: add completion status tab pane template"
```

---

## Task 4: Import Required Icons and Dependencies

**Files:**
- Modify: `src/views/content/topics.vue`

**Step 1: Add imports for icons and XLSX**

Update the import statement at line 388 to include `Download` and `Refresh` icons:

```typescript
import { Plus, Edit, Delete, Search, Document, Clock, OfficeBuilding, Check, Setting, Link, Download, Refresh } from '@element-plus/icons-vue';
```

**Step 2: Add XLSX import**

Add this import after the other imports (around line 393):

```typescript
import * as XLSX from 'xlsx';
```

**Step 3: Add API import**

Update the import statement at line 390 to include the new API function:

```typescript
import { getSubjects, updateSubject, addSubject, deleteSubject, addSubjectDepartment, deleteSubjectDepartment, getSubjectCompletion } from '@/api/subject';
```

**Step 4: Verify all imports are resolved**

Run: `npm run dev` and check console for import errors
Expected: No module not found errors

**Step 5: Commit**

```bash
git add src/views/content/topics.vue
git commit -m "feat: add imports for completion tab icons and dependencies"
```

---

## Task 5: Add Reactive State Variables

**Files:**
- Modify: `src/views/content/topics.vue`

**Step 1: Add completion data state variables**

Add these reactive variables after the `questionOperations` declaration (around line 513):

```typescript
// 完成情况管理
const loadingCompletion = ref(false);
const completionData = ref<any>({
  total_items: 0,
  users: []
});
const exportCompletionLoading = ref(false);
```

**Step 2: Verify state variables are properly defined**

Check that all variables use `ref()` for reactivity and follow the same pattern as other state variables in the component.

**Step 3: Commit**

```bash
git add src/views/content/topics.vue
git commit -m "feat: add reactive state for completion data"
```

---

## Task 6: Add Data Fetching Function

**Files:**
- Modify: `src/views/content/topics.vue`

**Step 1: Add the fetch completion data function**

Add this function after the `removeQuestionFromTopic` function (around line 1557):

```typescript
// ================== 完成情况功能 ==================

// 获取专题完成情况数据
const fetchCompletionData = async () => {
    if (!currentTopic.value) return;

    try {
        loadingCompletion.value = true;

        const res = await getSubjectCompletion(Number(currentTopic.value.id));
        const data = res.data.data || res.data;

        if (data) {
            completionData.value = {
                total_items: data.total_items || 0,
                users: data.users || []
            };
        } else {
            completionData.value = {
                total_items: 0,
                users: []
            };
        }
    } catch (error) {
        ElMessage.error('获取完成情况失败');
        console.error('获取完成情况失败:', error);
        completionData.value = {
            total_items: 0,
            users: []
        };
    } finally {
        loadingCompletion.value = false;
    }
};
```

**Step 2: Verify the function follows error handling patterns**

Check that the function includes proper try-catch error handling and loading state management, following the same pattern as other data fetching functions in the file.

**Step 3: Commit**

```bash
git add src/views/content/topics.vue
git commit -m "feat: add fetch completion data function"
```

---

## Task 7: Add Computed Properties

**Files:**
- Modify: `src/views/content/topics.vue`

**Step 1: Add average completion computed property**

Add this computed property after the `questionFilter` reactive object (around line 482):

```typescript
// 计算平均完成度
const averageCompletion = computed(() => {
    if (!completionData.value.users || completionData.value.users.length === 0) {
        return 0;
    }
    const total = completionData.value.users.reduce((sum: number, user: any) => sum + (user.completion_degree || 0), 0);
    return Math.round(total / completionData.value.users.length);
});
```

**Step 2: Verify computed property logic**

Check that the computed property handles edge cases (empty array, undefined values) and returns a rounded integer value.

**Step 3: Commit**

```bash
git add src/views/content/topics.vue
git commit -m "feat: add average completion computed property"
```

---

## Task 8: Add Progress Color Helper Function

**Files:**
- Modify: `src/views/content/topics.vue`

**Step 1: Add progress color function**

Add this function after the `getQuestionTypeColor` function (around line 1269):

```typescript
// 根据完成度返回进度条颜色
const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#67c23a'; // 绿色
    if (percentage >= 60) return '#409eff'; // 蓝色
    if (percentage >= 40) return '#e6a23c'; // 橙色
    return '#f56c6c'; // 红色
};
```

**Step 2: Verify color thresholds**

Check that the function returns appropriate colors for different completion levels:
- 80%+ : Green (excellent)
- 60-79%: Blue (good)
- 40-59%: Orange (fair)
- <40%: Red (poor)

**Step 3: Commit**

```bash
git add src/views/content/topics.vue
git commit -m "feat: add progress color helper function"
```

---

## Task 9: Add Excel Export Function

**Files:**
- Modify: `src/views/content/topics.vue`

**Step 1: Add export to Excel function**

Add this function after the `getProgressColor` function:

```typescript
// 导出完成情况到Excel
const exportCompletionToExcel = () => {
    if (!completionData.value.users || completionData.value.users.length === 0) {
        ElMessage.warning('暂无数据可导出');
        return;
    }

    try {
        exportCompletionLoading.value = true;

        // 准备导出数据
        const exportData = completionData.value.users.map((user: any, index: number) => ({
            '序号': index + 1,
            '用户ID': user.id,
            '姓名': user.name,
            '所属部门': user.department,
            '完成进度(%)': user.completion_degree
        }));

        // 添加统计信息行
        const summaryData = [
            { '专题内容总数': completionData.value.total_items },
            { '统计用户数': completionData.value.users.length },
            { '平均完成度(%)': averageCompletion.value },
            {}, // 空行
            { '说明': '以下是用户完成情况明细' },
            {} // 空行
        ];

        // 合并数据
        const finalData = [...summaryData, ...exportData];

        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(finalData);

        // 设置列宽
        ws['!cols'] = [
            { wch: 8 },   // 序号
            { wch: 12 },  // 用户ID
            { wch: 15 },  // 姓名
            { wch: 40 },  // 所属部门
            { wch: 15 }   // 完成进度
        ];

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '专题完成情况');

        // 生成文件名
        const fileName = `专题完成情况_${currentTopic.value?.name || '未命名'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;

        // 下载文件
        XLSX.writeFile(wb, fileName);

        ElMessage.success('导出成功');
    } catch (error) {
        ElMessage.error('导出失败');
        console.error('导出Excel失败:', error);
    } finally {
        exportCompletionLoading.value = false;
    }
};
```

**Step 2: Verify export function handles all edge cases**

Check that the function:
- Handles empty data
- Includes summary statistics
- Sets appropriate column widths
- Generates meaningful filename with subject name and date

**Step 3: Commit**

```bash
git add src/views/content/topics.vue
git commit -m "feat: add Excel export function for completion data"
```

---

## Task 10: Integrate Tab Switch Handler

**Files:**
- Modify: `src/views/content/topics.vue`

**Step 1: Update handleManageContent to load completion data**

Find the `handleManageContent` function (around line 779) and add a call to fetch completion data. Update the function to also call `fetchCompletionData()` after getting departments:

```typescript
// 管理内容
const handleManageContent = async (row: any) => {
    currentTopic.value = row;
    contentDialogVisible.value = true;
    activeTab.value = 'articles';

    // 保存原始数据
    originalTopicArticles.value = (row.texts || []).map((text: any) => text.id);
    originalTopicQuestions.value = (row.question_list || []).map((question: any) => question.id);

    // 获取文章、题目和部门列表
    await getAvailableArticles();
    await getAvailableQuestions();
    await getAvailableDepartments();
    await getAppliedDepartments(); // 获取专题应用的部门
    await getAllDepartmentsList();

    // 设置已选状态
    await nextTick();
    setArticleSelection();
    setQuestionSelection();
};
```

No changes needed here - we'll load completion data lazily when the tab is clicked.

**Step 2: Add watch for tab switching**

Add this watch after the `onMounted` hook (around line 1561):

```typescript
// 监听标签页切换
watch(activeTab, async (newTab) => {
    if (newTab === 'completion' && currentTopic.value) {
        // 只在首次切换到完成情况标签时加载数据
        if (completionData.value.users.length === 0) {
            await fetchCompletionData();
        }
    }
});
```

**Step 3: Import watch function**

Update the Vue imports at line 386 to include `watch`:

```typescript
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
```

**Step 4: Verify tab switching loads data correctly**

Test that switching to the completion tab triggers data fetch only once, and switching between other tabs doesn't reload completion data unnecessarily.

**Step 5: Commit**

```bash
git add src/views/content/topics.vue
git commit -m "feat: add tab switch handler to load completion data"
```

---

## Task 11: Add Styles for Completion Tab

**Files:**
- Modify: `src/views/content/topics.vue`

**Step 1: Add CSS styles**

Add these styles at the end of the `<style scoped>` section (before the closing `</style>` tag at line 2089):

```css
/* 完成情况标签页样式 */
.completion-summary {
    margin-bottom: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
}

/* 暗色模式下的统计区域 */
:root.dark .completion-summary {
    background: linear-gradient(135deg, #4c5c9e 0%, #5a3d7e 100%);
    box-shadow: 0 4px 12px rgba(76, 92, 158, 0.3);
}

.summary-card {
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 20px;
}

.summary-item {
    flex: 1;
    text-align: center;
    padding: 15px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.summary-item:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.25);
}

.summary-label {
    display: block;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 8px;
    font-weight: 500;
}

.summary-value {
    display: block;
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 6px;
    transition: all 0.3s ease;
}

/* 暗色模式下的工具栏 */
:root.dark .table-toolbar {
    background: var(--el-fill-color-light, #262727);
}

.toolbar-left {
    display: flex;
    gap: 12px;
    align-items: center;
}

.toolbar-right {
    display: flex;
    align-items: center;
}

.total-info {
    font-size: 14px;
    color: var(--text-secondary, #606266);
    font-weight: 500;
    transition: color 0.3s ease;
}

/* 暗色模式下的统计信息 */
:root.dark .total-info {
    color: var(--text-secondary, #a3a6ad);
}

.table-container {
    margin-top: 16px;
}

.progress-cell {
    padding: 0 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
    .summary-card {
        flex-direction: column;
        gap: 12px;
    }

    .summary-item {
        width: 100%;
        padding: 12px;
    }

    .table-toolbar {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }

    .toolbar-left {
        flex-direction: column;
        width: 100%;
    }

    .toolbar-left .el-button {
        width: 100%;
    }
}
```

**Step 2: Verify styles don't conflict with existing styles**

Check that the new styles are scoped properly and don't affect other tab panes or components.

**Step 3: Commit**

```bash
git add src/views/content/topics.vue
git commit -m "feat: add styles for completion status tab"
```

---

## Task 12: Manual Testing

**Files:**
- No file modifications

**Step 1: Start development server**

Run: `npm run dev`
Expected: Server starts successfully at localhost port

**Step 2: Navigate to subjects page**

1. Open browser to development server URL
2. Login with admin credentials
3. Navigate to "内容管理" → "专题管理"
4. Click on any subject's "管理" button

**Step 3: Test completion tab functionality**

1. Click on the "完成情况" tab
2. Verify:
   - Loading indicator appears
   - Data loads successfully (if backend is ready)
   - Summary statistics display correctly
   - User table displays with all columns
   - Progress bars show correct colors based on completion percentage
   - Sort functionality works for all sortable columns
   - Refresh button reloads data
   - Export button generates Excel file with correct data

**Step 4: Test edge cases**

1. Test with subject that has no users
2. Test with subject that has no articles/questions
3. Test export with empty data (should show warning)
4. Test sorting on different columns
5. Test switching between tabs multiple times

**Step 5: Verify Excel export**

1. Click "导出Excel" button
2. Verify file downloads with correct name format
3. Open Excel file and verify:
   - Summary statistics at top
   - All user data rows
   - Correct column headers
   - Proper formatting and column widths

**Step 6: Document any issues**

If any issues are found, create bug tasks for fixes. Otherwise, proceed to final testing.

**Step 7: Commit test results documentation**

```bash
echo "# Test Results - $(date)" >> docs/test-results/completion-feature.md
# Add test execution notes
git add docs/test-results/completion-feature.md
git commit -m "test: document manual test results for completion feature"
```

---

## Task 13: TypeScript Build Verification

**Files:**
- No file modifications

**Step 1: Run TypeScript compiler check**

Run: `npm run build`
Expected: Build completes successfully with no TypeScript errors

**Step 2: Check for type errors**

Review build output for any type-related warnings or errors related to:
- New type definitions in `content.ts`
- API function return types
- Component props and data binding

**Step 3: Fix any type issues if found**

If type errors exist:
1. Identify the specific type mismatch
2. Fix the type definitions or usage
3. Re-run build to verify fix

**Step 4: Commit**

```bash
# Only if fixes were needed
git add src/types/content.ts src/api/subject.ts src/views/content/topics.vue
git commit -m "fix: resolve TypeScript type errors"
```

---

## Task 14: Final Code Review

**Files:**
- Review all modified files

**Step 1: Review type definitions**

Check `src/types/content.ts`:
- Interface names are descriptive and follow naming conventions
- All required fields are present
- Types are appropriate for the data

**Step 2: Review API function**

Check `src/api/subject.ts`:
- Function follows existing patterns
- Error handling is consistent
- Parameter naming is clear

**Step 3: Review component implementation**

Check `src/views/content/topics.vue`:
- Template follows Vue 3 Composition API best practices
- Reactive variables are properly defined
- Computed properties are used appropriately
- Functions follow single responsibility principle
- Error handling is comprehensive
- Loading states are properly managed
- Styles follow the existing design system

**Step 4: Verify code quality**

Check for:
- No console.log statements left in production code
- No commented-out code
- Consistent code formatting
- Meaningful variable and function names
- Proper JSDoc comments for complex functions

**Step 5: Create code review checklist**

```bash
cat > docs/review/completion-feature-checklist.md << 'EOF'
# Completion Feature Code Review Checklist

## Type Definitions
- [ ] Interfaces are well-named and descriptive
- [ ] All fields have appropriate types
- [ ] Types align with API response structure

## API Layer
- [ ] Function follows existing patterns
- [ ] Error handling is consistent
- [ ] Request parameters are correct

## Component Implementation
- [ ] Template is clean and readable
- [ ] Reactive state is properly managed
- [ ] Computed properties are used where appropriate
- [ ] Functions have single responsibility
- [ ] Error handling is comprehensive
- [ ] Loading states prevent race conditions
- [ ] No memory leaks (proper cleanup)

## UI/UX
- [ ] Loading indicators provide feedback
- [ ] Error messages are user-friendly
- [ ] Progress bars are visually clear
- [ ] Responsive design works on mobile
- [ ] Dark mode styles are consistent

## Excel Export
- [ ] Export includes all necessary data
- [ ] Filename is descriptive
- [ ] Column widths are appropriate
- [ ] Summary data is included

## Testing
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] TypeScript build passes
- [ ] No console errors in browser
EOF

git add docs/review/completion-feature-checklist.md
git commit -m "docs: add code review checklist for completion feature"
```

---

## Task 15: Final Integration Test

**Files:**
- No file modifications

**Step 1: Full production build**

Run: `npm run build`
Expected: Clean build with no errors or warnings

**Step 2: Preview production build**

Run: `npm run serve`
Expected: Production preview server starts

**Step 3: Test in production mode**

1. Open production preview URL
2. Run through all test scenarios from Task 12
3. Verify performance is acceptable
4. Check bundle size impact

**Step 4: Verify dark mode**

1. Switch to dark mode
2. Navigate to completion tab
3. Verify all styles render correctly in dark mode

**Step 5: Verify responsive design**

1. Resize browser window to tablet width (768px)
2. Verify layout adapts correctly
3. Resize to mobile width (375px)
4. Verify mobile layout is usable

**Step 6: Document build results**

```bash
cat > docs/build/completion-feature-build.md << 'EOF'
# Completion Feature Build Results

Date: $(date)

## Build Status
- TypeScript: PASS
- Bundle Size: TBD bytes
- Build Time: TBD seconds

## Performance Metrics
- Initial Load: TBD ms
- Tab Switch: TBD ms
- Export Generation: TBD ms

## Browser Compatibility
- Chrome: PASS
- Firefox: PASS
- Safari: PASS
- Edge: PASS

## Notes
EOF

git add docs/build/completion-feature-build.md
git commit -m "docs: document production build results"
```

---

## Task 16: Final Commit and Documentation

**Files:**
- Create: `docs/features/completion-status.md`

**Step 1: Create feature documentation**

```bash
cat > docs/features/completion-status.md << 'EOF'
# Subject Completion Status Feature

## Overview
This feature adds a "Completion Status" tab to the subject content management dialog, displaying all users' completion progress for a selected subject.

## Features
- View completion statistics for all users assigned to a subject
- Visual progress bars with color coding based on completion percentage
- Sortable columns (ID, Name, Department, Completion Degree)
- Export completion data to Excel with summary statistics
- Real-time data refresh capability

## User Interface
- **Tab Name**: 完成情况
- **Location**: Fourth tab in 专题内容管理 dialog
- **Columns**: 用户ID, 姓名, 所属部门, 完成进度

## API Endpoint
- **URL**: `/subject/check_completion_degree`
- **Method**: GET
- **Parameters**: `subject_id` (number)
- **Response**: See TypeScript types in `src/types/content.ts`

## Technical Details
- Uses existing XLSX library for Excel export
- Follows established tab pane patterns
- Implements lazy loading (data fetches on tab switch)
- Includes comprehensive error handling
- Supports dark mode and responsive design

## Usage
1. Navigate to "内容管理" → "专题管理"
2. Click "管理" button on any subject
3. Select "完成情况" tab
4. View completion data, sort columns, or export to Excel

## Color Coding
- 80%+ : Green (excellent)
- 60-79%: Blue (good)
- 40-59%: Orange (fair)
- <40%: Red (poor)
EOF

git add docs/features/completion-status.md
git commit -m "docs: add feature documentation for completion status"
```

**Step 2: Verify all changes are committed**

Run: `git status`
Expected: No uncommitted changes (except untracked files)

**Step 3: Review commit history**

Run: `git log --oneline -20`
Expected: Series of clean, atomic commits following the plan

**Step 4: Create summary PR description**

```bash
cat > docs/pr/completion-feature-pr.md << 'EOF'
# Add Subject Completion Status Feature

## Summary
Implements a new "Completion Status" tab in the subject content management dialog to track and display user completion progress for subjects.

## Changes
- Added TypeScript type definitions for completion data
- Created API function to fetch completion statistics
- Implemented fourth tab pane with sortable table
- Added Excel export functionality with summary statistics
- Included progress bars with color-coded visualization
- Added dark mode and responsive design support

## Files Modified
- `src/types/content.ts` - Added completion data types
- `src/api/subject.ts` - Added getSubjectCompletion function
- `src/views/content/topics.vue` - Added completion tab UI and logic

## Testing
- Manual testing completed for all user flows
- TypeScript compilation successful
- Excel export verified
- Dark mode and responsive design tested

## Screenshots
(Attach screenshots of the completion tab)

## Related Issues
Closes #[issue-number]
EOF

git add docs/pr/completion-feature-pr.md
git commit -m "docs: add PR description for completion feature"
```

**Step 5: Create final tag**

```bash
git tag -a feature/completion-status -m "Add subject completion status feature"
git push origin feature/completion-status
```

---

## Success Criteria

✅ **Complete when:**
1. All 16 tasks are completed
2. TypeScript build passes with no errors
3. Manual testing confirms all features work
4. Excel export generates correct files
5. Dark mode and responsive design verified
6. All code is committed with atomic commits
7. Documentation is complete
8. No console errors or warnings in production build

## Rollback Plan

If critical issues are found:
1. Revert to tag: `git checkout [previous-stable-tag]`
2. Hotfix branch: `git checkout -b hotfix/completion-status`
3. Fix issues and re-test
4. Merge hotfix to master
5. Create new tag

## Next Steps After Implementation

1. **Backend Integration**: Ensure backend API `/subject/check_completion_degree` is implemented and returns data in the expected format
2. **User Acceptance Testing**: Get feedback from actual users
3. **Performance Monitoring**: Monitor API response times and optimize if needed
4. **Feature Enhancements**: Consider adding filters by department or completion range
5. **Documentation Updates**: Update user manual with screenshots and usage instructions

---

**Plan End**

**Total Estimated Tasks**: 16
**Estimated Completion Time**: 2-3 hours
**Dependencies**: Backend API must be implemented or mocked for testing
