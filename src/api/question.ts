import request from '@/utils/request';

// 获取全部题目
export const getAllQuestions = () => {
    return request({
        url: '/question/all/get_list',
        method: 'get'
    });
};

// 获取题目详情
export const getQuestionById = (id: string | number) => {
    return request({
        url: `/question/${id}`,
        method: 'get'
    });
};

// 创建题目
export const createQuestion = (data: any) => {
    return request({
        url: '/question/create',
        method: 'post',
        data
    });
};

// 更新题目
export const updateQuestion = (id: string | number, data: any) => {
    return request({
        url: `/question/${id}/update`,
        method: 'put',
        data
    });
};

// 删除题目
export const deleteQuestion = (id: string | number) => {
    return request({
        url: `/question/${id}/delete`,
        method: 'delete'
    });
};

// 更新题目状态
export const updateQuestionStatus = (id: string | number, status: string) => {
    return request({
        url: `/question/${id}/status`,
        method: 'patch',
        data: { status }
    });
};