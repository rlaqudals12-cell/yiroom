/**
 * Gemini SDK Adapter Layer
 *
 * @google/genai SDK를 래핑하여 프로젝트 전체에 일관된 인터페이스를 제공한다.
 * 모든 Gemini 호출은 이 모듈을 통해야 한다 (P8: 모듈 경계).
 *
 * @module lib/gemini/client
 * @see ADR-079 Gemini SDK 마이그레이션
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// --- 타입 정의 ---

export interface GeminiContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiSafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

export interface GeminiConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  safetySettings?: GeminiSafetySetting[];
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
  /** 3.5-flash thinking 제어 — 구조화 추출은 'low' (기본 medium은 느리고 재현성 저하) */
  thinkingConfig?: { thinkingLevel?: string };
}

export interface GeminiCallParams {
  model?: string;
  contents: string | GeminiContentPart[];
  config?: GeminiConfig;
}

export interface GeminiResponse {
  text: string;
}

// --- 상수 ---

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
// Gemini 3.5 Flash GA (2026-05-19): gemini-3-flash-preview가 폐기 목록에 올라 승계
// (2026-07-06 마이그레이션, thinking 파라미터 미사용이라 모델 ID 교체만으로 호환)
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

/**
 * 경량 모델 — 구조화 추출 작업용 (2026-07-07 A/B 실측 기반 모듈별 혼합 전략)
 *
 * 피부 분석(S-1/S-2): lite가 판정 5/5 동일 + 3~6초(3.5는 15~19초) + 1/6 가격 → lite.
 * 퍼스널컬러(PC): lite는 같은 사진에서 winter↔autumn 널뜀 + invalid JSON 생성 → 3.5 유지.
 * body/hair/makeup: 미검증 — 3.5 유지, 검증 후 확대.
 */
export const FAST_MODEL = process.env.GEMINI_MODEL_FAST || 'gemini-3.1-flash-lite';

// 기본 안전 설정 (기존 프로젝트와 동일)
export const DEFAULT_SAFETY_SETTINGS: GeminiSafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// --- 싱글톤 클라이언트 ---

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!_client) {
    _client = new GoogleGenAI({ apiKey: API_KEY });
  }
  return _client;
}

// --- 공개 API ---

/** Gemini 사용 가능 여부 확인 */
export function isGeminiAvailable(): boolean {
  return !!API_KEY && process.env.FORCE_MOCK_AI !== 'true';
}

/** 비스트리밍 콘텐츠 생성 */
export async function generateContent(params: GeminiCallParams): Promise<GeminiResponse> {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const { safetySettings, ...restConfig } = params.config ?? {};

  const response = await client.models.generateContent({
    model: params.model ?? DEFAULT_MODEL,
    contents: params.contents,
    // SDK 타입은 ThinkingLevel enum이지만 런타임은 문자열("low")을 수용 —
    // 기존 v1/v2 분석 경로가 문자열로 prod 검증됨. 타입 경계만 캐스트.
    config: {
      ...restConfig,
      safetySettings: safetySettings ?? DEFAULT_SAFETY_SETTINGS,
    } as Parameters<typeof client.models.generateContent>[0]['config'],
  });

  return { text: response.text ?? '' };
}

/** 스트리밍 콘텐츠 생성 */
export async function* generateContentStream(
  params: GeminiCallParams
): AsyncGenerator<string, void, unknown> {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini API key not configured');
  }

  const { safetySettings, ...restConfig } = params.config ?? {};

  const response = await client.models.generateContentStream({
    model: params.model ?? DEFAULT_MODEL,
    contents: params.contents,
    // SDK 타입은 ThinkingLevel enum이지만 런타임은 문자열("low")을 수용 —
    // 기존 v1/v2 분석 경로가 문자열로 prod 검증됨. 타입 경계만 캐스트.
    config: {
      ...restConfig,
      safetySettings: safetySettings ?? DEFAULT_SAFETY_SETTINGS,
    } as Parameters<typeof client.models.generateContent>[0]['config'],
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

/**
 * Base64 이미지를 Gemini inlineData 형식으로 변환
 * data:image/jpeg;base64,... 또는 raw base64 모두 지원
 */
export function formatImageForGemini(base64Image: string): GeminiContentPart {
  // data:image/...;base64,... 형식 검증
  if (!base64Image.startsWith('data:')) {
    throw new Error('Invalid base64 image format');
  }

  const match = base64Image.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid base64 image format');
  }

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

/**
 * Gemini 응답에서 JSON 파싱 (마크다운 코드블록 제거)
 * SDK 독립적 유틸리티
 */
export function parseJsonResponse<T>(text: string): T {
  // 모든 ``` 마커 제거 (중첩/반복 포함)
  const cleanText = text
    .replace(/```json\s*/g, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleanText) as T;
  } catch {
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

// re-export for convenience
export { HarmCategory, HarmBlockThreshold };
