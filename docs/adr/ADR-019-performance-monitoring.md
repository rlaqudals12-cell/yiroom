# ADR-019: 성능 모니터링 전략

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

이룸의 성능 모니터링이 **체계적으로 구축되지 않았습니다**:

1. **프론트엔드**: Lighthouse 점수 측정 없음, Core Web Vitals 추적 부재
2. **백엔드**: API 응답 시간 측정 없음, 병목 지점 파악 어려움
3. **AI 분석**: Gemini API 응답 시간 변동 추적 부재
4. **알림 부재**: 성능 저하 시 자동 알림 없음

## P1: 궁극의 형태 (Ultimate Form)

> 원리 참조: [00-first-principles.md](../../.claude/rules/00-first-principles.md) P1

### 이상적 최종 상태

**제약이 없다면**:
- 모든 사용자 인터랙션의 실시간 성능 추적 (100% 샘플링)
- AI 기반 성능 이상 탐지 및 자동 최적화
- 인프라부터 UX까지 End-to-End 가시성
- 성능 회귀 자동 차단 (CI/CD 통합)
- 예측적 스케일링으로 성능 저하 사전 방지
- 글로벌 CDN 기반 지역별 성능 최적화

### 물리적 한계

| 제약 | 현실 | 완화 |
|------|------|------|
| 샘플링 비용 | 100% 추적 시 비용 급증 | 10% 샘플링 + 이상 시 증가 |
| 서버리스 제약 | Vercel Edge 제한 | 클라이언트 RUM 활용 |
| 로그 저장 비용 | 대용량 메트릭 비용 | 집계 후 상세 삭제 |
| AI 모니터링 | 지속적 AI 분석 비용 | 임계값 기반 알림 |

### 100점 기준

| 항목 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 샘플링률 | 100% | 10% |
| 알림 지연 | < 10초 | < 5분 |
| 지표 종류 | 50개+ | 6개 (LCP, FID, CLS, API p95, AI 응답, 에러율) |
| 자동 대응 | AI 기반 자동 최적화 | 수동 대응 |
| 회귀 차단 | CI/CD 자동 차단 | 수동 확인 |
| 지역별 분석 | 20개 국가별 | 글로벌 집계만 |

### 현재 목표

**Phase 1: 40%** (기본 3계층 모니터링)
- Layer 1: Vercel Analytics + Web Vitals (RUM)
- Layer 2: Sentry Performance (APM)
- Layer 3: Custom Metrics (AI 응답)
- 수동 알림 → Slack/Email

### 의도적 제외

| 제외 항목 | 사유 | 재검토 시점 |
|----------|------|------------|
| 100% 샘플링 | 비용 대비 효과 낮음 | MAU 100,000+ |
| AI 이상 탐지 | 데이터 축적 필요 | 6개월 데이터 후 |
| CI/CD 성능 게이트 | 테스트 환경 구축 필요 | Beta 이후 |
| 지역별 분석 | 글로벌 확장 전 불필요 | 글로벌 확장 시 |
| APM 고급 기능 | Sentry Pro 비용 | 수익화 후 |

---

## 결정 (Decision)

**3계층 성능 모니터링** 아키텍처 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                 Performance Monitoring                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Real User Monitoring (RUM)                         │
│  ├── 도구: Vercel Analytics + Web Vitals                    │
│  ├── 지표: LCP, FID, CLS, TTFB                              │
│  └── 목표: LCP < 2.5s, CLS < 0.1                            │
│                                                              │
│  Layer 2: Application Performance (APM)                      │
│  ├── 도구: Sentry Performance                               │
│  ├── 지표: API 응답 시간, 에러율, 트랜잭션                  │
│  └── 목표: p95 < 500ms                                      │
│                                                              │
│  Layer 3: AI/External Service Monitoring                     │
│  ├── 도구: Custom Metrics + Logging                         │
│  ├── 지표: Gemini 응답 시간, 재시도율, Fallback 빈도        │
│  └── 목표: AI 응답 < 3s, Fallback < 5%                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 성능 목표 (SLA)

| 지표 | 목표 | 경고 임계값 | 심각 임계값 |
|------|------|-----------|-----------|
| **LCP** | < 2.5s | > 3s | > 4s |
| **FID** | < 100ms | > 150ms | > 300ms |
| **CLS** | < 0.1 | > 0.15 | > 0.25 |
| **API p95** | < 500ms | > 800ms | > 1500ms |
| **AI 분석** | < 3s | > 5s | > 10s |
| **에러율** | < 0.1% | > 0.5% | > 1% |

### 알림 규칙

| 조건 | 채널 | 액션 |
|------|------|------|
| LCP > 4s (5분 지속) | Slack #alerts | 번들 분석 |
| API p95 > 1.5s | Slack #alerts | DB 쿼리 검토 |
| AI Fallback > 10% | Email | Gemini 상태 확인 |
| 에러율 > 1% | PagerDuty | 즉시 대응 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| DataDog | 종합 모니터링 | 비용 높음 | `FINANCIAL_HOLD` |
| New Relic | APM 전문 | 복잡한 설정 | `HIGH_COMPLEXITY` |
| 자체 구축 | 커스터마이징 | 개발 비용 | `LOW_ROI` |

## 결과 (Consequences)

### 긍정적 결과

- **선제적 대응**: 성능 저하 조기 감지
- **데이터 기반**: 최적화 우선순위 결정
- **사용자 경험**: Core Web Vitals 개선

### 부정적 결과

- **비용 증가**: Sentry Pro 플랜 필요
- **오버헤드**: 모니터링 코드 추가

## 구현 가이드

### Web Vitals 수집

```typescript
// lib/analytics/web-vitals.ts
import { onCLS, onFID, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS((metric) => sendToAnalytics(metric));
  onFID((metric) => sendToAnalytics(metric));
  onLCP((metric) => sendToAnalytics(metric));
  onTTFB((metric) => sendToAnalytics(metric));
}

function sendToAnalytics(metric: Metric) {
  // Vercel Analytics로 전송
  if (window.va) {
    window.va('event', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  }

  // Sentry로 전송
  Sentry.setMeasurement(metric.name, metric.value, 'millisecond');
}
```

### API 성능 미들웨어

```typescript
// lib/api/performance-middleware.ts
export function withPerformanceTracking(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const start = performance.now();

    try {
      await handler(req, res);
    } finally {
      const duration = performance.now() - start;

      // 메트릭 기록
      apiMetrics.record({
        path: req.url,
        method: req.method,
        status: res.statusCode,
        duration,
      });

      // 느린 응답 경고
      if (duration > 1000) {
        logger.warn(`Slow API response: ${req.url} took ${duration}ms`);
      }
    }
  };
}
```

### AI 성능 추적

```typescript
// lib/gemini/metrics.ts
export const aiMetrics = {
  responseTime: new Histogram({
    name: 'gemini_response_time',
    help: 'Gemini API response time in seconds',
    buckets: [0.5, 1, 2, 3, 5, 10],
  }),

  fallbackRate: new Counter({
    name: 'gemini_fallback_total',
    help: 'Number of Gemini fallbacks to mock',
  }),

  record: (duration: number, usedFallback: boolean) => {
    aiMetrics.responseTime.observe(duration);
    if (usedFallback) {
      aiMetrics.fallbackRate.inc();
    }
  },
};
```

### Sentry 설정

```typescript
// lib/sentry.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% 샘플링
  profilesSampleRate: 0.1,

  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'yiroom.app'],
    }),
  ],

  beforeSendTransaction: (transaction) => {
    // 성능 임계값 초과 시 알림
    if (transaction.measurements?.lcp?.value > 4000) {
      sendSlackAlert('LCP exceeded 4s', transaction);
    }
    return transaction;
  },
});
```

## 리서치 티켓

```
[ADR-019-R1] 성능 모니터링 심화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. Web Vitals Attribution API를 활용한 LCP 원인 분석 자동화
2. 실시간 메트릭 스트리밍 vs 배치 수집의 비용-정확도 trade-off
3. 성능 회귀 자동 탐지 알고리즘 (통계적 이상 탐지)

→ 결과를 Claude Code에서 lib/analytics/ 성능 모니터링 개선에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: AI 추론](../principles/ai-inference.md) - AI 응답 시간 모니터링, SLA 정의
- [원리: 보안 패턴](../principles/security-patterns.md) - 모니터링 보안

### 관련 ADR/스펙
- [ADR-013: Error Handling](./ADR-013-error-handling.md)
- [ADR-015: Testing Strategy](./ADR-015-testing-strategy.md)

---

**Author**: Claude Code
**Reviewed by**: -
