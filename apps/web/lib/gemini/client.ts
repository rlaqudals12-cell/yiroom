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
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro-preview-06-05';

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
    config: {
      ...restConfig,
      safetySettings: safetySettings ?? DEFAULT_SAFETY_SETTINGS,
    },
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
    config: {
      ...restConfig,
      safetySettings: safetySettings ?? DEFAULT_SAFETY_SETTINGS,
    },
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
