/**
 * 신고/차단 Repository 함수 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase mock
const mockSelect = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockDelete = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
  eq: mockEq,
  single: mockSingle,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

// 체이닝을 위해 각 함수가 객체를 반환하도록 설정
beforeEach(() => {
  vi.clearAllMocks();

  const chainable = {
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
  };

  mockFrom.mockReturnValue(chainable);
  mockSelect.mockReturnValue(chainable);
  mockInsert.mockReturnValue(chainable);
  mockDelete.mockReturnValue(chainable);
  mockEq.mockReturnValue(chainable);
});

describe('reportPost', () => {
  it('should create a report with correct parameters', async () => {
    const mockReport = {
      id: 'report_1',
      reporter_clerk_user_id: 'user_1',
      post_id: 'post_1',
      reason: 'spam',
      description: null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    mockSingle.mockResolvedValue({ data: mockReport, error: null });

    const { reportPost } = await import('@/lib/feed/repository');
    const result = await reportPost('user_1', {
      post_id: 'post_1',
      reason: 'spam',
    });

    expect(mockFrom).toHaveBeenCalledWith('feed_reports');
    expect(mockInsert).toHaveBeenCalledWith({
      reporter_clerk_user_id: 'user_1',
      post_id: 'post_1',
      reason: 'spam',
      description: null,
    });
    expect(result).toEqual(mockReport);
  });

  it('should include description when provided', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'report_2' },
      error: null,
    });

    const { reportPost } = await import('@/lib/feed/repository');
    await reportPost('user_1', {
      post_id: 'post_1',
      reason: 'harassment',
      description: '욕설 포함',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '욕설 포함',
      })
    );
  });

  it('should throw on error', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate' },
    });

    const { reportPost } = await import('@/lib/feed/repository');

    await expect(reportPost('user_1', { post_id: 'post_1', reason: 'spam' })).rejects.toEqual(
      expect.objectContaining({ code: '23505' })
    );
  });
});

describe('blockUser', () => {
  it('should insert a block record', async () => {
    const mockBlock = {
      id: 'block_1',
      blocker_clerk_user_id: 'user_1',
      blocked_clerk_user_id: 'user_2',
      created_at: new Date().toISOString(),
    };

    mockSingle.mockResolvedValue({ data: mockBlock, error: null });

    const { blockUser } = await import('@/lib/feed/repository');
    const result = await blockUser('user_1', 'user_2');

    expect(mockFrom).toHaveBeenCalledWith('user_blocks');
    expect(mockInsert).toHaveBeenCalledWith({
      blocker_clerk_user_id: 'user_1',
      blocked_clerk_user_id: 'user_2',
    });
    expect(result).toEqual(mockBlock);
  });
});

describe('unblockUser', () => {
  it('should delete a block record', async () => {
    // delete().eq('blocker...').eq('blocked...') chain
    const secondEq = vi.fn().mockReturnValue({ error: null });
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq });
    mockDelete.mockReturnValue({ eq: firstEq });

    const { unblockUser } = await import('@/lib/feed/repository');
    await unblockUser('user_1', 'user_2');

    expect(mockFrom).toHaveBeenCalledWith('user_blocks');
    expect(mockDelete).toHaveBeenCalled();
    expect(firstEq).toHaveBeenCalledWith('blocker_clerk_user_id', 'user_1');
    expect(secondEq).toHaveBeenCalledWith('blocked_clerk_user_id', 'user_2');
  });
});

describe('getBlockedUserIds', () => {
  it('should return list of blocked user IDs', async () => {
    const mockData = [{ blocked_clerk_user_id: 'user_2' }, { blocked_clerk_user_id: 'user_3' }];

    mockEq.mockResolvedValue({ data: mockData, error: null });

    const { getBlockedUserIds } = await import('@/lib/feed/repository');
    const result = await getBlockedUserIds('user_1');

    expect(mockFrom).toHaveBeenCalledWith('user_blocks');
    expect(result).toEqual(['user_2', 'user_3']);
  });

  it('should return empty array when no blocks', async () => {
    mockEq.mockResolvedValue({ data: [], error: null });

    const { getBlockedUserIds } = await import('@/lib/feed/repository');
    const result = await getBlockedUserIds('user_1');

    expect(result).toEqual([]);
  });
});

describe('getBlockedByUserIds', () => {
  it('should return list of users who blocked me', async () => {
    const mockData = [{ blocker_clerk_user_id: 'user_5' }];

    mockEq.mockResolvedValue({ data: mockData, error: null });

    const { getBlockedByUserIds } = await import('@/lib/feed/repository');
    const result = await getBlockedByUserIds('user_1');

    expect(mockFrom).toHaveBeenCalledWith('user_blocks');
    expect(result).toEqual(['user_5']);
  });
});
