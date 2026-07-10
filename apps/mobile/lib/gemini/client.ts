/**
 * Gemini API 클라이언트
 * API 호출, 지수 백오프 재시도, 이미지 변환 담당
 */
import { extractJsonFromCodeBlock } from '../utils/json-extract';
import { geminiLogger } from '../utils/logger';

// Gemini API 설정
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// 기본 모델 — 웹 기본(gemini-3.5-flash)과 정합. 구모델(gemini-1.5-flash)은 폐기 트랙이라 제거.
// 오버라이드: EXPO_PUBLIC_GEMINI_MODEL
const DEFAULT_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash';

// 모델별 generateContent 엔드포인트
function geminiEndpoint(model: string): string {
  return `${GEMINI_API_BASE}/${model}:generateContent`;
}

// 분석 타임아웃 (30초)
// 비전 입력 + 긴 Level 2 프롬프트는 3초를 상시 초과해 전 시도가 abort → Mock으로 조용히 강등됐다.
// 웹 관례(피부 실측 3~19초)와 정합하도록 30초로 상향.
const ANALYSIS_TIMEOUT = 30000;

// 재시도 설정
// 타임아웃이 30초로 커진 만큼 총 소요를 억제하려 재시도는 1회로 축소(최악 ~60초 + 백오프).
// 2회였을 때는 최악 ~90초+로 사용자가 체감상 무한 대기.
const MAX_RETRIES = 1;
const RETRY_BASE_DELAY = 1000;

// 로그·에러 메시지에 남길 원문 일부(진단용, 과도한 로그 방지 위해 절단)
function responseSnippet(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

// 429, 400, 403은 재시도해도 동일 결과 → 즉시 실패
function isRetryableStatus(status: number): boolean {
  return status !== 429 && status !== 400 && status !== 403;
}

/**
 * 이미지를 Base64로 변환
 */
export async function imageToBase64(imageUri: string): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function backoffDelay(retryCount: number): Promise<void> {
  const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Gemini API 호출 (지수 백오프 재시도 포함)
 */
export async function callGeminiAPI(
  prompt: string,
  imageBase64?: string,
  model: string = DEFAULT_MODEL,
  retryCount = 0
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const parts: ({ text: string } | { inline_data: { mime_type: string; data: string } })[] = [
    { text: prompt },
  ];

  if (imageBase64) {
    parts.unshift({
      inline_data: {
        mime_type: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT);

  try {
    const response = await fetch(`${geminiEndpoint(model)}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 재시도 불가능한 상태 코드는 즉시 throw
      if (!isRetryableStatus(response.status)) {
        throw new Error(`Gemini API error: ${response.status} (non-retryable)`);
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    clearTimeout(timeoutId);

    // non-retryable 에러는 재시도하지 않음
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('non-retryable')) {
      throw error;
    }

    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount);
      geminiLogger.warn(`API retry ${retryCount + 1}/${MAX_RETRIES} (${delay}ms 대기)`);
      await backoffDelay(retryCount);
      return callGeminiAPI(prompt, imageBase64, model, retryCount + 1);
    }

    throw error;
  }
}

// =============================================================================
// 웹 호환 API (Phase 3 동기화용)
// =============================================================================

/**
 * Gemini 사용 가능 여부 (웹 호환)
 */
export function isGeminiAvailable(): boolean {
  return !!GEMINI_API_KEY;
}

/** 웹 호환 Gemini 콘텐츠 파트 */
interface GeminiContentPart {
  inlineData: { mimeType: string; data: string };
}

/**
 * 이미지를 Gemini 입력 포맷으로 변환 (웹 호환)
 */
export function formatImageForGemini(base64Image: string): GeminiContentPart {
  const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  return {
    inlineData: { mimeType: 'image/jpeg', data },
  };
}

/** 웹 호환 Gemini 응답 */
interface GeminiResponse {
  text: string;
}

/** 웹 호환 Gemini 호출 파라미터 */
interface GeminiCallParams {
  prompt?: string;
  imageBase64?: string;
  model?: string;
  contents?: unknown;
  config?: Record<string, unknown>;
}

/**
 * Gemini 콘텐츠 생성 (웹 호환 래퍼)
 *
 * 웹에서 사용하는 다양한 호출 방식을 모바일의 callGeminiAPI로 변환
 */
export async function generateContent(params: GeminiCallParams): Promise<GeminiResponse> {
  // contents 배열에서 prompt 추출
  let prompt = params.prompt ?? '';
  let imageBase64: string | undefined;

  if (params.contents) {
    if (typeof params.contents === 'string') {
      prompt = params.contents;
    } else if (Array.isArray(params.contents)) {
      for (const part of params.contents) {
        if (typeof part === 'string') {
          prompt += part;
        } else if (part && typeof part === 'object') {
          const p = part as Record<string, unknown>;
          if ('text' in p && typeof p.text === 'string') {
            prompt += p.text;
          }
          if ('inlineData' in p) {
            const inlineData = p.inlineData as { data?: string };
            imageBase64 = inlineData?.data;
          }
        }
      }
    }
  }

  const text = await callGeminiAPI(prompt, imageBase64 ?? params.imageBase64, params.model);
  return { text };
}

/**
 * Gemini API 설정 검증
 */
export function validateGeminiConfig(): boolean {
  if (!GEMINI_API_KEY) {
    geminiLogger.warn('Missing EXPO_PUBLIC_GEMINI_API_KEY');
    return false;
  }
  return true;
}

/**
 * Gemini JSON 응답 파싱 (웹 호환)
 *
 * Gemini가 ```json 코드 펜스로 감싸거나 앞뒤에 산문을 붙여도 첫 JSON 객체를 추출해 파싱한다.
 * (기존 replace 방식은 산문이 섞이면 실패 → 분석기가 조용히 Mock으로 강등되던 원인)
 * 실패 시 원문 일부를 담은 에러를 throw해 호출부 로그에서 진단할 수 있게 한다.
 */
export function parseJsonResponse<T>(text: string): T {
  const jsonStr = extractJsonFromCodeBlock(text);
  if (!jsonStr) {
    throw new Error(`Gemini 응답에서 JSON을 찾지 못함: ${responseSnippet(text)}`);
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(`Gemini JSON 파싱 실패: ${responseSnippet(text)}`);
  }
}
