import { ElMessage } from 'element-plus';
import { getOssUploadUrl } from '@/api/upload';
import { getAccessibleUrl } from './download';

// 文件上传函数 - OSS预签名URL上传模式
export const uploadFile = async (file: File): Promise<string> => {
    try {

        // 从文件名中提取文件后缀
        const fileExtension = file.name.split('.').pop() || '';

        // 1. 获取签名地址，传入文件后缀参数
        const response = await getOssUploadUrl(fileExtension);

        if (!response.data || !response.data.data) {
            throw new Error('获取签名地址失败：API返回数据格式错误');
        }

        const apiData = response.data.data as any;
        const signedUrl = apiData.presign_url as string;

        // 2. 读取文件为ArrayBuffer
        const fileBuffer = await file.arrayBuffer();

        // 3. 使用ArrayBuffer + 不设置Content-Type
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: fileBuffer
        });

        if (uploadResponse.ok) {
            const url = new URL(signedUrl);
            const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;

            try {
                const accessibleUrl = await getAccessibleUrl(baseUrl);
                ElMessage.success('文件上传成功');
                return accessibleUrl;
            } catch (downloadError) {
                ElMessage.success('文件上传成功');
                return baseUrl;
            }
        } else {
            const errorText = await uploadResponse.text();

            // 分析错误类型并提供建议
            let errorMessage = '上传失败';
            if (errorText.includes('SignatureDoesNotMatch')) {
                errorMessage = 'OSS签名不匹配，请检查后端预签名URL生成逻辑';
            } else if (errorText.includes('AccessDenied')) {
                errorMessage = 'OSS访问被拒绝，请检查权限配置';
            } else if (errorText.includes('InvalidArgument')) {
                errorMessage = 'OSS参数错误，请检查文件格式或大小';
            } else {
                errorMessage = `OSS上传失败: ${uploadResponse.status}`;
            }

            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error(`文件上传失败：${(error as Error).message}`);
        throw error;
    }
};