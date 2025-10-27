import request from '@/utils/request';

// 获取OSS上传预签名URL
export const getOssUploadUrl = (fileExtension: string) => {
    return request({
        url: '/richtext/upload_file',
        method: 'get',
        params: {
            suffix: fileExtension
        }
    });
};

// 获取文件可访问URL
export const getFileAccessibleUrl = (key: string) => {
    return request({
        url: '/richtext/download',
        method: 'get',
        params: {
            key
        }
    });
};
