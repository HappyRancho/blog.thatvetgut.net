export type UserRole = 'CO_FOUNDER' | 'CONTRIBUTOR' | 'REVIEWER';

export type ArticleStatus =
  | 'DRAFT'
  | 'SUBMITTED FOR REVIEW'
  | 'UNDER REVIEW'
  | 'CHANGES REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'UNPUBLISHED';

export interface ReviewNote {
  id: string;
  authorId: string;
  authorName: string;
  note: string;
  createdAt: string;
  statusAtNote?: ArticleStatus;
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  designation: string; // e.g. "Co-Founder, ThatVetGuy"
  professionalRole: string; // e.g. "Lead Pathologist & Clinical Director"
  role: UserRole;
  qualifications: string; // e.g. "BVSc & AH"
  bio: string;
  avatarUrl: string;
  expertise: string[];
  clinicOrAffiliation?: string;
  isActive?: boolean;
  socials: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
    researchGate?: string;
    email?: string;
  };
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  articleCount?: number;
  featuredOrder?: number;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface ArticleReference {
  id: string;
  citation: string;
  source: string;
  year?: number;
  url?: string;
  doi?: string;
}

export interface ArticleContentBlock {
  type: 'paragraph' | 'heading2' | 'heading3' | 'callout' | 'table' | 'takeaways' | 'quote' | 'image';
  content?: string;
  calloutType?: 'clinical-alert' | 'note' | 'pro-tip' | 'dosage-warning';
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  quoteAuthor?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  featuredImage: string;
  imageAlt: string;
  imageCaption?: string;
  category: string; // category slug
  tags: string[]; // tag slugs
  authorId: string;
  authorName?: string;
  authorProfile?: {
    name: string;
    designation: string;
    professionalRole?: string;
    avatarUrl?: string;
  };
  reviewerId?: string;
  reviewer?: string;
  reviewedDate?: string;
  publishedDate: string;
  updatedDate: string;
  createdAt?: string;
  submittedAt?: string;
  publishedAt?: string;
  readingTimeMinutes: number;
  readingTime?: number | string;
  isDemo?: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  status?: ArticleStatus;
  content?: string; // HTML / Rich-text formatted body
  contentBlocks?: ArticleContentBlock[];
  references: ArticleReference[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  socialImage?: string;
  version?: number;
  internalNotes?: ReviewNote[];
}

export type PageRoute =
  | { name: 'home' }
  | { name: 'articles'; category?: string; tag?: string }
  | { name: 'article'; slug: string }
  | { name: 'categories' }
  | { name: 'category'; slug: string }
  | { name: 'contributors' }
  | { name: 'author'; slug: string }
  | { name: 'search'; initialQuery?: string }
  | { name: 'about' }
  | { name: 'contact' }
  | { name: 'admin'; section?: string; articleId?: string };

