/**
 * 어필리에이트 클릭 트래킹 테스트
 * @description lib/affiliate/clicks.ts의 클릭 기록, 통계 조회, IP 해싱 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 터미널 결과를 저장하는 변수
let terminalResult: { data: unknown; error: unknown; count?: number | null } = {
  data: null,
  error: null,
};

// Supabase 체이너블 mock
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
  return chain;
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockChain,
}));

vi.mock('@/lib/utils/logger', () => ({
  affiliateLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import {
  createAffiliateClick,
  getUserClickHistory,
  getProductClickCount,
  updateClickConversion,
  getPartnerDailyStats,
  getAffiliateStatsSummary,
  getTopClickedProducts,
  hashIpAddress,
} from '@/lib/affiliate/clicks';

// ============================================================================
// 테스트 데이터
// ============================================================================

const mockClickRow = {
  id: 'click_001',
  product_id: 'prod_001',
  clerk_user_id: 'user_123',
  source_page: '/beauty',
  source_component: 'ProductCard',
  recommendation_type: 'skin_analysis',
  user_agent: 'Mozilla/5.0',
  ip_hash: 'abc123',
  session_id: 'sess_001',
  clicked_at: '2026-01-15T10:00:00Z',
  converted_at: null,
  conversion_value_krw: null,
  commission_krw: null,
};

const mockDailyStatsRow = {
  date: '2026-01-15',
  total_clicks: 100,
  unique_clicks: 80,
  conversions: 5,
  total_sales_krw: 500000,
  total_commission_krw: 25000,
  partner_id: 'partner_001',
};

// ============================================================================
// 테스트
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
  mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
});

describe('createAffiliateClick', () => {
  it('클릭 기록을 생성하고 결과를 반환한다', async () => {
    terminalResult = { data: mockClickRow, error: null };

    const result = await createAffiliateClick({
      productId: 'prod_001',
      clerkUserId: 'user_123',
      sourcePage: '/beauty',
      sourceComponent: 'ProductCard',
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe('click_001');
    expect(result!.productId).toBe('prod_001');
    expect(result!.clerkUserId).toBe('user_123');
    expect(result!.clickedAt).toBeInstanceOf(Date);
    expect(mockChain.from).toHaveBeenCalledWith('affiliate_clicks');
  });

  it('DB 에러 시 null을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'DB error' } };

    const result = await createAffiliateClick({
      productId: 'prod_001',
      sourcePage: '/beauty',
      sourceComponent: 'ProductCard',
    });

    expect(result).toBeNull();
  });

  it('null 필드를 올바르게 매핑한다', async () => {
    const rowWithNulls = {
      ...mockClickRow,
      clerk_user_id: null,
      user_agent: null,
      ip_hash: null,
      session_id: null,
      recommendation_type: null,
    };
    terminalResult = { data: rowWithNulls, error: null };

    const result = await createAffiliateClick({
      productId: 'prod_001',
      sourcePage: '/beauty',
      sourceComponent: 'ProductCard',
    });

    expect(result).not.toBeNull();
    expect(result!.clerkUserId).toBeUndefined();
    expect(result!.userAgent).toBeUndefined();
    expect(result!.ipHash).toBeUndefined();
  });
});

describe('getUserClickHistory', () => {
  it('사용자 클릭 히스토리를 반환한다', async () => {
    terminalResult = { data: [mockClickRow], error: null };

    const result = await getUserClickHistory('user_123');

    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('prod_001');
    expect(mockChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user_123');
    expect(mockChain.order).toHaveBeenCalledWith('clicked_at', { ascending: false });
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getUserClickHistory('user_123');

    expect(result).toEqual([]);
  });

  it('커스텀 limit을 적용한다', async () => {
    terminalResult = { data: [], error: null };

    await getUserClickHistory('user_123', 5);

    expect(mockChain.limit).toHaveBeenCalledWith(5);
  });

  it('converted_at이 있으면 Date로 변환한다', async () => {
    const convertedRow = {
      ...mockClickRow,
      converted_at: '2026-01-16T12:00:00Z',
      conversion_value_krw: 50000,
      commission_krw: 2500,
    };
    terminalResult = { data: [convertedRow], error: null };

    const result = await getUserClickHistory('user_123');

    expect(result[0].convertedAt).toBeInstanceOf(Date);
    expect(result[0].conversionValueKrw).toBe(50000);
    expect(result[0].commissionKrw).toBe(2500);
  });
});

describe('getProductClickCount', () => {
  it('제품 클릭 수를 반환한다', async () => {
    terminalResult = { data: null, error: null, count: 42 };

    const result = await getProductClickCount('prod_001');

    expect(result).toBe(42);
    expect(mockChain.eq).toHaveBeenCalledWith('product_id', 'prod_001');
  });

  it('DB 에러 시 0을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' }, count: null };

    const result = await getProductClickCount('prod_001');

    expect(result).toBe(0);
  });

  it('count가 null이면 0을 반환한다', async () => {
    terminalResult = { data: null, error: null, count: null };

    const result = await getProductClickCount('prod_001');

    expect(result).toBe(0);
  });
});

describe('updateClickConversion', () => {
  it('전환 업데이트 성공 시 true를 반환한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await updateClickConversion('click_001', 50000, 2500);

    expect(result).toBe(true);
    expect(mockChain.from).toHaveBeenCalledWith('affiliate_clicks');
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'click_001');
  });

  it('DB 에러 시 false를 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await updateClickConversion('click_001', 50000, 2500);

    expect(result).toBe(false);
  });
});

describe('getPartnerDailyStats', () => {
  it('파트너별 일별 통계를 반환한다', async () => {
    terminalResult = { data: [mockDailyStatsRow], error: null };

    const result = await getPartnerDailyStats('partner_001', '2026-01-01', '2026-01-31');

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-01-15');
    expect(result[0].totalClicks).toBe(100);
    expect(result[0].uniqueClicks).toBe(80);
    expect(result[0].conversions).toBe(5);
    expect(result[0].totalSalesKrw).toBe(500000);
    expect(result[0].totalCommissionKrw).toBe(25000);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getPartnerDailyStats('partner_001', '2026-01-01', '2026-01-31');

    expect(result).toEqual([]);
  });
});

describe('getAffiliateStatsSummary', () => {
  it('통계 요약을 올바르게 집계한다', async () => {
    terminalResult = {
      data: [
        { total_clicks: 100, conversions: 5, total_sales_krw: 500000, total_commission_krw: 25000 },
        {
          total_clicks: 200,
          conversions: 10,
          total_sales_krw: 800000,
          total_commission_krw: 40000,
        },
      ],
      error: null,
    };

    const result = await getAffiliateStatsSummary('2026-01-01', '2026-01-31');

    expect(result.totalClicks).toBe(300);
    expect(result.totalConversions).toBe(15);
    expect(result.totalSalesKrw).toBe(1300000);
    expect(result.totalCommissionKrw).toBe(65000);
    expect(result.conversionRate).toBe(5);
  });

  it('DB 에러 시 모든 값이 0인 객체를 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getAffiliateStatsSummary('2026-01-01', '2026-01-31');

    expect(result.totalClicks).toBe(0);
    expect(result.totalConversions).toBe(0);
    expect(result.conversionRate).toBe(0);
  });

  it('클릭이 0이면 전환율은 0이다', async () => {
    terminalResult = { data: [], error: null };

    const result = await getAffiliateStatsSummary('2026-01-01', '2026-01-31');

    expect(result.conversionRate).toBe(0);
  });
});

describe('getTopClickedProducts', () => {
  it('클릭 수 기준 상위 제품을 반환한다', async () => {
    terminalResult = {
      data: [
        { product_id: 'A' },
        { product_id: 'A' },
        { product_id: 'A' },
        { product_id: 'B' },
        { product_id: 'B' },
        { product_id: 'C' },
      ],
      error: null,
    };

    const result = await getTopClickedProducts(undefined, 10);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ productId: 'A', clicks: 3 });
    expect(result[1]).toEqual({ productId: 'B', clicks: 2 });
    expect(result[2]).toEqual({ productId: 'C', clicks: 1 });
  });

  it('limit에 따라 결과를 제한한다', async () => {
    terminalResult = {
      data: [{ product_id: 'A' }, { product_id: 'A' }, { product_id: 'B' }, { product_id: 'C' }],
      error: null,
    };

    const result = await getTopClickedProducts(undefined, 2);

    expect(result).toHaveLength(2);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getTopClickedProducts();

    expect(result).toEqual([]);
  });

  it('데이터가 비어있으면 빈 배열을 반환한다', async () => {
    terminalResult = { data: [], error: null };

    const result = await getTopClickedProducts();

    expect(result).toEqual([]);
  });
});

describe('hashIpAddress', () => {
  it('동일 IP에 대해 동일 해시를 반환한다', () => {
    const hash1 = hashIpAddress('192.168.1.1');
    const hash2 = hashIpAddress('192.168.1.1');

    expect(hash1).toBe(hash2);
  });

  it('다른 IP에 대해 다른 해시를 반환한다', () => {
    const hash1 = hashIpAddress('192.168.1.1');
    const hash2 = hashIpAddress('10.0.0.1');

    expect(hash1).not.toBe(hash2);
  });

  it('16진수 문자열을 반환한다', () => {
    const hash = hashIpAddress('127.0.0.1');

    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('빈 문자열에 대해 0을 반환한다', () => {
    const hash = hashIpAddress('');

    expect(hash).toBe('0');
  });
});
