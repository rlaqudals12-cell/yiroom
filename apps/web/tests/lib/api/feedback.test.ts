/**
 * Feedback API 테스트
 * @description lib/api/feedback.ts의 변환 함수 및 유틸리티 테스트
 */
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase before importing the module
const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
        single: vi.fn(),
      })),
      order: vi.fn(() => ({
        limit: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabaseClient,
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => mockSupabaseClient,
}));

import { toFeedback } from '@/lib/api/feedback';
import type { FeedbackRow } from '@/types/feedback';

// =====================================================
// toFeedback 변환 함수 테스트
// =====================================================

describe('toFeedback 변환 함수', () => {
  it('DB Row를 Feedback 객체로 정확히 변환', () => {
    const row: FeedbackRow = {
      id: 'fb-123',
      clerk_user_id: 'user_abc',
      type: 'bug',
      title: '버그 신고',
      content: '앱이 자꾸 멈춰요',
      contact_email: 'test@example.com',
      screenshot_url: 'https://example.com/screenshot.png',
      status: 'pending',
      admin_notes: null,
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-10T10:00:00Z',
    };

    const result = toFeedback(row);

    expect(result.id).toBe('fb-123');
    expect(result.clerkUserId).toBe('user_abc');
    expect(result.type).toBe('bug');
    expect(result.title).toBe('버그 신고');
    expect(result.content).toBe('앱이 자꾸 멈춰요');
    expect(result.contactEmail).toBe('test@example.com');
    expect(result.screenshotUrl).toBe('https://example.com/screenshot.png');
    expect(result.status).toBe('pending');
    expect(result.adminNotes).toBeNull();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('null 필드 처리', () => {
    const row: FeedbackRow = {
      id: 'fb-456',
      clerk_user_id: 'anonymous',
      type: 'suggestion',
      title: '기능 제안',
      content: '이런 기능이 있으면 좋겠어요',
      contact_email: null,
      screenshot_url: null,
      status: 'in_progress',
      admin_notes: '검토 중입니다',
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-10T11:00:00Z',
    };

    const result = toFeedback(row);

    expect(result.contactEmail).toBeNull();
    expect(result.screenshotUrl).toBeNull();
    expect(result.adminNotes).toBe('검토 중입니다');
  });

  it('users 조인 데이터가 있으면 userName 설정', () => {
    const row: FeedbackRow = {
      id: 'fb-789',
      clerk_user_id: 'user_xyz',
      type: 'question',
      title: '문의',
      content: '궁금한 게 있어요',
      contact_email: null,
      screenshot_url: null,
      status: 'resolved',
      admin_notes: null,
      created_at: '2026-01-10T10:00:00Z',
      updated_at: '2026-01-10T10:00:00Z',
      users: {
        full_name: '홍길동',
      },
    };

    const result = toFeedback(row);

    expect(result.userName).toBe('홍길동');
  });

  it('모든 피드백 타입 변환', () => {
    const types = ['bug', 'suggestion', 'question', 'other'] as const;

    types.forEach((type) => {
      const row: FeedbackRow = {
        id: `fb-${type}`,
        clerk_user_id: 'user_test',
        type,
        title: '테스트',
        content: '테스트 내용',
        contact_email: null,
        screenshot_url: null,
        status: 'pending',
        admin_notes: null,
        created_at: '2026-01-10T10:00:00Z',
        updated_at: '2026-01-10T10:00:00Z',
      };

      const result = toFeedback(row);
      expect(result.type).toBe(type);
    });
  });

  it('모든 피드백 상태 변환', () => {
    const statuses = ['pending', 'in_progress', 'resolved', 'closed'] as const;

    statuses.forEach((status) => {
      const row: FeedbackRow = {
        id: `fb-${status}`,
        clerk_user_id: 'user_test',
        type: 'bug',
        title: '테스트',
        content: '테스트 내용',
        contact_email: null,
        screenshot_url: null,
        status,
        admin_notes: null,
        created_at: '2026-01-10T10:00:00Z',
        updated_at: '2026-01-10T10:00:00Z',
      };

      const result = toFeedback(row);
      expect(result.status).toBe(status);
    });
  });
});

// =====================================================
// 타입 상수 테스트
// =====================================================

describe('피드백 타입 상수', () => {
  it('FEEDBACK_TYPE_NAMES 확인', async () => {
    const { FEEDBACK_TYPE_NAMES } = await import('@/types/feedback');

    expect(FEEDBACK_TYPE_NAMES.bug).toBe('버그 신고');
    expect(FEEDBACK_TYPE_NAMES.suggestion).toBe('기능 제안');
    expect(FEEDBACK_TYPE_NAMES.question).toBe('문의');
    expect(FEEDBACK_TYPE_NAMES.other).toBe('기타');
  });

  it('FEEDBACK_STATUS_NAMES 확인', async () => {
    const { FEEDBACK_STATUS_NAMES } = await import('@/types/feedback');

    expect(FEEDBACK_STATUS_NAMES.pending).toBe('대기 중');
    expect(FEEDBACK_STATUS_NAMES.in_progress).toBe('처리 중');
    expect(FEEDBACK_STATUS_NAMES.resolved).toBe('해결됨');
    expect(FEEDBACK_STATUS_NAMES.closed).toBe('종료');
  });

  it('FEEDBACK_STATUS_COLORS 색상 확인', async () => {
    const { FEEDBACK_STATUS_COLORS } = await import('@/types/feedback');

    expect(FEEDBACK_STATUS_COLORS.pending.bg).toBe('bg-yellow-100');
    expect(FEEDBACK_STATUS_COLORS.resolved.bg).toBe('bg-green-100');
  });
});
