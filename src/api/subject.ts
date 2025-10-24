import request from '../utils/request';
import type { Topic, TopicQuery } from '@/types/content';

// 获取所有专题
export const getSubjects = () => {
    return request({
        url: '/subject/get_all',
        method: 'get'
    });
};

// 根据ID获取专题详情
export const getSubjectById = (id: string) => {
    return request({
        url: `/subject/get/${id}`,
        method: 'get'
    });
};

// 创建专题
export const createSubject = (data: Omit<Topic, 'id' | 'createTime' | 'updateTime'>) => {
    return request({
        url: '/subject/create',
        method: 'post',
        data
    });
};

// 更新专题
export const updateSubject = (id: string, data: Partial<Topic>) => {
    return request({
        url: `/subject/update/${id}`,
        method: 'put',
        data
    });
};

// 删除专题
export const deleteSubject = (id: string) => {
    return request({
        url: `/subject/delete/${id}`,
        method: 'delete'
    });
};

// 更新专题状态
export const updateSubjectStatus = (id: string, status: string) => {
    return request({
        url: `/subject/status/${id}`,
        method: 'patch',
        data: { status }
    });
};

// 更新专题内容（文章和题目）
export const updateSubjectContent = (id: string, data: {
    articleIds: string[];
    pinnedArticles: string[];
    questions?: any[];
    config?: any;
}) => {
    return request({
        url: `/subject/content/${id}`,
        method: 'put',
        data
    });
};

// 搜索专题
export const searchSubjects = (params: TopicQuery) => {
    return request({
        url: '/subject/search',
        method: 'get',
        params
    });
};