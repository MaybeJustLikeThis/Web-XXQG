<template>
    <div class="organization-container">
        <el-row :gutter="20">
            <!-- 左侧菜单 -->
            <el-col :span="4">
                <el-card class="menu-card">
                    <template #header>
                        <div class="card-header">
                            <span>组织管理</span>
                        </div>
                    </template>
                    <div class="org-menu">
                        <div class="menu-item active">
                            <el-icon><OfficeBuilding /></el-icon>
                            <span>部门管理</span>
                        </div>
                    </div>
                </el-card>
            </el-col>

            <!-- 右侧内容区 -->
            <el-col :span="20">
                <div class="content-area">
                    <DepartmentManagement />
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts" name="organization">
import { ref } from 'vue';
import { OfficeBuilding } from '@element-plus/icons-vue';
import DepartmentManagement from './components/DepartmentManagement.vue';

// 由于只有部门管理，移除菜单切换逻辑
</script>

<style scoped>
.organization-container {
    padding: 20px;
    transition: all 0.3s ease;
}

/* 暗色模式下的组织管理容器 */
:root.dark .organization-container {
    background: var(--dashboard-bg, #0f0f0f);
}

.menu-card {
    min-height: 600px;
}

.card-header {
    font-weight: bold;
    font-size: 16px;
    color: var(--text-primary, #1f2937);
    transition: color 0.3s ease;
}

/* 暗色模式下的卡片标题 */
:root.dark .card-header {
    color: var(--text-primary, #e5eaf3);
}

.org-menu {
    border: none;
}

/* 菜单项样式 */
.menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s ease;
    color: var(--text-primary, #1f2937);
}

.menu-item:hover {
    background: var(--el-fill-color-light, #f5f7fa);
}

.menu-item.active {
    background: var(--el-color-primary-light-9, #ecf5ff);
    color: var(--el-color-primary, #409eff);
}

/* 暗色模式下的菜单项 */
:root.dark .menu-item {
    color: var(--text-primary, #e5eaf3);
}

:root.dark .menu-item:hover {
    background: var(--el-fill-color-light, #262727);
}

:root.dark .menu-item.active {
    background: var(--el-color-primary-light-9, #1d3a5a);
    color: var(--el-color-primary, #409eff);
}

.content-area {
    background: #fff;
    border-radius: 4px;
    min-height: 600px;
    transition: all 0.3s ease;
}

/* 暗色模式下的内容区域 */
:root.dark .content-area {
    background: var(--card-bg, #1a1a1a);
    border: 1px solid var(--card-border, #2d2d2d);
}
</style>