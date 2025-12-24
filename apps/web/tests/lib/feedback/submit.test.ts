import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

// 실제 모듈은 mock 후에 import
const { submitFeedback, getMyFeedbacks } = await import('@/lib/feedback/submit');

describe('submitFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('인증 검사', () => {
    it('로그인하지 않은 경우 에러 반환', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      const result = await submitFeedback({
        type: 'bug',
        title: '테스트 제목',
        content: '테스트 내용입니다.',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다.');
    });
  });

  describe('피드백 제출', () => {
    it('성공 시 피드백 반환', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);

      const mockFeedback = {
        id: 'fb_1',
        clerk_user_id: 'user_123',
        type: 'bug',
        title: '테스트 제목',
        content: '테스트 내용입니다.',
        contact_email: null,
        screenshot_url: null,
        status: 'pending',
        admin_notes: null,
        created_at: '2025-12-24T00:00:00Z',
        updated_at: '2025-12-24T00:00:00Z',
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockFeedback,
          error: null,
        }),
      };

      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await submitFeedback({
        type: 'bug',
        title: '테스트 제목',
        content: '테스트 내용입니다.',
      });

      expect(result.success).toBe(true);
      expect(result.feedback).toBeDefined();
      expect(result.feedback?.type).toBe('bug');
      expect(result.feedback?.title).toBe('테스트 제목');
    });

    it('DB 에러 시 실패 반환', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      };

      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      const result = await submitFeedback({
        type: 'bug',
        title: '테스트 제목',
        content: '테스트 내용입니다.',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('피드백 저장에 실패했습니다.');
    });

    it('연락처 이메일 포함', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);

      const mockFeedback = {
        id: 'fb_1',
        clerk_user_id: 'user_123',
        type: 'suggestion',
        title: '기능 제안',
        content: '새로운 기능을 제안합니다.',
        contact_email: 'test@example.com',
        screenshot_url: null,
        status: 'pending',
        admin_notes: null,
        created_at: '2025-12-24T00:00:00Z',
        updated_at: '2025-12-24T00:00:00Z',
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockFeedback,
          error: null,
        }),
      };

      vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

      await submitFeedback({
        type: 'suggestion',
        title: '기능 제안',
        content: '새로운 기능을 제안합니다.',
        contactEmail: 'test@example.com',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          contact_email: 'test@example.com',
        })
      );
    });
  });
});

describe('getMyFeedbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로그인하지 않은 경우 빈 배열 반환', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    const result = await getMyFeedbacks();

    expect(result).toEqual([]);
  });

  it('피드백 목록 반환', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);

    const mockFeedbacks = [
      {
        id: 'fb_1',
        clerk_user_id: 'user_123',
        type: 'bug',
        title: '버그 1',
        content: '내용 1',
        contact_email: null,
        screenshot_url: null,
        status: 'pending',
        admin_notes: null,
        created_at: '2025-12-24T00:00:00Z',
        updated_at: '2025-12-24T00:00:00Z',
      },
      {
        id: 'fb_2',
        clerk_user_id: 'user_123',
        type: 'question',
        title: '문의 1',
        content: '내용 2',
        contact_email: 'test@example.com',
        screenshot_url: null,
        status: 'resolved',
        admin_notes: '처리 완료',
        created_at: '2025-12-23T00:00:00Z',
        updated_at: '2025-12-23T12:00:00Z',
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockFeedbacks,
        error: null,
      }),
    };

    vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

    const result = await getMyFeedbacks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('버그 1');
    expect(result[1].title).toBe('문의 1');
  });

  it('DB 에러 시 빈 배열 반환', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      }),
    };

    vi.mocked(createClerkSupabaseClient).mockReturnValue(mockSupabase as never);

    const result = await getMyFeedbacks();

    expect(result).toEqual([]);
  });
});
