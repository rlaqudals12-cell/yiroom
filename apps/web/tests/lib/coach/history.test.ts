/**
 * AI 코치 채팅 히스토리 테스트
 * @description Phase K - 채팅 기록 저장/조회 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase 클라이언트 모킹
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => ({
    from: vi.fn((table: string) => {
      return {
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockReturnValue({
              limit: mockLimit,
            }),
            single: mockSingle,
          }),
          single: mockSingle,
        }),
        insert: mockInsert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
        update: mockUpdate.mockReturnValue({
          eq: mockEq,
        }),
        delete: mockDelete.mockReturnValue({
          eq: mockEq,
        }),
      };
    }),
  }),
}));

import {
  createCoachSession,
  saveCoachMessage,
  getCoachSessions,
  getSessionMessages,
  deleteCoachSession,
  updateSessionCategory,
} from '@/lib/coach/history';

describe('Coach History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCoachSession', () => {
    it('새 세션을 생성한다', async () => {
      const mockSession = {
        id: 'session-1',
        clerk_user_id: 'user-1',
        title: '첫 번째 질문입니다...',
        category: 'general',
        message_count: 0,
        created_at: '2026-01-12T00:00:00Z',
        updated_at: '2026-01-12T00:00:00Z',
      };

      mockSingle.mockResolvedValueOnce({ data: mockSession, error: null });

      const result = await createCoachSession('user-1', '첫 번째 질문입니다');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('session-1');
      expect(result?.title).toBe('첫 번째 질문입니다...');
    });

    it('긴 메시지는 제목을 50자로 자른다', async () => {
      const longMessage = 'a'.repeat(100);
      const mockSession = {
        id: 'session-2',
        clerk_user_id: 'user-1',
        title: 'a'.repeat(50) + '...',
        category: 'general',
        message_count: 0,
        created_at: '2026-01-12T00:00:00Z',
        updated_at: '2026-01-12T00:00:00Z',
      };

      mockSingle.mockResolvedValueOnce({ data: mockSession, error: null });

      const result = await createCoachSession('user-1', longMessage);

      expect(result?.title?.length).toBeLessThanOrEqual(53); // 50 + '...'
    });

    it('에러 시 null을 반환한다', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

      const result = await createCoachSession('user-1');

      expect(result).toBeNull();
    });
  });

  describe('saveCoachMessage', () => {
    it('메시지를 저장한다', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null });

      const result = await saveCoachMessage('session-1', 'user', '안녕하세요');

      expect(result).toBe('msg-1');
    });

    it('추천 질문과 함께 저장한다', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 'msg-2' }, error: null });

      const result = await saveCoachMessage('session-1', 'assistant', '답변입니다', [
        '추천 질문 1',
        '추천 질문 2',
      ]);

      expect(result).toBe('msg-2');
    });

    it('에러 시 null을 반환한다', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: new Error('Save error') });

      const result = await saveCoachMessage('session-1', 'user', '테스트');

      expect(result).toBeNull();
    });
  });

  describe('getCoachSessions', () => {
    it('세션 목록을 조회한다', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          clerk_user_id: 'user-1',
          title: '첫 세션',
          category: 'workout',
          message_count: 5,
          created_at: '2026-01-12T00:00:00Z',
          updated_at: '2026-01-12T01:00:00Z',
        },
        {
          id: 'session-2',
          clerk_user_id: 'user-1',
          title: '두 번째 세션',
          category: 'nutrition',
          message_count: 3,
          created_at: '2026-01-11T00:00:00Z',
          updated_at: '2026-01-11T01:00:00Z',
        },
      ];

      mockLimit.mockResolvedValueOnce({ data: mockSessions, error: null });

      const result = await getCoachSessions('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('첫 세션');
      expect(result[0].messageCount).toBe(5);
    });

    it('에러 시 빈 배열을 반환한다', async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: new Error('Fetch error') });

      const result = await getCoachSessions('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getSessionMessages', () => {
    it('세션 메시지를 조회한다', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          content: '질문입니다',
          created_at: '2026-01-12T00:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: '답변입니다',
          created_at: '2026-01-12T00:01:00Z',
        },
      ];

      mockOrder.mockReturnValueOnce({
        then: (cb: (result: { data: typeof mockMessages; error: null }) => void) =>
          Promise.resolve(cb({ data: mockMessages, error: null })),
      });

      // 직접 mock 재설정
      mockSelect.mockReturnValueOnce({
        eq: mockEq.mockReturnValueOnce({
          order: vi.fn().mockResolvedValueOnce({ data: mockMessages, error: null }),
        }),
      });

      const result = await getSessionMessages('session-1');

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('user');
      expect(result[1].role).toBe('assistant');
    });
  });

  describe('deleteCoachSession', () => {
    it('세션을 삭제한다', async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      const result = await deleteCoachSession('session-1');

      expect(result).toBe(true);
    });

    it('에러 시 false를 반환한다', async () => {
      mockEq.mockResolvedValueOnce({ error: new Error('Delete error') });

      const result = await deleteCoachSession('session-1');

      expect(result).toBe(false);
    });
  });

  describe('updateSessionCategory', () => {
    it('카테고리를 업데이트한다', async () => {
      mockEq.mockResolvedValueOnce({ error: null });

      const result = await updateSessionCategory('session-1', 'workout');

      expect(result).toBe(true);
    });

    it('에러 시 false를 반환한다', async () => {
      mockEq.mockResolvedValueOnce({ error: new Error('Update error') });

      const result = await updateSessionCategory('session-1', 'workout');

      expect(result).toBe(false);
    });
  });
});
