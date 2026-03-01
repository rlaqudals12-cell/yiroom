/**
 * 공지사항 + FAQ 모듈
 *
 * 공지사항 표시 로직, FAQ 그룹핑/검색
 *
 * @module lib/announcements
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export type AnnouncementCategory =
  | 'update'
  | 'bug_fix'
  | 'feature'
  | 'event'
  | 'maintenance';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  isImportant: boolean;
  publishedAt: string;
  expiresAt?: string;
}

export type FAQCategory =
  | 'general'
  | 'account'
  | 'workout'
  | 'nutrition'
  | 'technical';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  order: number;
}

// ─── 상수 ─────────────────────────────────────────────

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  update: '업데이트',
  bug_fix: '버그 수정',
  feature: '새 기능',
  event: '이벤트',
  maintenance: '점검',
};

export const FAQ_CATEGORY_LABELS: Record<FAQCategory, string> = {
  general: '일반',
  account: '계정',
  workout: '운동',
  nutrition: '영양',
  technical: '기술',
};

// ─── DB 변환 ─────────────────────────────────────────

interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  category: string;
  is_important: boolean;
  published_at: string;
  expires_at: string | null;
}

function toAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category as AnnouncementCategory,
    isImportant: row.is_important,
    publishedAt: row.published_at,
    expiresAt: row.expires_at ?? undefined,
  };
}

interface FAQRow {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

function toFAQ(row: FAQRow): FAQ {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category as FAQCategory,
    order: row.sort_order,
  };
}

// ─── 공지사항 ─────────────────────────────────────────

/**
 * 공지사항이 만료됐는지 확인
 */
export function isAnnouncementExpired(announcement: Announcement): boolean {
  if (!announcement.expiresAt) return false;
  return new Date(announcement.expiresAt).getTime() < Date.now();
}

/**
 * 표시 가능한 공지인지 확인
 */
export function isAnnouncementVisible(announcement: Announcement): boolean {
  return !isAnnouncementExpired(announcement);
}

/**
 * 공지사항 정렬 (중요도 → 최신순)
 */
export function sortAnnouncements(announcements: Announcement[]): Announcement[] {
  return [...announcements].sort((a, b) => {
    // 중요 공지 우선
    if (a.isImportant !== b.isImportant) {
      return a.isImportant ? -1 : 1;
    }
    // 최신순
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/**
 * 공지사항 날짜 포맷
 */
export function formatAnnouncementDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 공지사항 조회
 */
export async function getAnnouncements(
  supabase: SupabaseClient
): Promise<Announcement[]> {
  const { data } = await supabase
    .from('announcements')
    .select('id, title, content, category, is_important, published_at, expires_at')
    .order('is_important', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(50);

  return (data ?? [])
    .map((row) => toAnnouncement(row as AnnouncementRow))
    .filter(isAnnouncementVisible);
}

/**
 * 읽지 않은 공지사항 수
 */
export async function getUnreadCount(
  supabase: SupabaseClient,
  userId: string,
  lastReadAt?: string
): Promise<number> {
  let query = supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true });

  if (lastReadAt) {
    query = query.gt('published_at', lastReadAt);
  }

  const { count } = await query;
  return count ?? 0;
}

// ─── FAQ ──────────────────────────────────────────────

/**
 * FAQ 카테고리별 그룹핑
 */
export function groupFAQsByCategory(
  faqs: FAQ[]
): Record<FAQCategory, FAQ[]> {
  const groups: Record<FAQCategory, FAQ[]> = {
    general: [],
    account: [],
    workout: [],
    nutrition: [],
    technical: [],
  };

  faqs.forEach((faq) => {
    groups[faq.category]?.push(faq);
  });

  // 각 카테고리 내 정렬
  Object.values(groups).forEach((group) => {
    group.sort((a, b) => a.order - b.order);
  });

  return groups;
}

/**
 * FAQ 검색 (제목+내용)
 */
export function searchFAQs(faqs: FAQ[], query: string): FAQ[] {
  if (!query.trim()) return faqs;

  const lowerQuery = query.toLowerCase();
  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery)
  );
}

/**
 * FAQ 조회
 */
export async function getFAQs(supabase: SupabaseClient): Promise<FAQ[]> {
  const { data } = await supabase
    .from('faqs')
    .select('id, question, answer, category, sort_order')
    .order('sort_order');

  return (data ?? []).map((row) => toFAQ(row as FAQRow));
}
