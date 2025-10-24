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

// 题目接口
export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  content: string;
  options?: Option[];                  // 选择题选项
  correctAnswer: string | string[];    // 正确答案
  explanation?: string;                // 答案解析
  points: number;                      // 分值
  timeLimit?: number;                  // 时间限制（秒）
  creatorId: string;                   // 创建者ID
  reviewerId?: string;                 // 评审者ID
  createTime: string;                  // 创建时间
  updateTime: string;                  // 更新时间
  reviewTime?: string;                 // 评审时间
  reviewComment?: string;              // 评审意见
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
  difficulty?: QuestionDifficulty;
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