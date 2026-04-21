// 文章相关类型定义
export interface Article {
    id: string;
    title: string;
    content: string;
    cover: string;
    tags: string[];
    status: 'published' | 'draft' | 'withdrawn';
    author: string;
    publishTime: string;
    updateTime: string;
    viewCount: number;
    public: boolean;
    categoryId?: string;
}

// 专题相关类型定义
export interface Topic {
    id: string;
    name: string;
    description: string;
    cover: string;
    articleIds: string[];
    pinnedArticles: string[];
    status: 'active' | 'expired' | 'hidden';
    startTime?: string;
    endTime?: string;
    createTime: string;
    updateTime: string;
}

// 文章分类
export interface Category {
    id: string;
    name: string;
    description: string;
    articleCount: number;
}

// 标签
export interface Tag {
    id: string;
    name: string;
    color: string;
    count: number;
}

// 查询参数
export interface ArticleQuery {
    page: number;
    pageSize: number;
    title?: string;
    status?: Article['status'];
    tags?: string[];
    categoryId?: string;
}

export interface TopicQuery {
    page: number;
    pageSize: number;
    name?: string;
    status?: Topic['status'];
}

// 专题部门关系相关类型
export interface SubjectDepartmentRelation {
    subject_id: number;
    department_id: number;
}

// 专题添加部门请求参数
export interface AddSubjectDepartmentParams {
    subject_id: number;
    department_id: number;
}

// 专题删除部门请求参数
export interface DeleteSubjectDepartmentParams {
    subject_id: number;
    department_id: number;
}

// Subject completion data types
export interface SubjectCompletionData {
    total_items: number;  // Total articles + questions in the subject
    list: SubjectUserCompletion[];  // Backend returns 'list' not 'users'
}

export interface SubjectUserCompletion {
    user_id: number;           // User ID - backend uses 'user_id'
    name: string;         // User name
    department: string;   // Department name/path
    progress: number;  // Completion count (number of items completed) - backend uses 'progress'
}