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
export const updateArticle = (id: string | number, data: any) => {
    return request({
        url: `/richtext/${id}/update`,
        method: 'put',
        data
    });
};

// 删除文章
export const deleteArticle = (id: string | number) => {
    return request({
        url: `/richtext/${id}/delete`,
        method: 'delete'
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