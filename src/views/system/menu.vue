<template>
    <div class="container">
        <TableCustom :columns="columns" :tableData="menuData" row-key="index" :has-pagination="false"
            :viewFunc="handleView">
            <!-- 移除了编辑和删除功能，只保留查看功能 -->
            <template #toolbarBtn>
                <!-- 移除新增按钮 -->
            </template>
            <template #icon="{ rows }">
                <el-icon>
                    <component :is="rows.icon"></component>
                </el-icon>
            </template>
        </TableCustom>

        <el-dialog title="查看详情" v-model="visible1" width="700px" destroy-on-close>
            <TableDetail :data="viewData">
                <template #icon="{ rows }">
                    <el-icon>
                        <component :is="rows.icon"></component>
                    </el-icon>
                </template>
            </TableDetail>
        </el-dialog>
    </div>
</template>

<script setup lang="ts" name="system-menu">
import { ref } from 'vue';
import { Menus } from '@/types/menu';
import TableCustom from '@/components/table-custom.vue';
import TableDetail from '@/components/table-detail.vue';
import { menuData } from '@/components/menu';

// 表格相关
let columns = ref([
    { prop: 'title', label: '菜单名称', align: 'left' },
    { prop: 'icon', label: '图标' },
    { prop: 'index', label: '路由路径' },
    { prop: 'permiss', label: '权限标识' },
    // 移除操作列，因为不需要编辑和删除按钮
])

const getOptions = (data: any) => {
    return data.map(item => {
        const a: any = {
            label: item.title,
            value: item.id,
        }
        if (item.children) {
            a.children = getOptions(item.children)
        }
        return a
    })
}
const cascaderOptions = ref(getOptions(menuData));


// 移除编辑/新增相关代码

// 查看详情弹窗相关
const visible1 = ref(false);
const viewData = ref({
    row: {},
    list: []
});
const handleView = (row: Menus) => {
    viewData.value.row = { ...row }
    viewData.value.list = [
        {
            prop: 'id',
            label: '菜单ID',
        },
        {
            prop: 'pid',
            label: '父菜单ID',
        },
        {
            prop: 'title',
            label: '菜单名称',
        },
        {
            prop: 'index',
            label: '路由路径',
        },
        {
            prop: 'permiss',
            label: '权限标识',
        },
        {
            prop: 'icon',
            label: '图标',
        },
    ]
    visible1.value = true;
};

// 移除删除相关代码
</script>

<style scoped></style>