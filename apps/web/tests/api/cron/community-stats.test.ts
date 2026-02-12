/**
 * 커뮤니티 통계 Cron API 테스트
 * POST /api/cron/community-stats
 *
 * @see app/api/cron/community-stats/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Supabase mock
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}));

import { POST, GET } from '@/app/api/cron/community-stats/route';

// 헬퍼: Request 생성
function createCronRequest(options?: { authHeader?: string }): Request {
  const headers: Record<string, string> = {};
  if (options?.authHeader) headers['authorization'] = options.authHeader;

  return new Request('http://localhost:3000/api/cron/community-stats', {
    method: 'POST',
    headers,
  });
}

// Supabase 체이닝 mock 헬퍼
function mockSelectCount(count: number) {
  return {
    select: vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        lt: vi.fn().mockResolvedValue({ count, error: null }),
      }),
    }),
  };
}

function mockSelectWithData(data: Array<{ clerk_user_id: string }>) {
  return {
    select: vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        lt: vi.fn().mockResolvedValue({ data, error: null }),
      }),
    }),
  };
}

function mockSelectCountWithEq(count: number) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ count, error: null }),
        }),
      }),
    }),
  };
}

describe('POST /api/cron/community-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('인증', () => {
    it('CRON_SECRET 미설정 시 인증 없이 접근 가능하다', async () => {
      setupSuccessfulMock();

      const request = createCronRequest();
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('CRON_SECRET 설정 시 잘못된 토큰은 401을 반환한다', async () => {
      vi.stubEnv('CRON_SECRET', 'test-secret');

      const request = createCronRequest({ authHeader: 'Bearer wrong' });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('CRON_SECRET으로 정상 인증한다', async () => {
      vi.stubEnv('CRON_SECRET', 'test-secret');
      setupSuccessfulMock();

      const request = createCronRequest({ authHeader: 'Bearer test-secret' });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('통계 집계', () => {
    it('일일 커뮤니티 통계를 정상 반환한다', async () => {
      setupSuccessfulMock();

      const request = createCronRequest();
      const response = await POST(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.date).toBeDefined();
      expect(json.stats.mealRecords).toBe(15);
      expect(json.stats.waterRecords).toBe(30);
      expect(json.stats.workoutRecords).toBe(8);
      expect(json.stats.checkins).toBe(12);
      expect(json.stats.activeUsers).toBe(2);
    });

    it('GET 요청도 동일하게 처리한다', async () => {
      setupSuccessfulMock();

      const request = new Request('http://localhost:3000/api/cron/community-stats');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('에러 처리', () => {
    it('upsert 실패 시 500을 반환한다', async () => {
      setupMockWithUpsertError();

      const request = createCronRequest();
      const response = await POST(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Failed to update stats');
    });

    it('예상치 못한 에러 시 500을 반환한다', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected DB error');
      });

      const request = createCronRequest();
      const response = await POST(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal server error');
    });
  });
});

// 헬퍼: 정상 Supabase mock 설정
function setupSuccessfulMock(): void {
  let callCount = 0;

  mockFrom.mockImplementation((table: string) => {
    if (table === 'meal_records') {
      return mockSelectCount(15);
    }
    if (table === 'water_records') {
      return mockSelectCount(30);
    }
    if (table === 'workout_logs') {
      return mockSelectCount(8);
    }
    if (table === 'activity_logs') {
      callCount++;
      if (callCount <= 1) {
        // checkin count
        return mockSelectCountWithEq(12);
      }
      // active users
      return mockSelectWithData([
        { clerk_user_id: 'user-1' },
        { clerk_user_id: 'user-2' },
        { clerk_user_id: 'user-1' }, // 중복
      ]);
    }
    if (table === 'daily_community_stats') {
      return {
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return {};
  });
}

// 헬퍼: upsert 실패 mock 설정
function setupMockWithUpsertError(): void {
  let callCount = 0;

  mockFrom.mockImplementation((table: string) => {
    if (table === 'meal_records') return mockSelectCount(0);
    if (table === 'water_records') return mockSelectCount(0);
    if (table === 'workout_logs') return mockSelectCount(0);
    if (table === 'activity_logs') {
      callCount++;
      if (callCount <= 1) return mockSelectCountWithEq(0);
      return mockSelectWithData([]);
    }
    if (table === 'daily_community_stats') {
      return {
        upsert: vi.fn().mockResolvedValue({
          error: { message: 'Upsert failed' },
        }),
      };
    }
    return {};
  });
}
