/**
 * 공지사항 시스템 타입 정의
 * Sprint D Day 8: 운영 기능
 */

// ============================================================
// 공지사항 타입
// ============================================================

/** 공지사항 카테고리 */
export type AnnouncementCategory =
  | 'general'
  | 'update'
  | 'event'
  | 'maintenance'
  | 'important';

/** 공지사항 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: number;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
  authorId: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  /** 조인 시 포함 */
  isRead?: boolean;
}

/** 공지사항 읽음 표시 */
export interface AnnouncementRead {
  id: string;
  announcementId: string;
  clerkUserId: string;
  readAt: Date;
}

// ============================================================
// DB Row 타입
// ============================================================

/** announcements 테이블 Row */
export interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/** announcement_reads 테이블 Row */
export interface AnnouncementReadRow {
  id: string;
  announcement_id: string;
  clerk_user_id: string;
  read_at: string;
}

// ============================================================
// FAQ 타입
// ============================================================

/** FAQ 카테고리 */
export type FAQCategory =
  | 'general'
  | 'account'
  | 'workout'
  | 'nutrition'
  | 'technical';

/** FAQ 항목 */
export interface FAQ {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** faqs 테이블 Row */
export interface FAQRow {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// UI 상수
// ============================================================

/** 공지사항 카테고리별 이름 */
export const ANNOUNCEMENT_CATEGORY_NAMES: Record<AnnouncementCategory, string> = {
  general: '일반',
  update: '업데이트',
  event: '이벤트',
  maintenance: '점검',
  important: '중요',
};

/** 공지사항 카테고리별 색상 */
export const ANNOUNCEMENT_CATEGORY_COLORS: Record<
  AnnouncementCategory,
  { bg: string; text: string }
> = {
  general: { bg: 'bg-gray-100', text: 'text-gray-700' },
  update: { bg: 'bg-blue-100', text: 'text-blue-700' },
  event: { bg: 'bg-purple-100', text: 'text-purple-700' },
  maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  important: { bg: 'bg-red-100', text: 'text-red-700' },
};

/** FAQ 카테고리별 이름 */
export const FAQ_CATEGORY_NAMES: Record<FAQCategory, string> = {
  general: '일반',
  account: '계정',
  workout: '운동',
  nutrition: '영양',
  technical: '기술 지원',
};

/** FAQ 카테고리별 아이콘 */
export const FAQ_CATEGORY_ICONS: Record<FAQCategory, string> = {
  general: '❓',
  account: '👤',
  workout: '💪',
  nutrition: '🥗',
  technical: '🔧',
};
