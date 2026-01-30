/**
 * 친구 시스템 조회 함수 테스트
 *
 * @module tests/lib/friends/queries
 * @description getFriends, getReceivedRequests, getSentRequests, getFriendStats, searchUsers, checkFriendship
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFriends,
  getReceivedRequests,
  getSentRequests,
  getFriendStats,
  searchUsers,
  checkFriendship,
} from '@/lib/friends/queries';

// Logger 모킹
vi.mock('@/lib/utils/logger', () => ({
  socialLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// =============================================================================
// Mock 데이터
// =============================================================================

const mockUserId = 'user_123';
const mockFriendId = 'user_456';

const mockFriendshipRow = {
  id: 'friendship_001',
  requester_id: mockUserId,
  addressee_id: mockFriendId,
  status: 'accepted',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockUserRow = {
  clerk_user_id: mockFriendId,
  display_name: '김철수',
  avatar_url: 'https://example.com/avatar.jpg',
};

const mockLevelRow = {
  clerk_user_id: mockFriendId,
  level: 15,
  total_xp: 1500,
  tier: 'silver',
};

// =============================================================================
// 테스트
// =============================================================================

describe('lib/friends/queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getFriends
  // ---------------------------------------------------------------------------

  describe('getFriends', () => {
    it('should return empty array when no friends', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await getFriends(mockSupabase as never, mockUserId);
      expect(result).toEqual([]);
    });

    it('should return friends with user info and levels', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'friendships') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [mockFriendshipRow],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockUserRow],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'user_levels') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockLevelRow],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      const result = await getFriends(mockSupabase as never, mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: mockFriendId,
        displayName: '김철수',
        level: 15,
        tier: 'silver',
        friendshipId: 'friendship_001',
      });
    });

    it('should return empty array on error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'DB error' },
              }),
            }),
          }),
        }),
      };

      const result = await getFriends(mockSupabase as never, mockUserId);
      expect(result).toEqual([]);
    });

    it('should use default values for missing level info', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'friendships') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [mockFriendshipRow],
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockUserRow],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'user_levels') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [], // 레벨 정보 없음
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      const result = await getFriends(mockSupabase as never, mockUserId);

      expect(result[0]).toMatchObject({
        level: 1,
        totalXp: 0,
        tier: 'beginner',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getReceivedRequests
  // ---------------------------------------------------------------------------

  describe('getReceivedRequests', () => {
    it('should return received friend requests', async () => {
      const pendingRequest = {
        id: 'request_001',
        requester_id: mockFriendId,
        created_at: '2026-01-01T00:00:00Z',
      };

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'friendships') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [pendingRequest],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockUserRow],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'user_levels') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockLevelRow],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      const result = await getReceivedRequests(mockSupabase as never, mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'request_001',
        requesterId: mockFriendId,
        requesterName: '김철수',
        requesterLevel: 15,
      });
    });

    it('should return empty array when no requests', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const result = await getReceivedRequests(mockSupabase as never, mockUserId);
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getSentRequests
  // ---------------------------------------------------------------------------

  describe('getSentRequests', () => {
    it('should return sent friend requests', async () => {
      const sentRequest = {
        id: 'request_002',
        addressee_id: mockFriendId,
        created_at: '2026-01-01T00:00:00Z',
      };

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'friendships') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [sentRequest],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockUserRow],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      const result = await getSentRequests(mockSupabase as never, mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'request_002',
        requesterName: '김철수',
      });
    });

    it('should return empty array on error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Error' },
                }),
              }),
            }),
          }),
        }),
      };

      const result = await getSentRequests(mockSupabase as never, mockUserId);
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getFriendStats
  // ---------------------------------------------------------------------------

  describe('getFriendStats', () => {
    it('should return friend statistics', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 5,
              }),
            }),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 2,
              }),
            }),
          }),
        }),
      };

      const result = await getFriendStats(mockSupabase as never, mockUserId);

      expect(result).toMatchObject({
        totalFriends: expect.any(Number),
        pendingRequests: expect.any(Number),
        sentRequests: expect.any(Number),
      });
    });

    it('should return zeros when counts are null', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: null,
              }),
            }),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: null,
              }),
            }),
          }),
        }),
      };

      const result = await getFriendStats(mockSupabase as never, mockUserId);

      expect(result).toEqual({
        totalFriends: 0,
        pendingRequests: 0,
        sentRequests: 0,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // searchUsers
  // ---------------------------------------------------------------------------

  describe('searchUsers', () => {
    it('should return empty array for short query', async () => {
      const mockSupabase = {} as never;

      const result = await searchUsers(mockSupabase, mockUserId, 'a');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty query', async () => {
      const mockSupabase = {} as never;

      const result = await searchUsers(mockSupabase, mockUserId, '');
      expect(result).toEqual([]);
    });

    it('should search users by display name', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [mockUserRow],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'friendships') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'user_levels') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockLevelRow],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      const result = await searchUsers(mockSupabase as never, mockUserId, '김철');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: mockFriendId,
        displayName: '김철수',
        level: 15,
        isFriend: false,
        isPending: false,
        isBlocked: false,
      });
    });

    it('should mark existing friends correctly', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn().mockReturnValue({
                neq: vi.fn().mockReturnValue({
                  ilike: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [mockUserRow],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'friendships') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: [
                    {
                      requester_id: mockUserId,
                      addressee_id: mockFriendId,
                      status: 'accepted',
                    },
                  ],
                  error: null,
                }),
              }),
            };
          }
          if (table === 'user_levels') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      const result = await searchUsers(mockSupabase as never, mockUserId, '김철');

      expect(result[0].isFriend).toBe(true);
      expect(result[0].isPending).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // checkFriendship
  // ---------------------------------------------------------------------------

  describe('checkFriendship', () => {
    it('should return friendship status when friends', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'friendship_001',
                  status: 'accepted',
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await checkFriendship(mockSupabase as never, mockUserId, mockFriendId);

      expect(result).toEqual({
        isFriend: true,
        isPending: false,
        isBlocked: false,
        friendshipId: 'friendship_001',
      });
    });

    it('should return pending status', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'friendship_002',
                  status: 'pending',
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await checkFriendship(mockSupabase as never, mockUserId, mockFriendId);

      expect(result).toEqual({
        isFriend: false,
        isPending: true,
        isBlocked: false,
        friendshipId: 'friendship_002',
      });
    });

    it('should return blocked status', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'friendship_003',
                  status: 'blocked',
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await checkFriendship(mockSupabase as never, mockUserId, mockFriendId);

      expect(result).toEqual({
        isFriend: false,
        isPending: false,
        isBlocked: true,
        friendshipId: 'friendship_003',
      });
    });

    it('should return no relationship when no data', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await checkFriendship(mockSupabase as never, mockUserId, mockFriendId);

      expect(result).toEqual({
        isFriend: false,
        isPending: false,
        isBlocked: false,
      });
    });
  });
});
