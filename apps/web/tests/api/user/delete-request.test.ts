/**
 * GDPR 삭제 요청 API 테스트
 * POST /api/user/delete-request - 삭제 예약
 * DELETE /api/user/delete-request - 삭제 취소
 * GET /api/user/delete-request - 상태 조회
 *
 * @see SDD-GDPR-DELETION-CRON.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GDPR_CONFIG } from '@/types/gdpr';

// Supabase mock
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}));

// Clerk mock
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

describe('GDPR Delete Request API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/user/delete-request', () => {
    it('인증되지 않은 사용자는 401을 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      const { POST } = await import('@/app/api/user/delete-request/route');

      const response = await POST();

      expect(response.status).toBe(401);
    });

    it('존재하지 않는 사용자는 404를 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const { POST } = await import('@/app/api/user/delete-request/route');

      const response = await POST();

      expect(response.status).toBe(404);
    });

    it('이미 삭제 요청 중이면 409를 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'uuid-1',
                clerk_user_id: 'user-123',
                deletion_requested_at: '2026-01-01T00:00:00Z',
                deletion_scheduled_at: '2026-01-31T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const { POST } = await import('@/app/api/user/delete-request/route');

      const response = await POST();
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.error).toBe('ALREADY_REQUESTED');
    });

    it('삭제 요청을 성공적으로 처리한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'uuid-1',
                    clerk_user_id: 'user-123',
                    deletion_requested_at: null,
                    deletion_scheduled_at: null,
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'deletion_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const { POST } = await import('@/app/api/user/delete-request/route');

      const response = await POST();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.gracePeriodDays).toBe(GDPR_CONFIG.GRACE_PERIOD_DAYS);
      expect(json.data.scheduledAt).toBeDefined();
    });
  });

  describe('DELETE /api/user/delete-request', () => {
    it('인증되지 않은 사용자는 401을 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      const { DELETE } = await import('@/app/api/user/delete-request/route');

      const response = await DELETE();

      expect(response.status).toBe(401);
    });

    it('삭제 요청이 없으면 400을 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'uuid-1',
                clerk_user_id: 'user-123',
                deletion_requested_at: null,
                deletion_scheduled_at: null,
                deleted_at: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const { DELETE } = await import('@/app/api/user/delete-request/route');

      const response = await DELETE();
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('NO_REQUEST');
    });

    it('이미 삭제된 사용자는 400을 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'uuid-1',
                clerk_user_id: 'user-123',
                deletion_requested_at: '2026-01-01T00:00:00Z',
                deletion_scheduled_at: '2026-01-31T00:00:00Z',
                deleted_at: '2026-01-31T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const { DELETE } = await import('@/app/api/user/delete-request/route');

      const response = await DELETE();
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('ALREADY_DELETED');
    });

    it('삭제 요청을 성공적으로 취소한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'uuid-1',
                    clerk_user_id: 'user-123',
                    deletion_requested_at: '2026-01-01T00:00:00Z',
                    deletion_scheduled_at: '2026-01-31T00:00:00Z',
                    deleted_at: null,
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'deletion_audit_log') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const { DELETE } = await import('@/app/api/user/delete-request/route');

      const response = await DELETE();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.message).toContain('취소');
    });
  });

  describe('GET /api/user/delete-request', () => {
    it('인증되지 않은 사용자는 401을 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      const { GET } = await import('@/app/api/user/delete-request/route');

      const response = await GET();

      expect(response.status).toBe(401);
    });

    it('삭제 요청이 없으면 active 상태를 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                deletion_requested_at: null,
                deletion_scheduled_at: null,
                deleted_at: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const { GET } = await import('@/app/api/user/delete-request/route');

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('active');
      expect(json.data.deletionRequested).toBe(false);
    });

    it('삭제 예정 상태를 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

      // 7일 후 삭제 예정
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 7);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                deletion_requested_at: new Date().toISOString(),
                deletion_scheduled_at: scheduledAt.toISOString(),
                deleted_at: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const { GET } = await import('@/app/api/user/delete-request/route');

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('pending_deletion');
      expect(json.data.deletionRequested).toBe(true);
      expect(json.data.daysRemaining).toBeGreaterThanOrEqual(6);
      expect(json.data.daysRemaining).toBeLessThanOrEqual(8);
      expect(json.data.canCancel).toBe(true);
    });

    it('삭제 완료 상태를 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                deletion_requested_at: '2026-01-01T00:00:00Z',
                deletion_scheduled_at: '2026-01-31T00:00:00Z',
                deleted_at: '2026-01-31T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const { GET } = await import('@/app/api/user/delete-request/route');

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('deleted');
      expect(json.data.deletionRequested).toBe(true);
    });
  });
});
