import { getFileDownloadUrl } from '@/api/article';
import { getTemplate } from '@/api/template';
import { exportDepartmentUsers } from '@/api/department';
import { ElMessage } from 'element-plus';

// 从OSS URL中提取文件key
const extractFileKey = (ossUrl: string): string | null => {
    try {
        const url = new URL(ossUrl);
        const pathname = url.pathname;

        // 移除开头的斜杠
        const key = pathname.startsWith('/') ? pathname.substring(1) : pathname;

        // 如果key包含查询参数，只取路径部分
        const keyWithoutQuery = key.split('?')[0];

        return keyWithoutQuery || null;
    } catch (error) {
        console.error('提取文件key失败:', error);
        return null;
    }
};

// 根据OSS URL获取可下载的URL
export const getDownloadableUrl = async (ossUrl: string): Promise<string> => {
    try {

        // 从OSS URL中提取文件key
        const fileKey = extractFileKey(ossUrl);

        if (!fileKey) {
            return ossUrl; // 返回原始URL作为备用
        }


        // 调用download接口获取可下载URL
        const response = await getFileDownloadUrl(fileKey);

        if (response.data && response.data.code === 200 && response.data.data) {
            const downloadUrl = response.data.data.url || response.data.data.download_url;
            return downloadUrl;
        } else {
            return ossUrl; // 返回原始URL作为备用
        }

    } catch (error) {
        console.error('获取可下载URL失败:', error);
        ElMessage.warning('获取下载链接失败，使用原始URL');
        return ossUrl; // 返回原始URL作为备用
    }
};

// 检查URL是否需要使用download接口
export const shouldUseDownloadApi = (url: string): boolean => {
    // 如果是OSS URL且可能存在权限问题，则使用download接口
    return url.includes('tyut-qiangguo.oss-cn-beijing.aliyuncs.com') ||
           url.includes('oss-cn-beijing.aliyuncs.com');
};

// 智能获取可访问的URL（优先使用download接口）
export const getAccessibleUrl = async (url: string): Promise<string> => {
    // 如果不是OSS URL，直接返回
    if (!shouldUseDownloadApi(url)) {
        return url;
    }

    // 尝试使用download接口获取可下载URL
    try {
        const downloadUrl = await getDownloadableUrl(url);
        return downloadUrl;
    } catch (error) {
        return url;
    }
};

// 下载模板文件（blob 方式，浏览器直接下载不跳转）
export async function downloadTemplate(fileName: string): Promise<void> {
    const response = await getTemplate(fileName);
    const url = response.data?.data?.url;
    if (!url) {
        throw new Error('模板链接为空');
    }

    const fileRes = await fetch(url);
    if (!fileRes.ok) {
        throw new Error('模板文件下载失败');
    }
    const blob = await fileRes.blob();

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

// 导出部门用户 Excel（blob 方式，浏览器直接下载不跳转）
export async function exportUsers(departmentId: number, departmentName: string): Promise<void> {
    const response = await exportDepartmentUsers(departmentId);
    const blob = new Blob([response.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${departmentName}_成员列表.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}