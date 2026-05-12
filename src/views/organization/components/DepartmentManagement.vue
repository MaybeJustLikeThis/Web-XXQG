<template>
    <div class="department-management">
        <div class="header">
            <h2>部门管理</h2>
            <el-button type="primary" @click="showAddDialog(null)">
                <el-icon>
                    <Plus />
                </el-icon>
                新增部门
            </el-button>
        </div>

        <div class="content">
            <el-tree ref="treeRef" :data="departmentTree" :props="treeProps" :expand-on-click-node="false"
                :default-expanded-keys="expandedKeys" node-key="id" @node-expand="handleNodeExpand"
                @node-collapse="handleNodeCollapse">
                <template #default="{ node, data }">
                    <!-- 第一层权限检查：决定是否显示该部门节点 -->
                    <div class="tree-node" v-if="shouldDisplayDepartment(data.id)">
                        <div class="node-info">
                            <span class="node-name">{{ data.name }}</span>
                            <!-- 人数统计显示 -->
                            <el-tag v-if="data.userCount >= 0" size="small" type="info">
                                ({{ data.activeCount || 0 }}/{{ data.userCount }})
                            </el-tag>
                            <el-tag v-else size="small" type="info">
                                (-/-)
                            </el-tag>
                            <el-tag v-if="schoolStats.get(data.id)" size="small" color="#409eff" effect="dark">
                                激活/导入：{{ schoolStats.get(data.id)!.activated_count }}/{{ schoolStats.get(data.id)!.user_count }}
                            </el-tag>
                            <el-tag v-if="data.admin && data.admin.length > 0" size="small" type="success">
                                部门管理员：{{data.admin.map(a => a.name).join('，')}}
                            </el-tag>
                            <!-- 显示权限状态标签 -->
                            <el-tag v-if="!hasManagementPermission(data.id)" size="small" type="warning">
                                仅查看
                            </el-tag>
                        </div>
                        <div class="node-actions">
                            <!-- 第二层权限检查：决定显示哪些操作按钮 -->
                            <template v-if="hasManagementPermission(data.id)">
                                <!-- 有管理权限时显示操作按钮组 -->
                                <el-button type="primary" size="small" @click="showAddDialog(data)">
                                    新增子部门
                                </el-button>
                                <el-button type="primary" size="small" plain @click="showBatchAddDialog(data)">
                                    批量添加部门
                                </el-button>
                                <el-button type="success" size="small" plain @click="showBatchAddWithAdminDialog(data)">
                                    批量添加部门和管理员
                                </el-button>
                                <el-button type="info" size="small" @click="showMemberManagement(data)">
                                    成员管理
                                </el-button>
                                <el-button type="success" size="small" @click="showSetAdminDialog(data)">
                                    设置管理员
                                </el-button>
                                <el-button type="warning" size="small" @click="showEditDialog(data)">
                                    编辑
                                </el-button>
                                <el-button type="danger" size="small" @click="handleDelete(data)">
                                    删除
                                </el-button>
                            </template>
                            <template v-else>
                                <!-- 无管理权限时显示查看提示 -->
                                <span class="view-only-hint">您仅有查看权限</span>
                            </template>
                        </div>
                    </div>
                </template>
            </el-tree>
        </div>

        <!-- 新增/编辑部门弹窗 -->
        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑部门' : '新增部门'" width="500px" @close="resetForm">
            <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
                <el-form-item label="部门名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入部门名称" />
                </el-form-item>
                <el-form-item label="上级部门" prop="parentId">
                    <el-tree-select v-model="formData.parentId" :data="departmentOptions" :props="treeProps"
                        placeholder="请选择上级部门" clearable check-strictly :render-after-expand="false" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确认</el-button>
            </template>
        </el-dialog>

        <!-- 批量添加子部门弹窗 -->
        <el-dialog v-model="batchAddDialogVisible" title="批量添加子部门" width="500px" @close="resetBatchAddForm">
            <el-form ref="batchAddFormRef" :model="batchAddFormData" :rules="batchAddFormRules" label-width="100px">
                <el-form-item label="上级部门">
                    <el-input :model-value="batchAddParentName" readonly />
                </el-form-item>
                <el-form-item label="部门名称" prop="nameList">
                    <el-input v-model="batchAddFormData.nameText" type="textarea" :rows="6"
                        placeholder="每行输入一个部门名称" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="batchAddDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="batchAddSubmitting" @click="handleBatchAddSubmit">确认</el-button>
            </template>
        </el-dialog>

        <!-- 批量添加子部门及管理员弹窗 -->
        <el-dialog v-model="batchAddWithAdminDialogVisible" title="一键批量添加子部门和管理员账号" width="500px" @close="resetBatchAddWithAdminForm">
            <el-form label-width="100px">
                <el-form-item label="上级部门">
                    <el-input :model-value="batchAddParentName" readonly />
                </el-form-item>
                <el-form-item label="模板文件">
                    <el-link type="primary" @click="handleDownloadTemplate('upload_departments_with_admin_users.xls')" :underline="false" :loading="templateDownloading">
                        {{ templateDownloading ? '下载中...' : '下载导入模板' }}
                    </el-link>
                </el-form-item>
                <el-form-item label="上传文件">
                    <el-upload
                        ref="batchUploadRef"
                        :auto-upload="false"
                        :limit="1"
                        :on-change="handleBatchFileChange"
                        :on-remove="handleBatchFileRemove"
                        :before-upload="() => false"
                        accept=".xls,.xlsx"
                    >
                        <el-button type="primary">选择文件</el-button>
                        <template #tip>
                            <div class="el-upload__tip">仅支持 .xls / .xlsx 格式</div>
                        </template>
                    </el-upload>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="batchAddWithAdminDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="batchAddWithAdminSubmitting" :disabled="!batchAddSelectedFile" @click="handleBatchAddWithAdminSubmit">确认上传</el-button>
            </template>
        </el-dialog>

        <AdminManagementDialog
            v-model:visible="adminDialogVisible"
            :department-id="currentDepartmentId"
            :department-name="currentDepartmentName"
            :admins="currentDepartmentAdmins"
            @data-changed="onChildDataChanged"
        />

        <MemberManagementDialog
            v-model:visible="memberDialogVisible"
            :department="currentDepartment"
            @data-changed="onChildDataChanged"
        />

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { showError } from '@/utils/errorHandler';
import { Plus } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import { Department } from '@/types/organization';
import { getAllDepartments, updateDepartment, createDepartment, deleteDepartment, addBatchDepartment, addDepartmentWithAdminsByFile } from '@/api/department';
import { getUsersByDepartment } from '@/api/user';
import { getSchoolUserCount } from '@/api/dashboard';
import { downloadTemplate } from '@/utils/download';
import { usePermissStore } from '@/store/permiss';
import { permission } from '@/utils/permission';
import AdminManagementDialog from './AdminManagementDialog.vue';
import MemberManagementDialog from './MemberManagementDialog.vue';

// 响应式数据
const departmentTree = ref<Department[]>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref<FormInstance>();
const permiss = usePermissStore();
const isUnmounted = ref(false); // 组件是否已卸载
const abortController = new AbortController(); // 用于取消异步请求



// ========== 权限预计算：避免每次渲染重复遍历树 ==========
const deptNodeMap = computed(() => {
    const map = new Map<number, Department>();
    const collect = (depts: Department[]) => {
        for (const dept of depts) {
            map.set(dept.id, dept);
            if (dept.children) collect(dept.children);
        }
    };
    collect(departmentTree.value);
    return map;
});

const userManagedDeptIds = computed(() => {
    if (permission.isSuperAdmin()) return null; // null = 超级管理员，无限制
    const p = permiss.userProfile;
    if (!p?.manage_departments?.length) return new Set<number>();
    return new Set(p.manage_departments);
});

// 用户可查看的部门ID集合：直接管理 + 祖先链 + 后代
const visibleDeptIds = computed(() => {
    const managed = userManagedDeptIds.value;
    if (managed === null) return null; // 超级管理员
    if (managed.size === 0) return new Set<number>();

    const visible = new Set(managed);
    const map = deptNodeMap.value;

    for (const managedId of managed) {
        // 向上遍历祖先
        let dept = map.get(managedId);
        while (dept && dept.parentId != null && dept.parentId !== 0) {
            visible.add(dept.parentId);
            dept = map.get(dept.parentId);
        }
    }

    for (const managedId of managed) {
        // 向下遍历后代
        const descend = (node: Department) => {
            if (!node.children) return;
            for (const child of node.children) {
                visible.add(child.id);
                descend(child);
            }
        };
        const managedDept = map.get(managedId);
        if (managedDept) descend(managedDept);
    }

    return visible;
});

// 用户可管理的部门ID集合：直接管理 + 后代（不含祖先）
const manageableDeptIds = computed(() => {
    const managed = userManagedDeptIds.value;
    if (managed === null) return null;
    if (managed.size === 0) return new Set<number>();

    const manageable = new Set(managed);
    const map = deptNodeMap.value;

    for (const managedId of managed) {
        const descend = (node: Department) => {
            if (!node.children) return;
            for (const child of node.children) {
                manageable.add(child.id);
                descend(child);
            }
        };
        const managedDept = map.get(managedId);
        if (managedDept) descend(managedDept);
    }

    return manageable;
});

// ========== 优化：请求缓存机制 ==========
interface CacheItem {
    data: any;
    timestamp: number;
}

const userCountCache = ref<Map<number, CacheItem>>(new Map());
const CACHE_TTL = 5 * 60 * 1000; // 缓存5分钟
const loadingDeptIds = ref<Set<number>>(new Set()); // 正在加载中的部门ID，防止重复请求
const schoolStats = ref<Map<number, { user_count: number; activated_count: number }>>(new Map());

// 清除过期缓存
const clearExpiredCache = () => {
    const now = Date.now();
    const cache = userCountCache.value;

    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
        }
    }
};

// 获取缓存的用户数量
const getCachedUserCount = (deptId: number) => {
    const cached = userCountCache.value.get(deptId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
};

// 设置用户数量缓存
const setCachedUserCount = (deptId: number, data: any) => {
    userCountCache.value.set(deptId, {
        data,
        timestamp: Date.now()
    });
};

// ========== 树展开状态持久化 ==========
const DEPT_EXPAND_CACHE_KEY = 'department_expanded_keys';
const treeRef = ref();
const getInitialExpandedKeys = (): number[] => {
    try {
        const cached = localStorage.getItem(DEPT_EXPAND_CACHE_KEY);
        return cached ? JSON.parse(cached).map(Number) : [];
    } catch {
        return [];
    }
};
const expandedKeys = ref<number[]>(getInitialExpandedKeys());

const saveExpandedKeys = (keys: number[]) => {
    try {
        localStorage.setItem(DEPT_EXPAND_CACHE_KEY, JSON.stringify(keys));
    } catch {
        // ignore
    }
};

const handleNodeExpand = async (data: Department) => {
    const key = data.id;
    if (!expandedKeys.value.includes(key)) {
        expandedKeys.value = [...expandedKeys.value, key];
        saveExpandedKeys(expandedKeys.value);
    }
    // 展开时按需加载子部门的用户数量
    if (data.children && data.children.length > 0) {
        await processBatchRequests(data.children, loadUserCountForDept, 5);
    }
};

// 收集节点所有后代的 ID
const collectDescendantIds = (node: Department): number[] => {
    const ids: number[] = [];
    if (node.children) {
        for (const child of node.children) {
            ids.push(child.id);
            ids.push(...collectDescendantIds(child));
        }
    }
    return ids;
};

const handleNodeCollapse = (data: Department) => {
    // 阻止折叠第一级节点
    const isFirstLevel = departmentTree.value.some(d => d.id === data.id);
    if (isFirstLevel) {
        nextTick(() => {
            const node = treeRef.value?.getNode(data.id);
            node?.expand();
        });
        return;
    }
    // 收起节点时同时清除所有后代的展开状态，避免 el-tree 为展开后代而自动重新展开当前节点
    const descendantIds = collectDescendantIds(data);
    const removedIds = new Set([data.id, ...descendantIds]);
    expandedKeys.value = expandedKeys.value.filter(id => !removedIds.has(id));
    saveExpandedKeys(expandedKeys.value);
};

// ========== 直接从树遍历收集可见节点（展开节点 + 根节点 + 祖先链） ==========
const collectVisibleTreeNodes = (nodes: Department[], effectiveExpanded: Set<number>): Department[] => {
    const result: Department[] = [];
    for (const node of nodes) {
        result.push(node);
        if (effectiveExpanded.has(node.id) && node.children && node.children.length > 0) {
            result.push(...collectVisibleTreeNodes(node.children, effectiveExpanded));
        }
    }
    return result;
};

// ========== 按需加载单个部门用户数量（带去重） ==========
const loadUserCountForDept = async (dept: Department) => {
    const deptId = dept.id;

    if (loadingDeptIds.value.has(deptId)) return; // 正在加载中，去重
    const cached = getCachedUserCount(deptId);
    if (cached) {
        updateDepartmentTreeNode(departmentTree.value, deptId, cached);
        return;
    }

    loadingDeptIds.value = new Set([...loadingDeptIds.value, deptId]);

    try {
        const userRes = await getUsersByDepartment(deptId);
        if (userRes.data && userRes.data.code === 200 && Array.isArray(userRes.data.data)) {
            const users = userRes.data.data;
            const activeUsers = users.filter((user: any) => user.wx_id && user.wx_id.trim() !== '');
            const data = { userCount: users.length, activeCount: activeUsers.length };

            setCachedUserCount(deptId, data);
            updateDepartmentTreeNode(departmentTree.value, deptId, data);
        }
    } catch {
        // 加载失败静默处理
    } finally {
        const next = new Set(loadingDeptIds.value);
        next.delete(deptId);
        loadingDeptIds.value = next;
    }
};

// ========== 请求批量处理器（按批次并发，每批 batchSize 个） ==========
const processBatchRequests = async <T,>(
    items: T[],
    processor: (item: T) => Promise<void>,
    batchSize: number = 10
): Promise<void> => {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(processor));
    }
};

// 批量添加子部门相关
const batchAddDialogVisible = ref(false);
const batchAddFormRef = ref<FormInstance>();
const batchAddSubmitting = ref(false);
const batchAddParentId = ref<number>(0);
const batchAddParentName = ref('');
const batchAddFormData = reactive({
    nameText: ''
});
const batchAddFormRules = {
    nameText: [
        { required: true, message: '请输入部门名称，每行一个', trigger: 'blur' }
    ]
};

// 批量添加子部门及管理员（Excel上传）相关
const batchAddWithAdminDialogVisible = ref(false);
const batchAddWithAdminSubmitting = ref(false);
const batchAddSelectedFile = ref<File | null>(null);
const batchUploadRef = ref();
const templateDownloading = ref(false);
const handleDownloadTemplate = async (fileName: string) => {
    try {
        templateDownloading.value = true;
        await downloadTemplate(fileName);
    } catch (error: any) {
        showError(error, "模板下载失败");
    } finally {
        templateDownloading.value = false;
    }
};

    const adminDialogVisible = ref(false);
    const memberDialogVisible = ref(false);
    const currentDepartmentId = ref<number | null>(null);
    const currentDepartmentName = ref('');
    const currentDepartmentAdmins = ref<{ id: number; name: string }[]>([]);
    const currentDepartment = ref<Department | null>(null);

    const showSetAdminDialog = async (department: Department) => {
        const hasPermission = await canManageDepartment(department.id);
        if (!hasPermission) {
            ElMessage.warning('您没有管理部门的权限');
            return;
        }
        currentDepartmentId.value = department.id;
        currentDepartmentName.value = department.name;
        currentDepartmentAdmins.value = department.admin || [];
        adminDialogVisible.value = true;
    };

    const showMemberManagement = (department: Department) => {
        currentDepartment.value = { ...department };
        memberDialogVisible.value = true;
    };

    const onChildDataChanged = () => {
        userCountCache.value.clear();
        getDepartmentData();
    };




const formData = reactive({
    id: 0,
    name: '',
    parentId: undefined as number | undefined
});

const treeProps = {
    children: 'children',
    label: 'name',
    value: 'id'
};


// 表单验证规则
const formRules = {
    name: [
        { required: true, message: '请输入部门名称', trigger: 'blur' },
        { min: 2, max: 50, message: '部门名称长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    parentId: [
        { required: true, message: '请选择上级部门', trigger: 'change' }
    ]
};

// 管理员表单验证规则
const adminFormRules = {
    admin_id: [
        { required: true, message: '请选择管理员', trigger: 'change' }
    ]
};

// 成员表单验证规则
const memberFormRules = {
    name: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
    ],
    id_number: [
        { required: true, message: '请输入手机号', trigger: 'blur' }
    ],
    sex: [],
    race: [],
    political_status: []
};

// 获取部门选项（不包含当前部门及其子部门）
const departmentOptions = computed(() => {
    const filterDepartments = (deps: Department[], excludeId?: number): Department[] => {
        return deps.filter(dep => dep.id !== excludeId).map(dep => ({
            ...dep,
            children: dep.children ? filterDepartments(dep.children, excludeId) : undefined
        }));
    };

    return filterDepartments(departmentTree.value, isEdit.value ? formData.id : undefined);
});

// 获取部门数据
const getDepartmentData = async () => {
    if (isUnmounted.value || abortController.signal.aborted) return;

    try {
        const res = await getAllDepartments();

        if (res.data && res.data.code === 200 && Array.isArray(res.data.data)) {
            // 将API数据转换为前端需要的格式
            const departments = res.data.data.map((item: any) => {
                return {
                    id: Number(item.id),
                    name: item.name || '未命名部门',
                    parentId: Number(item.parent_department_id) === -1 ? null : Number(item.parent_department_id),
                    level: item.level || 1,
                    createTime: item.create_time || '',
                    userCount: -1, // -1 表示未加载，>=0 表示已加载
                    activeCount: -1,
                    admin: item.admin || [], // 添加管理员信息
                    parent_department_name: item.parent_department_name || '',
                    children: [] // 先初始化为空，后面会构建树结构
                };
            });

            // ========== 优化：先构建树结构并渲染，再异步加载用户数据 ==========

            // 构建完整的树结构
            const fullTree = buildDepartmentTree(departments);

            // 过滤显示用户有权限查看的部门（包含权限继承链）
            departmentTree.value = filterDepartmentTreeForDisplay(fullTree);

            // 从展示树中收集所有有效 ID，确保不含被过滤掉的节点
            const allIds: number[] = [];
            const collectAllIds = (nodes: Department[]) => {
                for (const node of nodes) {
                    allIds.push(node.id);
                    if (node.children) collectAllIds(node.children);
                }
            };
            collectAllIds(departmentTree.value);
            const validKeys = expandedKeys.value.filter(id => allIds.includes(id));

            // 确保第一级节点始终展开
            const firstLevelIds = departmentTree.value.map(d => d.id);
            const mergedKeys = [...new Set([...validKeys, ...firstLevelIds])];

            expandedKeys.value = mergedKeys;

            // ========== 展开祖先链：确保深层展开节点的完整路径可遍历 ==========
            // el-tree 的 default-expanded-keys 会自动展开祖先链，但我们的遍历代码不会
            // 所以需要手动把祖先节点也加入 expandedKeys
            const effectiveExpanded = new Set(expandedKeys.value);
            const parentMap = new Map<number, number | null>();
            const buildParentMap = (nodes: Department[], pid: number | null) => {
                for (const node of nodes) {
                    parentMap.set(node.id, pid);
                    if (node.children) buildParentMap(node.children, node.id);
                }
            };
            buildParentMap(departmentTree.value, null);
            for (const key of expandedKeys.value) {
                let pid = parentMap.get(key);
                while (pid != null) {
                    effectiveExpanded.add(pid);
                    pid = parentMap.get(pid) ?? null;
                }
            }

            saveExpandedKeys(mergedKeys);

            // 清除过期缓存
            clearExpiredCache();

            // 优先加载学校用户统计数据，后续用户数据逐个加载即可即时匹配
            try {
                const statsRes = await getSchoolUserCount();
                if (statsRes.data && statsRes.data.code === 200 && Array.isArray(statsRes.data.data)) {
                    const statsMap = new Map<number, { user_count: number; activated_count: number }>();
                    for (const item of statsRes.data.data) {
                        if (item.school?.id && item.user_count != null && item.activated_count != null) {
                            statsMap.set(Number(item.school.id), {
                                user_count: Number(item.user_count),
                                activated_count: Number(item.activated_count)
                            });
                        }
                    }
                    schoolStats.value = statsMap;
                }
            } catch {
                // 学校统计数据加载失败，静默处理
            }

            // ========== 只加载当前可见部门（展开的 + 根节点 + 祖先链）的用户数据 ==========
            const visibleNodes = collectVisibleTreeNodes(departmentTree.value, effectiveExpanded);
            await processBatchRequests(visibleNodes, loadUserCountForDept, 10);

        } else {
            throw new Error('API返回数据格式不正确');
        }
    } catch (error) {
        if (!isUnmounted.value) {
            showError(error, '获取部门数据失败');
            console.error('获取部门数据错误:', error);
        }

        // 发生错误时清空部门树
        departmentTree.value = [];
    }
};

// 更新部门树中节点的用户数量（直接修改树节点，触发响应式更新）
const updateDepartmentTreeNode = (tree: Department[], deptId: number, data: { userCount: number; activeCount: number }): boolean => {
    for (const dept of tree) {
        if (dept.id === deptId) {
            dept.userCount = data.userCount;
            dept.activeCount = data.activeCount;
            return true;
        }
        if (dept.children && dept.children.length > 0) {
            if (updateDepartmentTreeNode(dept.children, deptId, data)) return true;
        }
    }
    return false;
};

// 构建部门树结构
const buildDepartmentTree = (departments: Department[]): Department[] => {
    const map = new Map<number, Department>();
    const tree: Department[] = [];

    // 创建映射
    departments.forEach(dept => {
        map.set(dept.id, { ...dept, children: [] });
    });

    // 构建树
    departments.forEach(dept => {
        const node = map.get(dept.id)!;
        if (dept.parentId === null || dept.parentId === 0) {
            // 根部门（parentId为null或0）
            tree.push(node);
        } else {
            const parent = map.get(dept.parentId);
            if (parent) {
                parent.children!.push(node);
            } else {
                // 如果找不到父节点，作为根节点
                tree.push(node);
            }
        }
    });

    return tree;
};

// 过滤部门树，显示用户有权限查看的部门（包含权限继承链上的所有部门）
const filterDepartmentTreeForDisplay = (tree: Department[]): Department[] => {
    const userProfile = permiss.userProfile;
    // 超级管理员可以看到所有部门
    if (userProfile?.is_super_admin) {
        return tree;
    }


    if (!userProfile?.manage_departments || userProfile.manage_departments.length === 0) {
        return [];
    }

    const userDeptIds = new Set(userProfile.manage_departments);

    // 收集所有需要显示的部门ID：
    // 1. 用户可管理的部门
    // 2. 用户可管理部门的所有上级部门（完整权限链）
    // 3. 用户可管理部门的所有下级部门（权限继承）
    const visibleDeptIds = new Set<number>();

    // 构建部门映射用于查找父子关系
    const allDepartments = new Map<number, Department>();
    const collectAllDepartments = (depts: Department[]) => {
        depts.forEach(dept => {
            allDepartments.set(dept.id, dept);
            if (dept.children) {
                collectAllDepartments(dept.children);
            }
        });
    };
    collectAllDepartments(tree);

    // 为每个用户权限部门查找完整的权限链
    userDeptIds.forEach(managedDeptId => {
        // 1. 添加用户直接管理的部门
        visibleDeptIds.add(managedDeptId);

        // 2. 查找所有上级部门（权限链向上）
        const findParentDepartments = (deptId: number) => {
            const dept = allDepartments.get(deptId);
            if (!dept) return;

            if (dept.parentId !== null && dept.parentId !== 0) {
                visibleDeptIds.add(dept.parentId);
                findParentDepartments(dept.parentId);
            }
        };
        findParentDepartments(managedDeptId);

        // 3. 查找所有下级部门（权限继承向下）
        const findChildDepartments = (deptId: number) => {
            const dept = allDepartments.get(deptId);
            if (!dept || !dept.children) return;

            dept.children.forEach(child => {
                visibleDeptIds.add(child.id);
                findChildDepartments(child.id);
            });
        };
        findChildDepartments(managedDeptId);
    });

    // 递归过滤树，只保留可见的部门，但保持完整的树结构
    const filterTreeForDisplay = (departments: Department[]): Department[] => {
        return departments.filter(dept => {
            // 如果当前部门在可见列表中，显示它及其子部门
            if (visibleDeptIds.has(dept.id)) {
                // 递归处理子部门，只显示可见的子部门
                if (dept.children && dept.children.length > 0) {
                    dept.children = filterTreeForDisplay(dept.children);
                }
                return true;
            }
            // 如果当前部门不可见，但它的子部门中有可见的，也要显示当前部门（作为路径）
            else if (dept.children && dept.children.length > 0) {
                const filteredChildren = filterTreeForDisplay(dept.children);
                if (filteredChildren.length > 0) {
                    dept.children = filteredChildren;
                    return true;
                }
            }
            return false;
        });
    };

    return filterTreeForDisplay(tree);
};

// 显示新增对话框
const showAddDialog = (parent: Department | null) => {
    isEdit.value = false;
    resetForm();
    if (parent) {
        formData.parentId = parent.id;
    }
    dialogVisible.value = true;
};

// 显示批量添加子部门对话框
const showBatchAddDialog = (parent: Department) => {
    batchAddParentId.value = parent.id;
    batchAddParentName.value = parent.name;
    batchAddFormData.nameText = '';
    batchAddDialogVisible.value = true;
};

// 重置批量添加表单
const resetBatchAddForm = () => {
    try {
        if (batchAddFormRef.value && !isUnmounted.value) {
            batchAddFormRef.value.resetFields();
        }
    } catch (error) {
        // ignore
    }
    if (!isUnmounted.value) {
        batchAddFormData.nameText = '';
    }
};

// 提交批量添加
const handleBatchAddSubmit = async () => {
    if (!batchAddFormRef.value) return;

    try {
        await batchAddFormRef.value.validate();

        const nameList = batchAddFormData.nameText
            .split('\n')
            .map((name: string) => name.trim())
            .filter((name: string) => name.length > 0);

        if (nameList.length === 0) {
            ElMessage.warning('请输入至少一个部门名称');
            return;
        }

        batchAddSubmitting.value = true;
        await addBatchDepartment({
            name_list: nameList,
            parent_department_id: batchAddParentId.value
        });

        ElMessage.success(`成功添加 ${nameList.length} 个部门`);
        batchAddDialogVisible.value = false;

        userCountCache.value.clear();
        await getDepartmentData();
    } catch (error: any) {
        if (error !== 'cancel') {
            showError(error, '批量添加失败');
        }
    } finally {
        batchAddSubmitting.value = false;
    }
};

// ===== 批量添加子部门及管理员（Excel上传） =====
const showBatchAddWithAdminDialog = (parent: Department) => {
    batchAddParentId.value = parent.id;
    batchAddParentName.value = parent.name;
    batchAddSelectedFile.value = null;
    batchAddWithAdminDialogVisible.value = true;
};

const handleBatchFileChange = (file: any) => {
    batchAddSelectedFile.value = file.raw;
};

const handleBatchFileRemove = () => {
    batchAddSelectedFile.value = null;
};

const resetBatchAddWithAdminForm = () => {
    batchAddSelectedFile.value = null;
    if (batchUploadRef.value && !isUnmounted.value) {
        batchUploadRef.value.clearFiles();
    }
};

const handleBatchAddWithAdminSubmit = async () => {
    if (!batchAddSelectedFile.value) {
        ElMessage.warning('请先选择文件');
        return;
    }

    try {
        batchAddWithAdminSubmitting.value = true;
        await addDepartmentWithAdminsByFile(batchAddParentId.value, batchAddSelectedFile.value);

        ElMessage.success('批量添加成功');
        batchAddWithAdminDialogVisible.value = false;

        userCountCache.value.clear();
        await getDepartmentData();
    } catch (error: any) {
        if (error !== 'cancel') {
            showError(error, '批量添加失败');
        }
    } finally {
        batchAddWithAdminSubmitting.value = false;
    }
};

// 显示编辑对话框
const showEditDialog = async (department: Department) => {
    // 检查权限（包含继承逻辑）
    const hasPermission = await canManageDepartment(department.id);
    if (!hasPermission) {
        ElMessage.warning('您没有编辑该部门的权限');
        return;
    }

    isEdit.value = true;
    Object.assign(formData, department);
    dialogVisible.value = true;
};

// 删除部门
const handleDelete = async (department: Department) => {
    if (department.children && department.children.length > 0) {
        ElMessage.error('该部门下还有子部门，无法删除');
        return;
    }

    if ((department.userCount ?? 0) > 0) {
        ElMessage.error('该部门下还有用户，无法删除');
        return;
    }

    try {
        await ElMessageBox.confirm('确定要删除该部门吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        });

        // 调用删除API
        await deleteDepartment({ department_id: department.id });

        ElMessage.success('删除成功');

        // 清除缓存
        userCountCache.value.clear();

        await getDepartmentData();
    } catch (error) {
        if (error !== 'cancel') {
            showError(error, '删除失败');
        }
    }
};

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return;

    try {
        await formRef.value.validate();

        // 调用创建或更新API
        if (isEdit.value) {
            // 构造更新接口所需的参数格式
            const updateData = {
                department_id: formData.id,
                name: formData.name,
                parent_department_id: formData.parentId || -1
            };
            await updateDepartment(updateData);
        } else {
            // 构造新增接口所需的参数格式
            const createData = {
                name: formData.name,
                parent_department_id: formData.parentId || -1
            };
            await createDepartment(createData);
        }

        ElMessage.success(isEdit.value ? '编辑成功' : '新增成功');
        dialogVisible.value = false;

        // 清除缓存，因为部门数据已更新
        userCountCache.value.clear();

        await getDepartmentData();
    } catch (error) {
        if (error !== 'cancel') {
            showError(error, isEdit.value ? '更新失败' : '添加失败');
        }
    }
};

// 重置表单
const resetForm = () => {
    try {
        if (formRef.value && !isUnmounted.value) {
            formRef.value.resetFields();
        }
    } catch (error) {
        // 忽略表单重置过程中的错误
    }

    if (!isUnmounted.value) {
        Object.assign(formData, {
            id: 0,
            name: '',
            parentId: undefined
        });
    }
};

// 检查是否可以管理部门（支持权限继承） - 用于异步操作前的权限验证
const canManageDepartment = async (departmentId: number): Promise<boolean> => {
    try {
        // 首先检查异步权限（包含继承逻辑）
        const hasInheritedPermission = await permission.canManageDepartment(departmentId);
        if (hasInheritedPermission) {
            return true;
        }

        // 如果没有继承权限，用户无权管理该部门
        return false;
    } catch (error) {
        // 降级到同步权限检查（不包含继承）
        const hasSyncPermission = permission.canManageDepartmentSync(departmentId);
        return hasSyncPermission;
    }
};

// 检查部门是否应该显示（展示权限） - 第一层权限检查
const shouldDisplayDepartment = (departmentId: number): boolean => {
    const ids = visibleDeptIds.value;
    if (ids === null) return true; // 超级管理员
    return ids.has(departmentId);
};

// 检查是否有管理权限（操作权限） - 第二层权限检查
const hasManagementPermission = (departmentId: number): boolean => {
    const ids = manageableDeptIds.value;
    if (ids === null) return true; // 超级管理员
    return ids.has(departmentId);
};

onMounted(() => {
    getDepartmentData();
});

onUnmounted(() => {
    isUnmounted.value = true;

    // 取消所有正在进行的异步请求
    abortController.abort();

    // 清理缓存（可选，如果希望保留缓存则删除此行）
    userCountCache.value.clear();

    // 立即关闭所有弹窗
    dialogVisible.value = false;
    adminDialogVisible.value = false;
    memberDialogVisible.value = false;

    // 使用 setTimeout 延迟清理，确保 Vue 完成卸载过程
    setTimeout(() => {
        try {
            // 清理所有可能引起问题的引用
            currentDepartmentId.value = null;
            currentDepartmentName.value = '';
                    // currentDepartmentAdmins 不需要清空，因为它会被组件卸载自动清理
                } catch (error) {
            // 忽略清理过程中的任何错误
        }
    }, 0);
});
</script>

<style scoped>
.department-management {
    padding: 20px;
    transition: all 0.3s ease;
}

/* 暗色模式下的部门管理容器 */
:root.dark .department-management {
    background-color: var(--dashboard-bg, #0f0f0f);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.content {
    background: #fff;
    border-radius: 4px;
    padding: 20px;
    transition: all 0.3s ease;
}

/* 暗色模式下的内容区域 */
:root.dark .content {
    background: var(--card-bg, #1a1a1a);
    border: 1px solid var(--card-border, #2d2d2d);
}

.tree-node {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-right: 20px;
}

.node-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.node-name {
    font-weight: 500;
    color: var(--text-primary, #1f2937);
    transition: color 0.3s ease;
}

/* 暗色模式下的节点名称 */
:root.dark .node-name {
    color: var(--text-primary, #e5eaf3);
}

.node-actions {
    display: flex;
    gap: 8px;
}

:deep(.el-tree-node__content) {
    height: 40px;
    border-radius: 4px;
    margin: 2px 0;
}

:deep(.el-tree-node__content:hover) {
    background-color: #f5f7fa;
}

/* 暗色模式下的树形控件 */
:root.dark :deep(.el-tree-node__content) {
    background-color: transparent;
    color: var(--text-primary, #e5eaf3);
}

:root.dark :deep(.el-tree-node__content:hover) {
    background-color: var(--el-fill-color-light, #262727);
}

:root.dark :deep(.el-tree-node__expand-icon) {
    color: var(--text-secondary, #a3a6ad);
}

:root.dark :deep(.el-tree-node__expand-icon:hover) {
    color: var(--text-primary, #e5eaf3);
}

:root.dark :deep(.el-tree-node__label) {
    color: var(--text-primary, #e5eaf3);
}

/* 成员管理样式 */
.member-management-content {
    max-height: 70vh;
    overflow-y: auto;
}

.member-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

.member-search {
    background: #f5f7fa;
    padding: 20px;
    border-radius: 4px;
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

/* 暗色模式下的搜索区域 */
:root.dark .member-search {
    background: var(--el-fill-color-light, #262727);
    border: 1px solid var(--card-border, #2d2d2d);
}

.member-table {
    background: #fff;
    transition: background-color 0.3s ease;
}

/* 暗色模式下的成员表格 */
:root.dark .member-table {
    background: var(--card-bg, #1a1a1a);
}

.group-tag {
    margin-right: 5px;
    margin-bottom: 2px;
}

.permission-tag {
    margin-right: 5px;
    margin-bottom: 2px;
}

.no-permission {
    color: #909399;
    font-size: 12px;
    transition: color 0.3s ease;
}

/* 暗色模式下的权限提示 */
:root.dark .no-permission {
    color: var(--text-muted, #6c6e72);
}

.invite-code {
    color: #409eff;
    cursor: pointer;
    text-decoration: underline;
    font-family: monospace;
    font-weight: 500;
}

.invite-code:hover {
    color: #66b1ff;
}

.no-invite-code {
    color: #c0c4cc;
    font-style: italic;
    transition: color 0.3s ease;
}

/* 暗色模式下的无邀请码提示 */
:root.dark .no-invite-code {
    color: var(--text-muted, #6c6e72);
}

.pagination {
    margin-top: 20px;
    text-align: right;
}

.view-only-hint {
    color: #909399;
    font-size: 12px;
    font-style: italic;
}

/* 暗色模式下的查看提示 */
:root.dark .view-only-hint {
    color: #a3a6ad;
}
</style>