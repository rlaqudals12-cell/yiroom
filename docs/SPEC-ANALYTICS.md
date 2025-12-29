# SPEC-ANALYTICS: 사용자 행동 분석 시스템

> 사용자가 어떤 기능을 많이 사용하고, 어디서 오래 머무는지 분석하는 시스템

## 1. 개요

### 1.1 목적
- 사용자 행동 패턴 파악
- 인기 기능 및 페이지 식별
- 이탈 지점 분석
- 서비스 개선 인사이트 도출

### 1.2 범위
- 페이지 조회 트래킹
- 기능 사용 트래킹
- 체류 시간 측정
- 전환 퍼널 분석

## 2. 이벤트 유형

### 2.1 자동 수집 이벤트

| 이벤트 | 설명 | 데이터 |
|--------|------|--------|
| `page_view` | 페이지 조회 | path, referrer, duration |
| `session_start` | 세션 시작 | device, browser, os |
| `session_end` | 세션 종료 | duration, page_count |

### 2.2 사용자 행동 이벤트

| 이벤트 | 설명 | 데이터 |
|--------|------|--------|
| `feature_use` | 기능 사용 | feature_id, feature_name |
| `analysis_complete` | 분석 완료 | analysis_type (pc, skin, body) |
| `workout_start` | 운동 시작 | workout_plan_id |
| `workout_complete` | 운동 완료 | workout_plan_id, duration |
| `meal_record` | 식단 기록 | meal_type, calories |
| `product_view` | 제품 조회 | product_id, category |
| `product_click` | 제품 클릭 (어필리에이트) | product_id, partner_id |
| `search` | 검색 | query, results_count |
| `button_click` | 버튼 클릭 | button_id, context |

### 2.3 전환 이벤트

| 이벤트 | 설명 | 데이터 |
|--------|------|--------|
| `signup_complete` | 회원가입 완료 | method |
| `onboarding_complete` | 온보딩 완료 | steps_completed |
| `first_analysis` | 첫 분석 완료 | analysis_type |
| `affiliate_conversion` | 어필리에이트 전환 | product_id, revenue |

## 3. 데이터 구조

### 3.1 Supabase 테이블

```sql
-- 분석 이벤트 테이블
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT,  -- 비로그인 시 NULL
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_path TEXT,
  referrer TEXT,
  device_type TEXT,  -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 세션 테이블
CREATE TABLE analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  clerk_user_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  entry_page TEXT,
  exit_page TEXT,
  country TEXT
);

-- 일별 집계 테이블 (성능 최적화)
CREATE TABLE analytics_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,  -- page_views, unique_users, feature_usage, etc.
  metric_name TEXT NOT NULL,  -- 페이지 경로 또는 기능 이름
  value INTEGER DEFAULT 0,
  unique_users INTEGER DEFAULT 0,
  avg_duration_seconds NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, metric_type, metric_name)
);

-- 인덱스
CREATE INDEX idx_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_sessions_started_at ON analytics_sessions(started_at);
CREATE INDEX idx_daily_stats_date ON analytics_daily_stats(date);
```

### 3.2 TypeScript 타입

```typescript
// types/analytics.ts

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

export interface AnalyticsEvent {
  id: string;
  clerkUserId?: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  eventName: string;
  eventData: Record<string, unknown>;
  pagePath?: string;
  referrer?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  country?: string;
  createdAt: Date;
}

export interface AnalyticsSession {
  id: string;
  sessionId: string;
  clerkUserId?: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  pageViews: number;
  eventsCount: number;
  deviceType?: string;
  browser?: string;
  os?: string;
  entryPage?: string;
  exitPage?: string;
  country?: string;
}

export interface DailyStats {
  date: string;
  metricType: string;
  metricName: string;
  value: number;
  uniqueUsers: number;
  avgDurationSeconds?: number;
}

// 대시보드용 집계 타입
export interface AnalyticsSummary {
  period: { start: string; end: string };
  totalPageViews: number;
  uniqueUsers: number;
  totalSessions: number;
  avgSessionDuration: number;  // seconds
  avgPagePerSession: number;
  bounceRate: number;  // %
  comparedToPrevious: {
    pageViewsChange: number;
    usersChange: number;
    sessionsChange: number;
  };
}

export interface TopPage {
  path: string;
  pageViews: number;
  uniqueUsers: number;
  avgDuration: number;
  bounceRate: number;
}

export interface TopFeature {
  featureId: string;
  featureName: string;
  usageCount: number;
  uniqueUsers: number;
}

export interface UserFlow {
  fromPage: string;
  toPage: string;
  count: number;
  percentage: number;
}

export interface DeviceBreakdown {
  deviceType: string;
  sessions: number;
  percentage: number;
}
```

## 4. API 엔드포인트

### 4.1 이벤트 수집 API

```
POST /api/analytics/events
```

**Request Body:**
```json
{
  "eventType": "page_view",
  "eventName": "Dashboard View",
  "eventData": {
    "duration": 45
  },
  "pagePath": "/dashboard",
  "sessionId": "sess_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "evt_xyz789"
}
```

### 4.2 대시보드 통계 API

```
GET /api/analytics/stats?period=week&type=summary
```

**Query Parameters:**
- `period`: today, week, month, quarter (기본: week)
- `type`: summary, pages, features, devices, flow (기본: summary)
- `startDate`, `endDate`: 사용자 정의 기간

**Response (type=summary):**
```json
{
  "success": true,
  "data": {
    "period": { "start": "2025-01-01", "end": "2025-01-07" },
    "totalPageViews": 15420,
    "uniqueUsers": 2850,
    "totalSessions": 4200,
    "avgSessionDuration": 285,
    "avgPagePerSession": 3.7,
    "bounceRate": 35.2,
    "comparedToPrevious": {
      "pageViewsChange": 12.5,
      "usersChange": 8.3,
      "sessionsChange": 10.1
    }
  }
}
```

### 4.3 실시간 통계 API

```
GET /api/analytics/realtime
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": 42,
    "pageViewsLast5Min": 156,
    "topPagesNow": [
      { "path": "/dashboard", "users": 15 },
      { "path": "/analysis/skin", "users": 8 }
    ]
  }
}
```

## 5. lib/analytics 구조

```
lib/analytics/
├── index.ts           # 통합 export
├── tracker.ts         # 이벤트 트래킹 함수
├── session.ts         # 세션 관리
├── stats.ts           # 통계 조회/집계
├── aggregator.ts      # 일별 집계 (cron용)
└── mock.ts            # Mock 데이터
```

### 5.1 주요 함수

```typescript
// tracker.ts
export function trackEvent(event: TrackEventInput): Promise<void>;
export function trackPageView(path: string, duration?: number): Promise<void>;
export function trackFeatureUse(featureId: string, featureName: string): Promise<void>;

// session.ts
export function getOrCreateSession(): string;
export function endSession(): Promise<void>;
export function getSessionId(): string | null;

// stats.ts
export function getAnalyticsSummary(start: string, end: string): Promise<AnalyticsSummary>;
export function getTopPages(limit: number, start: string, end: string): Promise<TopPage[]>;
export function getTopFeatures(limit: number, start: string, end: string): Promise<TopFeature[]>;
export function getDeviceBreakdown(start: string, end: string): Promise<DeviceBreakdown[]>;
export function getUserFlow(start: string, end: string): Promise<UserFlow[]>;
export function getDateRange(period: string): { start: string; end: string };
```

## 6. 대시보드 UI 구성

### 6.1 페이지 구조

```
/admin/analytics/
├── page.tsx              # 메인 대시보드
└── _components/
    ├── AnalyticsSummaryCard.tsx    # 요약 카드 (4개 메트릭)
    ├── PageViewsChart.tsx          # 페이지뷰 트렌드 차트
    ├── TopPagesTable.tsx           # 인기 페이지 TOP 10
    ├── TopFeaturesTable.tsx        # 인기 기능 TOP 10
    ├── DevicePieChart.tsx          # 디바이스 분포
    ├── UserFlowSankey.tsx          # 사용자 흐름 (선택적)
    └── RealtimeWidget.tsx          # 실시간 활성 사용자
```

### 6.2 UI 와이어프레임

```
┌─────────────────────────────────────────────────────────────┐
│  사용자 행동 분석                    [기간 선택 ▼] [새로고침] │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ 페이지뷰  │ │ 사용자   │ │ 세션     │ │ 이탈률   │        │
│ │ 15,420   │ │ 2,850    │ │ 4,200    │ │ 35.2%   │        │
│ │ +12.5%   │ │ +8.3%    │ │ +10.1%   │ │ -2.1%   │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌─────────────────────────┐ │
│ │     페이지뷰 트렌드 차트      │ │    디바이스 분포        │ │
│ │     (일별 라인 차트)          │ │    (파이 차트)          │ │
│ └─────────────────────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌─────────────────────────┐ │
│ │     인기 페이지 TOP 10       │ │    인기 기능 TOP 10      │ │
│ │     (테이블)                 │ │    (테이블)              │ │
│ └─────────────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 7. 구현 계획

### Phase 1: 기본 인프라 (1일)
- [ ] types/analytics.ts 타입 정의
- [ ] lib/analytics/tracker.ts 이벤트 트래킹
- [ ] lib/analytics/session.ts 세션 관리
- [ ] lib/analytics/mock.ts Mock 데이터

### Phase 2: API (0.5일)
- [ ] POST /api/analytics/events
- [ ] GET /api/analytics/stats

### Phase 3: 테스트 (0.5일)
- [ ] lib/analytics 테스트
- [ ] API 테스트

### Phase 4: 대시보드 UI (1일)
- [ ] /admin/analytics 페이지
- [ ] 대시보드 컴포넌트 5종

### Phase 5: 통합 (0.5일)
- [ ] 주요 페이지에 트래킹 코드 삽입
- [ ] 클라이언트 훅 (useAnalytics)

## 8. 고려사항

### 8.1 개인정보 보호
- 비로그인 사용자: 세션 ID만 저장, 개인 식별 불가
- 로그인 사용자: clerk_user_id로 연결 (옵트아웃 가능)
- IP 주소 미저장 (country만 저장)

### 8.2 성능 최적화
- 이벤트는 배치로 전송 (5초 또는 10개 단위)
- 대시보드는 일별 집계 테이블 사용
- 실시간 통계는 최근 5분 데이터만

### 8.3 확장성
- 이벤트 타입 추가 용이한 구조
- 커스텀 대시보드 위젯 추가 가능
- A/B 테스트 시스템과 연동 가능

---

**Version**: 1.0
**Created**: 2025-12-29
**Status**: Draft
