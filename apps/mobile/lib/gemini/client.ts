/**
 * Gemini API 클라이언트
 * API 호출, 지수 백오프 재시도, 이미지 변환 담당
 */
import { geminiLogger } from '../utils/logger';

// Gemini API 설정
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// 분석 타임아웃 (3초)
const ANALYSIS_TIMEOUT = 3000;

// 재시도 설정
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 1000;

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
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Gemini API 호출 (지수 백오프 재시도 포함)
 */
export async function callGeminiAPI(
  prompt: string,
  imageBase64?: string,
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
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
      return callGeminiAPI(prompt, imageBase64, retryCount + 1);
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

  const text = await callGeminiAPI(prompt, imageBase64 ?? params.imageBase64);
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
 * ```json 마커 제거 후 JSON.parse
 */
export function parseJsonResponse<T>(text: string): T {
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
