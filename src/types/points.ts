// 积分事件类型枚举
export enum PointEventType {
  LOGIN = 'login',                    // 登录
  DAILY_LOGIN = 'daily_login',        // 每日登录
  ARTICLE_READ = 'article_read',      // 阅读文章
  ARTICLE_COMPLETE = 'article_complete', // 完播文章
  ARTICLE_COMMENT = 'article_comment', // 评论文章
  QUESTION_ANSWER = 'question_answer', // 答题
  QUESTION_CORRECT = 'question_correct', // 答对题目
  QUESTION_WRONG = 'question_wrong',   // 答错题目
  CHALLENGE_WIN = 'challenge_win',     // 挑战胜利
  CHALLENGE_LOSE = 'challenge_lose',   // 挑战失败
  PK_WIN = 'pk_win',                  // PK胜利
  PK_LOSE = 'pk_lose',                // PK失败
  SHARE_CONTENT = 'share_content',    // 分享内容
  INVITE_USER = 'invite_user',         // 邀请用户
  SYSTEM_REWARD = 'system_reward',     // 系统奖励
  SYSTEM_PENALTY = 'system_penalty'    // 系统惩罚
}

// 积分规则接口
export interface PointRule {
  id: string;
  name: string;
  description: string;
  eventType: PointEventType;
  points: number;                    // 积分值（正数为增加，负数为扣除）
  isReward: boolean;                  // 是否为奖励事件
  isActive: boolean;                  // 是否启用
  maxDailyLimit?: number;             // 每日上限（0表示无限制）
  cooldownHours?: number;             // 冷却时间（小时，0表示无冷却）
  effectiveStartDate?: string;         // 生效开始时间
  effectiveEndDate?: string;           // 生效结束时间
  conditions?: {                       // 获取条件
    minLevel?: number;                 // 最低等级
    maxLevel?: number;                 // 最高等级
    userTags?: string[];               // 用户标签
    requiredActions?: string[];        // 必需完成的行为
  };
  creatorId: string;                   // 创建者ID
  createTime: string;                  // 创建时间
  updateTime: string;                  // 更新时间
}

// 积分规则配置项接口
export interface PointRuleConfig {
  id: string;
  ruleId: string;
  configName: string;
  description: string;
  eventType: PointEventType;
  points: number;
  maxDailyLimit?: number;
  cooldownHours?: number;
  conditions?: {
    minLevel?: number;
    maxLevel?: number;
    userTags?: string[];
    requiredActions?: string[];
  };
  isActive: boolean;
  createTime: string;
  updateTime: string;
}

// 用户积分记录接口
export interface UserPointRecord {
  id: string;
  userId: string;
  userName: string;
  eventType: PointEventType;
  ruleName: string;
  points: number;
  balanceBefore: number;              // 操作前余额
  balanceAfter: number;               // 操作后余额
  description: string;
  relatedId?: string;                  // 关联对象ID（如文章ID、题目ID等）
  metadata?: Record<string, any>;     // 额外元数据
  createTime: string;
  ip?: string;
  userAgent?: string;
}

// 积分统计接口
export interface PointStatistics {
  userId: string;
  userName: string;
  totalPoints: number;                 // 总积分
  availablePoints: number;             // 可用积分
  todayEarned: number;                // 今日获得
  todaySpent: number;                 // 今日消费
  thisWeekEarned: number;             // 本周获得
  thisWeekSpent: number;             // 本周消费
  thisMonthEarned: number;            // 本月获得
  thisMonthSpent: number;            // 本月消费
  lastLoginTime?: string;             // 最后登录时间
  consecutiveLoginDays: number;       // 连续登录天数
  totalLoginDays: number;             // 总登录天数
}

// 查询参数接口
export interface PointRuleQuery {
  page: number;
  pageSize: number;
  name?: string;
  eventType?: PointEventType;
  isActive?: boolean;
  isReward?: boolean;
}

export interface UserPointRecordQuery {
  page: number;
  pageSize: number;
  userId?: string;
  userName?: string;
  eventType?: PointEventType;
  startDate?: string;
  endDate?: string;
  minPoints?: number;
  maxPoints?: number;
}

// 积分规则预设
export interface PointRuleTemplate {
  name: string;
  description: string;
  eventType: PointEventType;
  points: number;
  maxDailyLimit?: number;
  cooldownHours?: number;
}

// 积分活动接口
export interface PointActivity {
  id: string;
  name: string;
  description: string;
  type: 'multiplier' | 'bonus' | 'penalty'; // 倍数、奖励、惩罚
  value: number;                       // 倍数值或固定积分
  isActive: boolean;
  startTime: string;
  endTime: string;
  affectedEvents?: PointEventType[];    // 影响的事件类型
  conditions?: {
    minUserLevel?: number;
    userTags?: string[];
  };
  createTime: string;
  updateTime: string;
}