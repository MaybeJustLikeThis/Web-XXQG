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
}

.menu-card {
    min-height: 600px;
}

.card-header {
    font-weight: bold;
    font-size: 16px;
}

.org-menu {
    border: none;
}

.content-area {
    background: #fff;
    border-radius: 4px;
    min-height: 600px;
}
</style>