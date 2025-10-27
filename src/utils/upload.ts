import { ElMessage } from 'element-plus';
import { getOssUploadUrl } from '@/api/upload';
import { getAccessibleUrl } from './download';

// 文件上传函数 - OSS预签名URL上传模式
export const uploadFile = async (file: File): Promise<string> => {
    try {
        console.log('=== OSS预签名URL上传模式 ===');
        console.log('开始上传文件:', file.name, '类型:', file.type, '大小:', file.size);

        // 从文件名中提取文件后缀
        const fileExtension = file.name.split('.').pop() || '';
        console.log('文件后缀:', fileExtension);

        // 1. 获取签名地址，传入文件后缀参数
        console.log('🔄 请求预签名URL...');
        const response = await getOssUploadUrl(fileExtension);
        console.log('获取签名地址响应:', response.data);

        if (!response.data || !response.data.data) {
            throw new Error('获取签名地址失败：API返回数据格式错误');
        }

        const apiData = response.data.data as any;
        const signedUrl = apiData.presign_url as string;
        const fileKey = apiData.key as string;

        console.log('签名URL:', signedUrl);
        console.log('文件key:', fileKey);

        // 2. 读取文件为ArrayBuffer
        console.log('🔄 读取文件为ArrayBuffer...');
        const fileBuffer = await file.arrayBuffer();
        console.log('文件读取完成，大小:', fileBuffer.byteLength, 'bytes');

        // 3. 使用ArrayBuffer + 不设置Content-Type
        console.log('=== 执行上传（使用验证成功的策略） ===');
        console.log('策略: ArrayBuffer + 不设置Content-Type');

        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: fileBuffer
            // 关键：不设置Content-Type，让OSS自动处理
        });

        console.log(`状态码: ${uploadResponse.status} ${uploadResponse.statusText}`);

        if (uploadResponse.ok) {
            console.log('✅ 文件上传成功！');
            const responseText = await uploadResponse.text();
            console.log('响应数据:', responseText || '无响应内容');

            // 返回完整的访问URL
            const url = new URL(signedUrl);
            const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
            console.log('上传成功，原始文件URL:', baseUrl);

            // 使用download接口获取可下载的URL
            try {
                const accessibleUrl = await getAccessibleUrl(baseUrl);
                console.log('获取可下载URL成功:', accessibleUrl);

                if (accessibleUrl !== baseUrl) {
                    console.log('🔄 已使用download接口获取可下载URL');
                    ElMessage.success('文件上传成功');
                } else {
                    console.log('✅ 原始URL可直接访问');
                    ElMessage.success('文件上传成功');
                }

                return accessibleUrl;
            } catch (downloadError) {
                console.warn('获取可下载URL失败，使用原始URL:', downloadError);
                ElMessage.success('文件上传成功');
                return baseUrl;
            }
        } else {
            const errorText = await uploadResponse.text();
            console.log('❌ 上传失败');
            console.log('错误详情:', errorText);

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
        console.error(`文件上传失败：${error.message}`);
        ElMessage.error(`文件上传失败: ${error.message || '未知错误'}`);
        throw error;
    }
};