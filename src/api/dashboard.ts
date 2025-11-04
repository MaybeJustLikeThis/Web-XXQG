import request from '../utils/request';

// 获取用户积分排行榜
export const getTopUsers = () => {
    return request({
        url: '/dashboard/top_users',
        method: 'get'
    });
};

// 获取首页统计数据
export const getDashboardStats = () => {
    return request({
        url: '/dashboard/stats',
        method: 'get'
    });
};

// 获取系统动态
export const getSystemActivities = () => {
    return request({
        url: '/dashboard/activities',
        method: 'get'
    });
};

// 获取积分趋势数据
export const getRecentPointRecords = (limit: number = 10) => {
    return request({
        url: '/dashboard/recent_point_records',
        method: 'get',
        params: {
            limit
        }
    });
};

// 获取问题总数
export const getQuestionNum = () => {
    return request({
        url: '/dashboard/get_question_num',
        method: 'get'
    });
};

// 获取文章数量
export const getRichTextNum = () => {
    return request({
        url: '/dashboard/get_rich_tect_num',
        method: 'get'
    });
};

// 获取用户数量
export const getUserNum = () => {
    return request({
        url: '/dashboard/get_user_num',
        method: 'get'
    });
};