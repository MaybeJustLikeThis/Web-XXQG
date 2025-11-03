import request from '@/utils/request';
import type { Column, ColumnFormData, ColumnArticle, ArticleSelectOption } from '@/types/column';

// 获取所有专栏
export const getAllColumns = () => {
    return request({
        url: '/column/list',
        method: 'get'
    });
};

// 获取专栏详情
export const getColumnById = (id: number) => {
    return request({
        url: `/column/${id}`,
        method: 'get'
    });
};

// 创建专栏
export const createColumn = (data: ColumnFormData) => {
    return request({
        url: '/column/create',
        method: 'post',
        data
    });
};

// 更新专栏
export const updateColumn = (data: { column_id: number; name: string; description: string; cover_image?: string }) => {
    return request({
        url: '/column/update',
        method: 'post',
        data
    });
};

// 删除专栏
export const deleteColumn = (columnId: number) => {
    return request({
        url: `/column/delete/${columnId}`,
        method: 'post'
    });
};

// 获取专栏下的文章列表
export const getColumnArticles = (columnId: number, page = 1, limit = 10) => {
    return request({
        url: `/column/${columnId}/articles`,
        method: 'get',
        params: { page, limit }
    });
};

// 从专栏中移除文章
export const removeArticleFromColumn = (columnId: number, articleId: number) => {
    return request({
        url: '/richtext/remove_tag',
        method: 'post',
        data: {
            tag_id: columnId,
            text_id: articleId
        }
    });
};

// 将文章添加到专栏
export const addArticleToColumn = (columnId: number, articleId: number) => {
    return request({
        url: '/richtext/set_tag',
        method: 'post',
        data: {
            tag_id: columnId,
            text_id: articleId
        }
    });
};

// 获取可选文章列表（用于添加到专栏）
export const getAvailableArticles = (columnId: number, keyword = '', page = 1, limit = 20) => {
    return request({
        url: '/article/available',
        method: 'get',
        params: { column_id: columnId, keyword, page, limit }
    });
};

// 获取可添加到专栏的文章详情
export const getArticleDetail = (articleId: number) => {
    return request({
        url: `/article/${articleId}`,
        method: 'get'
    });
};

// 根据标签ID获取文章列表（用于专栏管理）
export const getArticlesByTagId = (tag_id: number) => {
    return request({
        url: '/richtext/get_by_tag_id',
        method: 'get',
        params: {
            tag_id
        }
    });
};