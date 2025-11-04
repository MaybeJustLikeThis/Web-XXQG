import { mix, setProperty } from '@/utils';
import { defineStore } from 'pinia';
import { useSidebarStore } from './sidebar';

export const useThemeStore = defineStore('theme', {
    state: () => {
        return {
            primary: '',
            success: '',
            warning: '',
            danger: '',
            info: '',
            headerBgColor: '#242f42',
            headerTextColor: '#fff',
            darkMode: false,
        };
    },
    getters: {},
    actions: {
        initTheme() {
            ['primary', 'success', 'warning', 'danger', 'info'].forEach((type) => {
                const color = localStorage.getItem(`theme-${type}`) || '';
                if (color) {
                    this.setPropertyColor(color, type); // 设置主题色
                }
            });
            const headerBgColor = localStorage.getItem('header-bg-color');
            headerBgColor && this.setHeaderBgColor(headerBgColor);
            const headerTextColor = localStorage.getItem('header-text-color');
            headerTextColor && this.setHeaderTextColor(headerTextColor);

            // 初始化夜间模式
            const darkMode = localStorage.getItem('dark-mode') === 'true';
            this.setDarkMode(darkMode);
        },
        resetTheme() {
            ['primary', 'success', 'warning', 'danger', 'info'].forEach((type) => {
                this.setPropertyColor('', type); // 重置主题色
            });
        },
        setPropertyColor(color: string, type: string = 'primary') {
            this[type] = color;
            setProperty(`--el-color-${type}`, color);
            localStorage.setItem(`theme-${type}`, color);
            this.setThemeLight(type);
        },
        setThemeLight(type: string = 'primary') {
            [3, 5, 7, 8, 9].forEach((v) => {
                setProperty(`--el-color-${type}-light-${v}`, mix('#ffffff', this[type], v / 10));
            });
            setProperty(`--el-color-${type}-dark-2`, mix('#ffffff', this[type], 0.2));
        },
        setHeaderBgColor(color: string) {
            this.headerBgColor = color;
            setProperty('--header-bg-color', color);
            localStorage.setItem(`header-bg-color`, color);
        },
        setHeaderTextColor(color: string) {
            this.headerTextColor = color;
            setProperty('--header-text-color', color);
            localStorage.setItem(`header-text-color`, color);
        },
        toggleDarkMode() {
            this.setDarkMode(!this.darkMode);
        },
        setDarkMode(isDark: boolean) {
            this.darkMode = isDark;
            localStorage.setItem('dark-mode', isDark.toString());

            // 添加或移除 dark 类名到 html 元素
            const html = document.documentElement;
            if (isDark) {
                html.classList.add('dark');
                // 设置暗色主题的CSS变量
                setProperty('--el-bg-color', '#1a1a1a');
                setProperty('--el-bg-color-page', '#141414');
                setProperty('--el-bg-color-overlay', '#262727');
                setProperty('--el-text-color-primary', '#e5eaf3');
                setProperty('--el-text-color-regular', '#cfd3dc');
                setProperty('--el-text-color-secondary', '#a3a6ad');
                setProperty('--el-text-color-placeholder', '#8d9095');
                setProperty('--el-text-color-disabled', '#6c6e72');
                setProperty('--el-border-color', '#4c4d4f');
                setProperty('--el-border-color-light', '#414243');
                setProperty('--el-border-color-lighter', '#363637');
                setProperty('--el-border-color-extra-light', '#2b2b2c');
                setProperty('--el-border-color-dark', '#58585b');
                setProperty('--el-border-color-darker', '#636466');
                setProperty('--el-fill-color', '#2b2b2c');
                setProperty('--el-fill-color-light', '#262727');
                setProperty('--el-fill-color-lighter', '#1f1f20');
                setProperty('--el-fill-color-extra-light', '#191919');
                setProperty('--el-fill-color-dark', '#303132');
                setProperty('--el-fill-color-darker', '#363637');
                setProperty('--el-fill-color-blank', 'transparent');
                setProperty('--el-box-shadow', '0px 12px 32px 4px rgba(0, 0, 0, .36), 0px 8px 20px rgba(0, 0, 0, .72)');
                setProperty('--el-box-shadow-light', '0px 0px 12px rgba(0, 0, 0, .72)');
                setProperty('--el-box-shadow-lighter', '0px 0px 6px rgba(0, 0, 0, .54)');
                setProperty('--el-box-shadow-dark', '0px 16px 48px 16px rgba(0, 0, 0, .72), 0px 12px 32px rgba(0, 0, 0, .84), 0px 8px 16px -8px rgba(0, 0, 0, .9)');
                setProperty('--el-disabled-bg-color', '#262727');
                setProperty('--el-disabled-text-color', '#6c6e72');
                setProperty('--el-disabled-border-color', '#4c4d4f');
                setProperty('--el-overlay-color', 'rgba(0, 0, 0, .8)');
                setProperty('--el-overlay-color-light', 'rgba(0, 0, 0, .7)');
                setProperty('--el-overlay-color-lighter', 'rgba(0, 0, 0, .5)');
                setProperty('--el-mask-color', 'rgba(255, 255, 255, .9)');
                setProperty('--el-mask-color-extra-light', 'rgba(255, 255, 255, .3)');

                // 自定义暗色主题变量
                setProperty('--dashboard-bg', '#0f0f0f');
                setProperty('--card-bg', '#1a1a1a');
                setProperty('--card-border', '#2d2d2d');
                setProperty('--text-primary', '#e5eaf3');
                setProperty('--text-secondary', '#a3a6ad');
                setProperty('--text-muted', '#6c6e72');
                setProperty('--header-bg-dark', '#1a1a1a');
                setProperty('--header-text-dark', '#e5eaf3');

                // 更新header颜色
                this.setHeaderBgColor('#1a1a1a');
                this.setHeaderTextColor('#e5eaf3');

                // 更新侧边栏颜色
                const sidebarStore = useSidebarStore();
                sidebarStore.setBgColor('#1a1a1a');
                sidebarStore.setTextColor('#e5eaf3');
            } else {
                html.classList.remove('dark');
                // 恢复亮色主题的CSS变量
                setProperty('--el-bg-color', '#ffffff');
                setProperty('--el-bg-color-page', '#f2f3f5');
                setProperty('--el-bg-color-overlay', '#ffffff');
                setProperty('--el-text-color-primary', '#303133');
                setProperty('--el-text-color-regular', '#606266');
                setProperty('--el-text-color-secondary', '#909399');
                setProperty('--el-text-color-placeholder', '#a8abb2');
                setProperty('--el-text-color-disabled', '#c0c4cc');
                setProperty('--el-border-color', '#dcdfe6');
                setProperty('--el-border-color-light', '#e4e7ed');
                setProperty('--el-border-color-lighter', '#ebeef5');
                setProperty('--el-border-color-extra-light', '#f2f6fc');
                setProperty('--el-border-color-dark', '#d3d4d6');
                setProperty('--el-border-color-darker', '#cdd0d6');
                setProperty('--el-fill-color', '#f0f2f5');
                setProperty('--el-fill-color-light', '#f5f7fa');
                setProperty('--el-fill-color-lighter', '#fafafa');
                setProperty('--el-fill-color-extra-light', '#fafcff');
                setProperty('--el-fill-color-dark', '#ebedf0');
                setProperty('--el-fill-color-darker', '#e6e8eb');
                setProperty('--el-fill-color-blank', '#ffffff');
                setProperty('--el-box-shadow', '0px 12px 32px 4px rgba(0, 0, 0, .04), 0px 8px 20px rgba(0, 0, 0, .08)');
                setProperty('--el-box-shadow-light', '0px 0px 12px rgba(0, 0, 0, .12)');
                setProperty('--el-box-shadow-lighter', '0px 0px 6px rgba(0, 0, 0, .04)');
                setProperty('--el-box-shadow-dark', '0px 16px 48px 16px rgba(0, 0, 0, .08), 0px 12px 32px rgba(0, 0, 0, .12), 0px 8px 16px -8px rgba(0, 0, 0, .16)');
                setProperty('--el-disabled-bg-color', 'var(--el-fill-color-light)');
                setProperty('--el-disabled-text-color', 'var(--el-text-color-placeholder)');
                setProperty('--el-disabled-border-color', 'var(--el-border-color-light)');
                setProperty('--el-overlay-color', 'rgba(0, 0, 0, .5)');
                setProperty('--el-overlay-color-light', 'rgba(0, 0, 0, .3)');
                setProperty('--el-overlay-color-lighter', 'rgba(0, 0, 0, .12)');
                setProperty('--el-mask-color', 'rgba(255, 255, 255, .9)');
                setProperty('--el-mask-color-extra-light', 'rgba(255, 255, 255, .3)');

                // 自定义亮色主题变量
                setProperty('--dashboard-bg', '#f5f7fa');
                setProperty('--card-bg', '#ffffff');
                setProperty('--card-border', '#f1f5f9');
                setProperty('--text-primary', '#1f2937');
                setProperty('--text-secondary', '#6b7280');
                setProperty('--text-muted', '#9ca3af');

                // 恢复header颜色
                this.setHeaderBgColor('#242f42');
                this.setHeaderTextColor('#fff');

                // 恢复侧边栏颜色
                const sidebarStore = useSidebarStore();
                sidebarStore.setBgColor('#324157');
                sidebarStore.setTextColor('#bfcbd9');
            }
        }
    }
});