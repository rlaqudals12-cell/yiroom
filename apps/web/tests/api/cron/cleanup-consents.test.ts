/**
 * cleanup-consents Cron API 테스트
 * GDPR/PIPA 준수를 위한 만료 동의 자동 정리
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/cron/cleanup-consents/route';

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

describe('GET /api/cron/cleanup-consents', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('인증', () => {
    it('개발 환경에서는 인증 없이 접근 가능하다', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-consents');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('프로덕션에서 인증 없이 401을 반환한다', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-consents');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('CRON_SECRET으로 인증 가능하다', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CRON_SECRET', 'test-secret');

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-consents', {
        headers: { Authorization: 'Bearer test-secret' },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('동의 정리', () => {
    it('만료된 동의가 없으면 성공 메시지를 반환한다', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-consents');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.processed).toBe(0);
    });

    it('만료된 동의를 처리한다', async () => {
      const expiredConsents = [
        {
          id: 'consent-1',
          clerk_user_id: 'user-123',
          analysis_type: 'skin',
          retention_until: '2025-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'image_consents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: expiredConsents, error: null }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      mockStorage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: [{ name: 'image1.jpg' }, { name: 'image2.jpg' }],
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-consents');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.processed).toBe(1);
      expect(json.deletedImages).toBe(2);
    });

    it('DB 조회 에러 시 500을 반환한다', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'DB Error' },
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-consents');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST 메서드', () => {
    it('POST도 GET과 동일하게 동작한다', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/cron/cleanup-consents', {
        method: 'POST',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});
