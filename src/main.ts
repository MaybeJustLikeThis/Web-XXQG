import { createApp } from 'vue';
import { createPinia } from 'pinia';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import { usePermissStore } from './store/permiss';
import 'element-plus/dist/index.css';
import './assets/css/icon.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// 注册elementplus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}
// 自定义权限指令 - 使用新的权限系统
const permiss = usePermissStore();
app.directive('permiss', {
    mounted(el, binding) {
        updatePermissionElement(el as HTMLElement, binding);
    },
    updated(el, binding) {
        updatePermissionElement(el as HTMLElement, binding);
    },
});

// 导入权限工具
import { updatePermissionElement } from './utils/permission';

app.mount('#app');
