import request from '@/utils/request';

// 根据部门ID获取用户列表
export const getUsersByDepartment = (department_id: number) => {
    return request({
        url: '/user/get_all',
        method: 'get',
        params: {
            department_id
        }
    });
};

// 获取所有用户列表
export const getAllUsers = () => {
    return request({
        url: '/user/get_all',
        method: 'get'
    });
};

// 根据用户ID获取用户详情
export const getUserById = (id: string | number) => {
    return request({
        url: `/user/${id}`,
        method: 'get'
    });
};

// 创建用户
export const createUser = (data: any) => {
    return request({
        url: '/user/add',
        method: 'post',
        data
    });
};

// 更新用户
export const updateUser = (data: { id: number; [key: string]: any }) => {
    return request({
        url: '/user/update',
        method: 'post',
        data
    });
};

// 管理员更新用户信息
export const updateUserByAdmin = (user_id: number, data: { name: string; sex: number; race: string; political_status: string; id_number: string }) => {
    return request({
        url: '/user/update_by_admin',
        method: 'post',
        params: {
            user_id
        },
        data
    });
};

// 删除用户
export const deleteUser = (id: number) => {
    return request({
        url: '/user/delete',
        method: 'post',
        data: { id }
    });
};

// 切换用户状态
export const toggleUserStatus = (id: number, status: 'active' | 'disabled') => {
    return request({
        url: '/user/toggle_status',
        method: 'post',
        data: { id, status }
    });
};

// 将用户从部门移除
export const removeUserFromDepartment = (data: { user_id: number; department_id: number }) => {
    return request({
        url: '/user/remove_from_department',
        method: 'post',
        data
    });
};

// 批量导入用户
export const importUsers = (data: FormData) => {
    return request({
        url: '/user/import',
        method: 'post',
        data,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// 批量添加用户 (通过文件上传)
export const addUsersByFile = (department_id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return request({
        url: '/user/add_by_file',
        method: 'post',
        params: {
            department_id
        },
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob' // 重要：用于下载文件
    });
};