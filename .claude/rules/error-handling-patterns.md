# 에러 처리 패턴

> 이룸 프로젝트 표준 에러 처리 전략

## 에러 분류 체계

### 에러 타입

```typescript
// types/errors.ts
export type ErrorCode =
  | 'VALIDATION_ERROR' // 입력 검증 실패
  | 'AUTH_ERROR' // 인증 실패
  | 'FORBIDDEN_ERROR' // 권한 없음
  | 'NOT_FOUND_ERROR' // 리소스 없음
  | 'CONFLICT_ERROR' // 중복/충돌
  | 'RATE_LIMIT_ERROR' // 요청 제한
  | 'AI_TIMEOUT_ERROR' // AI 타임아웃
  | 'AI_SERVICE_ERROR' // AI 서비스 오류
  | 'DB_ERROR' // 데이터베이스 오류
  | 'NETWORK_ERROR' // 네트워크 오류
  | 'UNKNOWN_ERROR'; // 알 수 없는 오류

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string; // 사용자에게 표시할 메시지
  details?: Record<string, unknown>;
}
```

### 에러 팩토리

```typescript
// lib/errors/factory.ts
export function createAppError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): AppError {
  const userMessages: Record<ErrorCode, string> = {
    VALIDATION_ERROR: '입력 정보를 확인해주세요.',
    AUTH_ERROR: '로그인이 필요합니다.',
    FORBIDDEN_ERROR: '접근 권한이 없습니다.',
    NOT_FOUND_ERROR: '요청하신 정보를 찾을 수 없습니다.',
    CONFLICT_ERROR: '이미 존재하는 데이터입니다.',
    RATE_LIMIT_ERROR: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    AI_TIMEOUT_ERROR: '분석 시간이 초과되었습니다. 다시 시도해주세요.',
    AI_SERVICE_ERROR: '분석 서비스에 일시적인 문제가 있습니다.',
    DB_ERROR: '데이터 처리 중 오류가 발생했습니다.',
    NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
    UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  };

  return {
    code,
    message,
    userMessage: userMessages[code],
    details,
  };
}
```

## 3단계 폴백 전략

### Level 1: 재시도 (Retry)

```typescript
// lib/utils/retry.ts
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  exponential?: boolean;
  shouldRetry?: (error: unknown) => boolean;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    exponential = true,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!shouldRetry(error) || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = exponential ? baseDelay * Math.pow(2, attempt) : baseDelay;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Level 2: 대체 처리 (Fallback)

```typescript
// lib/gemini/with-fallback.ts
export async function analyzeWithFallback<T>(
  analyze: () => Promise<T>,
  generateMock: () => T,
  options: { timeout?: number; maxRetries?: number } = {}
): Promise<{ result: T; usedFallback: boolean }> {
  const { timeout = 3000, maxRetries = 2 } = options;

  try {
    const result = await withRetry(
      () =>
        Promise.race([
          analyze(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI analysis timeout')), timeout)
          ),
        ]),
      { maxRetries }
    );

    return { result, usedFallback: false };
  } catch (error) {
    console.error('[AI] Analysis failed, using fallback:', error);

    return {
      result: generateMock(),
      usedFallback: true,
    };
  }
}
```

### Level 3: 우아한 실패 (Graceful Degradation)

```typescript
// components/FeatureWrapper.tsx
interface FeatureWrapperProps {
  featureFlag: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureWrapper({
  featureFlag,
  children,
  fallback = null,
}: FeatureWrapperProps) {
  const isEnabled = useFeatureFlag(featureFlag);

  if (!isEnabled) {
    return fallback;
  }

  return <>{children}</>;
}
```

## API 에러 처리

### API 라우트 패턴

```typescript
// app/api/analyze/skin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAppError } from '@/lib/errors/factory';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(createAppError('AUTH_ERROR', 'User not authenticated'), {
        status: 401,
      });
    }

    const body = await request.json();
    const validated = skinAnalysisSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        createAppError('VALIDATION_ERROR', 'Invalid input', {
          errors: validated.error.flatten(),
        }),
        { status: 400 }
      );
    }

    const result = await analyzeSkin(validated.data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[API] /analyze/skin error:', error);

    // 알려진 에러 타입 처리
    if (error instanceof AITimeoutError) {
      return NextResponse.json(createAppError('AI_TIMEOUT_ERROR', error.message), { status: 504 });
    }

    // 알 수 없는 에러
    return NextResponse.json(createAppError('UNKNOWN_ERROR', 'Internal server error'), {
      status: 500,
    });
  }
}
```

### 클라이언트 에러 처리

```typescript
// lib/api/client.ts
export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw createAppError(error.code || 'UNKNOWN_ERROR', error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
```

## React 에러 바운더리

### 전역 에러 바운더리

```tsx
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('[ErrorBoundary]', error, errorInfo);
    // Sentry로 전송
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">문제가 발생했습니다</h2>
          <p className="text-muted-foreground mb-4">
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
          <Button onClick={() => window.location.reload()}>새로고침</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 분석 전용 에러 바운더리

```tsx
// components/AnalysisErrorBoundary.tsx
export function AnalysisErrorBoundary({
  children,
  analysisType,
}: {
  children: ReactNode;
  analysisType: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">분석 중 문제가 발생했습니다</h2>
          <p className="text-muted-foreground mb-4">{getAnalysisErrorMessage(analysisType)}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">대시보드로 이동</Link>
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

## 에러 로깅

### 로깅 패턴

```typescript
// lib/logger.ts
const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export const logger = {
  debug: (module: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${module}] ${message}`, data);
    }
  },

  info: (module: string, message: string, data?: unknown) => {
    console.info(`[${module}] ${message}`, data);
  },

  warn: (module: string, message: string, data?: unknown) => {
    console.warn(`[${module}] ${message}`, data);
  },

  error: (module: string, message: string, error?: unknown) => {
    // PII 필터링
    const sanitizedError = sanitizeError(error);
    console.error(`[${module}] ${message}`, sanitizedError);

    // Sentry 전송
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        tags: { module },
        extra: { message },
      });
    }
  },
};
```

### 사용 예시

```typescript
// 모듈별 로깅
logger.info('PC-1', 'Analysis started', { userId });
logger.error('S-1', 'Gemini API failed', error);
logger.warn('W-1', 'Slow response detected', { duration: 2500 });
```

## 사용자 피드백

### 토스트 메시지

```typescript
// hooks/useToast.ts
export function useErrorToast() {
  const { toast } = useToast();

  const showError = useCallback(
    (error: AppError | Error) => {
      const message = 'userMessage' in error ? error.userMessage : '오류가 발생했습니다.';

      toast({
        variant: 'destructive',
        title: '오류',
        description: message,
      });
    },
    [toast]
  );

  return showError;
}
```

### 인라인 에러

```tsx
// components/FormField.tsx
export function FormField({ error, ...props }: FormFieldProps) {
  return (
    <div>
      <Input {...props} className={error ? 'border-red-500' : ''} />
      {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}
```

---

**Version**: 1.0 | **Updated**: 2026-01-15
