// 文章相关类型定义
export interface Article {
    id: string;
    title: string;
    content: string;
    summary: string;
    cover: string;
    tags: string[];
    status: 'published' | 'draft' | 'withdrawn';
    author: string;
    publishTime: string;
    updateTime: string;
    viewCount: number;
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