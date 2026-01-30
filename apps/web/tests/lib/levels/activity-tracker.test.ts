/**
 * 활동 트래커 테스트
 *
 * @module tests/lib/levels/activity-tracker
 * @description trackActivity, getUserLevel, getUserActivityLogs, getTodayActivityCount
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackActivity,
  getUserLevel,
  getUserActivityLogs,
  getTodayActivityCount,
  getLevelDefinitions,
} from '@/lib/levels/activity-tracker';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockUserId = 'user_123';

const mockActivityLog = {
  id: 'log_001',
  activity_type: 'workout',
  points: 1,
  created_at: '2026-01-15T10:00:00Z',
};

const mockUserLevel = {
  level: 3,
  total_activity_count: 150,
  level_updated_at: '2026-01-15T00:00:00Z',
};

// =============================================================================
// 테스트
// =============================================================================

describe('lib/levels/activity-tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // trackActivity
  // ---------------------------------------------------------------------------

  describe('trackActivity', () => {
    it('should successfully track workout activity', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      const result = await trackActivity(mockSupabase as never, mockUserId, 'workout');

      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('activity_logs');
    });

    it('should track activity with activity ID', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };

      const result = await trackActivity(
        mockSupabase as never,
        mockUserId,
        'analysis',
        'analysis_123'
      );

      expect(result).toEqual({ success: true });
    });

    it('should return error on DB failure', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({
            error: { message: 'DB error' },
          }),
        }),
      };

      const result = await trackActivity(mockSupabase as never, mockUserId, 'meal');

      expect(result).toEqual({
        success: false,
        error: 'DB error',
      });
    });

    it('should handle unexpected errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
      };

      const result = await trackActivity(mockSupabase as never, mockUserId, 'water');

      expect(result).toEqual({
        success: false,
        error: 'Unexpected error',
      });
    });

    it('should use correct points for each activity type', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: insertMock,
        }),
      };

      // workout = 1 point
      await trackActivity(mockSupabase as never, mockUserId, 'workout');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ points: 1 }));

      // analysis = 2 points
      await trackActivity(mockSupabase as never, mockUserId, 'analysis');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ points: 2 }));

      // review = 3 points
      await trackActivity(mockSupabase as never, mockUserId, 'review');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ points: 3 }));
    });
  });

  // ---------------------------------------------------------------------------
  // getUserLevel
  // ---------------------------------------------------------------------------

  describe('getUserLevel', () => {
    it('should return user level info', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserLevel,
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await getUserLevel(mockSupabase as never, mockUserId);

      expect(result).toEqual({
        level: 3,
        totalActivityCount: 150,
        levelUpdatedAt: '2026-01-15T00:00:00Z',
      });
    });

    it('should return default values for new user (PGRST116)', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Row not found' },
              }),
            }),
          }),
        }),
      };

      const result = await getUserLevel(mockSupabase as never, mockUserId);

      expect(result).toEqual({
        level: 1,
        totalActivityCount: 0,
        levelUpdatedAt: null,
      });
    });

    it('should return null on other DB errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST500', message: 'Server error' },
              }),
            }),
          }),
        }),
      };

      const result = await getUserLevel(mockSupabase as never, mockUserId);

      expect(result).toBeNull();
    });

    it('should handle unexpected errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
      };

      const result = await getUserLevel(mockSupabase as never, mockUserId);

      expect(result).toBeNull();
    });

    it('should handle null total_activity_count', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  level: 1,
                  total_activity_count: null,
                  level_updated_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const result = await getUserLevel(mockSupabase as never, mockUserId);

      expect(result?.totalActivityCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getUserActivityLogs
  // ---------------------------------------------------------------------------

  describe('getUserActivityLogs', () => {
    it('should return activity logs', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [mockActivityLog],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const result = await getUserActivityLogs(mockSupabase as never, mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'log_001',
        activityType: 'workout',
        points: 1,
        createdAt: '2026-01-15T10:00:00Z',
      });
    });

    it('should use default limit of 20', async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: limitMock,
              }),
            }),
          }),
        }),
      };

      await getUserActivityLogs(mockSupabase as never, mockUserId);

      expect(limitMock).toHaveBeenCalledWith(20);
    });

    it('should use custom limit', async () => {
      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: limitMock,
              }),
            }),
          }),
        }),
      };

      await getUserActivityLogs(mockSupabase as never, mockUserId, 50);

      expect(limitMock).toHaveBeenCalledWith(50);
    });

    it('should return empty array on error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Error' },
                }),
              }),
            }),
          }),
        }),
      };

      const result = await getUserActivityLogs(mockSupabase as never, mockUserId);

      expect(result).toEqual([]);
    });

    it('should handle null data', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const result = await getUserActivityLogs(mockSupabase as never, mockUserId);

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getTodayActivityCount
  // ---------------------------------------------------------------------------

  describe('getTodayActivityCount', () => {
    it('should return today activity count', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({
                  count: 3,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const result = await getTodayActivityCount(mockSupabase as never, mockUserId, 'workout');

      expect(result).toBe(3);
    });

    it('should return 0 on error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({
                  count: null,
                  error: { message: 'Error' },
                }),
              }),
            }),
          }),
        }),
      };

      const result = await getTodayActivityCount(mockSupabase as never, mockUserId, 'meal');

      expect(result).toBe(0);
    });

    it('should return 0 when count is null', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({
                  count: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const result = await getTodayActivityCount(mockSupabase as never, mockUserId, 'water');

      expect(result).toBe(0);
    });

    it('should handle unexpected errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
      };

      const result = await getTodayActivityCount(mockSupabase as never, mockUserId, 'checkin');

      expect(result).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getLevelDefinitions
  // ---------------------------------------------------------------------------

  describe('getLevelDefinitions', () => {
    it('should return level definitions', async () => {
      const mockDefinitions = [
        { level: 1, name: 'Lv.1', threshold: 0 },
        { level: 2, name: 'Lv.2', threshold: 30 },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDefinitions,
              error: null,
            }),
          }),
        }),
      };

      const result = await getLevelDefinitions(mockSupabase as never);

      expect(result).toEqual(mockDefinitions);
    });

    it('should return null on error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Error' },
            }),
          }),
        }),
      };

      const result = await getLevelDefinitions(mockSupabase as never);

      expect(result).toBeNull();
    });

    it('should handle unexpected errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => {
          throw new Error('Unexpected error');
        }),
      };

      const result = await getLevelDefinitions(mockSupabase as never);

      expect(result).toBeNull();
    });
  });
});
