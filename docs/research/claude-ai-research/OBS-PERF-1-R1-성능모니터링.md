# 성능 모니터링

> **ID**: OBS-PERFORMANCE
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/

---

## 1. 현재 구현 분석

### 현재 상태

```typescript
// 현재 구현
✅ Lighthouse 수동 체크
✅ 기본 console.time 측정

// 개선 필요 항목
❌ Web Vitals 실시간 추적
❌ Vercel Speed Insights 통합
❌ API 응답 시간 모니터링
❌ 성능 예산 설정
❌ 알림 시스템
```

---

## 2. Core Web Vitals

### 2.1 지표 정의

| 지표 | 설명 | 목표 | 경고 |
|------|------|------|------|
| **LCP** | Largest Contentful Paint | < 2.5s | > 4s |
| **FID** | First Input Delay | < 100ms | > 300ms |
| **CLS** | Cumulative Layout Shift | < 0.1 | > 0.25 |
| **INP** | Interaction to Next Paint | < 200ms | > 500ms |
| **TTFB** | Time to First Byte | < 800ms | > 1.8s |
| **FCP** | First Contentful Paint | < 1.8s | > 3s |

### 2.2 useReportWebVitals

```typescript
// app/layout.tsx
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // 콘솔 로깅 (개발)
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating);

    // Analytics로 전송
    sendToAnalytics(metric);
  });

  return null;
}

function sendToAnalytics(metric: NextWebVitalsMetric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Beacon API (페이지 이탈 시에도 전송)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body);
  } else {
    fetch('/api/vitals', { body, method: 'POST', keepalive: true });
  }
}
```

### 2.3 web-vitals 라이브러리

```typescript
// lib/analytics/web-vitals.ts
import { onCLS, onFID, onLCP, onTTFB, onINP, onFCP } from 'web-vitals';

export function initWebVitals() {
  // 모든 Core Web Vitals 추적
  onCLS(handleMetric);
  onFID(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
  onINP(handleMetric);
  onFCP(handleMetric);
}

function handleMetric(metric: Metric) {
  // 등급 판정
  const rating = getRating(metric.name, metric.value);

  // Sentry에 전송 (성능 문제 추적)
  if (rating === 'poor') {
    Sentry.captureMessage(`Poor ${metric.name}: ${metric.value}ms`, {
      level: 'warning',
      tags: { metric: metric.name, rating },
      extra: metric,
    });
  }

  // Vercel Analytics에 전송
  sendToVercel(metric);
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    INP: [200, 500],
    TTFB: [800, 1800],
    FCP: [1800, 3000],
  };

  const [good, poor] = thresholds[name] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}
```

---

## 3. Vercel Speed Insights

### 3.1 설치 및 설정

```bash
npm install @vercel/speed-insights
```

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 3.2 Vercel Analytics 통합

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 3.3 커스텀 이벤트

```typescript
// lib/analytics/track.ts
import { track } from '@vercel/analytics';

// 페이지별 성능 추적
export function trackPagePerformance(pageName: string, loadTime: number) {
  track('page_load', {
    page: pageName,
    loadTime,
    timestamp: Date.now(),
  });
}

// 분석 완료 시간 추적
export function trackAnalysisTime(analysisType: string, duration: number) {
  track('analysis_complete', {
    type: analysisType,
    duration,
    success: true,
  });
}
```

---

## 4. API 응답 시간 모니터링

### 4.1 미들웨어 측정

```typescript
// middleware.ts (proxy.ts)
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const start = Date.now();

  const response = NextResponse.next();

  // API 라우트만 측정
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const duration = Date.now() - start;

    // 헤더에 응답 시간 추가
    response.headers.set('X-Response-Time', `${duration}ms`);

    // 느린 API 경고
    if (duration > 3000) {
      console.warn(`[Slow API] ${request.nextUrl.pathname}: ${duration}ms`);
    }
  }

  return response;
}
```

### 4.2 API 라우트 측정

```typescript
// lib/api/with-timing.ts
import { NextRequest, NextResponse } from 'next/server';

export function withTiming<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const start = performance.now();

    try {
      const response = await handler(request);
      const duration = performance.now() - start;

      // 응답에 타이밍 추가
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);

      // 로깅
      console.log(
        `[API] ${request.method} ${request.nextUrl.pathname}: ${duration.toFixed(2)}ms`
      );

      return response;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(
        `[API Error] ${request.nextUrl.pathname}: ${duration.toFixed(2)}ms`,
        error
      );
      throw error;
    }
  };
}

// 사용
export const POST = withTiming(async (request: NextRequest) => {
  // ... 핸들러 로직
});
```

### 4.3 Supabase 쿼리 측정

```typescript
// lib/supabase/with-query-timing.ts
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    // 느린 쿼리 로깅
    if (duration > 100) {
      console.warn(`[Slow Query] ${queryName}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Query Error] ${queryName}: ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

// 사용
const analyses = await measureQuery('getSkinAnalyses', () =>
  supabase
    .from('skin_analyses')
    .select('*')
    .eq('clerk_user_id', userId)
    .limit(10)
);
```

---

## 5. 성능 예산

### 5.1 번들 크기 예산

```javascript
// next.config.js
module.exports = {
  experimental: {
    // 번들 크기 경고
    webpackBuildWorker: true,
  },
};

// package.json scripts
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "check-bundle": "npx bundlewatch"
  }
}
```

```json
// bundlewatch.config.json
{
  "files": [
    {
      "path": ".next/static/chunks/main-*.js",
      "maxSize": "100KB"
    },
    {
      "path": ".next/static/chunks/pages/**/*.js",
      "maxSize": "50KB"
    }
  ],
  "ci": {
    "trackBranches": ["main"]
  }
}
```

### 5.2 Lighthouse 예산

```json
// lighthouse-budget.json
[
  {
    "path": "/*",
    "timings": [
      { "metric": "first-contentful-paint", "budget": 1800 },
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 },
      { "metric": "total-blocking-time", "budget": 300 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "image", "budget": 200 },
      { "resourceType": "total", "budget": 700 }
    ]
  }
]
```

### 5.3 CI 통합

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            https://yiroom.app/
            https://yiroom.app/dashboard
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

---

## 6. 실시간 대시보드

### 6.1 Axiom 통합

```bash
npm install @axiomhq/nextjs
```

```typescript
// instrumentation.ts
import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({
    serviceName: 'yiroom-web',
  });
}
```

```typescript
// lib/logging/axiom.ts
import { AxiomWithoutBatching } from '@axiomhq/js';

const axiom = new AxiomWithoutBatching({
  token: process.env.AXIOM_TOKEN!,
  orgId: process.env.AXIOM_ORG_ID!,
});

export async function logPerformance(data: {
  name: string;
  duration: number;
  metadata?: Record<string, unknown>;
}) {
  await axiom.ingest('performance', [{
    ...data,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }]);
}
```

### 6.2 커스텀 대시보드 데이터

```typescript
// app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 메트릭 저장소 (실제로는 Redis/DB 사용)
const metrics = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  const { name, value } = await request.json();

  if (!metrics.has(name)) {
    metrics.set(name, []);
  }

  metrics.get(name)!.push(value);

  // 최근 100개만 유지
  if (metrics.get(name)!.length > 100) {
    metrics.get(name)!.shift();
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const summary: Record<string, { avg: number; p95: number; count: number }> = {};

  metrics.forEach((values, name) => {
    const sorted = [...values].sort((a, b) => a - b);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;

    summary[name] = { avg, p95, count: values.length };
  });

  return NextResponse.json(summary);
}
```

---

## 7. 알림 설정

### 7.1 성능 저하 알림

```typescript
// lib/monitoring/alerts.ts
interface PerformanceThreshold {
  metric: string;
  warning: number;
  critical: number;
}

const THRESHOLDS: PerformanceThreshold[] = [
  { metric: 'LCP', warning: 3000, critical: 4000 },
  { metric: 'API_RESPONSE', warning: 2000, critical: 5000 },
  { metric: 'ANALYSIS_TIME', warning: 8000, critical: 15000 },
];

export async function checkAndAlert(metric: string, value: number) {
  const threshold = THRESHOLDS.find(t => t.metric === metric);
  if (!threshold) return;

  if (value >= threshold.critical) {
    await sendAlert({
      level: 'critical',
      message: `${metric} 심각: ${value}ms (기준: ${threshold.critical}ms)`,
    });
  } else if (value >= threshold.warning) {
    await sendAlert({
      level: 'warning',
      message: `${metric} 경고: ${value}ms (기준: ${threshold.warning}ms)`,
    });
  }
}

async function sendAlert(alert: { level: string; message: string }) {
  // Slack Webhook
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    body: JSON.stringify({
      text: `[${alert.level.toUpperCase()}] ${alert.message}`,
    }),
  });
}
```

---

## 8. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] useReportWebVitals 설정
- [ ] Vercel Speed Insights 추가
- [ ] API 응답 시간 로깅

### 단기 적용 (P1)

- [ ] web-vitals 라이브러리 통합
- [ ] Lighthouse CI 설정
- [ ] 성능 예산 설정

### 장기 적용 (P2)

- [ ] Axiom 통합
- [ ] 커스텀 대시보드
- [ ] 자동 알림 시스템

---

## 9. 참고 자료

- [Next.js Analytics Guide](https://nextjs.org/docs/pages/guides/analytics)
- [Vercel Speed Insights](https://vercel.com/products/observability)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Axiom for Vercel](https://axiom.co/vercel)

---

**Version**: 1.0 | **Priority**: P0 Critical
