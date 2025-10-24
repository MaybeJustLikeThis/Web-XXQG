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
                    <el-menu
                        :default-active="activeMenu"
                        class="org-menu"
                        @select="handleMenuSelect"
                    >
                        <el-menu-item index="department">
                            <el-icon><OfficeBuilding /></el-icon>
                            <span>部门管理</span>
                        </el-menu-item>
                        <el-menu-item index="user">
                            <el-icon><User /></el-icon>
                            <span>用户管理</span>
                        </el-menu-item>
                        <el-menu-item index="group">
                            <el-icon><UserFilled /></el-icon>
                            <span>用户分组</span>
                        </el-menu-item>
                        <el-menu-item index="invitation">
                            <el-icon><Key /></el-icon>
                            <span>邀请码管理</span>
                        </el-menu-item>
                    </el-menu>
                </el-card>
            </el-col>

            <!-- 右侧内容区 -->
            <el-col :span="20">
                <div class="content-area">
                    <!-- 部门管理 -->
                    <div v-show="activeMenu === 'department'">
                        <DepartmentManagement />
                    </div>

                    <!-- 用户管理 -->
                    <div v-show="activeMenu === 'user'">
                        <UserManagement />
                    </div>

                    <!-- 用户分组 -->
                    <div v-show="activeMenu === 'group'">
                        <UserGroupManagement />
                    </div>

                    <!-- 邀请码管理 -->
                    <div v-show="activeMenu === 'invitation'">
                        <InvitationManagement />
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts" name="organization">
import { ref } from 'vue';
import { OfficeBuilding, User, UserFilled, Key } from '@element-plus/icons-vue';
import DepartmentManagement from './components/DepartmentManagement.vue';
import UserManagement from './components/UserManagement.vue';
import UserGroupManagement from './components/UserGroupManagement.vue';
import InvitationManagement from './components/InvitationManagement.vue';

const activeMenu = ref('department');

const handleMenuSelect = (key: string) => {
    activeMenu.value = key;
};
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