import { describe, it, expect } from 'vitest';
import {
  toFeedback,
  filterFeedbackByStatus,
  filterFeedbackByType,
  sortFeedbackByDate,
  getFeedbackStats,
  validateFeedback,
} from '@/lib/feedback';
import type { Feedback, FeedbackRow } from '@/types/feedback';

// Mock 데이터
const mockFeedbackRow: FeedbackRow = {
  id: 'fb-1',
  clerk_user_id: 'user-1',
  type: 'bug',
  title: '버그 신고',
  content: '앱이 작동하지 않습니다.',
  contact_email: 'user@example.com',
  screenshot_url: null,
  status: 'pending',
  admin_notes: null,
  created_at: '2025-12-24T00:00:00Z',
  updated_at: '2025-12-24T00:00:00Z',
  users: {
    full_name: '홍길동',
  },
};

const createMockFeedback = (overrides: Partial<Feedback> = {}): Feedback => ({
  id: 'fb-1',
  clerkUserId: 'user-1',
  type: 'bug',
  title: '버그 신고',
  content: '앱이 작동하지 않습니다.',
  contactEmail: 'user@example.com',
  screenshotUrl: null,
  status: 'pending',
  adminNotes: null,
  createdAt: new Date('2025-12-24'),
  updatedAt: new Date('2025-12-24'),
  userName: '홍길동',
  ...overrides,
});

describe('lib/feedback', () => {
  describe('toFeedback', () => {
    it('DB Row를 Feedback으로 변환', () => {
      const result = toFeedback(mockFeedbackRow);

      expect(result.id).toBe('fb-1');
      expect(result.clerkUserId).toBe('user-1');
      expect(result.type).toBe('bug');
      expect(result.title).toBe('버그 신고');
      expect(result.status).toBe('pending');
      expect(result.userName).toBe('홍길동');
    });

    it('Date 필드 변환', () => {
      const result = toFeedback(mockFeedbackRow);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('null 필드 처리', () => {
      const result = toFeedback(mockFeedbackRow);

      expect(result.screenshotUrl).toBeNull();
      expect(result.adminNotes).toBeNull();
    });

    it('users 없을 때 userName undefined', () => {
      const row = { ...mockFeedbackRow, users: undefined };
      const result = toFeedback(row);

      expect(result.userName).toBeUndefined();
    });
  });

  describe('filterFeedbackByStatus', () => {
    const feedbacks: Feedback[] = [
      createMockFeedback({ id: '1', status: 'pending' }),
      createMockFeedback({ id: '2', status: 'in_progress' }),
      createMockFeedback({ id: '3', status: 'resolved' }),
      createMockFeedback({ id: '4', status: 'pending' }),
    ];

    it('all이면 전체 반환', () => {
      const result = filterFeedbackByStatus(feedbacks, 'all');
      expect(result.length).toBe(4);
    });

    it('pending 필터', () => {
      const result = filterFeedbackByStatus(feedbacks, 'pending');
      expect(result.length).toBe(2);
      expect(result.every((f) => f.status === 'pending')).toBe(true);
    });

    it('in_progress 필터', () => {
      const result = filterFeedbackByStatus(feedbacks, 'in_progress');
      expect(result.length).toBe(1);
    });

    it('resolved 필터', () => {
      const result = filterFeedbackByStatus(feedbacks, 'resolved');
      expect(result.length).toBe(1);
    });
  });

  describe('filterFeedbackByType', () => {
    const feedbacks: Feedback[] = [
      createMockFeedback({ id: '1', type: 'bug' }),
      createMockFeedback({ id: '2', type: 'suggestion' }),
      createMockFeedback({ id: '3', type: 'bug' }),
      createMockFeedback({ id: '4', type: 'question' }),
    ];

    it('all이면 전체 반환', () => {
      const result = filterFeedbackByType(feedbacks, 'all');
      expect(result.length).toBe(4);
    });

    it('bug 필터', () => {
      const result = filterFeedbackByType(feedbacks, 'bug');
      expect(result.length).toBe(2);
    });

    it('suggestion 필터', () => {
      const result = filterFeedbackByType(feedbacks, 'suggestion');
      expect(result.length).toBe(1);
    });
  });

  describe('sortFeedbackByDate', () => {
    it('최신순 정렬', () => {
      const feedbacks: Feedback[] = [
        createMockFeedback({ id: '1', createdAt: new Date('2025-12-20') }),
        createMockFeedback({ id: '2', createdAt: new Date('2025-12-24') }),
        createMockFeedback({ id: '3', createdAt: new Date('2025-12-22') }),
      ];

      const sorted = sortFeedbackByDate(feedbacks);

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });

    it('원본 배열 수정하지 않음', () => {
      const feedbacks: Feedback[] = [
        createMockFeedback({ id: '1' }),
        createMockFeedback({ id: '2' }),
      ];

      const sorted = sortFeedbackByDate(feedbacks);

      expect(sorted).not.toBe(feedbacks);
    });
  });

  describe('getFeedbackStats', () => {
    it('통계 계산', () => {
      const feedbacks: Feedback[] = [
        createMockFeedback({ type: 'bug', status: 'pending' }),
        createMockFeedback({ type: 'bug', status: 'in_progress' }),
        createMockFeedback({ type: 'suggestion', status: 'resolved' }),
        createMockFeedback({ type: 'question', status: 'pending' }),
      ];

      const stats = getFeedbackStats(feedbacks);

      expect(stats.total).toBe(4);
      expect(stats.pending).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.resolved).toBe(1);
      expect(stats.byType.bug).toBe(2);
      expect(stats.byType.suggestion).toBe(1);
      expect(stats.byType.question).toBe(1);
      expect(stats.byType.other).toBe(0);
    });

    it('빈 배열', () => {
      const stats = getFeedbackStats([]);

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.byType.bug).toBe(0);
    });
  });

  describe('validateFeedback', () => {
    it('유효한 데이터', () => {
      const result = validateFeedback({
        type: 'bug',
        title: '버그가 발생했습니다',
        content: '앱 사용 중 오류가 발생하여 신고합니다.',
      });

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('유형 없음', () => {
      const result = validateFeedback({
        title: '버그 신고',
        content: '내용입니다. 자세한 설명.',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('피드백 유형을 선택해주세요.');
    });

    it('제목 짧음', () => {
      const result = validateFeedback({
        type: 'bug',
        title: '짧음',
        content: '내용입니다. 자세한 설명.',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('제목은 5자 이상 입력해주세요.');
    });

    it('내용 짧음', () => {
      const result = validateFeedback({
        type: 'bug',
        title: '제목입니다',
        content: '짧음',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('내용은 10자 이상 입력해주세요.');
    });

    it('여러 에러', () => {
      const result = validateFeedback({
        title: '',
        content: '',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
    });
  });
});
