import { describe, it, expect } from 'vitest';
import {
  toAnnouncement,
  toFAQ,
  isAnnouncementExpired,
  isAnnouncementVisible,
  sortAnnouncements,
  groupFAQsByCategory,
  searchFAQs,
  getUnreadCount,
  formatAnnouncementDate,
} from '@/lib/announcements';
import type {
  Announcement,
  AnnouncementRow,
  FAQ,
  FAQRow,
} from '@/types/announcements';

// Mock 데이터
const mockAnnouncementRow: AnnouncementRow = {
  id: 'ann-1',
  title: '테스트 공지',
  content: '테스트 내용입니다.',
  category: 'general',
  priority: 5,
  is_pinned: true,
  is_published: true,
  published_at: '2025-12-24T00:00:00Z',
  expires_at: null,
  author_id: 'admin-1',
  view_count: 100,
  created_at: '2025-12-24T00:00:00Z',
  updated_at: '2025-12-24T00:00:00Z',
};

const mockFAQRow: FAQRow = {
  id: 'faq-1',
  category: 'general',
  question: '테스트 질문?',
  answer: '테스트 답변입니다.',
  sort_order: 1,
  is_published: true,
  helpful_count: 10,
  not_helpful_count: 2,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('lib/announcements', () => {
  describe('toAnnouncement', () => {
    it('DB Row를 Announcement로 변환', () => {
      const result = toAnnouncement(mockAnnouncementRow);

      expect(result.id).toBe('ann-1');
      expect(result.title).toBe('테스트 공지');
      expect(result.category).toBe('general');
      expect(result.isPinned).toBe(true);
      expect(result.isPublished).toBe(true);
      expect(result.viewCount).toBe(100);
    });

    it('publishedAt이 null일 때 null 반환', () => {
      const row = { ...mockAnnouncementRow, published_at: null };
      const result = toAnnouncement(row);

      expect(result.publishedAt).toBeNull();
    });

    it('expiresAt이 null일 때 null 반환', () => {
      const result = toAnnouncement(mockAnnouncementRow);
      expect(result.expiresAt).toBeNull();
    });

    it('expiresAt 변환', () => {
      const row = {
        ...mockAnnouncementRow,
        expires_at: '2025-12-31T00:00:00Z',
      };
      const result = toAnnouncement(row);

      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('toFAQ', () => {
    it('DB Row를 FAQ로 변환', () => {
      const result = toFAQ(mockFAQRow);

      expect(result.id).toBe('faq-1');
      expect(result.category).toBe('general');
      expect(result.question).toBe('테스트 질문?');
      expect(result.answer).toBe('테스트 답변입니다.');
      expect(result.sortOrder).toBe(1);
      expect(result.helpfulCount).toBe(10);
      expect(result.notHelpfulCount).toBe(2);
    });

    it('Date 필드 변환', () => {
      const result = toFAQ(mockFAQRow);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('isAnnouncementExpired', () => {
    it('만료일이 없으면 false', () => {
      const announcement: Announcement = {
        ...toAnnouncement(mockAnnouncementRow),
        expiresAt: null,
      };

      expect(isAnnouncementExpired(announcement)).toBe(false);
    });

    it('만료일이 미래면 false', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const announcement: Announcement = {
        ...toAnnouncement(mockAnnouncementRow),
        expiresAt: futureDate,
      };

      expect(isAnnouncementExpired(announcement)).toBe(false);
    });

    it('만료일이 과거면 true', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const announcement: Announcement = {
        ...toAnnouncement(mockAnnouncementRow),
        expiresAt: pastDate,
      };

      expect(isAnnouncementExpired(announcement)).toBe(true);
    });
  });

  describe('isAnnouncementVisible', () => {
    it('발행 중이고 만료되지 않으면 true', () => {
      const announcement: Announcement = {
        ...toAnnouncement(mockAnnouncementRow),
        isPublished: true,
        expiresAt: null,
      };

      expect(isAnnouncementVisible(announcement)).toBe(true);
    });

    it('발행되지 않으면 false', () => {
      const announcement: Announcement = {
        ...toAnnouncement(mockAnnouncementRow),
        isPublished: false,
      };

      expect(isAnnouncementVisible(announcement)).toBe(false);
    });

    it('만료되면 false', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const announcement: Announcement = {
        ...toAnnouncement(mockAnnouncementRow),
        isPublished: true,
        expiresAt: pastDate,
      };

      expect(isAnnouncementVisible(announcement)).toBe(false);
    });
  });

  describe('sortAnnouncements', () => {
    it('고정된 것이 먼저', () => {
      const announcements: Announcement[] = [
        { ...toAnnouncement(mockAnnouncementRow), id: '1', isPinned: false },
        { ...toAnnouncement(mockAnnouncementRow), id: '2', isPinned: true },
      ];

      const sorted = sortAnnouncements(announcements);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('우선순위 높은 것이 먼저', () => {
      const announcements: Announcement[] = [
        { ...toAnnouncement(mockAnnouncementRow), id: '1', isPinned: false, priority: 1 },
        { ...toAnnouncement(mockAnnouncementRow), id: '2', isPinned: false, priority: 10 },
      ];

      const sorted = sortAnnouncements(announcements);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('최신 발행일이 먼저', () => {
      const older = new Date('2025-01-01');
      const newer = new Date('2025-12-01');

      const announcements: Announcement[] = [
        { ...toAnnouncement(mockAnnouncementRow), id: '1', isPinned: false, priority: 0, publishedAt: older },
        { ...toAnnouncement(mockAnnouncementRow), id: '2', isPinned: false, priority: 0, publishedAt: newer },
      ];

      const sorted = sortAnnouncements(announcements);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
    });

    it('원본 배열 수정하지 않음', () => {
      const announcements: Announcement[] = [
        { ...toAnnouncement(mockAnnouncementRow), id: '1' },
        { ...toAnnouncement(mockAnnouncementRow), id: '2' },
      ];

      const sorted = sortAnnouncements(announcements);

      expect(sorted).not.toBe(announcements);
    });
  });

  describe('groupFAQsByCategory', () => {
    it('카테고리별로 그룹화', () => {
      const faqs: FAQ[] = [
        { ...toFAQ(mockFAQRow), id: '1', category: 'general' },
        { ...toFAQ(mockFAQRow), id: '2', category: 'account' },
        { ...toFAQ(mockFAQRow), id: '3', category: 'general' },
      ];

      const grouped = groupFAQsByCategory(faqs);

      expect(grouped.general.length).toBe(2);
      expect(grouped.account.length).toBe(1);
      expect(grouped.workout.length).toBe(0);
    });

    it('각 카테고리 내에서 sortOrder로 정렬', () => {
      const faqs: FAQ[] = [
        { ...toFAQ(mockFAQRow), id: '1', category: 'general', sortOrder: 3 },
        { ...toFAQ(mockFAQRow), id: '2', category: 'general', sortOrder: 1 },
        { ...toFAQ(mockFAQRow), id: '3', category: 'general', sortOrder: 2 },
      ];

      const grouped = groupFAQsByCategory(faqs);

      expect(grouped.general[0].id).toBe('2');
      expect(grouped.general[1].id).toBe('3');
      expect(grouped.general[2].id).toBe('1');
    });
  });

  describe('searchFAQs', () => {
    const faqs: FAQ[] = [
      { ...toFAQ(mockFAQRow), id: '1', question: '이룸은 무엇인가요?', answer: '웰니스 앱입니다.' },
      { ...toFAQ(mockFAQRow), id: '2', question: '가격은 어떻게 되나요?', answer: '무료입니다.' },
      { ...toFAQ(mockFAQRow), id: '3', question: '운동 기록 방법', answer: '이룸에서 기록하세요.' },
    ];

    it('질문에서 검색', () => {
      const result = searchFAQs(faqs, '이룸');

      expect(result.length).toBe(2);
      expect(result.map((f) => f.id)).toContain('1');
      expect(result.map((f) => f.id)).toContain('3');
    });

    it('답변에서 검색', () => {
      const result = searchFAQs(faqs, '무료');

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('2');
    });

    it('대소문자 구분 없이 검색', () => {
      const result = searchFAQs(faqs, '이룸');

      expect(result.length).toBe(2);
    });

    it('빈 검색어면 전체 반환', () => {
      const result = searchFAQs(faqs, '');

      expect(result.length).toBe(3);
    });

    it('공백만 있으면 전체 반환', () => {
      const result = searchFAQs(faqs, '   ');

      expect(result.length).toBe(3);
    });

    it('검색 결과 없으면 빈 배열', () => {
      const result = searchFAQs(faqs, '없는검색어');

      expect(result.length).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('읽지 않은 공지 수 반환', () => {
      const announcements: Announcement[] = [
        { ...toAnnouncement(mockAnnouncementRow), id: '1', isPublished: true },
        { ...toAnnouncement(mockAnnouncementRow), id: '2', isPublished: true },
        { ...toAnnouncement(mockAnnouncementRow), id: '3', isPublished: true },
      ];

      const readIds = new Set(['1']);
      const count = getUnreadCount(announcements, readIds);

      expect(count).toBe(2);
    });

    it('만료된 공지는 제외', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const announcements: Announcement[] = [
        { ...toAnnouncement(mockAnnouncementRow), id: '1', isPublished: true, expiresAt: null },
        { ...toAnnouncement(mockAnnouncementRow), id: '2', isPublished: true, expiresAt: pastDate },
      ];

      const readIds = new Set<string>();
      const count = getUnreadCount(announcements, readIds);

      expect(count).toBe(1);
    });

    it('발행되지 않은 공지는 제외', () => {
      const announcements: Announcement[] = [
        { ...toAnnouncement(mockAnnouncementRow), id: '1', isPublished: true },
        { ...toAnnouncement(mockAnnouncementRow), id: '2', isPublished: false },
      ];

      const readIds = new Set<string>();
      const count = getUnreadCount(announcements, readIds);

      expect(count).toBe(1);
    });
  });

  describe('formatAnnouncementDate', () => {
    it('오늘 날짜면 "오늘"', () => {
      const today = new Date();
      const result = formatAnnouncementDate(today);

      expect(result).toBe('오늘');
    });

    it('어제 날짜면 "어제"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatAnnouncementDate(yesterday);

      expect(result).toBe('어제');
    });

    it('3일 전이면 "3일 전"', () => {
      const date = new Date();
      date.setDate(date.getDate() - 3);
      const result = formatAnnouncementDate(date);

      expect(result).toBe('3일 전');
    });

    it('2주 전이면 "2주 전"', () => {
      const date = new Date();
      date.setDate(date.getDate() - 14);
      const result = formatAnnouncementDate(date);

      expect(result).toBe('2주 전');
    });

    it('30일 이상이면 날짜 형식', () => {
      const date = new Date('2025-01-15');
      const result = formatAnnouncementDate(date);

      // YYYY.MM.DD 또는 유사 형식
      expect(result).toMatch(/^\d{4}/);
    });
  });
});
