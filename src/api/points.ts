import request from '../utils/request';

// 积分配置相关接口
export interface PointConfig {
    login: { score: number; limit: number };
    read: { score: number; limit: number };
    answer: { score: number; limit: number };
    competition: { score: number; limit: number };
}

// 获取积分配置
export const getPointConfig = () => {
    return request({
        url: '/config/get',
        method: 'get'
    });
};

// 设置积分配置
export const setPointConfig = (data: PointConfig) => {
    return request({
        url: '/config/set',
        method: 'post',
        data
    });
};
