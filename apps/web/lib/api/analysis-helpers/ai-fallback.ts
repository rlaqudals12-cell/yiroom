/**
 * AI 분석 + Mock 폴백 헬퍼
 *
 * @see ADR-007 Mock Fallback 전략
 * @see ADR-085
 */

import type { AIFallbackResult, AIFallbackOptions } from './types';

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * AI 호출 시도 후 실패 시 Mock 폴백
 *
 * @param aiCall - AI 분석 호출 함수
 * @param mockCall - Mock 데이터 생성 함수
 * @param options - 옵션 (forceMock, moduleId)
 * @returns 분석 결과 + 폴백 사용 여부
 *
 * @example
 * const { result, usedFallback } = await withAIFallback(
 *   () => analyzeSkinWithGemini(imageBase64),
 *   () => generateMockSkinResult(),
 *   { moduleId: 'S-1' }
 * );
 */
export async function withAIFallback<T>(
  aiCall: () => Promise<T>,
  mockCall: () => T,
  options: AIFallbackOptions = {}
): Promise<AIFallbackResult<T>> {
  const { forceMock = false, moduleId = 'Unknown' } = options;

  // Mock 모드 강제
  if (FORCE_MOCK || forceMock) {
    return { result: mockCall(), usedFallback: true };
  }

  // AI 호출 시도
  try {
    const result = await aiCall();
    return { result, usedFallback: false };
  } catch (error) {
    console.error(`[${moduleId}] AI 분석 실패, Mock 폴백:`, error);
    return { result: mockCall(), usedFallback: true };
  }
}
