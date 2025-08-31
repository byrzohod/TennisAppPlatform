export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  featuredImageUrl?: string;
  authorName: string;
  isPublished: boolean;
  publishedAt?: Date;
  viewCount: number;
  categories: string[];
  tags: string[];
}

export interface CreateBlogPost {
  title: string;
  content: string;
  summary: string;
  featuredImageUrl?: string;
  categories: string[];
  tags: string[];
}

export interface UpdateBlogPost {
  title: string;
  content: string;
  summary: string;
  featuredImageUrl?: string;
  isPublished: boolean;
  categories: string[];
  tags: string[];
}