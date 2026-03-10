/**
 * Multi-AI Backup System 타입 정의
 *
 * @module lib/ai/types
 * @see docs/adr/ADR-055-multi-ai-backup-strategy.md
 */

// =============================================================================
// Provider 타입
// =============================================================================

/**
 * AI 프로바이더 이름
 */
export type AIProviderName = 'gemini' | 'claude' | 'mock';

/**
 * AI 프로바이더 인터페이스
 */
export interface AIProvider<TInput, TOutput> {
  /** 프로바이더 이름 */
  name: AIProviderName;
  /** 분석 함수 */
  analyze: (input: TInput) => Promise<TOutput>;
  /** 타임아웃 (ms) */
  timeout: number;
  /** 최대 재시도 횟수 */
  maxRetries: number;
  /** 우선순위 (낮을수록 먼저 시도) */
  priority: number;
  /** 활성화 여부 확인 함수 */
  isEnabled: () => boolean;
}

/**
 * AI 분석 결과 래퍼
 */
export interface AIAnalysisResult<T> {
  /** 분석 결과 */
  result: T;
  /** 사용된 프로바이더 */
  provider: AIProviderName;
  /** Mock 폴백 사용 여부 */
  usedFallback: boolean;
  /** 응답 시간 (ms) */
  latencyMs: number;
  /** 시도한 프로바이더 목록 */
  attemptedProviders: AIProviderName[];
  /** 각 프로바이더 에러 (있는 경우) */
  errors?: Record<AIProviderName, string>;
}

// =============================================================================
// 분석 입력/출력 타입
// =============================================================================

/**
 * 이미지 분석 입력
 */
export interface ImageAnalysisInput {
  /** Base64 인코딩된 이미지 */
  imageBase64: string;
  /** 분석 유형 */
  analysisType: 'skin-v2' | 'personal-color-v2' | 'body-v2' | 'hair-v2';
  /** 추가 옵션 */
  options?: Record<string, unknown>;
}

/**
 * 공통 이미지 품질 정보
 */
export interface ImageQualityInfo {
  lightingCondition: 'natural' | 'artificial' | 'mixed';
  makeupDetected: boolean;
  analysisReliability: 'high' | 'medium' | 'low';
}

// =============================================================================
// 서킷 브레이커 타입
// =============================================================================

/**
 * 서킷 브레이커 상태
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * 서킷 브레이커 설정
 */
export interface CircuitBreakerConfig {
  /** 실패 임계값 (이 수치 초과 시 open) */
  failureThreshold: number;
  /** 리셋 타임아웃 (ms) - open 상태에서 half-open으로 전환 */
  resetTimeoutMs: number;
  /** half-open 상태에서 성공 시 closed로 전환할 성공 횟수 */
  successThreshold: number;
}

/**
 * 서킷 브레이커 메트릭스
 */
export interface CircuitBreakerMetrics {
  /** 현재 상태 */
  state: CircuitState;
  /** 연속 실패 횟수 */
  failures: number;
  /** 마지막 실패 시간 */
  lastFailure: Date | null;
  /** 마지막 성공 시간 */
  lastSuccess: Date | null;
  /** 총 요청 수 */
  totalRequests: number;
  /** 총 성공 수 */
  totalSuccesses: number;
  /** 총 실패 수 */
  totalFailures: number;
}

// =============================================================================
// Feature Flag 타입
// =============================================================================

/**
 * AI Feature Flag 설정
 */
export interface AIFeatureFlags {
  /** Primary AI (Gemini) 활성화 */
  enableGemini: boolean;
  /** Secondary AI (Claude) 활성화 */
  enableClaude: boolean;
  /** Primary 실패 시 Secondary 사용 */
  useSecondaryOnPrimaryFailure: boolean;
  /** Primary 에러율 임계값 (% 초과 시 자동 스위칭) */
  primaryErrorThreshold: number;
  /** 강제 Mock 모드 */
  forceMock: boolean;
}

/**
 * 기본 Feature Flag 값
 */
export const DEFAULT_AI_FLAGS: AIFeatureFlags = {
  enableGemini: true,
  enableClaude: true,
  useSecondaryOnPrimaryFailure: true,
  primaryErrorThreshold: 10,
  forceMock: false,
};

// =============================================================================
// 모니터링 타입
// =============================================================================

/**
 * AI 메트릭스
 */
export interface AIMetrics {
  /** Provider별 성공률 */
  providerSuccessRate: Record<AIProviderName, number>;
  /** Provider별 평균 응답시간 (ms) */
  providerLatency: Record<AIProviderName, number>;
  /** Fallback 발생률 */
  fallbackRate: number;
  /** 서킷 브레이커 상태 */
  circuitState: Record<AIProviderName, CircuitState>;
}

// =============================================================================
// 유틸리티 타입
// =============================================================================

/**
 * 재시도 옵션
 */
export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier?: number;
}

/**
 * 타임아웃 옵션
 */
export interface TimeoutOptions {
  timeoutMs: number;
  errorMessage?: string;
}
