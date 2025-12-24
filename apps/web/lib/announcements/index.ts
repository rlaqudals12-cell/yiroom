/**
 * 공지사항/FAQ 시스템 라이브러리
 * Sprint D Day 8: 운영 기능
 */

import type {
  Announcement,
  AnnouncementRow,
  AnnouncementCategory,
  FAQ,
  FAQRow,
  FAQCategory,
} from '@/types/announcements';

// ============================================================
// 변환 함수
// ============================================================

/**
 * DB Row를 Announcement로 변환
 */
export function toAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category as AnnouncementCategory,
    priority: row.priority,
    isPinned: row.is_pinned,
    isPublished: row.is_published,
    publishedAt: row.published_at ? new Date(row.published_at) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    authorId: row.author_id,
    viewCount: row.view_count,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * DB Row를 FAQ로 변환
 */
export function toFAQ(row: FAQRow): FAQ {
  return {
    id: row.id,
    category: row.category as FAQCategory,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    helpfulCount: row.helpful_count,
    notHelpfulCount: row.not_helpful_count,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 공지사항이 만료되었는지 확인
 */
export function isAnnouncementExpired(announcement: Announcement): boolean {
  if (!announcement.expiresAt) return false;
  return announcement.expiresAt < new Date();
}

/**
 * 공지사항이 표시 가능한지 확인
 */
export function isAnnouncementVisible(announcement: Announcement): boolean {
  return announcement.isPublished && !isAnnouncementExpired(announcement);
}

/**
 * 공지사항 정렬 (고정 > 우선순위 > 발행일)
 */
export function sortAnnouncements(announcements: Announcement[]): Announcement[] {
  return [...announcements].sort((a, b) => {
    // 고정된 것 우선
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    // 우선순위 높은 것 우선
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // 최신 발행일 우선
    const aDate = a.publishedAt?.getTime() ?? a.createdAt.getTime();
    const bDate = b.publishedAt?.getTime() ?? b.createdAt.getTime();
    return bDate - aDate;
  });
}

/**
 * FAQ를 카테고리별로 그룹화
 */
export function groupFAQsByCategory(
  faqs: FAQ[]
): Record<FAQCategory, FAQ[]> {
  const grouped: Record<FAQCategory, FAQ[]> = {
    general: [],
    account: [],
    workout: [],
    nutrition: [],
    technical: [],
  };

  for (const faq of faqs) {
    if (grouped[faq.category]) {
      grouped[faq.category].push(faq);
    }
  }

  // 각 카테고리 내에서 sortOrder로 정렬
  for (const category of Object.keys(grouped) as FAQCategory[]) {
    grouped[category].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return grouped;
}

/**
 * FAQ 검색 (질문/답변에서 키워드 검색)
 */
export function searchFAQs(faqs: FAQ[], query: string): FAQ[] {
  if (!query.trim()) return faqs;

  const lowerQuery = query.toLowerCase().trim();

  return faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 읽지 않은 공지사항 수
 */
export function getUnreadCount(
  announcements: Announcement[],
  readIds: Set<string>
): number {
  return announcements.filter(
    (a) => isAnnouncementVisible(a) && !readIds.has(a.id)
  ).length;
}

/**
 * 상대 시간 포맷 (공지사항용)
 */
export function formatAnnouncementDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '어제';
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}주 전`;
  } else {
    // YYYY.MM.DD 형식
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace('.', '');
  }
}

// ============================================================
// 타입 re-export
// ============================================================

export type {
  Announcement,
  AnnouncementRow,
  AnnouncementCategory,
  AnnouncementRead,
  AnnouncementReadRow,
  FAQ,
  FAQRow,
  FAQCategory,
} from '@/types/announcements';

export {
  ANNOUNCEMENT_CATEGORY_NAMES,
  ANNOUNCEMENT_CATEGORY_COLORS,
  FAQ_CATEGORY_NAMES,
  FAQ_CATEGORY_ICONS,
} from '@/types/announcements';
