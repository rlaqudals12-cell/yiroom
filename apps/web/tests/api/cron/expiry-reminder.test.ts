/**
 * 유통기한 만료 리마인더 Cron 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          not: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        data: null,
        error: null,
      })),
      update: vi.fn(() => ({
        in: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
  })),
}));

// Mock Push
vi.mock('@/lib/push/server', () => ({
  isVapidConfigured: vi.fn(() => true),
  sendPushToSubscription: vi.fn(() => ({
    success: true,
    endpoint: 'test-endpoint',
  })),
}));

describe('Expiry Reminder Cron API', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('GET /api/cron/expiry-reminder', () => {
    it('인증 없이 호출 시 401 반환', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const { GET } = await import('@/app/api/cron/expiry-reminder/route');

      const request = new NextRequest('http://localhost/api/cron/expiry-reminder');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('CRON_SECRET으로 인증 성공', async () => {
      vi.stubEnv('CRON_SECRET', 'test-secret');

      const { GET } = await import('@/app/api/cron/expiry-reminder/route');

      const request = new NextRequest('http://localhost/api/cron/expiry-reminder', {
        headers: {
          Authorization: 'Bearer test-secret',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('개발 환경에서는 인증 없이 접근 가능', async () => {
      const { GET } = await import('@/app/api/cron/expiry-reminder/route');

      const request = new NextRequest('http://localhost/api/cron/expiry-reminder');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('VAPID 미설정 시 알림 스킵', async () => {
      const { isVapidConfigured } = await import('@/lib/push/server');
      vi.mocked(isVapidConfigured).mockReturnValue(false);

      const { GET } = await import('@/app/api/cron/expiry-reminder/route');

      const request = new NextRequest('http://localhost/api/cron/expiry-reminder');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.message).toBe('VAPID not configured');
    });

    it('만료 예정 재료가 없으면 빈 결과 반환', async () => {
      const { isVapidConfigured } = await import('@/lib/push/server');
      vi.mocked(isVapidConfigured).mockReturnValue(true);

      const { GET } = await import('@/app/api/cron/expiry-reminder/route');

      const request = new NextRequest('http://localhost/api/cron/expiry-reminder');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.totalUsers).toBe(0);
      expect(data.totalItems).toBe(0);
    });
  });

  describe('POST /api/cron/expiry-reminder', () => {
    it('POST 요청도 GET과 동일하게 동작', async () => {
      const { isVapidConfigured } = await import('@/lib/push/server');
      vi.mocked(isVapidConfigured).mockReturnValue(true);

      const { POST } = await import('@/app/api/cron/expiry-reminder/route');

      const request = new NextRequest('http://localhost/api/cron/expiry-reminder', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
