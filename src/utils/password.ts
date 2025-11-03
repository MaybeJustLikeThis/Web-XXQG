/**
 * 检测是否为初始密码
 * 初始密码规则：身份证号后四位 + A1234
 * @param idNumber 身份证号
 * @param password 密码
 * @returns 是否为初始密码
 */
export const isInitialPassword = (idNumber: string, password: string): boolean => {
    if (!idNumber || !password) return false;

    // 获取身份证号后四位
    const lastFourDigits = idNumber.slice(-4);
    const expectedInitialPassword = lastFourDigits + 'A1234';

    return password === expectedInitialPassword;
};