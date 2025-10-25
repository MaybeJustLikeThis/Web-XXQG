import request from '@/utils/request';

// 获取所有部门
export const getAllDepartments = () => {
    return request({
        url: '/department/get_all',
        method: 'get'
    });
};

// 获取部门详情
export const getDepartmentById = (id: string | number) => {
    return request({
        url: `/department/${id}`,
        method: 'get'
    });
};

// 创建部门
export const createDepartment = (data: any) => {
    return request({
        url: '/department/create',
        method: 'post',
        data
    });
};

// 更新部门
export const updateDepartment = (id: string | number, data: any) => {
    return request({
        url: `/department/${id}/update`,
        method: 'put',
        data
    });
};

// 删除部门
export const deleteDepartment = (id: string | number) => {
    return request({
        url: `/department/${id}/delete`,
        method: 'delete'
    });
};

// 获取部门用户
export const getDepartmentUsers = (id: string | number) => {
    return request({
        url: `/department/${id}/users`,
        method: 'get'
    });
};