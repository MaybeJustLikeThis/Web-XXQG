import request from '@/utils/request';

// 获取全部题目
export const getAllQuestions = (params?: { page?: number; size?: number }) => {
    return request({
      url: "/question/all/get_list_for_admin",
      method: "get",
      params
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

// 新增题目接口 (使用 /question/add)
export const addQuestion = (data: {
    type: number;
    detail: {
        title: string;
        options?: string[];
        fixed_answer: boolean;
        standard_answer: string[];
        reference_answer?: string;
    };
    public?: boolean;
    status?: number;
}) => {
    return request({
        url: '/question/add',
        method: 'post',
        data
    });
};

// 编辑题目接口 (使用 /question/edit)
export const editQuestion = (data: {
    id: number;
    type: number;
    detail: {
        title: string;
        options?: string[];
        fixed_answer: boolean;
        standard_answer: string[];
        reference_answer?: string;
    };
    public?: boolean;
    status?: number;
}) => {
    return request({
        url: '/question/edit',
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
export const deleteQuestion = (question_id: string | number) => {
    return request({
        url: '/question/delete',
        method: 'post',
        data: { question_id }
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