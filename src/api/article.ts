import request from '@/utils/request';

// 获取所有文章
export const getAllArticles = () => {
    return request({
        url: '/richtext/get_all',
        method: 'get'
    });
};

// 获取文章详情
export const getArticleById = (id: string | number) => {
    return request({
        url: `/richtext/${id}`,
        method: 'get'
    });
};

// 创建文章
export const createArticle = (data: any) => {
    return request({
        url: '/richtext/create',
        method: 'post',
        data
    });
};

// 更新文章
export const updateArticle = (data: { id: number; text: string; title: string; head_image?: string }) => {
    return request({
        url: '/richtext/edit',
        method: 'post',
        data
    });
};

// 删除文章
export const deleteArticle = (rich_text_id: number) => {
    return request({
        url: '/richtext/delete',
        method: 'post',
        params: {
            rich_text_id
        }
    });
};

// 根据标签ID获取文章
export const getArticlesByTagId = (tag_id: number) => {
    return request({
        url: '/richtext/get_by_tag_id',
        method: 'get',
        params: {
            tag_id
        }
    });
};

// 更新文章状态
export const updateArticleStatus = (id: string | number, status: string) => {
    return request({
        url: `/richtext/${id}/status`,
        method: 'patch',
        data: { status }
    });
};