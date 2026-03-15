import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted로 안전한 mock 변수 생성
const { mockFrom, mockFetchPrices, mockRecordPriceHistory } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockFetchPrices: vi.fn(),
  mockRecordPriceHistory: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({ from: mockFrom }),
}));

vi.mock('@/lib/utils/logger', () => ({
  crawlerLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/products', () => ({
  recordPriceHistory: (...args: unknown[]) => mockRecordPriceHistory(...args),
}));

vi.mock('./price-fetcher', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    fetchPrices: (...args: unknown[]) => mockFetchPrices(...args),
  };
});

import {
  updatePricesForType,
  updateAllPrices,
  updateSpecificProducts,
} from '@/lib/crawler/price-updater';

describe('updatePricesForType', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('제품이 없으면 빈 결과를 반환한다', async () => {
    // DB에서 빈 결과 반환
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    });

    const result = await updatePricesForType('cosmetic', { limit: 10 });

    expect(result.total).toBe(0);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.results).toEqual([]);
  });

  it('DB 조회 에러 시 빈 결과를 반환한다', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      }),
    });

    const result = await updatePricesForType('supplement', { limit: 5 });

    expect(result.total).toBe(0);
  });

  it('결과에 durationMs가 포함된다', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    });

    const result = await updatePricesForType('cosmetic');

    expect(result).toHaveProperty('durationMs');
    expect(result).toHaveProperty('startedAt');
    expect(result).toHaveProperty('completedAt');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('updateAllPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 모든 타입에서 빈 결과 반환
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    });
  });

  it('4개 제품 타입 모두 처리한다', async () => {
    const results = await updateAllPrices();

    expect(results).toHaveProperty('cosmetic');
    expect(results).toHaveProperty('supplement');
    expect(results).toHaveProperty('workout_equipment');
    expect(results).toHaveProperty('health_food');
  });

  it('limitPerType 옵션이 전달된다', async () => {
    await updateAllPrices({ limitPerType: 5 });

    // from이 4번 호출됨 (4개 타입)
    expect(mockFrom).toHaveBeenCalledTimes(4);
  });
});

describe('updateSpecificProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('빈 제품 목록이면 빈 결과를 반환한다', async () => {
    mockFetchPrices.mockResolvedValue([]);

    const result = await updateSpecificProducts([]);

    expect(result.total).toBe(0);
    expect(result.success).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('성공한 가격 업데이트를 카운트한다', async () => {
    const products = [
      { id: 'p1', type: 'cosmetic' as const, name: '제품1', brand: '브랜드A', currentPrice: 10000 },
      { id: 'p2', type: 'cosmetic' as const, name: '제품2', brand: '브랜드B', currentPrice: 20000 },
    ];

    mockFetchPrices.mockResolvedValue([
      {
        productId: 'p1',
        productType: 'cosmetic',
        price: 9000,
        source: 'naver_shopping',
        success: true,
      },
      {
        productId: 'p2',
        productType: 'cosmetic',
        price: 19000,
        source: 'naver_shopping',
        success: true,
      },
    ]);

    // DB 업데이트 성공 mock
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockRecordPriceHistory.mockResolvedValue(undefined);

    const result = await updateSpecificProducts(products);

    expect(result.total).toBe(2);
    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('실패한 가격 조회를 카운트한다', async () => {
    const products = [{ id: 'p1', type: 'supplement' as const, name: '제품1', brand: '브랜드A' }];

    mockFetchPrices.mockResolvedValue([
      {
        productId: 'p1',
        productType: 'supplement',
        price: 0,
        source: 'mock',
        success: false,
        error: 'Not found',
      },
    ]);

    // DB mock도 초기화 (이전 테스트의 mock이 남아있을 수 있음)
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'should not reach here' } }),
      }),
    });

    const result = await updateSpecificProducts(products);

    expect(result.total).toBe(1);
    // success: false인 결과는 DB 업데이트 시도하지 않으므로 failed 카운트
    expect(result.failed).toBe(1);
  });

  it('결과에 타이밍 정보가 포함된다', async () => {
    mockFetchPrices.mockResolvedValue([]);

    const result = await updateSpecificProducts([]);

    expect(result.startedAt).toBeInstanceOf(Date);
    expect(result.completedAt).toBeInstanceOf(Date);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
