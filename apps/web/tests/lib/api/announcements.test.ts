/**
 * 공지사항/FAQ API 테스트
 * @description lib/api/announcements.ts의 CRUD 함수 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 터미널 결과를 저장하는 변수
let terminalResult: { data: unknown; error: unknown } = { data: null, error: null };

// Supabase 체이너블 mock — eq/limit/single/order/upsert 모두 chain 반환
// 실제 "await" 시 체인 객체 자체가 thenable이 되도록 설정
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
  // thenable: await chain 시 terminalResult 반환
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
  return chain;
});

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockChain,
}));

vi.mock('@/lib/announcements', () => ({
  toAnnouncement: (row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    isPinned: row.is_pinned,
  }),
  toFAQ: (row: Record<string, unknown>) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
  }),
  sortAnnouncements: (arr: unknown[]) => arr,
}));

import {
  getPublishedAnnouncements,
  getAnnouncementById,
  getUserReadAnnouncementIds,
  markAnnouncementAsRead,
  incrementAnnouncementViewCount,
  getPublishedFAQs,
  updateFAQFeedback,
} from '@/lib/api/announcements';

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
  // then을 재설정
  mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
});

describe('getPublishedAnnouncements', () => {
  it('발행된 공지사항 목록을 반환한다', async () => {
    const mockRows = [
      { id: '1', title: '첫 공지', is_pinned: true },
      { id: '2', title: '두번째 공지', is_pinned: false },
    ];
    terminalResult = { data: mockRows, error: null };

    const result = await getPublishedAnnouncements();

    expect(mockChain.from).toHaveBeenCalledWith('announcements');
    expect(mockChain.eq).toHaveBeenCalledWith('is_published', true);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('id', '1');
  });

  it('limit 파라미터를 전달한다', async () => {
    terminalResult = { data: [], error: null };

    await getPublishedAnnouncements(10);

    expect(mockChain.limit).toHaveBeenCalledWith(10);
  });

  it('에러 발생 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'DB error' } };

    const result = await getPublishedAnnouncements();

    expect(result).toEqual([]);
  });
});

describe('getAnnouncementById', () => {
  it('ID로 공지사항을 조회한다', async () => {
    const mockRow = { id: 'abc', title: '테스트 공지', is_pinned: false };
    terminalResult = { data: mockRow, error: null };

    const result = await getAnnouncementById('abc');

    expect(mockChain.eq).toHaveBeenCalledWith('id', 'abc');
    expect(result).toHaveProperty('id', 'abc');
  });

  it('존재하지 않는 ID는 null을 반환한다', async () => {
    terminalResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } };

    const result = await getAnnouncementById('nonexistent');

    expect(result).toBeNull();
  });
});

describe('getUserReadAnnouncementIds', () => {
  it('읽은 공지사항 ID 목록을 반환한다', async () => {
    terminalResult = {
      data: [{ announcement_id: 'a1' }, { announcement_id: 'a2' }],
      error: null,
    };

    const result = await getUserReadAnnouncementIds('user_123');

    expect(mockChain.from).toHaveBeenCalledWith('announcement_reads');
    expect(result).toEqual(['a1', 'a2']);
  });

  it('에러 발생 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Error' } };

    const result = await getUserReadAnnouncementIds('user_123');

    expect(result).toEqual([]);
  });
});

describe('markAnnouncementAsRead', () => {
  it('읽음 표시를 성공적으로 저장한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await markAnnouncementAsRead('a1', 'user_123');

    expect(result).toBe(true);
    expect(mockChain.from).toHaveBeenCalledWith('announcement_reads');
    expect(mockChain.upsert).toHaveBeenCalledWith(
      { announcement_id: 'a1', clerk_user_id: 'user_123' },
      { onConflict: 'announcement_id,clerk_user_id' }
    );
  });

  it('에러 발생 시 false를 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Conflict' } };

    const result = await markAnnouncementAsRead('a1', 'user_123');

    expect(result).toBe(false);
  });
});

describe('incrementAnnouncementViewCount', () => {
  it('RPC를 호출하여 조회수를 증가시킨다', async () => {
    mockChain.rpc.mockResolvedValueOnce({ data: null, error: null });

    await incrementAnnouncementViewCount('a1');

    expect(mockChain.rpc).toHaveBeenCalledWith('increment_announcement_view_count', {
      announcement_id: 'a1',
    });
  });

  it('RPC 실패 시 에러를 무시한다 (경고 로그만)', async () => {
    mockChain.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'function not found' },
    });

    await expect(incrementAnnouncementViewCount('a1')).resolves.toBeUndefined();
  });
});

describe('getPublishedFAQs', () => {
  it('발행된 FAQ 목록을 반환한다', async () => {
    terminalResult = { data: [{ id: 'f1', question: 'Q1?', answer: 'A1' }], error: null };

    const result = await getPublishedFAQs();

    expect(mockChain.from).toHaveBeenCalledWith('faqs');
    expect(result).toHaveLength(1);
  });

  it('에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'err' } };

    const result = await getPublishedFAQs();

    expect(result).toEqual([]);
  });
});

describe('updateFAQFeedback', () => {
  it('helpful 피드백을 반영한다', async () => {
    // updateFAQFeedback는 두 개의 쿼리를 실행:
    // 1) from('faqs').select(...).eq(...).single() — 현재 카운트 조회
    // 2) from('faqs').update(...).eq(...) — 카운트 업데이트
    // then은 두 번 호출됨: 첫 번째는 조회, 두 번째는 업데이트
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          data: { helpful_count: 5, not_helpful_count: 2 },
          error: null,
        }).then(resolve);
      }
      return Promise.resolve({ data: null, error: null }).then(resolve);
    });

    const result = await updateFAQFeedback('f1', true);

    expect(result).toBe(true);
  });

  it('not_helpful 피드백을 반영한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          data: { helpful_count: 5, not_helpful_count: 2 },
          error: null,
        }).then(resolve);
      }
      return Promise.resolve({ data: null, error: null }).then(resolve);
    });

    const result = await updateFAQFeedback('f1', false);

    expect(result).toBe(true);
  });

  it('현재 카운트 조회 실패 시 false를 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Not found' } };

    const result = await updateFAQFeedback('f1', true);

    expect(result).toBe(false);
  });

  it('null 카운트를 0으로 처리한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          data: { helpful_count: null, not_helpful_count: null },
          error: null,
        }).then(resolve);
      }
      return Promise.resolve({ data: null, error: null }).then(resolve);
    });

    const result = await updateFAQFeedback('f1', true);

    expect(result).toBe(true);
  });
});
