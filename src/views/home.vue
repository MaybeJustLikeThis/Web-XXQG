<template>
    <div class="wrapper">
        <v-header />
        <v-sidebar />
        <div class="content-box" :class="{ 'content-collapse': sidebar.collapse }">
            <v-tabs></v-tabs>
            <div class="content">
                <router-view v-slot="{ Component }">
                    <transition name="move" mode="out-in">
                        <keep-alive :include="tabs.nameList">
                            <component :is="Component"></component>
                        </keep-alive>
                    </transition>
                </router-view>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useSidebarStore } from '@/store/sidebar';
import { useTabsStore } from '@/store/tabs';
import vHeader from '@/components/header.vue';
import vSidebar from '@/components/sidebar.vue';
import vTabs from '@/components/tabs.vue';

const sidebar = useSidebarStore();
const tabs = useTabsStore();
</script>

<style>
.wrapper {
    height: 100vh;
    overflow: hidden;
    transition: all 0.3s ease;
}

/* 暗色模式下的主背景 */
:root.dark .wrapper {
    background-color: var(--dashboard-bg, #0f0f0f);
}
.content-box {
    position: absolute;
    left: 250px;
    right: 0;
    top: 70px;
    bottom: 0;
    padding-bottom: 30px;
    -webkit-transition: left 0.3s ease-in-out;
    transition: left 0.3s ease-in-out;
    background: #eef0fc;
    overflow: hidden;
    transition: background-color 0.3s ease;
}

/* 暗色模式下的内容区域 */
:root.dark .content-box {
    background: var(--dashboard-bg, #0f0f0f);
}

.content {
    width: auto;
    height: 100%;
    padding: 20px;
    overflow-y: scroll;
    box-sizing: border-box;
}

.content::-webkit-scrollbar {
    width: 8px;
}

.content::-webkit-scrollbar-track {
    background: transparent;
}

.content::-webkit-scrollbar-thumb {
    background-color: #c0c4cc;
    border-radius: 4px;
}

.content::-webkit-scrollbar-thumb:hover {
    background-color: #909399;
}

/* 暗色模式下的滚动条 */
:root.dark .content::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter, #1f1f20);
}

:root.dark .content::-webkit-scrollbar-thumb {
    background-color: var(--el-border-color-dark, #58585b);
}

:root.dark .content::-webkit-scrollbar-thumb:hover {
    background-color: var(--el-border-color-darker, #636466);
}

.content-collapse {
    left: 65px;
}
</style>
