/**
 * Gemini AI Provider Adapter
 *
 * Primary AI 프로바이더 - Gemini 3 Flash
 *
 * @module lib/ai/providers/gemini
 * @see docs/adr/ADR-055-multi-ai-backup-strategy.md
 * @see docs/adr/ADR-003-ai-model-selection.md
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, ImageAnalysisInput } from '../types';

// =============================================================================
// 설정
// =============================================================================

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash-exp';

// Gemini 클라이언트 초기화
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// 모델 설정
const modelConfig = {
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 4096,
  },
};

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * Base64 이미지를 Gemini 형식으로 변환
 */
export function formatImageForGemini(imageBase64: string): {
  inlineData: { mimeType: string; data: string };
} {
  const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 image format');
  }

  return {
    inlineData: {
      mimeType: matches[1],
      data: matches[2],
    },
  };
}

/**
 * JSON 응답 파싱 (마크다운 코드블록 제거)
 */
export function parseGeminiJsonResponse<T>(text: string): T {
  const jsonText = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    console.error('[Gemini] JSON parse error:', error);
    console.error('[Gemini] Raw text:', text.substring(0, 500));
    throw new Error('Failed to parse Gemini response as JSON');
  }
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
export async function analyzeWithGemini<T>(
  input: ImageAnalysisInput,
  prompt: string
): Promise<T> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel(modelConfig);
  const imagePart = formatImageForGemini(input.imageBase64);

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();

  console.log(`[Gemini] ${input.analysisType} analysis completed`);

  return parseGeminiJsonResponse<T>(text);
}

/**
 * Gemini Provider 팩토리
 *
 * @param prompt 분석에 사용할 프롬프트
 * @returns AIProvider 구현
 */
export function createGeminiProvider<T>(
  prompt: string
): AIProvider<ImageAnalysisInput, T> {
  return {
    name: 'gemini',
    analyze: (input: ImageAnalysisInput) => analyzeWithGemini<T>(input, prompt),
    timeout: 3000, // ADR-055: Primary 타임아웃 3초
    maxRetries: 2, // ADR-055: Primary 재시도 2회
    priority: 1, // 최우선 순위
    isEnabled: () => {
      const forceMock = process.env.FORCE_MOCK_AI === 'true';
      const hasApiKey = !!API_KEY;
      const flagEnabled = process.env.ENABLE_GEMINI !== 'false';
      return !forceMock && hasApiKey && flagEnabled;
    },
  };
}

/**
 * Gemini 사용 가능 여부 확인
 */
export function isGeminiAvailable(): boolean {
  const forceMock = process.env.FORCE_MOCK_AI === 'true';
  return !forceMock && !!API_KEY;
}

/**
 * Gemini 모델 정보 조회
 */
export function getGeminiModelInfo(): { model: string; available: boolean } {
  return {
    model: MODEL_NAME,
    available: isGeminiAvailable(),
  };
}
