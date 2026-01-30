/**
 * Multi-AI Provider 오케스트레이션
 *
 * 다중 AI 프로바이더 폴백 체인 구현
 * Primary (Gemini) → Secondary (Claude) → Mock
 *
 * @module lib/ai/multi-provider
 * @see docs/adr/ADR-055-multi-ai-backup-strategy.md
 */

import type {
  AIProvider,
  AIProviderName,
  AIAnalysisResult,
  ImageAnalysisInput,
  RetryOptions,
} from './types';
import { getCircuitBreaker, CircuitOpenError } from './circuit-breaker';
import { createGeminiProvider } from './providers/gemini';
import { createClaudeProvider } from './providers/claude';

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 타임아웃 적용 Promise 래퍼
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

/**
 * 재시도 로직 (지수 백오프)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, delayMs, backoffMultiplier = 1 } = options;
  let lastError: Error | null = null;
  let currentDelay = delayMs;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }
  }
  throw lastError;
}

// =============================================================================
// Multi-Provider 오케스트레이션
// =============================================================================

/**
 * Multi-AI 분석 실행
 *
 * ADR-055 폴백 체인:
 * 1. Primary (Gemini) - 타임아웃 3초, 재시도 2회
 * 2. Secondary (Claude) - 타임아웃 4초, 재시도 1회
 * 3. Mock Fallback - 즉시 반환
 *
 * @param providers 정렬된 프로바이더 배열
 * @param input 분석 입력
 * @param generateMock Mock 데이터 생성 함수
 * @returns 분석 결과 (provider, usedFallback 포함)
 */
export async function analyzeWithMultiAI<TInput, TOutput>(
  providers: AIProvider<TInput, TOutput>[],
  input: TInput,
  generateMock: () => TOutput
): Promise<AIAnalysisResult<TOutput>> {
  const startTime = Date.now();
  const attemptedProviders: AIProviderName[] = [];
  const errors: Record<string, string> = {};

  // 우선순위 순 정렬
  const sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);

  for (const provider of sortedProviders) {
    // 프로바이더 활성화 확인
    if (!provider.isEnabled()) {
      console.log(`[MultiAI] ${provider.name}: disabled, skipping`);
      continue;
    }

    attemptedProviders.push(provider.name);

    // 서킷 브레이커 확인
    const circuitBreaker = getCircuitBreaker(provider.name);
    if (!circuitBreaker.canExecute()) {
      console.log(`[MultiAI] ${provider.name}: circuit OPEN, skipping`);
      errors[provider.name] = 'Circuit breaker open';
      continue;
    }

    try {
      console.log(`[MultiAI] Trying ${provider.name}...`);

      // 서킷 브레이커를 통한 실행
      const result = await circuitBreaker.execute(() =>
        withTimeout(
          withRetry(() => provider.analyze(input), {
            maxRetries: provider.maxRetries,
            delayMs: 1000,
          }),
          provider.timeout,
          `[MultiAI] ${provider.name} timeout`
        )
      );

      const latencyMs = Date.now() - startTime;
      console.log(`[MultiAI] ${provider.name} succeeded in ${latencyMs}ms`);

      return {
        result,
        provider: provider.name,
        usedFallback: false,
        latencyMs,
        attemptedProviders,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors[provider.name] = errorMsg;

      if (error instanceof CircuitOpenError) {
        console.log(`[MultiAI] ${provider.name}: circuit open`);
      } else {
        console.error(`[MultiAI] ${provider.name} failed:`, errorMsg);
      }
      // 다음 프로바이더로 시도
    }
  }

  // 모든 AI 프로바이더 실패 → Mock Fallback
  console.warn('[MultiAI] All providers failed, using mock fallback');
  const latencyMs = Date.now() - startTime;

  return {
    result: generateMock(),
    provider: 'mock',
    usedFallback: true,
    latencyMs,
    attemptedProviders,
    errors: errors as Record<AIProviderName, string>,
  };
}

/**
 * 이미지 분석용 Multi-AI 실행
 *
 * 가장 일반적인 사용 패턴을 위한 편의 함수
 *
 * @param input 이미지 분석 입력
 * @param prompt 분석 프롬프트 (Gemini, Claude 공통)
 * @param generateMock Mock 데이터 생성 함수
 * @returns 분석 결과
 */
export async function analyzeImageWithMultiAI<T>(
  input: ImageAnalysisInput,
  prompt: string,
  generateMock: () => T
): Promise<AIAnalysisResult<T>> {
  // 프로바이더 생성
  const providers: AIProvider<ImageAnalysisInput, T>[] = [
    createGeminiProvider<T>(prompt),
    createClaudeProvider<T>(prompt),
  ];

  return analyzeWithMultiAI(providers, input, generateMock);
}

// =============================================================================
// 프롬프트 래퍼 함수
// =============================================================================

/**
 * S-2 피부분석용 Multi-AI 래퍼
 */
export function createSkinV2MultiAIAnalyzer<T>(
  prompt: string,
  generateMock: () => T
) {
  return (imageBase64: string) =>
    analyzeImageWithMultiAI<T>(
      { imageBase64, analysisType: 'skin-v2' },
      prompt,
      generateMock
    );
}

/**
 * PC-2 퍼스널컬러용 Multi-AI 래퍼
 */
export function createPersonalColorV2MultiAIAnalyzer<T>(
  prompt: string,
  generateMock: () => T
) {
  return (imageBase64: string) =>
    analyzeImageWithMultiAI<T>(
      { imageBase64, analysisType: 'personal-color-v2' },
      prompt,
      generateMock
    );
}

/**
 * C-2 체형분석용 Multi-AI 래퍼
 */
export function createBodyV2MultiAIAnalyzer<T>(
  prompt: string,
  generateMock: () => T
) {
  return (imageBase64: string) =>
    analyzeImageWithMultiAI<T>(
      { imageBase64, analysisType: 'body-v2' },
      prompt,
      generateMock
    );
}

/**
 * H-2 헤어분석용 Multi-AI 래퍼
 */
export function createHairV2MultiAIAnalyzer<T>(
  prompt: string,
  generateMock: () => T
) {
  return (imageBase64: string) =>
    analyzeImageWithMultiAI<T>(
      { imageBase64, analysisType: 'hair-v2' },
      prompt,
      generateMock
    );
}
