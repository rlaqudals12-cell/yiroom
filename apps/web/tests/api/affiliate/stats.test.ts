/**
 * 어필리에이트 통계 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/affiliate/stats/route';
import { NextRequest } from 'next/server';

// Mock 모듈
vi.mock('@/lib/affiliate/stats', () => ({
  getDashboardSummary: vi.fn().mockResolvedValue({
    period: { start: '2025-01-01', end: '2025-01-07' },
    totalClicks: 1000,
    totalConversions: 25,
    totalSalesKrw: 1250000,
    totalCommissionKrw: 37500,
    conversionRate: 2.5,
    comparedToPrevious: { clicksChange: 12.5, commissionsChange: 8.3 },
  }),
  getPartnerRevenues: vi.fn().mockResolvedValue([
    { partnerId: 'coupang', partnerName: '쿠팡', clicks: 500, conversions: 12, salesKrw: 600000, commissionKrw: 18000, conversionRate: 2.4 },
    { partnerId: 'iherb', partnerName: 'iHerb', clicks: 300, conversions: 8, salesKrw: 400000, commissionKrw: 12000, conversionRate: 2.67 },
    { partnerId: 'musinsa', partnerName: '무신사', clicks: 200, conversions: 5, salesKrw: 250000, commissionKrw: 7500, conversionRate: 2.5 },
  ]),
  getDailyRevenueTrend: vi.fn().mockResolvedValue([
    { date: '2025-01-01', clicks: 150, conversions: 4, commissionKrw: 5000 },
    { date: '2025-01-02', clicks: 140, conversions: 3, commissionKrw: 4500 },
  ]),
  getTopProducts: vi.fn().mockResolvedValue([
    { productId: 'p1', productName: '제품1', partnerId: 'coupang', clicks: 50, conversions: 2, commissionKrw: 2000 },
  ]),
  getDateRange: vi.fn().mockReturnValue({ start: '2025-01-01', end: '2025-01-07' }),
}));

describe('GET /api/affiliate/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('전체 대시보드 데이터를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('summary');
    expect(data.data).toHaveProperty('partners');
    expect(data.data).toHaveProperty('trend');
    expect(data.data).toHaveProperty('topProducts');
  });

  it('summary 타입으로 요약만 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/stats?type=summary');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalClicks');
    expect(data.data).toHaveProperty('totalCommissionKrw');
  });

  it('partners 타입으로 파트너별 통계를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/stats?type=partners');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('trend 타입으로 일별 트렌드를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/stats?type=trend');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('products 타입으로 인기 제품을 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/stats?type=products&limit=5');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('period 파라미터로 기간을 설정한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/stats?period=month');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('startDate/endDate로 사용자 정의 기간을 설정한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/affiliate/stats?startDate=2025-01-01&endDate=2025-01-31'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('isMock 플래그를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/affiliate/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('isMock');
  });
});
