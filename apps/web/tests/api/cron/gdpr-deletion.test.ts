/**
 * GDPR 삭제 Cron API 테스트
 * G-7: deletion-reminder, soft-delete-users, hard-delete-users 테스트
 *
 * @see SDD-GDPR-DELETION-CRON.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Supabase mock
const mockFrom = vi.fn();
const mockStorage = {
  from: vi.fn().mockReturnValue({
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
    remove: vi.fn().mockResolvedValue({ error: null }),
  }),
};

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
    storage: mockStorage,
  }),
}));

// Clerk mock
vi.mock('@clerk/nextjs/server', () => ({
  clerkClient: () => Promise.resolve({
    users: {
      updateUser: vi.fn().mockResolvedValue({}),
      deleteUser: vi.fn().mockResolvedValue({}),
    },
  }),
}));

// Push mock
vi.mock('@/lib/push/server', () => ({
  sendPushToSubscriptions: vi.fn().mockResolvedValue(undefined),
}));

// Redact PII mock
vi.mock('@/lib/utils/redact-pii', () => ({
  redactPii: {
    userId: (id: string) => `***${id.slice(-4)}`,
  },
}));

describe('GDPR Deletion Cron APIs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('GET /api/cron/deletion-reminder', () => {
    it('개발 환경에서 인증 없이 접근 가능하다', async () => {
      // 동적 import 사용
      const { GET } = await import('@/app/api/cron/deletion-reminder/route');

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest('http://localhost:3000/api/cron/deletion-reminder');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('프로덕션에서 인증 없이 401을 반환한다', async () => {
      const { GET } = await import('@/app/api/cron/deletion-reminder/route');

      vi.stubEnv('NODE_ENV', 'production');

      const request = new NextRequest('http://localhost:3000/api/cron/deletion-reminder');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('알림 대상자가 없으면 성공 메시지를 반환한다', async () => {
      const { GET } = await import('@/app/api/cron/deletion-reminder/route');

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest('http://localhost:3000/api/cron/deletion-reminder');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.sent['7d']).toBe(0);
      expect(json.sent['3d']).toBe(0);
      expect(json.sent['1d']).toBe(0);
    });
  });

  describe('GET /api/cron/soft-delete-users', () => {
    it('개발 환경에서 인증 없이 접근 가능하다', async () => {
      const { GET } = await import('@/app/api/cron/soft-delete-users/route');

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              lt: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
              count: vi.fn().mockResolvedValue({ count: 0 }),
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest('http://localhost:3000/api/cron/soft-delete-users');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('프로덕션에서 인증 없이 401을 반환한다', async () => {
      const { GET } = await import('@/app/api/cron/soft-delete-users/route');

      vi.stubEnv('NODE_ENV', 'production');

      const request = new NextRequest('http://localhost:3000/api/cron/soft-delete-users');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('삭제 대상자가 없으면 성공 메시지를 반환한다', async () => {
      const { GET } = await import('@/app/api/cron/soft-delete-users/route');

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              lt: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest('http://localhost:3000/api/cron/soft-delete-users');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.processed).toBe(0);
    });

    it('사용자 soft delete를 처리한다', async () => {
      const { GET } = await import('@/app/api/cron/soft-delete-users/route');

      const usersToDelete = [
        {
          id: 'uuid-1',
          clerk_user_id: 'user-123',
          email: 'test@example.com',
          deletion_scheduled_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              lt: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: usersToDelete, error: null }),
                  }),
                }),
              }),
              count: vi.fn().mockResolvedValue({ count: 0 }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'deletion_audit_log' || table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        // 다른 테이블은 삭제 mock
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/cron/soft-delete-users');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.processed).toBe(1);
    });
  });

  describe('GET /api/cron/hard-delete-users', () => {
    it('개발 환경에서 인증 없이 접근 가능하다', async () => {
      const { GET } = await import('@/app/api/cron/hard-delete-users/route');

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              lt: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
              count: vi.fn().mockResolvedValue({ count: 0 }),
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest('http://localhost:3000/api/cron/hard-delete-users');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('프로덕션에서 인증 없이 401을 반환한다', async () => {
      const { GET } = await import('@/app/api/cron/hard-delete-users/route');

      vi.stubEnv('NODE_ENV', 'production');

      const request = new NextRequest('http://localhost:3000/api/cron/hard-delete-users');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('삭제 대상자가 없으면 성공 메시지를 반환한다', async () => {
      const { GET } = await import('@/app/api/cron/hard-delete-users/route');

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              lt: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = new NextRequest('http://localhost:3000/api/cron/hard-delete-users');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.processed).toBe(0);
    });

    it('사용자 hard delete를 처리한다', async () => {
      const { GET } = await import('@/app/api/cron/hard-delete-users/route');

      const usersToDelete = [
        {
          id: 'uuid-1',
          clerk_user_id: 'user-123',
          deleted_at: '2025-01-01T00:00:00Z', // 5일 이상 전
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              lt: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: usersToDelete, error: null }),
                }),
              }),
              count: vi.fn().mockResolvedValue({ count: 0 }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'deletion_audit_log' || table === 'audit_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        // 모든 다른 테이블은 삭제 mock
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/cron/hard-delete-users');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.processed).toBe(1);
    });
  });
});
