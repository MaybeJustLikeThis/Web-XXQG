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
        url: '/department/add',
        method: 'post',
        data
    });
};

// 更新部门
export const updateDepartment = (data: { department_id: number; name: string; parent_department_id: number }) => {
    return request({
        url: '/department/update',
        method: 'post',
        data
    });
};

// 删除部门
export const deleteDepartment = (data: { department_id: number }) => {
    return request({
        url: '/department/delete',
        method: 'post',
        data
    });
};

// 设置部门管理员
export const setDepartmentAdmin = (data: { admin_id: number; department_id: number }) => {
    return request({
        url: '/department/set_admin',
        method: 'post',
        data
    });
};

// 取消部门管理员
export const unsetDepartmentAdmin = (data: { admin_id: number; department_id: number }) => {
    return request({
        url: '/department/unset_admin',
        method: 'post',
        data
    });
};

// 批量添加部门
export const addBatchDepartment = (data: { name_list: string[]; parent_department_id: number }) => {
    return request({
        url: '/department/add_batch',
        method: 'post',
        data
    });
};

// 获取部门用户
export const getDepartmentUsers = (id: string | number) => {
    return request({
        url: `/department/${id}/users`,
        method: 'get'
    });
};

// 批量新增子部门及管理员（Excel上传）
export const addDepartmentWithAdminsByFile = (parentDepartmentId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request({
        url: '/department/add_with_admins_by_file',
        method: 'post',
        params: { parent_department_id: parentDepartmentId },
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};