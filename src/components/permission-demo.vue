<template>
  <div class="permission-demo">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>权限管理系统演示</span>
        </div>
      </template>

      <!-- 当前用户信息 -->
      <div class="user-info">
        <h3>当前用户信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">{{ userProfile?.name || '未登录' }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ userProfile?.department || '-' }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ userProfile?.points || 0 }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag v-for="role in userRoles" :key="role" type="primary" style="margin-right: 8px;">
              {{ role }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 权限测试按钮 -->
      <div class="permission-tests">
        <h3>权限功能测试</h3>

        <!-- 超级管理员权限 -->
        <el-button v-permiss="'13'" type="danger" @click="showMessage('您有菜单管理权限')">
          菜单管理 (需要权限码: 13)
        </el-button>

        <!-- 内容管理权限 -->
        <el-button v-permiss="'151'" type="primary" @click="showMessage('您有文章管理权限')">
          文章管理 (需要权限码: 151)
        </el-button>

        <!-- 题目管理权限 -->
        <el-button v-permiss="'16'" type="success" @click="showMessage('您有题目管理权限')">
          题目管理 (需要权限码: 16)
        </el-button>

        <!-- 组织管理权限 -->
        <el-button v-permiss="'10'" type="warning" @click="showMessage('您有组织管理权限')">
          组织管理 (需要权限码: 10)
        </el-button>

        <!-- 没有权限的按钮 -->
        <el-button v-permiss="'999'" type="info" disabled>
          无权限按钮 (需要权限码: 999)
        </el-button>
      </div>

      <!-- 部门权限测试 -->
      <div class="department-tests" v-if="userProfile?.manage_departments?.length">
        <h3>部门管理权限测试</h3>
        <p>您可管理的部门ID: {{ userProfile.manage_departments.join(', ') }}</p>
        <el-button
          v-for="deptId in [1, 2, 3]"
          :key="deptId"
          :type="canManageDepartment(deptId) ? 'primary' : 'info'"
          :disabled="!canManageDepartment(deptId)"
          @click="testDepartmentPermission(deptId)">
          管理部门 {{ deptId }}
        </el-button>
      </div>

      <!-- 用户角色切换 -->
      <div class="role-switcher">
        <h3>模拟用户角色切换 (仅用于测试)</h3>
        <el-space>
          <el-button @click="switchToSuperAdmin">切换到超级管理员</el-button>
          <el-button @click="switchToContentManager">切换到内容管理员</el-button>
          <el-button @click="switchToQuestionManager">切换到题目管理员</el-button>
          <el-button @click="switchToDepartmentManager">切换到部门管理员</el-button>
          <el-button @click="switchToNormalUser">切换到普通用户</el-button>
        </el-space>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { usePermissStore, type UserProfile } from '@/store/permiss';
import { permission } from '@/utils/permission';

const permissStore = usePermissStore();

// 计算属性
const userProfile = computed(() => permissStore.userProfile);
const userRoles = computed(() => permissStore.userRoles);

// 方法
const showMessage = (message: string) => {
  ElMessage.success(message);
};

const canManageDepartment = (departmentId: number): boolean => {
  return permission.canManageDepartmentSync(departmentId);
};

const testDepartmentPermission = (deptId: number) => {
  if (canManageDepartment(deptId)) {
    showMessage(`您有权管理部门 ${deptId}`);
  } else {
    ElMessage.warning(`您无权管理部门 ${deptId}`);
  }
};

// 模拟角色切换
const switchToSuperAdmin = () => {
  const adminData: UserProfile = {
    id: 1,
    wx_id: "admin_wx_id",
    name: "超级管理员",
    sex: "男",
    race: "汉族",
    political_status: "中共党员",
    id_number: "110101199001011234",
    department: "技术部",
    points: 100,
    is_super_admin: true,
    edit_text: false,
    edit_question: false,
    manage_departments: []
  };
  permission.setUserInfo(adminData);
  ElMessage.success('已切换到超级管理员角色');
};

const switchToContentManager = () => {
  const contentManagerData: UserProfile = {
    id: 2,
    wx_id: "content_wx_id",
    name: "内容管理员",
    sex: "女",
    race: "汉族",
    political_status: "群众",
    id_number: "110101199001011235",
    department: "编辑部",
    points: 50,
    is_super_admin: false,
    edit_text: true,
    edit_question: false,
    manage_departments: []
  };
  permission.setUserInfo(contentManagerData);
  ElMessage.success('已切换到内容管理员角色');
};

const switchToQuestionManager = () => {
  const questionManagerData: UserProfile = {
    id: 3,
    wx_id: "question_wx_id",
    name: "题目管理员",
    sex: "男",
    race: "汉族",
    political_status: "群众",
    id_number: "110101199001011236",
    department: "教研部",
    points: 30,
    is_super_admin: false,
    edit_text: false,
    edit_question: true,
    manage_departments: []
  };
  permission.setUserInfo(questionManagerData);
  ElMessage.success('已切换到题目管理员角色');
};

const switchToDepartmentManager = () => {
  const deptManagerData: UserProfile = {
    id: 4,
    wx_id: "dept_wx_id",
    name: "部门管理员",
    sex: "女",
    race: "汉族",
    political_status: "中共党员",
    id_number: "110101199001011237",
    department: "管理部",
    points: 25,
    is_super_admin: false,
    edit_text: false,
    edit_question: false,
    manage_departments: [1, 2] // 可管理部门1和2
  };
  permission.setUserInfo(deptManagerData);
  ElMessage.success('已切换到部门管理员角色 (可管理部门: 1, 2)');
};

const switchToNormalUser = () => {
  const normalUserData: UserProfile = {
    id: 5,
    wx_id: "user_wx_id",
    name: "普通用户",
    sex: "男",
    race: "汉族",
    political_status: "群众",
    id_number: "110101199001011238",
    department: "业务部",
    points: 15,
    is_super_admin: false,
    edit_text: false,
    edit_question: false,
    manage_departments: []
  };
  permission.setUserInfo(normalUserData);
  ElMessage.success('已切换到普通用户角色');
};
</script>

<style scoped>
.permission-demo {
  padding: 20px;
}

.demo-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info, .permission-tests, .department-tests, .role-switcher {
  margin-bottom: 30px;
}

.permission-tests .el-button {
  margin-right: 10px;
  margin-bottom: 10px;
}

.department-tests .el-button {
  margin-right: 10px;
}

h3 {
  color: #409eff;
  margin-bottom: 15px;
}
</style>