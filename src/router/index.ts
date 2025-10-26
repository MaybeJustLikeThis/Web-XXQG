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
    const role = localStorage.getItem('vuems_name');
    const permiss = usePermissStore();

    if (!role && to.meta.noAuth !== true) {
        next('/login');
    } else if (typeof to.meta.permiss == 'string' && !permiss.key.includes(to.meta.permiss)) {
        // 如果没有权限，则进入403
        next('/403');
    } else {
        next();
    }
});

router.afterEach(() => {
    NProgress.done();
});

export default router;
