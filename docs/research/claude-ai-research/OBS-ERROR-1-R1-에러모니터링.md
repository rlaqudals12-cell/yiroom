# 에러 모니터링 (Sentry)

> **ID**: OBS-ERROR-MONITORING
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/

---

## 1. 현재 구현 분석

### 현재 상태

```typescript
// 현재 구현된 기능
✅ 기본 console.error 로깅
✅ try-catch 에러 핸들링
✅ API 라우트 에러 응답

// 개선 필요 항목
❌ Sentry 통합
❌ Error Boundary 체계화
❌ 소스맵 업로드
❌ 알림 설정
❌ 릴리스 트래킹
```

---

## 2. Sentry 설정

### 2.1 설치 및 초기화

```bash
# 설치
npx @sentry/wizard@latest -i nextjs

# 생성되는 파일:
# - sentry.client.config.ts
# - sentry.server.config.ts
# - sentry.edge.config.ts
# - instrumentation.ts
# - app/global-error.tsx
```

### 2.2 기본 설정

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경별 설정
  environment: process.env.NODE_ENV,

  // 샘플링 (프로덕션)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 리플레이 (선택)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // 무시할 에러
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    /^Loading chunk \d+ failed/,
  ],

  // PII 필터링
  beforeSend(event) {
    // 민감 정보 제거
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
      delete event.request.headers['Cookie'];
    }
    return event;
  },

  // 통합
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### 2.3 서버 설정

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 서버 특화 설정
  beforeSend(event, hint) {
    // 특정 에러 무시
    if (hint.originalException instanceof Error) {
      if (hint.originalException.message.includes('NEXT_NOT_FOUND')) {
        return null; // 404는 무시
      }
    }
    return event;
  },
});
```

### 2.4 Edge 설정

```typescript
// sentry.edge.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

## 3. Error Boundary 체계

### 3.1 글로벌 에러 핸들러

```typescript
// app/global-error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              문제가 발생했습니다
            </h2>
            <p className="text-muted-foreground mb-6">
              잠시 후 다시 시도해주세요.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### 3.2 라우트 에러 핸들러

```typescript
// app/(main)/analysis/error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AnalysisError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 타입 분류
    const errorType = classifyError(error);

    Sentry.captureException(error, {
      tags: {
        section: 'analysis',
        errorType,
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-xl font-bold mb-4">
        분석 중 오류가 발생했습니다
      </h2>
      <p className="text-muted-foreground mb-6">
        {getErrorMessage(error)}
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>다시 시도</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">대시보드로 이동</Link>
        </Button>
      </div>
    </div>
  );
}

function classifyError(error: Error): string {
  if (error.message.includes('timeout')) return 'timeout';
  if (error.message.includes('network')) return 'network';
  if (error.message.includes('AI')) return 'ai_service';
  return 'unknown';
}

function getErrorMessage(error: Error): string {
  if (error.message.includes('timeout')) {
    return '분석 시간이 초과되었습니다. 다시 시도해주세요.';
  }
  if (error.message.includes('network')) {
    return '네트워크 연결을 확인해주세요.';
  }
  return '일시적인 오류가 발생했습니다.';
}
```

### 3.3 컴포넌트 에러 바운더리

```typescript
// components/ErrorBoundary.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setExtra('componentStack', errorInfo.componentStack);
      Sentry.captureException(error);
    });

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center text-red-500">
          컴포넌트 로드 중 오류가 발생했습니다.
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 4. 수동 에러 캡처

### 4.1 API 라우트

```typescript
// app/api/analyze/skin/route.ts
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  const { userId } = await auth();

  try {
    const result = await analyzeSkin(request);
    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    // Sentry에 수동 전송
    Sentry.withScope((scope) => {
      scope.setUser({ id: userId });
      scope.setTag('api', 'analyze/skin');
      scope.setContext('request', {
        url: request.url,
        method: 'POST',
      });
      Sentry.captureException(error);
    });

    return NextResponse.json(
      { success: false, error: { code: 'ANALYSIS_ERROR', message: '분석 실패' } },
      { status: 500 }
    );
  }
}
```

### 4.2 클라이언트 에러

```typescript
// hooks/useErrorCapture.ts
import * as Sentry from '@sentry/nextjs';
import { useCallback } from 'react';

export function useErrorCapture() {
  const captureError = useCallback((
    error: Error,
    context?: Record<string, unknown>
  ) => {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(error);
    });
  }, []);

  const captureMessage = useCallback((
    message: string,
    level: Sentry.SeverityLevel = 'info'
  ) => {
    Sentry.captureMessage(message, level);
  }, []);

  return { captureError, captureMessage };
}
```

### 4.3 비동기 에러

```typescript
// lib/utils/with-error-capture.ts
import * as Sentry from '@sentry/nextjs';

export function withErrorCapture<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: { name?: string; tags?: Record<string, string> }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      Sentry.withScope((scope) => {
        if (options?.name) {
          scope.setTag('function', options.name);
        }
        if (options?.tags) {
          Object.entries(options.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }
        Sentry.captureException(error);
      });
      throw error;
    }
  }) as T;
}

// 사용
const analyzeSkinWithCapture = withErrorCapture(analyzeSkin, {
  name: 'analyzeSkin',
  tags: { module: 'S-1' },
});
```

---

## 5. Breadcrumbs

### 5.1 커스텀 Breadcrumb

```typescript
// lib/sentry/breadcrumbs.ts
import * as Sentry from '@sentry/nextjs';

export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

// 사용 예시
addBreadcrumb('analysis', 'Started skin analysis', { imageSize: 1024 });
addBreadcrumb('api', 'Gemini API called', { model: 'gemini-3-flash' });
addBreadcrumb('user', 'Uploaded image', { format: 'jpeg' });
```

### 5.2 자동 Breadcrumb 설정

```typescript
// sentry.client.config.ts
Sentry.init({
  // ...
  integrations: [
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
      xhr: true,
    }),
  ],
});
```

---

## 6. 성능 모니터링 통합

### 6.1 트랜잭션

```typescript
// lib/sentry/transactions.ts
import * as Sentry from '@sentry/nextjs';

export function startTransaction(
  name: string,
  op: string
): Sentry.Transaction | undefined {
  return Sentry.startTransaction({ name, op });
}

// 사용
export async function analyzeSkin(imageBase64: string) {
  const transaction = startTransaction('analyzeSkin', 'analysis');

  const preprocessSpan = transaction?.startChild({
    op: 'preprocess',
    description: 'Image preprocessing',
  });

  const processedImage = await preprocessImage(imageBase64);
  preprocessSpan?.finish();

  const aiSpan = transaction?.startChild({
    op: 'ai',
    description: 'Gemini analysis',
  });

  const result = await callGeminiAPI(processedImage);
  aiSpan?.finish();

  transaction?.finish();

  return result;
}
```

---

## 7. 소스맵

### 7.1 next.config.js 설정

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // 기존 설정
};

module.exports = withSentryConfig(nextConfig, {
  // Sentry Webpack 플러그인 옵션
  org: 'your-org',
  project: 'yiroom-web',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // 소스맵 업로드
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // 릴리스 설정
  release: {
    name: process.env.VERCEL_GIT_COMMIT_SHA,
    setCommits: {
      auto: true,
    },
  },

  // 성능
  hideSourceMaps: true,
  disableLogger: true,
});
```

### 7.2 CI/CD 통합

```yaml
# .github/workflows/deploy.yml
- name: Create Sentry Release
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: your-org
    SENTRY_PROJECT: yiroom-web
  run: |
    npx @sentry/cli releases new ${{ github.sha }}
    npx @sentry/cli releases set-commits ${{ github.sha }} --auto
    npx @sentry/cli releases finalize ${{ github.sha }}
```

---

## 8. 알림 설정

### 8.1 Sentry Dashboard 알림

```
Sentry Dashboard > Settings > Alerts

추천 규칙:
1. 새 이슈 발생 시 → Slack/이메일
2. 이슈 급증 (1시간 내 10건+) → Slack 긴급
3. 특정 태그 (api:critical) → PagerDuty

필터:
- environment:production만
- level:error 이상
```

### 8.2 커스텀 알림 조건

```typescript
// 코드에서 심각도 설정
Sentry.withScope((scope) => {
  scope.setLevel('fatal'); // 가장 높은 심각도
  scope.setTag('alert', 'critical');
  Sentry.captureException(error);
});
```

---

## 9. 디버깅 정보

### 9.1 사용자 컨텍스트

```typescript
// components/providers/SentryUserProvider.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export function SentryUserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          // PII 주의: 이름 등은 포함하지 않음
        });
      } else {
        Sentry.setUser(null);
      }
    }
  }, [user, isLoaded]);

  return <>{children}</>;
}
```

### 9.2 추가 컨텍스트

```typescript
// 앱 상태 컨텍스트
Sentry.setContext('app', {
  version: process.env.NEXT_PUBLIC_APP_VERSION,
  environment: process.env.NODE_ENV,
  region: process.env.VERCEL_REGION,
});

// 기기 정보
Sentry.setContext('device', {
  screen: `${window.screen.width}x${window.screen.height}`,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  language: navigator.language,
});
```

---

## 10. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] Sentry 설치 및 초기화
- [ ] global-error.tsx 설정
- [ ] API 라우트 에러 캡처
- [ ] 소스맵 업로드

### 단기 적용 (P1)

- [ ] 라우트별 error.tsx
- [ ] 커스텀 Breadcrumb
- [ ] 알림 규칙 설정

### 장기 적용 (P2)

- [ ] Session Replay
- [ ] 성능 트랜잭션
- [ ] 릴리스 트래킹

---

## 11. 참고 자료

- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [Error Monitoring Guide](https://medium.com/@rukshan1122/error-monitoring-the-ultimate-guide-to-sentry-in-next-js-never-miss-a-production-error-again-e678a93760ae)

---

**Version**: 1.0 | **Priority**: P0 Critical
