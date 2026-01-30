# AI-3: Fallback 전략 (Graceful Degradation)

> AI/ML 심화 3/8 - AI API 실패 시 대응 및 복원력 확보

---

## 1. 연구 개요

### 1.1 배경

AI API는 다양한 이유로 실패할 수 있다:
- API 타임아웃
- Rate Limiting (429)
- 서비스 장애 (5xx)
- 모델 응답 오류
- 네트워크 불안정

Graceful Degradation은 이러한 실패 시에도 시스템이 완전히 멈추지 않고
제한된 기능이라도 제공하는 설계 원칙이다.

### 1.2 Fallback 계층 구조

```
┌─────────────────────────────────────────────────────────────┐
│                     Fallback 계층 구조                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Level 0: 정상 동작                                        │
│   └── Gemini 3 Flash API 정상 응답                          │
│              ↓ (실패 시)                                    │
│   Level 1: 재시도 (Retry)                                   │
│   └── 지수 백오프로 2-3회 재시도                            │
│              ↓ (실패 시)                                    │
│   Level 2: 대체 모델 (Model Fallback)                       │
│   └── 다른 AI 모델로 전환 (예: GPT-4o → Claude)            │
│              ↓ (실패 시)                                    │
│   Level 3: 캐시된 결과 (Cached Response)                    │
│   └── 유사한 이전 분석 결과 반환                            │
│              ↓ (없으면)                                     │
│   Level 4: Mock 데이터 (Static Fallback)                    │
│   └── 미리 정의된 기본 응답 반환                            │
│              ↓ (최후)                                       │
│   Level 5: 기능 비활성화                                    │
│   └── "분석 서비스 일시 중단" 메시지                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Level 1: 재시도 (Retry)

### 2.1 지수 백오프 구현

```typescript
// lib/utils/retry.ts

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;      // ms
  maxDelay: number;       // ms
  exponential: boolean;
  jitter: boolean;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponential: true,
  jitter: true,
  shouldRetry: (error) => {
    // 재시도 가능한 에러만
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('503') ||
        message.includes('network')
      );
    }
    return false;
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 마지막 시도이거나 재시도 불가 에러면 throw
      if (
        attempt === cfg.maxRetries ||
        (cfg.shouldRetry && !cfg.shouldRetry(error))
      ) {
        throw error;
      }

      // 딜레이 계산
      let delay = cfg.exponential
        ? cfg.baseDelay * Math.pow(2, attempt)
        : cfg.baseDelay;

      // 최대 딜레이 제한
      delay = Math.min(delay, cfg.maxDelay);

      // 지터 추가 (동시 재시도 방지)
      if (cfg.jitter) {
        delay += Math.random() * delay * 0.1;
      }

      console.log(`[Retry] Attempt ${attempt + 1} failed, waiting ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 2.2 사용 예시

```typescript
// lib/gemini/with-retry.ts

export async function analyzeWithRetry(
  imageBase64: string,
  prompt: string
): Promise<AnalysisResult> {
  return withRetry(
    () => callGeminiAPI(imageBase64, prompt),
    {
      maxRetries: 2,
      baseDelay: 1000,
      shouldRetry: (error) => {
        // 429 (Rate Limit) 또는 5xx 에러만 재시도
        if (error instanceof GeminiError) {
          return error.statusCode === 429 || error.statusCode >= 500;
        }
        return false;
      },
    }
  );
}
```

---

## 3. Level 2: 대체 모델 (Model Fallback)

### 3.1 모델 체인 구현

```typescript
// lib/ai/model-chain.ts

export interface AIModel {
  id: string;
  name: string;
  priority: number;
  analyze: (input: AnalysisInput) => Promise<AnalysisResult>;
  isAvailable: () => Promise<boolean>;
}

export const MODEL_CHAIN: AIModel[] = [
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    priority: 1,
    analyze: geminiAnalyze,
    isAvailable: checkGeminiHealth,
  },
  // 향후 추가 가능
  // {
  //   id: 'claude-3-sonnet',
  //   name: 'Claude 3 Sonnet',
  //   priority: 2,
  //   analyze: claudeAnalyze,
  //   isAvailable: checkClaudeHealth,
  // },
];

export async function analyzeWithModelFallback(
  input: AnalysisInput
): Promise<{ result: AnalysisResult; usedModel: string }> {
  // 우선순위 순으로 정렬
  const sortedModels = [...MODEL_CHAIN].sort((a, b) => a.priority - b.priority);

  for (const model of sortedModels) {
    try {
      // 모델 사용 가능 여부 확인
      const available = await model.isAvailable();
      if (!available) {
        console.log(`[ModelFallback] ${model.name} not available, skipping`);
        continue;
      }

      // 분석 시도
      const result = await model.analyze(input);
      return { result, usedModel: model.id };
    } catch (error) {
      console.error(`[ModelFallback] ${model.name} failed:`, error);
      continue;
    }
  }

  // 모든 모델 실패
  throw new Error('All AI models failed');
}
```

### 3.2 서킷 브레이커 패턴

```typescript
// lib/ai/circuit-breaker.ts

export interface CircuitBreakerConfig {
  failureThreshold: number;    // 실패 횟수 임계값
  resetTimeout: number;        // 차단 해제까지 대기 시간 (ms)
  halfOpenRetries: number;     // Half-Open 상태에서 시도 횟수
}

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures: number = 0;
  private lastFailureTime: number = 0;

  constructor(
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenRetries: 1,
    }
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 상태 확인
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'half-open';
        console.log('[CircuitBreaker] Transitioning to half-open');
      } else {
        throw new CircuitOpenError('Circuit is open');
      }
    }

    try {
      const result = await fn();

      // 성공 시 상태 리셋
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        console.log('[CircuitBreaker] Circuit closed');
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.config.failureThreshold) {
        this.state = 'open';
        console.log('[CircuitBreaker] Circuit opened due to failures');
      }

      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}
```

---

## 4. Level 3: 캐시된 결과

### 4.1 유사 분석 결과 캐싱

```typescript
// lib/ai/analysis-cache.ts

import { SupabaseClient } from '@supabase/supabase-js';

export interface CachedAnalysis {
  id: string;
  userId: string;
  analysisType: string;
  inputHash: string;        // 이미지 해시
  result: AnalysisResult;
  createdAt: Date;
  usedCount: number;
}

export async function getCachedAnalysis(
  supabase: SupabaseClient,
  userId: string,
  analysisType: string,
  currentInputHash: string
): Promise<AnalysisResult | null> {
  // 1. 동일 입력 캐시 확인
  const { data: exact } = await supabase
    .from('analysis_cache')
    .select('result')
    .eq('user_id', userId)
    .eq('analysis_type', analysisType)
    .eq('input_hash', currentInputHash)
    .single();

  if (exact) {
    console.log('[Cache] Exact match found');
    return exact.result as AnalysisResult;
  }

  // 2. 최근 분석 결과 (24시간 이내) 폴백
  const { data: recent } = await supabase
    .from('analysis_results')
    .select('result')
    .eq('clerk_user_id', userId)
    .eq('analysis_type', analysisType)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recent) {
    console.log('[Cache] Recent analysis fallback');
    return {
      ...recent.result,
      _cached: true,
      _cacheNote: '이전 분석 결과를 표시합니다. 새로운 분석을 시도해 주세요.',
    };
  }

  return null;
}
```

---

## 5. Level 4: Mock 데이터

### 5.1 정적 Fallback 응답

```typescript
// lib/ai/mock-responses.ts

import { SkinAnalysisResult, BodyAnalysisResult, PersonalColorResult } from '@/types/analysis';

// Mock 데이터는 실제 분석을 대체하지 않음을 명시
export interface MockResponse<T> {
  result: T;
  isMock: true;
  disclaimer: string;
}

export const MOCK_RESPONSES = {
  skin: (): MockResponse<SkinAnalysisResult> => ({
    result: {
      skinType: '복합성',
      scores: {
        hydration: 60,
        oiliness: 50,
        sensitivity: 40,
        poreVisibility: 45,
        wrinkleDepth: 30,
      },
      concerns: ['수분 부족', 'T존 유분'],
      recommendations: [
        '가벼운 수분 크림 사용을 권장합니다',
        'T존에는 매트 제품을 활용해 보세요',
      ],
      confidence: 0, // Mock임을 표시
    },
    isMock: true,
    disclaimer: '현재 분석 서비스에 일시적인 문제가 있어 예시 결과를 표시합니다. 잠시 후 다시 시도해 주세요.',
  }),

  body: (): MockResponse<BodyAnalysisResult> => ({
    result: {
      bodyType: 'rectangle',
      posture: 'normal',
      measurements: {},
      recommendations: [],
      confidence: 0,
    },
    isMock: true,
    disclaimer: '분석 서비스 일시 중단. 잠시 후 다시 시도해 주세요.',
  }),

  personalColor: (): MockResponse<PersonalColorResult> => ({
    result: {
      season: 'spring',
      subSeason: 'light',
      colorPalette: ['#FFB6A3', '#FF8B6A', '#FFDAB9'],
      recommendations: [],
      confidence: 0,
    },
    isMock: true,
    disclaimer: '분석 서비스 일시 중단. 잠시 후 다시 시도해 주세요.',
  }),
};

export function getMockResponse<T extends keyof typeof MOCK_RESPONSES>(
  type: T
): ReturnType<typeof MOCK_RESPONSES[T]> {
  return MOCK_RESPONSES[type]() as ReturnType<typeof MOCK_RESPONSES[T]>;
}
```

### 5.2 피처 플래그 연동

```typescript
// lib/ai/with-fallback.ts

import { isFeatureEnabled } from '@/lib/feature-flags';
import { getMockResponse } from './mock-responses';

export interface FallbackConfig {
  enableMockFallback: boolean;
  notifyUser: boolean;
  logToAnalytics: boolean;
}

export async function analyzeWithFallback<T>(
  analysisType: 'skin' | 'body' | 'personalColor',
  analyzeFn: () => Promise<T>,
  config?: Partial<FallbackConfig>
): Promise<{
  result: T;
  usedFallback: boolean;
  fallbackLevel?: number;
}> {
  const cfg: FallbackConfig = {
    enableMockFallback: await isFeatureEnabled('allowMockFallback'),
    notifyUser: await isFeatureEnabled('notifyOnFallback'),
    logToAnalytics: true,
    ...config,
  };

  try {
    // Level 0-2: 정상 분석 시도 (재시도 + 모델 폴백 포함)
    const result = await analyzeWithRetry(() =>
      analyzeWithModelFallback({ type: analysisType })
    );

    return { result: result.result as T, usedFallback: false };
  } catch (error) {
    console.error('[Fallback] All primary methods failed:', error);

    // Level 3: 캐시 확인은 호출측에서 처리

    // Level 4: Mock 데이터
    if (cfg.enableMockFallback) {
      const mock = getMockResponse(analysisType);

      if (cfg.logToAnalytics) {
        logFallbackEvent(analysisType, 'mock', error);
      }

      return {
        result: mock.result as T,
        usedFallback: true,
        fallbackLevel: 4,
      };
    }

    // Level 5: 에러 전파
    throw error;
  }
}
```

---

## 6. 사용자 알림

### 6.1 Fallback 알림 컴포넌트

```tsx
// components/analysis/FallbackNotice.tsx
'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FallbackNoticeProps {
  level: number;
  onRetry?: () => void;
}

export function FallbackNotice({ level, onRetry }: FallbackNoticeProps) {
  const notices = {
    3: {
      title: '이전 분석 결과입니다',
      description: '현재 분석 서비스에 일시적인 문제가 있어 가장 최근 분석 결과를 표시합니다.',
      severity: 'warning' as const,
    },
    4: {
      title: '예시 결과입니다',
      description: '분석 서비스 연결에 실패하여 예시 데이터를 표시합니다. 실제 분석 결과가 아닙니다.',
      severity: 'error' as const,
    },
    5: {
      title: '분석 서비스 일시 중단',
      description: '잠시 후 다시 시도해 주세요. 문제가 지속되면 고객센터로 문의해 주세요.',
      severity: 'error' as const,
    },
  };

  const notice = notices[level as keyof typeof notices];
  if (!notice) return null;

  const bgColors = {
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
  };

  const textColors = {
    warning: 'text-amber-800',
    error: 'text-red-800',
  };

  return (
    <div
      className={`rounded-lg border p-4 mb-4 ${bgColors[notice.severity]}`}
      data-testid="fallback-notice"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 ${textColors[notice.severity]}`} />
        <div className="flex-1">
          <h4 className={`font-medium ${textColors[notice.severity]}`}>
            {notice.title}
          </h4>
          <p className={`text-sm mt-1 ${textColors[notice.severity]} opacity-80`}>
            {notice.description}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 7. 모니터링 및 알림

### 7.1 Fallback 이벤트 로깅

```typescript
// lib/analytics/fallback-events.ts

export interface FallbackEvent {
  timestamp: Date;
  analysisType: string;
  fallbackLevel: number;
  errorType: string;
  errorMessage: string;
  userId?: string;
  duration: number;
}

export async function logFallbackEvent(
  analysisType: string,
  level: string,
  error: unknown
): Promise<void> {
  const event: FallbackEvent = {
    timestamp: new Date(),
    analysisType,
    fallbackLevel: parseInt(level) || 0,
    errorType: error instanceof Error ? error.name : 'Unknown',
    errorMessage: error instanceof Error ? error.message : String(error),
    duration: 0,
  };

  // Vercel Analytics 또는 Sentry로 전송
  console.log('[Fallback Event]', event);

  // 임계값 초과 시 알림
  await checkFallbackThreshold(analysisType);
}

async function checkFallbackThreshold(analysisType: string): Promise<void> {
  // 최근 1시간 내 fallback 비율 계산
  const recentFallbackRate = await getFallbackRate(analysisType, 60);

  // 10% 초과 시 알림
  if (recentFallbackRate > 0.1) {
    console.warn(
      `[Alert] High fallback rate for ${analysisType}: ${(recentFallbackRate * 100).toFixed(1)}%`
    );
    // Slack/PagerDuty 알림 등
  }
}
```

---

## 8. 구현 체크리스트

### P0 (Critical)

- [ ] 지수 백오프 재시도
- [ ] Mock 데이터 fallback
- [ ] 사용자 알림 UI

### P1 (High)

- [ ] 서킷 브레이커
- [ ] 캐시된 결과 fallback
- [ ] Fallback 이벤트 로깅

### P2 (Medium)

- [ ] 대체 모델 체인
- [ ] 자동 롤백 임계값
- [ ] 상태 대시보드

---

## 9. 참고 자료

- [MWA AI Reliability](https://www.mwaai.com/ai-insights/AI/ensuring-ai-reliability-advanced-error-handling-fallback-strategies)
- [LangGraph Error Handling](https://sparkco.ai/blog/advanced-error-handling-strategies-in-langgraph-applications)
- [Building Resilient AI Systems](https://medium.com/@tombastaner/building-resilient-ai-systems-understanding-model-level-fallback-mechanisms-436cf636045f)
- [API Resilience Patterns](https://api7.ai/blog/10-common-api-resilience-design-patterns)

---

**Version**: 1.0
**Created**: 2026-01-19
**Category**: AI/ML 심화 (3/8)
