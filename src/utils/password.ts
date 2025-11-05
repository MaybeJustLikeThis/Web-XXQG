/**
 * 检测是否为初始密码
 * 初始密码规则：手机号后四位 + A1234（虽然字段名是id_number，但实际存储的是手机号）
 * @param idNumber 字段名（实际存储手机号）
 * @param password 密码
 * @returns 是否为初始密码
 */
export const isInitialPassword = (idNumber: string, password: string): boolean => {
    if (!idNumber || !password) return false;

    // 获取手机号后四位
    const lastFourDigits = idNumber.slice(-4);
    const expectedInitialPassword = lastFourDigits + 'A1234';

    return password === expectedInitialPassword;
};