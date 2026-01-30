# QA-5-R1: 모니터링

> Sentry 기반 에러 모니터링 및 성능 추적 가이드
> **작성일**: 2026-01-16 | **버전**: 1.0

---

## 1. 핵심 요약

- **Sentry SDK 10.x** 기반 Next.js 16 통합으로 클라이언트/서버/엣지 환경 모니터링
- **에러 그룹화**는 fingerprint 커스터마이징으로 중복 이슈 최소화
- **PII 필터링**은 `beforeSend` 훅과 `redact-pii.ts` 유틸리티로 이중 보호
- **성능 모니터링**은 트레이싱 샘플링 10%로 운영, 핵심 트랜잭션 우선 추적
- **Slack 알림**은 이슈 볼륨/심각도 기반 라우팅으로 알림 피로도 최소화

---

## 2. 상세 내용

### 2.1 Sentry 설정 (Next.js 16 통합)

#### 현재 프로젝트 구성

```
apps/web/
├── sentry.client.config.ts   # 클라이언트 (브라우저)
├── sentry.server.config.ts   # 서버 (Node.js 런타임)
├── sentry.edge.config.ts     # 엣지 (Vercel Edge Runtime)
├── next.config.ts            # withSentryConfig 래핑
└── app/error.tsx             # 글로벌 에러 바운더리
```

#### SDK 버전

```json
"@sentry/nextjs": "^10.29.0"
```

#### 환경변수

```bash
# 필수
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# 소스맵 업로드 (CI에서만)
SENTRY_ORG=your-org
SENTRY_PROJECT=yiroom-web
SENTRY_AUTH_TOKEN=sntrys_xxx

# 버전 추적
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### Next.js 설정 통합

```typescript
// next.config.ts
import { withSentryConfig } from '@sentry/nextjs';

const sentryConfig = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 소스맵 설정
  widenClientFileUpload: true,
  hideSourceMaps: true,        // 프로덕션에서 숨김

  // Turbopack 호환
  tunnelRoute: '/monitoring',  // ad-blocker 우회

  // Vercel 자동 모니터링
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryConfig);
```

### 2.2 에러 그룹화 및 우선순위

#### 기본 그룹화 전략

Sentry는 기본적으로 스택 트레이스 기반 그룹화를 수행하지만, 이룸 프로젝트에서는 커스텀 fingerprint를 사용하여 의미 있는 그룹화를 수행합니다.

```typescript
// sentry.client.config.ts
Sentry.init({
  beforeSend(event, hint) {
    const error = hint.originalException;

    // AI 분석 에러 그룹화
    if (error instanceof AITimeoutError) {
      event.fingerprint = ['ai-timeout', error.analysisType];
    }

    // API 에러 그룹화 (상태코드 + 엔드포인트)
    if (error instanceof APIError) {
      event.fingerprint = ['api-error', error.statusCode.toString(), error.endpoint];
    }

    // 네트워크 에러 그룹화
    if (error?.message?.includes('fetch failed')) {
      event.fingerprint = ['network-error', '{{ default }}'];
    }

    return event;
  },
});
```

#### 이슈 우선순위 설정

| 레벨 | 기준 | 알림 |
|------|------|------|
| **P0 (Critical)** | 500 에러 10회/분, 인증 실패 급증 | 즉시 Slack + SMS |
| **P1 (High)** | AI 분석 실패 50%+, DB 연결 실패 | 즉시 Slack |
| **P2 (Medium)** | 개별 API 에러, 느린 트랜잭션 | 1시간 다이제스트 |
| **P3 (Low)** | 클라이언트 JS 에러, 경고 | 일일 리포트 |

#### 태그 전략

```typescript
// API 라우트에서 컨텍스트 추가
Sentry.setTag('module', 'PC-1');           // 모듈 식별
Sentry.setTag('analysisType', 'skin');     // 분석 유형
Sentry.setTag('apiVersion', 'v2');         // API 버전
Sentry.setUser({ id: userId });            // 사용자 (익명화)
```

### 2.3 사용자 피드백 수집

#### Sentry User Feedback Widget

```typescript
// components/FeedbackButton.tsx
'use client';

import * as Sentry from '@sentry/nextjs';

export function FeedbackButton() {
  const handleFeedback = () => {
    Sentry.showReportDialog({
      eventId: Sentry.lastEventId(),
      title: '오류가 발생했습니다',
      subtitle: '무엇이 잘못되었는지 알려주세요.',
      subtitle2: '오류 상황을 설명해 주시면 빠르게 해결하겠습니다.',
      labelName: '이름 (선택)',
      labelEmail: '이메일 (선택)',
      labelComments: '무슨 일이 있었나요?',
      labelClose: '닫기',
      labelSubmit: '제출',
      successMessage: '피드백을 보내주셔서 감사합니다.',
      lang: 'ko',
    });
  };

  return (
    <button onClick={handleFeedback}>
      문제 신고하기
    </button>
  );
}
```

#### 에러 페이지 통합

```typescript
// app/error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h1>문제가 발생했어요</h1>
      <p>오류 코드: {error.digest}</p>

      <Button onClick={reset}>다시 시도</Button>

      {/* 피드백 폼 표시 */}
      <Button
        variant="outline"
        onClick={() => Sentry.showReportDialog()}
      >
        문제 신고하기
      </Button>
    </div>
  );
}
```

#### 커스텀 피드백 수집

```typescript
// lib/feedback/sentry-feedback.ts
import * as Sentry from '@sentry/nextjs';

interface UserFeedback {
  category: 'bug' | 'feature' | 'performance' | 'other';
  description: string;
  screenshot?: string; // base64
  page: string;
}

export function submitUserFeedback(feedback: UserFeedback) {
  Sentry.captureMessage('User Feedback', {
    level: 'info',
    tags: {
      feedbackCategory: feedback.category,
    },
    extra: {
      description: feedback.description,
      page: feedback.page,
      // 스크린샷은 attachment로 전송
    },
  });

  // 스크린샷이 있으면 첨부
  if (feedback.screenshot) {
    Sentry.getCurrentScope().addAttachment({
      filename: 'screenshot.png',
      data: feedback.screenshot,
      contentType: 'image/png',
    });
  }
}
```

### 2.4 성능 모니터링 (트랜잭션)

#### 트레이싱 설정

```typescript
// sentry.client.config.ts
Sentry.init({
  // 프로덕션 10% 샘플링 (비용 최적화)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 동적 샘플링 (중요 트랜잭션 우선)
  tracesSampler: (samplingContext) => {
    const { name, parentSampled } = samplingContext;

    // 부모 트랜잭션이 샘플링됐으면 유지
    if (parentSampled !== undefined) {
      return parentSampled;
    }

    // AI 분석은 100% 추적 (핵심 기능)
    if (name?.includes('/api/analyze')) {
      return 1.0;
    }

    // 인증 API 50% 추적
    if (name?.includes('/api/auth') || name?.includes('/sign')) {
      return 0.5;
    }

    // 정적 자산은 추적 제외
    if (name?.includes('/_next/') || name?.includes('/static/')) {
      return 0;
    }

    // 기본 10%
    return 0.1;
  },
});
```

#### 커스텀 트랜잭션

```typescript
// lib/gemini.ts
import * as Sentry from '@sentry/nextjs';

export async function analyzeWithGemini(
  analysisType: string,
  imageData: string
) {
  return Sentry.startSpan(
    {
      name: `AI Analysis: ${analysisType}`,
      op: 'ai.analysis',
      attributes: {
        'ai.model': 'gemini-2.0-flash',
        'analysis.type': analysisType,
      },
    },
    async (span) => {
      try {
        // 이미지 전처리 스팬
        const preprocessed = await Sentry.startSpan(
          { name: 'Image Preprocessing', op: 'image.preprocess' },
          async () => preprocessImage(imageData)
        );

        // Gemini API 호출 스팬
        const result = await Sentry.startSpan(
          { name: 'Gemini API Call', op: 'http.client' },
          async () => callGeminiAPI(preprocessed)
        );

        span.setStatus({ code: 1 }); // OK
        return result;

      } catch (error) {
        span.setStatus({ code: 2, message: 'AI analysis failed' });
        throw error;
      }
    }
  );
}
```

#### 성능 메트릭 대시보드

| 메트릭 | 목표 | 알림 임계값 |
|--------|------|------------|
| **LCP** | < 2.5s | > 4s |
| **FID** | < 100ms | > 300ms |
| **CLS** | < 0.1 | > 0.25 |
| **AI 분석 P95** | < 3s | > 5s |
| **API 응답 P95** | < 500ms | > 2s |

### 2.5 알림 설정 (Slack 연동)

#### Sentry Slack 통합

1. **Sentry 프로젝트 설정** -> **Integrations** -> **Slack** 추가
2. Slack 워크스페이스 연결
3. 알림 규칙 설정

#### 알림 규칙 예시

```yaml
# P0: 즉시 알림
- name: "Critical Error Alert"
  conditions:
    - "event.level == 'fatal' OR event.level == 'error'"
    - "event.count >= 10 in 1 minute"
  actions:
    - type: "slack"
      channel: "#alerts-critical"
      tags: ["@channel", "P0"]

# P1: AI 분석 실패
- name: "AI Analysis Failure"
  conditions:
    - "event.tags.module == 'gemini'"
    - "event.count >= 5 in 5 minutes"
  actions:
    - type: "slack"
      channel: "#alerts-ai"

# P2: 일반 에러 다이제스트
- name: "Hourly Error Digest"
  conditions:
    - "event.level == 'error'"
  frequency: "1 hour"
  actions:
    - type: "slack"
      channel: "#alerts-general"
      digest: true

# 성능 저하 알림
- name: "Performance Degradation"
  conditions:
    - "transaction.duration.p95 > 5s"
  actions:
    - type: "slack"
      channel: "#alerts-performance"
```

#### 알림 포맷 커스터마이징

```typescript
// Sentry Slack 메시지 예시
{
  "text": "P0 Alert: AI 분석 실패 급증",
  "attachments": [{
    "color": "danger",
    "fields": [
      { "title": "모듈", "value": "PC-1 퍼스널컬러", "short": true },
      { "title": "영향 사용자", "value": "123명", "short": true },
      { "title": "에러율", "value": "45%", "short": true },
      { "title": "시작 시간", "value": "2026-01-16 14:30 KST", "short": true }
    ],
    "actions": [
      { "type": "button", "text": "Sentry에서 보기", "url": "..." },
      { "type": "button", "text": "롤백", "url": "...", "style": "danger" }
    ]
  }]
}
```

### 2.6 PII 필터링 설정

#### 이중 보호 전략

```
[ 클라이언트 ] -> [ beforeSend 훅 ] -> [ Sentry 서버 ] -> [ Data Scrubbing ]
                        |
              [ redact-pii.ts 적용 ]
```

#### Sentry 내장 필터링

```typescript
// sentry.client.config.ts
Sentry.init({
  beforeSend(event) {
    // 사용자 정보 필터링
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      event.user.id = hashUserId(event.user.id);
    }

    // 요청 데이터 필터링
    if (event.request?.data) {
      event.request.data = sanitizeForLogging(event.request.data);
    }

    // 스택 트레이스 경로 필터링
    if (event.exception?.values) {
      event.exception.values.forEach(ex => {
        if (ex.stacktrace?.frames) {
          ex.stacktrace.frames.forEach(frame => {
            frame.abs_path = sanitizePath(frame.abs_path);
          });
        }
      });
    }

    return event;
  },

  // 민감 필드 자동 스크러빙
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
      if (breadcrumb.data?.url?.includes('/api/')) {
        // API 요청 바디 제거
        delete breadcrumb.data.body;
        delete breadcrumb.data.response;
      }
    }
    return breadcrumb;
  },
});
```

#### redact-pii.ts 활용

```typescript
// lib/utils/redact-pii.ts (이미 구현됨)
import { sanitizeForLogging, redactPii } from '@/lib/utils/redact-pii';

// 사용 예시
const safeData = sanitizeForLogging({
  email: 'user@example.com',        // -> u***@e***.com
  phone: '010-1234-5678',           // -> ***-****-5678
  clerk_user_id: 'user_abc123xyz',  // -> user_ab***
  faceImage: 'https://...',         // -> [IMAGE_URL_REDACTED]
  name: 'Kim Cheolsu',              // -> Ki***
});
```

#### Sentry 서버 사이드 Data Scrubbing

Sentry 프로젝트 설정에서 추가 필터링:

1. **Settings** -> **Security & Privacy** -> **Data Scrubbing**
2. **Safe Fields**: `id`, `type`, `status`, `timestamp`
3. **Sensitive Fields**: `password`, `token`, `secret`, `api_key`
4. **PII Defaults**: Enable "Remove credit card numbers", "Remove IP addresses"

```yaml
# Sentry Data Scrubbing 규칙
scrub_data: true
scrub_ip_addresses: true
sensitive_fields:
  - password
  - token
  - secret
  - apiKey
  - creditCard
  - ssn
```

---

## 3. 구현 시 필수 사항

### 설정 체크리스트

- [ ] `NEXT_PUBLIC_SENTRY_DSN` 환경변수 설정
- [ ] `SENTRY_DSN` (서버용) 환경변수 설정
- [ ] `sentry.client.config.ts` 클라이언트 설정
- [ ] `sentry.server.config.ts` 서버 설정
- [ ] `sentry.edge.config.ts` 엣지 설정
- [ ] `next.config.ts`에 `withSentryConfig` 래핑
- [ ] `app/error.tsx` 글로벌 에러 바운더리

### 보안 체크리스트

- [ ] `beforeSend`에서 이메일/IP 주소 제거
- [ ] 이미지 URL 마스킹 (`[IMAGE_URL_REDACTED]`)
- [ ] 사용자 ID 해싱 또는 부분 마스킹
- [ ] 요청 바디에서 민감 정보 제거
- [ ] 스택 트레이스에서 로컬 경로 제거

### 성능 체크리스트

- [ ] `tracesSampleRate` 프로덕션 10% 이하
- [ ] `replaysSessionSampleRate` 0.1% (비용 최적화)
- [ ] `replaysOnErrorSampleRate` 100% (에러 시 전체 수집)
- [ ] 정적 자산 트랜잭션 제외

### 알림 체크리스트

- [ ] Slack 통합 설정
- [ ] P0/P1/P2/P3 알림 규칙 생성
- [ ] 알림 채널 분리 (`#alerts-critical`, `#alerts-general`)
- [ ] 다이제스트 설정으로 알림 피로도 감소

---

## 4. 코드 예시

### 4.1 완전한 클라이언트 설정

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';
import { sanitizeForLogging, sanitizeError } from '@/lib/utils/redact-pii';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === 'production',

  // 환경 및 릴리스 식별
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // 트레이싱 샘플링
  tracesSampleRate: 0.1,
  tracesSampler: (ctx) => {
    if (ctx.name?.includes('/api/analyze')) return 1.0;
    if (ctx.name?.includes('/_next/')) return 0;
    return 0.1;
  },

  // 세션 리플레이
  replaysSessionSampleRate: 0.001,
  replaysOnErrorSampleRate: 1.0,

  // 인테그레이션
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // PII 필터링
  beforeSend(event, hint) {
    // 사용자 정보 제거
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    // 요청 데이터 정화
    if (event.request?.data) {
      event.request.data = sanitizeForLogging(event.request.data);
    }

    // 에러 메시지 정화
    if (event.message) {
      event.message = sanitizeError({ message: event.message }).message;
    }

    // 커스텀 fingerprint
    const error = hint.originalException;
    if (error instanceof Error) {
      if (error.message.includes('AI analysis')) {
        event.fingerprint = ['ai-error', '{{ default }}'];
      }
    }

    return event;
  },

  // 브레드크럼 필터링
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'fetch') {
      delete breadcrumb.data?.body;
    }
    return breadcrumb;
  },
});
```

### 4.2 API 라우트 에러 핸들링

```typescript
// app/api/analyze/skin/route.ts
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return Sentry.withServerActionInstrumentation(
    'POST /api/analyze/skin',
    {
      recordResponse: false, // 응답 본문 기록 안 함 (보안)
    },
    async () => {
      try {
        const { userId } = await auth();

        // 사용자 컨텍스트 설정
        Sentry.setUser({ id: userId });
        Sentry.setTag('module', 'S-1');
        Sentry.setTag('analysisType', 'skin');

        const result = await analyzeSkin(request);

        return NextResponse.json({ success: true, data: result });

      } catch (error) {
        // 에러 캡처 (추가 컨텍스트 포함)
        Sentry.captureException(error, {
          tags: {
            handler: 'analyze-skin',
          },
          extra: {
            requestId: request.headers.get('x-request-id'),
          },
        });

        return NextResponse.json(
          { success: false, error: 'Analysis failed' },
          { status: 500 }
        );
      }
    }
  );
}
```

### 4.3 에러 바운더리 컴포넌트

```typescript
// components/AnalysisErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, MessageSquare } from 'lucide-react';

interface Props {
  children: ReactNode;
  analysisType: string;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

export class AnalysisErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setTag('analysisType', this.props.analysisType);
      scope.setExtra('componentStack', errorInfo.componentStack);

      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  handleFeedback = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({
        eventId: this.state.eventId,
        lang: 'ko',
      });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">분석 중 문제가 발생했습니다</h2>
          <p className="text-muted-foreground mb-6">
            일시적인 오류입니다. 다시 시도해 주세요.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
            <Button variant="outline" onClick={this.handleFeedback}>
              <MessageSquare className="h-4 w-4 mr-2" />
              문제 신고
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4.4 성능 트래킹 유틸리티

```typescript
// lib/monitoring/performance.ts
import * as Sentry from '@sentry/nextjs';

/**
 * 함수 실행 시간 측정 및 Sentry 전송
 */
export async function trackPerformance<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, string>
): Promise<T> {
  const startTime = performance.now();

  return Sentry.startSpan(
    {
      name,
      op: operation,
      attributes: metadata,
    },
    async (span) => {
      try {
        const result = await fn();

        const duration = performance.now() - startTime;
        span.setStatus({ code: 1 }); // OK

        // 느린 작업 경고
        if (duration > 3000) {
          Sentry.captureMessage(`Slow ${operation}: ${name}`, {
            level: 'warning',
            extra: { duration, ...metadata },
          });
        }

        return result;

      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        throw error;
      }
    }
  );
}

// 사용 예시
const result = await trackPerformance(
  'Skin Analysis',
  'ai.analysis',
  () => analyzeWithGemini(imageData),
  { module: 'S-1', userId: 'user_xxx' }
);
```

---

## 5. 참고 자료

### 공식 문서
- [Sentry Next.js SDK 문서](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Data Scrubbing](https://docs.sentry.io/security-legal-pii/scrubbing/)
- [Sentry Slack Integration](https://docs.sentry.io/product/integrations/notification-actions/slack/)

### 프로젝트 내부 문서
- `apps/web/sentry.client.config.ts` - 현재 클라이언트 설정
- `apps/web/lib/utils/redact-pii.ts` - PII 필터링 유틸리티
- `apps/web/app/error.tsx` - 글로벌 에러 바운더리

### 관련 ADR
- ADR-018: 에러 핸들링 전략
- ADR-020: API 응답 표준화

---

**Version**: 1.0 | **Created**: 2026-01-16 | **Author**: Claude Opus 4.5
