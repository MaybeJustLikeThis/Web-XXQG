<template>
    <div class="sidebar">
        <el-menu class="sidebar-el-menu" :default-active="onRoutes" :collapse="sidebar.collapse"
            :background-color="sidebar.bgColor" :text-color="sidebar.textColor" router>
            <template v-for="item in menuData">
                <template v-if="item.children">
                    <!-- 有子菜单的情况：使用 item.permiss 或 item.id 作为主菜单权限 -->
                    <el-sub-menu :index="item.index" :key="item.index" v-permiss="item.permiss || item.id">
                        <template #title>
                            <el-icon>
                                <component :is="item.icon"></component>
                            </el-icon>
                            <span>{{ item.title }}</span>
                        </template>
                        <template v-for="subItem in item.children">
                            <el-sub-menu v-if="subItem.children" :index="subItem.index" :key="subItem.index"
                                v-permiss="subItem.permiss || subItem.id">
                                <template #title>{{ subItem.title }}</template>
                                <el-menu-item v-for="(threeItem, i) in subItem.children" :key="i"
                                    :index="threeItem.index" v-permiss="threeItem.permiss || threeItem.id">
                                    {{ threeItem.title }}
                                </el-menu-item>
                            </el-sub-menu>
                            <!-- 子菜单项：优先使用 subItem.permiss，其次使用 subItem.id -->
                            <el-menu-item v-else :index="subItem.index" v-permiss="subItem.permiss || subItem.id">
                                {{ subItem.title }}
                            </el-menu-item>
                        </template>
                    </el-sub-menu>
                </template>
                <template v-else>
                    <!-- 无子菜单：使用 item.permiss 或 item.id -->
                    <el-menu-item :index="item.index" :key="item.index" v-permiss="item.permiss || item.id">
                        <el-icon>
                            <component :is="item.icon"></component>
                        </el-icon>
                        <template #title>{{ item.title }}</template>
                    </el-menu-item>
                </template>
            </template>
        </el-menu>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSidebarStore } from '../store/sidebar';
import { useRoute } from 'vue-router';
import { menuData } from '@/components/menu';

const route = useRoute();
const onRoutes = computed(() => {
    return route.path;
});

const sidebar = useSidebarStore();
</script>

<style scoped>
.sidebar {
    display: block;
    position: absolute;
    left: 0;
    top: 70px;
    bottom: 0;
    overflow-y: scroll;
}

.sidebar::-webkit-scrollbar {
    width: 0;
}

.sidebar-el-menu:not(.el-menu--collapse) {
    width: 250px;
}

.sidebar-el-menu {
    min-height: 100%;
}
</style>
