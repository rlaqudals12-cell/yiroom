/**
 * 친구 시스템 변경 함수 테스트
 *
 * @module tests/lib/friends/mutations
 * @description sendFriendRequest, acceptFriendRequest, rejectFriendRequest,
 *              cancelFriendRequest, removeFriend, blockUser, unblockUser
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
} from '@/lib/friends/mutations';

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
const mockTargetId = 'user_456';
const mockFriendshipId = 'friendship_001';

// =============================================================================
// 테스트
// =============================================================================

describe('lib/friends/mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // sendFriendRequest
  // ---------------------------------------------------------------------------

  describe('sendFriendRequest', () => {
    it('should prevent self-request', async () => {
      const mockSupabase = {} as never;

      const result = await sendFriendRequest(mockSupabase, mockUserId, mockUserId);

      expect(result).toEqual({
        success: false,
        error: '자기 자신에게 친구 요청을 보낼 수 없습니다.',
      });
    });

    it('should prevent duplicate request when already friends', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: mockFriendshipId, status: 'accepted' },
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await sendFriendRequest(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({
        success: false,
        error: '이미 친구입니다.',
      });
    });

    it('should prevent duplicate pending request', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: mockFriendshipId, status: 'pending' },
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await sendFriendRequest(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({
        success: false,
        error: '이미 요청을 보냈거나 받았습니다.',
      });
    });

    it('should prevent request to blocked user', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: mockFriendshipId, status: 'blocked' },
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await sendFriendRequest(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({
        success: false,
        error: '차단된 사용자입니다.',
      });
    });

    it('should successfully send friend request', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'new_friendship_001' },
                error: null,
              }),
            }),
          }),
        })),
      };

      const result = await sendFriendRequest(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({
        success: true,
        friendshipId: 'new_friendship_001',
      });
    });

    it('should handle insert error', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed' },
              }),
            }),
          }),
        })),
      };

      const result = await sendFriendRequest(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({
        success: false,
        error: '친구 요청을 보내는 데 실패했습니다.',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // acceptFriendRequest
  // ---------------------------------------------------------------------------

  describe('acceptFriendRequest', () => {
    it('should successfully accept friend request', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const result = await acceptFriendRequest(mockSupabase as never, mockUserId, mockFriendshipId);

      expect(result).toEqual({ success: true });
    });

    it('should handle update error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: { message: 'Update failed' },
                }),
              }),
            }),
          }),
        }),
      };

      const result = await acceptFriendRequest(mockSupabase as never, mockUserId, mockFriendshipId);

      expect(result).toEqual({
        success: false,
        error: '친구 요청을 수락하는 데 실패했습니다.',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // rejectFriendRequest
  // ---------------------------------------------------------------------------

  describe('rejectFriendRequest', () => {
    it('should successfully reject friend request', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const result = await rejectFriendRequest(mockSupabase as never, mockUserId, mockFriendshipId);

      expect(result).toEqual({ success: true });
    });

    it('should handle update error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: { message: 'Update failed' },
                }),
              }),
            }),
          }),
        }),
      };

      const result = await rejectFriendRequest(mockSupabase as never, mockUserId, mockFriendshipId);

      expect(result).toEqual({
        success: false,
        error: '친구 요청을 거절하는 데 실패했습니다.',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // cancelFriendRequest
  // ---------------------------------------------------------------------------

  describe('cancelFriendRequest', () => {
    it('should successfully cancel sent request', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const result = await cancelFriendRequest(mockSupabase as never, mockUserId, mockFriendshipId);

      expect(result).toEqual({ success: true });
    });

    it('should handle delete error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: { message: 'Delete failed' },
                }),
              }),
            }),
          }),
        }),
      };

      const result = await cancelFriendRequest(mockSupabase as never, mockUserId, mockFriendshipId);

      expect(result).toEqual({
        success: false,
        error: '친구 요청을 취소하는 데 실패했습니다.',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // removeFriend
  // ---------------------------------------------------------------------------

  describe('removeFriend', () => {
    it('should successfully remove friend', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const result = await removeFriend(mockSupabase as never, mockUserId, mockFriendshipId);

      expect(result).toEqual({ success: true });
    });

    it('should handle delete error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  error: { message: 'Delete failed' },
                }),
              }),
            }),
          }),
        }),
      };

      const result = await removeFriend(mockSupabase as never, mockUserId, mockFriendshipId);

      expect(result).toEqual({
        success: false,
        error: '친구를 삭제하는 데 실패했습니다.',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // blockUser
  // ---------------------------------------------------------------------------

  describe('blockUser', () => {
    it('should update existing relationship to blocked', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: mockFriendshipId },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        })),
      };

      const result = await blockUser(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({ success: true });
    });

    it('should create new blocked relationship when none exists', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({
            error: null,
          }),
        })),
      };

      const result = await blockUser(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({ success: true });
    });

    it('should handle update error', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: mockFriendshipId },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Update failed' },
            }),
          }),
        })),
      };

      const result = await blockUser(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({
        success: false,
        error: '사용자를 차단하는 데 실패했습니다.',
      });
    });

    it('should handle insert error', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => ({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue({
            error: { message: 'Insert failed' },
          }),
        })),
      };

      const result = await blockUser(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({
        success: false,
        error: '사용자를 차단하는 데 실패했습니다.',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // unblockUser
  // ---------------------------------------------------------------------------

  describe('unblockUser', () => {
    it('should successfully unblock user', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await unblockUser(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({ success: true });
    });

    it('should handle delete error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          delete: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: { message: 'Delete failed' },
              }),
            }),
          }),
        }),
      };

      const result = await unblockUser(mockSupabase as never, mockUserId, mockTargetId);

      expect(result).toEqual({
        success: false,
        error: '차단을 해제하는 데 실패했습니다.',
      });
    });
  });
});
