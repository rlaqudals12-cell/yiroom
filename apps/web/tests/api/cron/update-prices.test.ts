/**
 * 가격 업데이트 Cron API 테스트
 * GET /api/cron/update-prices
 *
 * @see app/api/cron/update-prices/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Crawler mock
vi.mock('@/lib/crawler', () => ({
  updateAllPrices: vi.fn(),
}));

import { GET } from '@/app/api/cron/update-prices/route';
import { updateAllPrices } from '@/lib/crawler';

// 헬퍼: NextRequest 생성
function createCronRequest(options?: {
  authHeader?: string;
  vercelSignature?: string;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (options?.authHeader) headers['Authorization'] = options.authHeader;
  if (options?.vercelSignature) headers['x-vercel-cron-signature'] = options.vercelSignature;

  return new NextRequest('http://localhost:3000/api/cron/update-prices', { headers });
}

// Mock 결과 데이터
const mockPriceResult = {
  cosmetic: { total: 100, success: 95, failed: 5 },
  supplement: { total: 80, success: 78, failed: 2 },
  workout_equipment: { total: 50, success: 50, failed: 0 },
  health_food: { total: 60, success: 55, failed: 5 },
};

describe('GET /api/cron/update-prices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('인증', () => {
    it('개발 환경에서 인증 없이 접근 가능하다', async () => {
      vi.mocked(updateAllPrices).mockResolvedValue(mockPriceResult);

      const request = createCronRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('프로덕션에서 인증 없이 401을 반환한다', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const request = createCronRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('CRON_SECRET으로 인증 가능하다', async () => {
      vi.stubEnv('CRON_SECRET', 'test-secret');
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(updateAllPrices).mockResolvedValue(mockPriceResult);

      const request = createCronRequest({ authHeader: 'Bearer test-secret' });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('Vercel cron signature로 인증 가능하다', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(updateAllPrices).mockResolvedValue(mockPriceResult);

      const request = createCronRequest({ vercelSignature: 'valid-sig' });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('가격 업데이트', () => {
    it('모든 카테고리의 가격 업데이트 결과를 반환한다', async () => {
      vi.mocked(updateAllPrices).mockResolvedValue(mockPriceResult);

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.summary.cosmetic.success).toBe(95);
      expect(json.summary.supplement.success).toBe(78);
      expect(json.totalSuccess).toBe(95 + 78 + 50 + 55);
      expect(json.totalFailed).toBe(5 + 2 + 0 + 5);
      expect(json.completedAt).toBeDefined();
    });

    it('updateAllPrices에 올바른 옵션을 전달한다', async () => {
      vi.mocked(updateAllPrices).mockResolvedValue(mockPriceResult);

      const request = createCronRequest();
      await GET(request);

      expect(updateAllPrices).toHaveBeenCalledWith({ limitPerType: 100 });
    });
  });

  describe('에러 처리', () => {
    it('updateAllPrices 실패 시 500을 반환한다', async () => {
      vi.mocked(updateAllPrices).mockRejectedValue(new Error('Crawler failed'));

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Cron job failed');
      expect(json.message).toBe('Crawler failed');
    });

    it('알 수 없는 에러도 500을 반환한다', async () => {
      vi.mocked(updateAllPrices).mockRejectedValue('unknown error');

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.message).toBe('Unknown error');
    });
  });
});
