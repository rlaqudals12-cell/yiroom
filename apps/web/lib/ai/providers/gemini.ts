/**
 * Gemini AI Provider Adapter
 *
 * Primary AI 프로바이더 - Gemini 3 Flash
 *
 * @module lib/ai/providers/gemini
 * @see docs/adr/ADR-055-multi-ai-backup-strategy.md
 * @see docs/adr/ADR-003-ai-model-selection.md
 */

import {
  generateContent as adapterGenerateContent,
  isGeminiAvailable as adapterIsGeminiAvailable,
  formatImageForGemini as adapterFormatImage,
  parseJsonResponse,
} from '@/lib/gemini/client';
import type { AIProvider, ImageAnalysisInput } from '../types';

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * Base64 이미지를 Gemini 형식으로 변환
 * @deprecated 어댑터의 formatImageForGemini 사용 권장
 */
export function formatImageForGemini(imageBase64: string) {
  return adapterFormatImage(imageBase64);
}

/**
 * JSON 응답 파싱 (마크다운 코드블록 제거)
 * @deprecated 어댑터의 parseJsonResponse 사용 권장
 */
export function parseGeminiJsonResponse<T>(text: string): T {
  return parseJsonResponse<T>(text);
}

// =============================================================================
// Gemini Provider
// =============================================================================

/**
 * Gemini 분석 실행
 *
 * @param input 이미지 분석 입력
 * @param prompt 분석 프롬프트
 * @returns 파싱된 JSON 응답
 */
export async function analyzeWithGemini<T>(input: ImageAnalysisInput, prompt: string): Promise<T> {
  if (!adapterIsGeminiAvailable()) {
    throw new Error('Gemini API key not configured');
  }

  const imagePart = adapterFormatImage(input.imageBase64);

  const result = await adapterGenerateContent({
    contents: [{ text: prompt }, imagePart],
    config: {
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });

  return parseJsonResponse<T>(result.text);
}

/**
 * Gemini Provider 팩토리
 *
 * @param prompt 분석에 사용할 프롬프트
 * @returns AIProvider 구현
 */
export function createGeminiProvider<T>(prompt: string): AIProvider<ImageAnalysisInput, T> {
  return {
    name: 'gemini',
    analyze: (input: ImageAnalysisInput) => analyzeWithGemini<T>(input, prompt),
    timeout: 3000, // ADR-055: Primary 타임아웃 3초
    maxRetries: 2, // ADR-055: Primary 재시도 2회
    priority: 1, // 최우선 순위
    isEnabled: () => {
      const available = adapterIsGeminiAvailable();
      const flagEnabled = process.env.ENABLE_GEMINI !== 'false';
      return available && flagEnabled;
    },
  };
}

/**
 * Gemini 사용 가능 여부 확인
 */
export function isGeminiAvailable(): boolean {
  return adapterIsGeminiAvailable();
}

/**
 * Gemini 모델 정보 조회
 */
export function getGeminiModelInfo(): { model: string; available: boolean } {
  return {
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-pro-preview-06-05',
    available: isGeminiAvailable(),
  };
}
