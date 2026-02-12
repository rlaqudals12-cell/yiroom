/**
 * 챌린지 만료 처리 Cron API 테스트
 * GET /api/cron/challenges
 *
 * @see app/api/cron/challenges/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Supabase mock
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

// Challenges mock
const mockProcessExpired = vi.fn();
vi.mock('@/lib/challenges', () => ({
  processExpiredChallenges: (...args: unknown[]) => mockProcessExpired(...args),
}));

// 헬퍼: NextRequest 생성
function createCronRequest(options?: {
  authHeader?: string;
  cronSecretHeader?: string;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (options?.authHeader) headers['authorization'] = options.authHeader;
  if (options?.cronSecretHeader) headers['x-cron-secret'] = options.cronSecretHeader;

  return new NextRequest('http://localhost:3000/api/cron/challenges', { headers });
}

describe('GET /api/cron/challenges', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('인증', () => {
    it('CRON_SECRET 미설정 시 인증 없이 접근 가능하다', async () => {
      mockProcessExpired.mockResolvedValue(0);

      const { GET } = await import('@/app/api/cron/challenges/route');
      const request = createCronRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('CRON_SECRET 설정 시 Bearer 토큰으로 인증한다', async () => {
      vi.stubEnv('CRON_SECRET', 'test-secret');
      mockProcessExpired.mockResolvedValue(3);

      const { GET } = await import('@/app/api/cron/challenges/route');
      const request = createCronRequest({ authHeader: 'Bearer test-secret' });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('CRON_SECRET 설정 시 x-cron-secret 헤더로도 인증한다', async () => {
      vi.stubEnv('CRON_SECRET', 'test-secret');
      mockProcessExpired.mockResolvedValue(0);

      const { GET } = await import('@/app/api/cron/challenges/route');
      const request = createCronRequest({ cronSecretHeader: 'test-secret' });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('CRON_SECRET 설정 시 잘못된 토큰은 401을 반환한다', async () => {
      vi.stubEnv('CRON_SECRET', 'test-secret');

      const { GET } = await import('@/app/api/cron/challenges/route');
      const request = createCronRequest({ authHeader: 'Bearer wrong-secret' });
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('챌린지 만료 처리', () => {
    it('만료된 챌린지 개수를 반환한다', async () => {
      mockProcessExpired.mockResolvedValue(5);

      const { GET } = await import('@/app/api/cron/challenges/route');
      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.processed.expired).toBe(5);
      expect(json.timestamp).toBeDefined();
    });

    it('만료된 챌린지가 없으면 0을 반환한다', async () => {
      mockProcessExpired.mockResolvedValue(0);

      const { GET } = await import('@/app/api/cron/challenges/route');
      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.processed.expired).toBe(0);
    });
  });

  describe('에러 처리', () => {
    it('processExpiredChallenges 실패 시 500을 반환한다', async () => {
      mockProcessExpired.mockRejectedValue(new Error('DB Error'));

      const { GET } = await import('@/app/api/cron/challenges/route');
      const request = createCronRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal server error');
    });
  });
});
