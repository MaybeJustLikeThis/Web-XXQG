// 题目类型枚举
export enum QuestionType {
    SINGLE_CHOICE = 'single_choice',    // 单选题
    MULTIPLE_CHOICE = 'multiple_choice', // 多选题
    FILL_BLANK = 'fill_blank',           // 填空题
    JUDGE = 'judge',                     // 判断题
    ESSAY = 'essay'                      // 简答题
}

// 题目难度枚举
export enum QuestionDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard'
}

// 题目状态枚举
export enum QuestionStatus {
    ACTIVE = 'active',                   // 启用
    INACTIVE = 'inactive',               // 禁用
    PENDING_REVIEW = 'pending_review',   // 待评审
    REJECTED = 'rejected'                // 被拒绝
}

// 选项接口（用于选择题）
export interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
}

// 题目详情接口
export interface QuestionDetail {
    title: string;
    options?: string[];               // 选择题选项
    fixed_answer: boolean;             // 是否有固定答案
    standard_answer: string[];         // 标准答案
    reference_answer: string | null;   // 参考答案
}

// 题目接口
export interface Question {
    id: string;
    creator: string;                   // 创建者
    type: number;                      // 题目类型：1=单选, 2=多选, 3=填空/简答
    detail: QuestionDetail;            // 题目详情
    public?: boolean;                  // 是否公开，列表接口可能不返回
    status: number;                     // 题目状态：1=启用
}

// 专题题目配置接口
export interface TopicQuestionConfig {
    id: string;
    topicId: string;                     // 专题ID
    questionIds: string[];               // 选中的题目ID列表
    timeWindow: {                        // 时间窗口
        startTime: string;
        endTime: string;
    };
    scoringStrategy: {                   // 积分策略
        correctPoints: number;
        wrongPoints: number;
        timeBonus: boolean;               // 是否有时间奖励
        dailyLimit?: number;              // 每日挑战次数限制
    };
    status: 'active' | 'inactive' | 'expired';
    createTime: string;
    updateTime: string;
}

// 查询参数接口
export interface QuestionQuery {
    page: number;
    pageSize: number;
    title?: string;
    type?: QuestionType;
    status?: QuestionStatus;
}

// 导入导出数据接口
export interface QuestionImportItem {
    title: string;
    type: string;
    difficulty: string;
    content: string;
    options?: string;
    correctAnswer: string;
    explanation?: string;
    points: number;
    tags?: string;
}

// 批量导入结果接口
export interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errors: Array<{
        row: number;
        error: string;
    }>;
}

const parseMaybeJson = (value: any) => {
    if (typeof value !== 'string') return value;

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const normalizeQuestionType = (type: any): number => {
    if (type === 1 || type === '1' || type === 'single_choice') return 1;
    if (type === 2 || type === '2' || type === 'multiple_choice') return 2;
    if (type === 3 || type === '3' || type === 'essay' || type === 'fill_blank' || type === 'judge') return 3;
    return 1;
};

const normalizeStringArray = (value: any): string[] => {
    const parsed = parseMaybeJson(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    if (typeof parsed === 'string' && parsed.trim()) return [parsed];
    return [];
};

// 数据转换工具函数
export const transformQuestionData = (apiData: any): Question => {
    const detail = parseMaybeJson(apiData.detail) || {};
    const type = normalizeQuestionType(apiData.type);

    return {
        id: apiData.id?.toString() || '',
        creator: apiData.creator?.toString() || '',
        type, // 1=单选, 2=多选, 3=填空/简答
        detail: {
            title: detail.title || apiData.title || '',
            options: normalizeStringArray(detail.options ?? apiData.options),
            fixed_answer: detail.fixed_answer ?? apiData.fixed_answer ?? type !== 3,
            standard_answer: normalizeStringArray(detail.standard_answer ?? apiData.standard_answer),
            reference_answer: detail.reference_answer ?? apiData.reference_answer ?? null
        },
        public: typeof apiData.public === 'boolean' ? apiData.public : undefined,
        status: apiData.status ?? 1 // 1=启用
    };
};

// 获取题型显示文本
export const getQuestionTypeText = (type: number): string => {
    switch (type) {
        case 1: return '单选题';
        case 2: return '多选题';
        case 3: return '填空题/简答题';
        default: return '未知题型';
    }
};

// 获取难度显示文本
export const getQuestionDifficultyText = (difficulty?: number): string => {
    if (difficulty === undefined) return '未设置';
    switch (difficulty) {
        case 1: return '简单';
        case 2: return '中等';
        case 3: return '困难';
        default: return '未知难度';
    }
};
