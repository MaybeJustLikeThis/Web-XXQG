import { ElMessage } from 'element-plus';

export function getErrorMessage(error: unknown, fallback = '操作失败'): string {
    if (!error) return fallback;

    const err = error as Record<string, unknown>;

    if (typeof err.message === 'string' && err.message) {
        return err.message;
    }

    const errData = err.data as Record<string, unknown> | undefined;
    if (typeof errData?.msg === 'string' && (errData.msg as string).trim()) {
        return errData.msg as string;
    }

    try {
        const response = err.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;
        if (typeof data?.msg === 'string' && (data.msg as string).trim()) {
            return data.msg as string;
        }
    } catch {
        // ignore unsafe shape access
    }

    return fallback;
}

export function showError(error: unknown, fallback = '操作失败'): void {
    ElMessage.error(getErrorMessage(error, fallback));
}
