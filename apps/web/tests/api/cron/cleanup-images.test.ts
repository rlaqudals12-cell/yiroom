/**
 * 이미지 자동 정리 Cron API 테스트
 * GET /api/cron/cleanup-images
 *
 * @see app/api/cron/cleanup-images/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Supabase mock
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();
const mockStorage = { from: mockStorageFrom };

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
    storage: mockStorage,
  }),
}));

// Logger mock
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Redact PII mock
vi.mock('@/lib/utils/redact-pii', () => ({
  redactPii: {
    userId: (id: string) => `***${id.slice(-4)}`,
  },
}));

describe('GET /api/cron/cleanup-images', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('NODE_ENV', 'development');

    // 기본 storage mock
    mockStorageFrom.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('인증', () => {
    it('개발 환경에서 인증 없이 접근 가능하다', async () => {
      const { GET } = await import('@/app/api/cron/cleanup-images/route');

      setupEmptyUsersMock();

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-images');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('프로덕션에서 인증 없이 401을 반환한다', async () => {
      const { GET } = await import('@/app/api/cron/cleanup-images/route');

      vi.stubEnv('NODE_ENV', 'production');

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-images');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('프로덕션에서 유효한 CRON_SECRET으로 접근 가능하다', async () => {
      const { GET } = await import('@/app/api/cron/cleanup-images/route');

      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CRON_SECRET', 'test-secret');

      setupEmptyUsersMock();

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-images', {
        headers: { Authorization: 'Bearer test-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('미접속 사용자 처리', () => {
    it('미접속 사용자가 없으면 processed: 0을 반환한다', async () => {
      const { GET } = await import('@/app/api/cron/cleanup-images/route');

      setupEmptyUsersMock();

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-images');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.inactiveUsers.processed).toBe(0);
    });

    it('30일 미접속 사용자의 이미지를 익명화한다', async () => {
      const { GET } = await import('@/app/api/cron/cleanup-images/route');

      const inactiveUser = {
        clerk_user_id: 'user-inactive-1',
        last_sign_in_at: '2025-01-01T00:00:00Z',
        email: 'inactive@test.com',
      };

      setupUsersMock({
        inactive: [inactiveUser],
        deleted: [],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-images');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.inactiveUsers.processed).toBe(1);
    });
  });

  describe('탈퇴 사용자 처리', () => {
    it('탈퇴 사용자가 없으면 processed: 0을 반환한다', async () => {
      const { GET } = await import('@/app/api/cron/cleanup-images/route');

      setupEmptyUsersMock();

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-images');
      const response = await GET(request);
      const json = await response.json();

      expect(json.deletedUsers.processed).toBe(0);
    });

    it('72시간 경과 탈퇴 사용자의 데이터를 완전 삭제한다', async () => {
      const { GET } = await import('@/app/api/cron/cleanup-images/route');

      const deletedUser = {
        clerk_user_id: 'user-deleted-1',
        email: 'deleted@test.com',
        deleted_at: '2025-01-01T00:00:00Z',
      };

      setupUsersMock({
        inactive: [],
        deleted: [deletedUser],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-images');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.deletedUsers.processed).toBe(1);
    });
  });

  describe('복합 처리', () => {
    it('미접속 + 탈퇴 사용자를 동시에 처리한다', async () => {
      const { GET } = await import('@/app/api/cron/cleanup-images/route');

      setupUsersMock({
        inactive: [
          {
            clerk_user_id: 'user-inactive',
            last_sign_in_at: '2025-01-01T00:00:00Z',
            email: 'a@test.com',
          },
        ],
        deleted: [
          {
            clerk_user_id: 'user-deleted',
            email: 'b@test.com',
            deleted_at: '2025-01-01T00:00:00Z',
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-images');
      const response = await GET(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.inactiveUsers.processed).toBe(1);
      expect(json.deletedUsers.processed).toBe(1);
    });
  });

  describe('에러 처리', () => {
    it('사용자 조회 실패 시에도 200을 반환한다 (부분 성공)', async () => {
      const { GET } = await import('@/app/api/cron/cleanup-images/route');

      // inactive 쿼리 실패, deleted 쿼리 성공
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          callCount++;
          if (callCount === 1) {
            // inactive users 쿼리 — 실패
            return {
              select: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: null,
                      error: { message: 'DB Error' },
                    }),
                  }),
                }),
              }),
            };
          }
          // deleted users 쿼리 — 성공 (빈 결과)
          return {
            select: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'audit_logs') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        return {
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-images');
      const response = await GET(request);

      // 부분 실패여도 200 (에러는 결과에 포함)
      expect(response.status).toBe(200);
    });
  });
});

// 헬퍼: 빈 사용자 조회 mock
function setupEmptyUsersMock(): void {
  setupUsersMock({ inactive: [], deleted: [] });
}

// 헬퍼: 사용자 조회 mock
function setupUsersMock(config: {
  inactive: Array<{ clerk_user_id: string; last_sign_in_at: string; email: string }>;
  deleted: Array<{ clerk_user_id: string; email: string; deleted_at: string }>;
}): void {
  let userQueryCount = 0;

  mockFrom.mockImplementation((table: string) => {
    if (table === 'users') {
      userQueryCount++;
      if (userQueryCount === 1) {
        // processInactiveUsers 쿼리
        return {
          select: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: config.inactive,
                  error: null,
                }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      // processDeletedUsers 쿼리
      return {
        select: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: config.deleted,
                  error: null,
                }),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    if (table === 'audit_logs') {
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    }
    // 기타 테이블 (분석 데이터, 개인 데이터)
    return {
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    };
  });
}
