import { Menus } from '@/types/menu';

export const menuData: Menus[] = [
    {
        id: '0',
        title: '系统首页',
        index: '/dashboard',
        icon: 'Odometer',
    },
    {
        id: '10',
        title: '组织管理',
        index: '/organization',
        icon: 'OfficeBuilding',
        permiss: '10',
    },
    {
        id: '15',
        title: '内容管理',
        index: '15',
        icon: 'Document',
        permiss: '15',
        children: [
            {
                id: '151',
                pid: '15',
                index: '/content/articles',
                title: '文章管理',
                permiss: '151',
            },
            {
                id: '152',
                pid: '15',
                index: '/content/topics',
                title: '专题管理',
                permiss: '152',
            },
            {
                id: '153',
                pid: '15',
                index: '/content/columns',
                title: '专栏管理',
                permiss: '153',
            },
        ],
    },
    {
        id: '16',
        title: '题目管理',
        index: '/question/questions',
        icon: 'Notebook',
        permiss: '16',
    },
    {
        id: '17',
        title: '积分管理',
        index: '/points/rules',
        icon: 'Medal',
        permiss: '17',
    },
    {
        id: '1',
        title: '系统管理',
        index: '1',
        icon: 'HomeFilled',
        children: [
            {
                id: '13',
                pid: '1',
                index: '/system-menu',
                title: '菜单管理',
                permiss: '13',
            },
        ],
    },
    {
        id: '6',
        icon: 'DocumentAdd',
        index: '6',
        title: '附加页面',
        children: [
            {
                id: '61',
                pid: '6',
                index: '/ucenter',
                title: '个人中心',
            },
            {
                id: '62',
                pid: '6',
                index: '/login',
                title: '登录',
            },
            {
                id: '63',
                pid: '6',
                index: '/register',
                title: '注册',
            },
            {
                id: '64',
                pid: '6',
                index: '/reset-pwd',
                title: '重设密码',
            },
            {
                id: '65',
                pid: '6',
                index: '/403',
                title: '403',
            },
            {
                id: '66',
                pid: '6',
                index: '/404',
                title: '404',
            },
        ],
    },
];