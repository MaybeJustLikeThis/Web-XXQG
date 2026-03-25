import request from '@/utils/request';

export const getTemplate = (fileName: string) => {
    return request({
        url: '/template/get_template',
        method: 'get',
        params: { file_name: fileName },
        responseType: 'blob'
    });
};
