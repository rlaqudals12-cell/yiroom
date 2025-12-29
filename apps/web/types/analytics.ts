/**
 * 사용자 행동 분석 타입 정의
 * @see docs/SPEC-ANALYTICS.md
 */

// 이벤트 타입
export type AnalyticsEventType =
  | 'page_view'
  | 'session_start'
  | 'session_end'
  | 'feature_use'
  | 'analysis_complete'
  | 'workout_start'
  | 'workout_complete'
  | 'meal_record'
  | 'product_view'
  | 'product_click'
  | 'search'
  | 'button_click'
  | 'signup_complete'
  | 'onboarding_complete'
  | 'first_analysis'
  | 'affiliate_conversion';

// 디바이스 타입
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 분석 이벤트
export interface AnalyticsEvent {
  id: string;
  clerkUserId?: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  eventName: string;
  eventData: Record<string, unknown>;
  pagePath?: string;
  referrer?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  country?: string;
  createdAt: Date;
}

// 이벤트 생성 입력
export interface AnalyticsEventInput {
  eventType: AnalyticsEventType;
  eventName: string;
  eventData?: Record<string, unknown>;
  pagePath?: string;
}

// 세션
export interface AnalyticsSession {
  id: string;
  sessionId: string;
  clerkUserId?: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  pageViews: number;
  eventsCount: number;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  entryPage?: string;
  exitPage?: string;
  country?: string;
}

// 일별 통계
export interface DailyStats {
  date: string;
  metricType: string;
  metricName: string;
  value: number;
  uniqueUsers: number;
  avgDurationSeconds?: number;
}

// 대시보드 요약
export interface AnalyticsSummary {
  period: { start: string; end: string };
  totalPageViews: number;
  uniqueUsers: number;
  totalSessions: number;
  avgSessionDuration: number; // seconds
  avgPagePerSession: number;
  bounceRate: number; // %
  comparedToPrevious: {
    pageViewsChange: number;
    usersChange: number;
    sessionsChange: number;
  };
}

// 인기 페이지
export interface TopPage {
  path: string;
  pageViews: number;
  uniqueUsers: number;
  avgDuration: number;
  bounceRate: number;
}

// 인기 기능
export interface TopFeature {
  featureId: string;
  featureName: string;
  usageCount: number;
  uniqueUsers: number;
}

// 사용자 흐름
export interface UserFlow {
  fromPage: string;
  toPage: string;
  count: number;
  percentage: number;
}

// 디바이스 분포
export interface DeviceBreakdown {
  deviceType: DeviceType;
  sessions: number;
  percentage: number;
}

// 실시간 통계
export interface RealtimeStats {
  activeUsers: number;
  pageViewsLast5Min: number;
  topPagesNow: Array<{
    path: string;
    users: number;
  }>;
}

// 기간 타입
export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'quarter';

// API 응답 타입
export type AnalyticsStatsType = 'summary' | 'pages' | 'features' | 'devices' | 'flow';
