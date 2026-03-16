/**
 * 가격 알림 체크 Cron API 테스트
 * GET /api/cron/price-check
 *
 * @see app/api/cron/price-check/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Service Role 클라이언트 mock
const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => mockSupabase),
}));

import { GET } from '@/app/api/cron/price-check/route';

// 헬퍼: NextRequest 생성
function createCronRequest(options?: {
  authHeader?: string;
  vercelSignature?: string;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (options?.authHeader) headers['Authorization'] = options.authHeader;
  if (options?.vercelSignature) headers['x-vercel-cron-signature'] = options.vercelSignature;

  return new NextRequest('http://localhost:3000/api/cron/price-check', { headers });
}

// 체이닝 헬퍼: Supabase 쿼리 체인 mock 생성
function createChain(result: {
  data?: unknown;
  error?: unknown;
  count?: number;
}): Record<string, unknown> {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.lt = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);

  // 마지막 체인은 Promise를 반환해야 함
  // select가 마지막이면 then을 추가
  chain.then = vi.fn((resolve) => resolve(result));

  return chain;
}

describe('GET /api/cron/price-check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('인증', () => {
    it('CRON_SECRET 미제공 + 프로덕션 환경에서 401을 반환한다', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const request = createCronRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('올바른 CRON_SECRET으로 인증에 성공한다', async () => {
      vi.stubEnv('CRON_SECRET', 'test-secret');
      vi.stubEnv('NODE_ENV', 'production');

      // 만료 watch 정리 결과
      const deleteChain = createChain({ data: [] });
      // 활성 watch 조회 - 없음
      const watchChain = createChain({ data: [], error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'price_watches') {
          // 첫 호출: delete (만료 정리), 두 번째: select (활성 조회)
          const callCount = mockFrom.mock.calls.filter(
            (c: string[]) => c[0] === 'price_watches'
          ).length;
          return callCount <= 1 ? deleteChain : watchChain;
        }
        return createChain({ data: [] });
      });

      const request = createCronRequest({ authHeader: 'Bearer test-secret' });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('활성 watch 없음', () => {
    it('활성 watch가 없을 때 processed: 0을 반환한다', async () => {
      // 만료 정리: 삭제 0건
      const deleteChain = createChain({ data: [] });
      // 활성 watch: 0건
      const watchChain = createChain({ data: [], error: null });

      let priceWatchCallCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'price_watches') {
          priceWatchCallCount++;
          return priceWatchCallCount === 1 ? deleteChain : watchChain;
        }
        return createChain({ data: [] });
      });

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.processed).toBe(0);
      expect(json.notified).toBe(0);
    });
  });

  describe('가격 하락 감지', () => {
    it('target_price 조건 충족 시 알림을 생성한다', async () => {
      const mockWatches = [
        {
          id: 'watch-1',
          clerk_user_id: 'user-1',
          product_id: 'prod-1',
          target_price: 15000,
          percent_drop: null,
          current_lowest_price: 12000, // 목표가 15000 이하
          lowest_platform: 'coupang',
        },
      ];

      const mockProducts = [{ id: 'prod-1', name: '보습 크림', price: 20000 }];

      let priceWatchCallCount = 0;
      const notifInsertChain = createChain({ data: null, error: null });
      const markUpdateChain = createChain({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'price_watches') {
          priceWatchCallCount++;
          if (priceWatchCallCount === 1) {
            // 만료 정리
            return createChain({ data: [] });
          } else if (priceWatchCallCount === 2) {
            // 활성 watch 조회
            return createChain({ data: mockWatches, error: null });
          } else {
            // notified 마킹
            return markUpdateChain;
          }
        }
        if (table === 'products') {
          return createChain({ data: mockProducts, error: null });
        }
        if (table === 'smart_notifications') {
          return notifInsertChain;
        }
        return createChain({ data: [] });
      });

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.processed).toBe(1);
      expect(json.notified).toBe(1);

      // smart_notifications insert 호출 확인
      expect(notifInsertChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          clerk_user_id: 'user-1',
          notification_type: 'price_drop',
          product_id: 'prod-1',
        })
      );
    });

    it('percent_drop 조건 충족 시 알림을 생성한다', async () => {
      const mockWatches = [
        {
          id: 'watch-2',
          clerk_user_id: 'user-2',
          product_id: 'prod-2',
          target_price: null,
          percent_drop: 20, // 20% 이상 하락 시 알림
          current_lowest_price: 16000, // 20000 → 16000 = 20% 하락
          lowest_platform: 'olive-young',
        },
      ];

      const mockProducts = [{ id: 'prod-2', name: '선크림', price: 20000 }];

      let priceWatchCallCount = 0;
      const notifInsertChain = createChain({ data: null, error: null });
      const markUpdateChain = createChain({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'price_watches') {
          priceWatchCallCount++;
          if (priceWatchCallCount === 1) return createChain({ data: [] });
          if (priceWatchCallCount === 2) return createChain({ data: mockWatches, error: null });
          return markUpdateChain;
        }
        if (table === 'products') return createChain({ data: mockProducts, error: null });
        if (table === 'smart_notifications') return notifInsertChain;
        return createChain({ data: [] });
      });

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.notified).toBe(1);
    });
  });

  describe('조건 미충족', () => {
    it('가격 조건 미충족 시 알림을 생성하지 않는다', async () => {
      const mockWatches = [
        {
          id: 'watch-3',
          clerk_user_id: 'user-3',
          product_id: 'prod-3',
          target_price: 10000,
          percent_drop: null,
          current_lowest_price: 18000, // 목표가 10000보다 높음
          lowest_platform: 'coupang',
        },
      ];

      const mockProducts = [{ id: 'prod-3', name: '토너', price: 20000 }];

      let priceWatchCallCount = 0;
      const notifInsertChain = createChain({ data: null, error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'price_watches') {
          priceWatchCallCount++;
          if (priceWatchCallCount === 1) return createChain({ data: [] });
          return createChain({ data: mockWatches, error: null });
        }
        if (table === 'products') return createChain({ data: mockProducts, error: null });
        if (table === 'smart_notifications') return notifInsertChain;
        return createChain({ data: [] });
      });

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.processed).toBe(1);
      expect(json.notified).toBe(0);

      // 알림 insert가 호출되지 않아야 함
      expect(notifInsertChain.insert).not.toHaveBeenCalled();
    });
  });

  describe('만료 watch 정리', () => {
    it('만료된 watch를 삭제하고 개수를 반환한다', async () => {
      // 만료 정리: 3건 삭제
      const deleteChain = createChain({
        data: [{ id: 'exp-1' }, { id: 'exp-2' }, { id: 'exp-3' }],
      });
      // 활성 watch: 0건
      const watchChain = createChain({ data: [], error: null });

      let priceWatchCallCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'price_watches') {
          priceWatchCallCount++;
          return priceWatchCallCount === 1 ? deleteChain : watchChain;
        }
        return createChain({ data: [] });
      });

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.expired).toBe(3);
    });
  });

  describe('에러 처리', () => {
    it('watch 조회 실패 시 500을 반환한다', async () => {
      const deleteChain = createChain({ data: [] });
      const watchChain = createChain({
        data: null,
        error: { message: 'DB error' },
      });

      let priceWatchCallCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'price_watches') {
          priceWatchCallCount++;
          return priceWatchCallCount === 1 ? deleteChain : watchChain;
        }
        return createChain({ data: [] });
      });

      const request = createCronRequest();
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });
});
