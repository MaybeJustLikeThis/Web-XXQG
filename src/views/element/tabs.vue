<template>
    <div class="tabs-container">
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
            <el-tab-pane
                v-for="tab in tabs"
                :key="tab.name"
                :label="tab.label"
                :name="tab.name"
            >
                <slot :name="tab.name"></slot>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface TabItem {
    name: string;
    label: string;
}

interface Props {
    tabs: TabItem[];
    defaultTab?: string;
}

const props = withDefaults(defineProps<Props>(), {
    defaultTab: ''
});

const emit = defineEmits<{
    'tab-click': [tab: TabItem];
}>();

const activeTab = ref(props.defaultTab || (props.tabs[0]?.name || ''));

const handleTabClick = (tab: any) => {
    const selectedTab = props.tabs.find(t => t.name === tab.props.name);
    if (selectedTab) {
        emit('tab-click', selectedTab);
    }
};

onMounted(() => {
    if (!activeTab.value && props.tabs.length > 0) {
        activeTab.value = props.tabs[0].name;
    }
});
</script>

<style scoped>
.tabs-container {
    width: 100%;
}

:deep(.el-tabs__content) {
    padding: 20px 0;
}
</style>