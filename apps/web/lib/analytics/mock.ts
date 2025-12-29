/**
 * Analytics Mock 데이터
 * @description 개발/테스트용 Mock 데이터 생성
 */

import type {
  AnalyticsSummary,
  TopPage,
  TopFeature,
  DeviceBreakdown,
  UserFlow,
  RealtimeStats,
} from '@/types/analytics';

// 페이지 목록 (Mock용)
const PAGES = [
  { path: '/dashboard', name: '대시보드' },
  { path: '/analysis/personal-color', name: '퍼스널컬러 분석' },
  { path: '/analysis/skin', name: '피부 분석' },
  { path: '/analysis/body', name: '체형 분석' },
  { path: '/workout', name: '운동' },
  { path: '/nutrition', name: '영양' },
  { path: '/products', name: '제품 추천' },
  { path: '/feed', name: '소셜 피드' },
  { path: '/leaderboard', name: '리더보드' },
  { path: '/profile', name: '프로필' },
];

// 기능 목록 (Mock용)
const FEATURES = [
  { id: 'analysis_pc', name: '퍼스널컬러 분석' },
  { id: 'analysis_skin', name: '피부 분석' },
  { id: 'analysis_body', name: '체형 분석' },
  { id: 'workout_start', name: '운동 시작' },
  { id: 'meal_record', name: '식단 기록' },
  { id: 'product_search', name: '제품 검색' },
  { id: 'water_record', name: '수분 섭취 기록' },
  { id: 'social_share', name: '소셜 공유' },
  { id: 'friend_add', name: '친구 추가' },
  { id: 'challenge_join', name: '챌린지 참여' },
];

/**
 * Mock 대시보드 요약 생성
 */
export function generateMockSummary(startDate: string, endDate: string): AnalyticsSummary {
  const basePageViews = 15000 + Math.floor(Math.random() * 5000);
  const baseUsers = 2500 + Math.floor(Math.random() * 1000);
  const baseSessions = 4000 + Math.floor(Math.random() * 1000);

  return {
    period: { start: startDate, end: endDate },
    totalPageViews: basePageViews,
    uniqueUsers: baseUsers,
    totalSessions: baseSessions,
    avgSessionDuration: 240 + Math.floor(Math.random() * 120), // 4-6분
    avgPagePerSession: 3 + Math.random() * 2, // 3-5 페이지
    bounceRate: 30 + Math.random() * 15, // 30-45%
    comparedToPrevious: {
      pageViewsChange: (Math.random() - 0.3) * 30, // -9% ~ +21%
      usersChange: (Math.random() - 0.3) * 25, // -7.5% ~ +17.5%
      sessionsChange: (Math.random() - 0.3) * 20, // -6% ~ +14%
    },
  };
}

/**
 * Mock 인기 페이지 생성
 */
export function generateMockTopPages(limit: number): TopPage[] {
  return PAGES.slice(0, limit).map((page, index) => ({
    path: page.path,
    pageViews: Math.floor(2000 / (index + 1) + Math.random() * 500),
    uniqueUsers: Math.floor(800 / (index + 1) + Math.random() * 200),
    avgDuration: Math.floor(60 + Math.random() * 180), // 1-4분
    bounceRate: 20 + Math.random() * 30, // 20-50%
  }));
}

/**
 * Mock 인기 기능 생성
 */
export function generateMockTopFeatures(limit: number): TopFeature[] {
  return FEATURES.slice(0, limit).map((feature, index) => ({
    featureId: feature.id,
    featureName: feature.name,
    usageCount: Math.floor(1500 / (index + 1) + Math.random() * 300),
    uniqueUsers: Math.floor(600 / (index + 1) + Math.random() * 150),
  }));
}

/**
 * Mock 디바이스 분포 생성
 */
export function generateMockDeviceBreakdown(): DeviceBreakdown[] {
  const mobile = 55 + Math.floor(Math.random() * 10); // 55-65%
  const desktop = 25 + Math.floor(Math.random() * 10); // 25-35%
  const tablet = 100 - mobile - desktop;

  return [
    { deviceType: 'mobile', sessions: mobile * 42, percentage: mobile },
    { deviceType: 'desktop', sessions: desktop * 42, percentage: desktop },
    { deviceType: 'tablet', sessions: tablet * 42, percentage: tablet },
  ];
}

/**
 * Mock 사용자 흐름 생성
 */
export function generateMockUserFlow(): UserFlow[] {
  return [
    { fromPage: '/', toPage: '/dashboard', count: 850, percentage: 42.5 },
    { fromPage: '/dashboard', toPage: '/analysis/personal-color', count: 320, percentage: 16.0 },
    { fromPage: '/dashboard', toPage: '/workout', count: 280, percentage: 14.0 },
    { fromPage: '/dashboard', toPage: '/nutrition', count: 250, percentage: 12.5 },
    { fromPage: '/analysis/personal-color', toPage: '/products', count: 180, percentage: 9.0 },
    { fromPage: '/workout', toPage: '/nutrition', count: 150, percentage: 7.5 },
    { fromPage: '/nutrition', toPage: '/feed', count: 120, percentage: 6.0 },
    { fromPage: '/products', toPage: '/profile', count: 100, percentage: 5.0 },
  ];
}

/**
 * Mock 실시간 통계 생성
 */
export function generateMockRealtimeStats(): RealtimeStats {
  return {
    activeUsers: 30 + Math.floor(Math.random() * 30),
    pageViewsLast5Min: 100 + Math.floor(Math.random() * 100),
    topPagesNow: [
      { path: '/dashboard', users: 12 + Math.floor(Math.random() * 8) },
      { path: '/analysis/skin', users: 6 + Math.floor(Math.random() * 6) },
      { path: '/workout', users: 4 + Math.floor(Math.random() * 4) },
      { path: '/nutrition', users: 3 + Math.floor(Math.random() * 3) },
      { path: '/feed', users: 2 + Math.floor(Math.random() * 2) },
    ],
  };
}

/**
 * Mock 일별 페이지뷰 트렌드 생성
 */
export function generateMockDailyTrend(
  startDate: string,
  endDate: string
): Array<{ date: string; pageViews: number; uniqueUsers: number; sessions: number }> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: Array<{ date: string; pageViews: number; uniqueUsers: number; sessions: number }> =
    [];

  const current = new Date(start);
  while (current <= end) {
    // 주말은 트래픽 감소
    const dayOfWeek = current.getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1;

    days.push({
      date: current.toISOString().split('T')[0],
      pageViews: Math.floor((1800 + Math.random() * 600) * weekendFactor),
      uniqueUsers: Math.floor((350 + Math.random() * 100) * weekendFactor),
      sessions: Math.floor((550 + Math.random() * 150) * weekendFactor),
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}
