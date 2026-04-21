<template>
    <div class="organization-container">
        <DepartmentManagement />
    </div>
</template>

<script setup lang="ts" name="organization">
import DepartmentManagement from './components/DepartmentManagement.vue';
</script>

<style scoped>
.organization-container {
    padding: 20px;
    transition: all 0.3s ease;
}
</style>
