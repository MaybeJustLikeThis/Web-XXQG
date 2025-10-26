import request from '../utils/request';
import type { PointRule, PointRuleQuery, UserPointRecord, UserPointRecordQuery, PointStatistics } from '@/types/points';

// 积分规则相关接口
export const getPointRules = (params: PointRuleQuery) => {
    return request({
        url: '/points/rules',
        method: 'get',
        params
    });
};

export const createPointRule = (data: Omit<PointRule, 'id' | 'createTime' | 'updateTime'>) => {
    return request({
        url: '/points/rules',
        method: 'post',
        data
    });
};

export const updatePointRule = (id: string, data: Partial<PointRule>) => {
    return request({
        url: `/points/rules/${id}`,
        method: 'put',
        data
    });
};

export const deletePointRule = (id: string) => {
    return request({
        url: `/points/rules/${id}`,
        method: 'delete'
    });
};

export const togglePointRuleStatus = (id: string, isActive: boolean) => {
    return request({
        url: `/points/rules/${id}/status`,
        method: 'patch',
        data: { isActive }
    });
};

// 积分记录相关接口
export const getPointRecords = (params: UserPointRecordQuery) => {
    return request({
        url: '/points/records',
        method: 'get',
        params
    });
};

export const getPointRecordDetail = (id: string) => {
    return request({
        url: `/points/records/${id}`,
        method: 'get'
    });
};

export const exportPointRecords = (params: UserPointRecordQuery) => {
    return request({
        url: '/points/records/export',
        method: 'get',
        params,
        responseType: 'blob'
    });
};

// 积分统计相关接口
export const getPointStatistics = () => {
    return request({
        url: '/points/statistics',
        method: 'get'
    });
};

export const getPointTrendData = (period: string) => {
    return request({
        url: '/points/statistics/trend',
        method: 'get',
        params: { period }
    });
};

export const getPointDistribution = (period: string) => {
    return request({
        url: '/points/statistics/distribution',
        method: 'get',
        params: { period }
    });
};

export const getPointRankings = (type: 'points' | 'activity', limit?: number) => {
    return request({
        url: '/points/statistics/rankings',
        method: 'get',
        params: { type, limit }
    });
};

export const getPointEventStatistics = (params: { startDate?: string; endDate?: string }) => {
    return request({
        url: '/points/statistics/events',
        method: 'get',
        params
    });
};

export const exportPointStatistics = (params: { startDate?: string; endDate?: string }) => {
    return request({
        url: '/points/statistics/export',
        method: 'get',
        params,
        responseType: 'blob'
    });
};