// 专栏相关类型定义

export interface Column {
    id: number;
    name: string;
    description: string;
    cover_image?: string;
    article_count: number;
    created_at: string;
    updated_at: string;
}

export interface Article {
    id: number;
    title: string;
    content: string;
    author: string;
    created_at: string;
    updated_at: string;
    tags?: ArticleTag[];
}

export interface ArticleTag {
    id: number;
    name: string;
    color?: string;
}

export interface ColumnArticle {
    id: number;
    column_id: number;
    article_id: number;
    article_title: string;
    article_author: string;
    article_content: string;
    added_at: string;
    tags: ArticleTag[];
}

export interface ColumnFormData {
    name: string;
    description: string;
    cover_image?: string;
}

export interface ArticleSelectOption {
    id: number;
    title: string;
    author: string;
    created_at: string;
    tags: ArticleTag[];
    selected?: boolean;
}