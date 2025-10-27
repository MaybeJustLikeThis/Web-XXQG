import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { usePermissStore } from '../store/permiss';
import Home from '../views/home.vue';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/dashboard',
    },
    {
        path: '/',
        name: 'Home',
        component: Home,
        children: [
            {
                path: '/dashboard',
                name: 'dashboard',
                meta: {
                    title: '系统首页',
                    noAuth: true,
                },
                component: () => import(/* webpackChunkName: "dashboard" */ '../views/dashboard.vue'),
            },
            {
                path: '/organization',
                name: 'organization',
                meta: {
                    title: '组织管理',
                    permiss: '10',
                },
                component: () => import(/* webpackChunkName: "organization" */ '../views/organization/index.vue'),
            },
            {
                path: '/content/articles',
                name: 'content-articles',
                meta: {
                    title: '文章管理',
                    permiss: '151',
                },
                component: () => import(/* webpackChunkName: "content-articles" */ '../views/content/articles.vue'),
            },
            {
                path: '/content/topics',
                name: 'content-topics',
                meta: {
                    title: '专题管理',
                    permiss: '152',
                },
                component: () => import(/* webpackChunkName: "content-topics" */ '../views/content/topics.vue'),
            },
            {
                path: '/content/columns',
                name: 'content-columns',
                meta: {
                    title: '专栏管理',
                    permiss: '153',
                },
                component: () => import(/* webpackChunkName: "content-columns" */ '../views/content/columns.vue'),
            },
            {
                path: '/question/questions',
                name: 'question-questions',
                meta: {
                    title: '题目管理',
                    permiss: '16',
                },
                component: () => import(/* webpackChunkName: "question-questions" */ '../views/question/questions.vue'),
            },
            {
                path: '/points/rules',
                name: 'points-rules',
                meta: {
                    title: '积分规则',
                    permiss: '171',
                },
                component: () => import(/* webpackChunkName: "points-rules" */ '../views/points/rules.vue'),
            },
            {
                path: '/points/records',
                name: 'points-records',
                meta: {
                    title: '积分记录',
                    permiss: '172',
                },
                component: () => import(/* webpackChunkName: "points-records" */ '../views/points/records.vue'),
            },
            {
                path: '/points/statistics',
                name: 'points-statistics',
                meta: {
                    title: '积分统计',
                    permiss: '173',
                },
                component: () => import(/* webpackChunkName: "points-statistics" */ '../views/points/statistics.vue'),
            },
            {
                path: '/system-menu',
                name: 'system-menu',
                meta: {
                    title: '菜单管理',
                    permiss: '13',
                },
                component: () => import(/* webpackChunkName: "system-menu" */ '../views/system/menu.vue'),
            },
            {
                path: '/ucenter',
                name: 'ucenter',
                meta: {
                    title: '个人中心',
                },
                component: () => import(/* webpackChunkName: "ucenter" */ '../views/pages/ucenter.vue'),
            },
        ],
    },
    {
        path: '/login',
        meta: {
            title: '登录',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "login" */ '../views/pages/login.vue'),
    },
    {
        path: '/register',
        meta: {
            title: '注册',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "register" */ '../views/pages/register.vue'),
    },
    {
        path: '/reset-pwd',
        meta: {
            title: '重置密码',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "reset-pwd" */ '../views/pages/reset-pwd.vue'),
    },
    {
        path: '/403',
        meta: {
            title: '没有权限',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "403" */ '../views/pages/403.vue'),
    },
    {
        path: '/404',
        meta: {
            title: '找不到页面',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "404" */ '../views/pages/404.vue'),
    },
    { path: '/:path(.*)', redirect: '/404' },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    NProgress.start();

    console.log('路由导航:', {
        from: from.path,
        to: to.path,
        requiresAuth: !to.meta.noAuth,
        permission: to.meta.permiss
    });

    // 检查登录状态：同时检查 token 和用户名
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('vuems_name');
    const permiss = usePermissStore();

    console.log('登录状态检查:', {
        token: token ? '存在' : '不存在',
        username: username ? username : '不存在',
        localStorage: {
            token: localStorage.getItem('token'),
            vuems_name: localStorage.getItem('vuems_name'),
            userProfile: localStorage.getItem('userProfile')
        }
    });

    // 检查是否需要登录
    if (!token || !username) {
        if (to.meta.noAuth === true) {
            // 登录相关页面，允许访问
            console.log('免登录页面，允许访问');
            next();
        } else {
            // 需要登录但没有登录，跳转到登录页
            console.log('需要登录但未登录，跳转到登录页');
            console.log('缺失信息:', {
                hasToken: !!token,
                hasUsername: !!username,
                tokenValue: token,
                usernameValue: username
            });
            next('/login');
        }
        return;
    }

    // 确保权限系统已初始化 - 如果 store 中没有用户信息，尝试重新初始化
    if (!permiss.userProfile && !permiss.key.length) {
        // 尝试重新初始化权限系统
        const userProfileStr = localStorage.getItem('userProfile');
        if (userProfileStr) {
            try {
                const userProfile = JSON.parse(userProfileStr);
                permiss.setUserProfile(userProfile);
                console.log('重新初始化权限系统成功');
            } catch (error) {
                console.error('解析用户信息失败，重新登录:', error);
                // 清理无效数据并跳转到登录页
                localStorage.removeItem('token');
                localStorage.removeItem('vuems_name');
                localStorage.removeItem('userProfile');
                next('/login');
                return;
            }
        } else {
            // 没有用户信息，可能是旧版本登录状态，使用兼容模式
            const keys = username === 'admin' ? permiss.defaultList.admin : permiss.defaultList.user;
            permiss.handleSet(keys);
            console.log('使用兼容模式初始化权限');
        }
    }

    // 检查页面权限
    if (typeof to.meta.permiss === 'string') {
        if (!permiss.key.includes(to.meta.permiss)) {
            // 没有权限，跳转到 403
            console.log('权限不足，跳转到403', {
                required: to.meta.permiss,
                has: permiss.key
            });
            next('/403');
            return;
        }
    }

    // 允许访问
    console.log('权限检查通过，允许访问');
    next();
});

// 添加路由错误处理
router.onError((error) => {
    console.error('路由错误:', error);
    NProgress.done();
});

router.afterEach(() => {
    NProgress.done();
});

export default router;
