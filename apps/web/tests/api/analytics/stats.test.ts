/**
 * Analytics 통계 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/analytics/stats/route';
import { NextRequest } from 'next/server';

// Mock 모듈
vi.mock('@/lib/analytics', () => ({
  getDateRange: vi.fn().mockReturnValue({ start: '2025-01-01', end: '2025-01-07' }),
  getAnalyticsSummary: vi.fn().mockResolvedValue({
    period: { start: '2025-01-01', end: '2025-01-07' },
    totalPageViews: 15000,
    uniqueUsers: 2500,
    totalSessions: 4000,
    avgSessionDuration: 280,
    avgPagePerSession: 3.5,
    bounceRate: 35,
    comparedToPrevious: {
      pageViewsChange: 12.5,
      usersChange: 8.3,
      sessionsChange: 10.1,
    },
  }),
  getTopPages: vi.fn().mockResolvedValue([
    { path: '/dashboard', pageViews: 2000, uniqueUsers: 800, avgDuration: 120, bounceRate: 30 },
    { path: '/workout', pageViews: 1500, uniqueUsers: 600, avgDuration: 180, bounceRate: 25 },
  ]),
  getTopFeatures: vi.fn().mockResolvedValue([
    { featureId: 'analysis_pc', featureName: '퍼스널컬러 분석', usageCount: 1500, uniqueUsers: 600 },
    { featureId: 'workout_start', featureName: '운동 시작', usageCount: 1200, uniqueUsers: 500 },
  ]),
  getDeviceBreakdown: vi.fn().mockResolvedValue([
    { deviceType: 'mobile', sessions: 2400, percentage: 60 },
    { deviceType: 'desktop', sessions: 1200, percentage: 30 },
    { deviceType: 'tablet', sessions: 400, percentage: 10 },
  ]),
  getUserFlow: vi.fn().mockResolvedValue([
    { fromPage: '/', toPage: '/dashboard', count: 850, percentage: 42.5 },
    { fromPage: '/dashboard', toPage: '/workout', count: 280, percentage: 14.0 },
  ]),
  getDailyTrend: vi.fn().mockResolvedValue([
    { date: '2025-01-01', pageViews: 2000, uniqueUsers: 400, sessions: 600 },
    { date: '2025-01-02', pageViews: 2100, uniqueUsers: 420, sessions: 630 },
  ]),
  getAnalyticsDashboardData: vi.fn().mockResolvedValue({
    summary: {
      period: { start: '2025-01-01', end: '2025-01-07' },
      totalPageViews: 15000,
      uniqueUsers: 2500,
      totalSessions: 4000,
      avgSessionDuration: 280,
      avgPagePerSession: 3.5,
      bounceRate: 35,
      comparedToPrevious: {
        pageViewsChange: 12.5,
        usersChange: 8.3,
        sessionsChange: 10.1,
      },
    },
    topPages: [],
    topFeatures: [],
    deviceBreakdown: [],
    dailyTrend: [],
  }),
}));

describe('GET /api/analytics/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('전체 대시보드 데이터를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('summary');
    expect(data.data).toHaveProperty('topPages');
    expect(data.data).toHaveProperty('topFeatures');
    expect(data.data).toHaveProperty('deviceBreakdown');
    expect(data.data).toHaveProperty('dailyTrend');
  });

  it('summary 타입으로 요약만 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats?type=summary');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalPageViews');
    expect(data.data).toHaveProperty('uniqueUsers');
    expect(data.data).toHaveProperty('bounceRate');
  });

  it('pages 타입으로 인기 페이지를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats?type=pages');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('features 타입으로 인기 기능을 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats?type=features');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('devices 타입으로 디바이스 분포를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats?type=devices');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('flow 타입으로 사용자 흐름을 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats?type=flow');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('trend 타입으로 일별 트렌드를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats?type=trend');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('period 파라미터로 기간을 설정한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats?period=month');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('startDate/endDate로 사용자 정의 기간을 설정한다', async () => {
    const request = new NextRequest(
      'http://localhost/api/analytics/stats?startDate=2025-01-01&endDate=2025-01-31'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('limit 파라미터를 전달한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats?type=pages&limit=5');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('isMock 플래그를 반환한다', async () => {
    const request = new NextRequest('http://localhost/api/analytics/stats');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('isMock');
  });
});
