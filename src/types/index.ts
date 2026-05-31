export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Category =
  | "Networking"
  | "Security"
  | "Caching"
  | "Infrastructure"
  | "Frontend"
  | "Databases";

export type SortOption = "recent" | "upvotes" | "trending";

export type SectionType = "text" | "code" | "list" | "note" | "warning";

export interface CodeBlock {
  language: string;
  snippet: string;
  caption?: string;
}

export interface BodySection {
  type: SectionType;
  heading?: string;
  content?: string;
  items?: string[];
  code?: CodeBlock;
}

export interface Author {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: Category;
  difficulty: Difficulty;
  tags: string[];
  readingTime: number;
  upvoteCount: number;
  viewCount: number;
  author: Author;
  publishedAt: string;
  trendingScore: number;
  body?: BodySection[];
}
