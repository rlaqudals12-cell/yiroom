/**
 * 가격 비교 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/smart-matching/price-compare/route';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

vi.mock('@/lib/smart-matching', () => ({
  comparePrices: vi.fn(),
  analyzePriceTrend: vi.fn(),
}));

import { comparePrices, analyzePriceTrend } from '@/lib/smart-matching';

describe('POST /api/smart-matching/price-compare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('제품 가격 비교를 반환한다', async () => {
    vi.mocked(comparePrices).mockResolvedValue({
      productId: 'product-1',
      options: [
        {
          platform: 'coupang',
          originalPrice: 50000,
          salePrice: 45000,
          discountPercent: 10,
          deliveryType: 'rocket',
          deliveryDays: 1,
          deliveryFee: 0,
          points: 450,
          inStock: true,
          affiliateUrl: 'https://example.com',
          commissionRate: 3.0,
          lastUpdated: new Date(),
          reliability: 'cached',
        },
      ],
      bestPrice: {
        platform: 'coupang',
        originalPrice: 50000,
        salePrice: 45000,
        discountPercent: 10,
        deliveryType: 'rocket',
        deliveryDays: 1,
        deliveryFee: 0,
        points: 450,
        inStock: true,
        affiliateUrl: 'https://example.com',
        commissionRate: 3.0,
        lastUpdated: new Date(),
        reliability: 'cached',
      },
      lastUpdated: new Date(),
    });

    const request = new NextRequest('http://localhost/api/smart-matching/price-compare', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.comparison.options).toHaveLength(1);
    expect(data.comparison.bestPrice.platform).toBe('coupang');
  });

  it('가격 트렌드 분석을 반환한다', async () => {
    vi.mocked(analyzePriceTrend).mockResolvedValue({
      trend: 'falling',
      changePercent: -8.5,
      lowestEver: {
        price: 42000,
        date: new Date(),
        platform: 'naver',
      },
      suggestion: '가격이 하락 중이에요.',
    });

    const request = new NextRequest('http://localhost/api/smart-matching/price-compare', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
        action: 'analyzeTrend',
        days: 30,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.trend.trend).toBe('falling');
    expect(data.trend.changePercent).toBe(-8.5);
  });

  it('productId 없이 요청하면 400 에러를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/smart-matching/price-compare', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('특정 플랫폼만 비교할 수 있다', async () => {
    vi.mocked(comparePrices).mockResolvedValue({
      productId: 'product-1',
      options: [],
      lastUpdated: new Date(),
    });

    const request = new NextRequest('http://localhost/api/smart-matching/price-compare', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
        platforms: ['coupang', 'naver'],
      }),
    });

    await POST(request);

    expect(comparePrices).toHaveBeenCalledWith('product-1', {
      platforms: ['coupang', 'naver'],
      includeHistory: undefined,
    });
  });
});
