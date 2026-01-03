/**
 * 피드 API 테스트
 */

import {
  getFriendsFeed,
  getMyFeed,
  getAllFeed,
  toggleLike,
  formatRelativeTime,
} from '@/lib/feed';
import type { FeedItem } from '@/lib/feed/types';

// Supabase 모킹
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(),
          })),
        })),
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(),
          })),
        })),
        order: jest.fn(() => ({
          range: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        single: jest.fn(),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
    rpc: jest.fn(),
  },
}));

describe('formatRelativeTime', () => {
  const now = new Date('2026-01-04T12:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('방금 전을 올바르게 표시해야 함', () => {
    const date = new Date('2026-01-04T11:59:30Z');
    expect(formatRelativeTime(date.toISOString())).toBe('방금 전');
  });

  it('분 단위를 올바르게 표시해야 함', () => {
    const date = new Date('2026-01-04T11:55:00Z');
    expect(formatRelativeTime(date.toISOString())).toBe('5분 전');
  });

  it('시간 단위를 올바르게 표시해야 함', () => {
    const date = new Date('2026-01-04T10:00:00Z');
    expect(formatRelativeTime(date.toISOString())).toBe('2시간 전');
  });

  it('일 단위를 올바르게 표시해야 함', () => {
    const date = new Date('2026-01-02T12:00:00Z');
    expect(formatRelativeTime(date.toISOString())).toBe('2일 전');
  });

  it('주 단위를 올바르게 표시해야 함', () => {
    const date = new Date('2025-12-21T12:00:00Z');
    expect(formatRelativeTime(date.toISOString())).toBe('2주 전');
  });

  it('월 단위를 올바르게 표시해야 함', () => {
    const date = new Date('2025-11-04T12:00:00Z');
    expect(formatRelativeTime(date.toISOString())).toBe('2개월 전');
  });
});

describe('getFriendsFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('친구들의 피드를 조회해야 함', async () => {
    const { supabase } = require('@/lib/supabase');
    const mockData: FeedItem[] = [
      {
        id: 'feed_1',
        userId: 'user_1',
        userName: '홍길동',
        userAvatar: 'https://example.com/avatar.jpg',
        type: 'workout',
        content: '오늘 운동 완료!',
        createdAt: '2026-01-04T10:00:00Z',
        likes: 5,
        comments: 2,
        isLiked: false,
      },
    ];

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        })),
      })),
    });

    const result = await getFriendsFeed('user_1', ['friend_1', 'friend_2']);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('feed_1');
  });

  it('친구가 없으면 빈 배열을 반환해야 함', async () => {
    const result = await getFriendsFeed('user_1', []);
    expect(result).toEqual([]);
  });

  it('오류 발생 시 빈 배열을 반환해야 함', async () => {
    const { supabase } = require('@/lib/supabase');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() =>
              Promise.resolve({ data: null, error: { message: 'DB error' } })
            ),
          })),
        })),
      })),
    });

    const result = await getFriendsFeed('user_1', ['friend_1']);

    expect(result).toEqual([]);
    consoleErrorSpy.mockRestore();
  });
});

describe('getMyFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('내 피드를 조회해야 함', async () => {
    const { supabase } = require('@/lib/supabase');
    const mockData: FeedItem[] = [
      {
        id: 'feed_1',
        userId: 'user_1',
        userName: '나',
        userAvatar: null,
        type: 'meal',
        content: '점심 기록',
        createdAt: '2026-01-04T12:00:00Z',
        likes: 0,
        comments: 0,
        isLiked: false,
      },
    ];

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
          })),
        })),
      })),
    });

    const result = await getMyFeed('user_1');

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('user_1');
  });
});

describe('getAllFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('전체 피드를 조회해야 함', async () => {
    const { supabase } = require('@/lib/supabase');
    const mockData: FeedItem[] = [
      {
        id: 'feed_1',
        userId: 'user_1',
        userName: '사용자1',
        userAvatar: null,
        type: 'achievement',
        content: '7일 연속 달성!',
        createdAt: '2026-01-04T09:00:00Z',
        likes: 10,
        comments: 3,
        isLiked: true,
      },
    ];

    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          range: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
        })),
      })),
    });

    const result = await getAllFeed();

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('achievement');
  });
});

describe('toggleLike', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('좋아요를 추가해야 함', async () => {
    const { supabase } = require('@/lib/supabase');

    supabase.from.mockReturnValue({
      insert: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ error: null })),
      })),
    });

    const result = await toggleLike('feed_1', 'user_1', false);

    expect(result).toBe(true);
  });

  it('좋아요를 취소해야 함', async () => {
    const { supabase } = require('@/lib/supabase');

    supabase.from.mockReturnValue({
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    });

    const result = await toggleLike('feed_1', 'user_1', true);

    expect(result).toBe(false);
  });

  it('오류 발생 시 현재 상태를 유지해야 함', async () => {
    const { supabase } = require('@/lib/supabase');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    supabase.from.mockReturnValue({
      insert: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ error: { message: 'Error' } })),
      })),
    });

    const result = await toggleLike('feed_1', 'user_1', false);

    expect(result).toBe(false);
    consoleErrorSpy.mockRestore();
  });
});
