/**
 * 모바일 Gemini 호환 유틸리티
 *
 * 비밀키를 앱 번들에 넣을 수 없으므로 직접 Google AI 호출은 영구 비활성화한다.
 * 실제 분석은 인증·동의 게이트가 있는 웹 API thin client를 사용해야 한다.
 */
import { extractJsonFromCodeBlock } from '../utils/json-extract';
import { geminiLogger } from '../utils/logger';

const DIRECT_GEMINI_DISABLED_MESSAGE =
  '모바일 앱에서는 Google AI를 직접 호출하지 않아요. 인증된 이룸 서버 API를 사용해주세요.';

// 로그·에러 메시지에 남길 원문 일부(진단용, 과도한 로그 방지 위해 절단)
function responseSnippet(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
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

/**
 * 과거 호출부의 타입 호환을 위한 fail-closed 함수.
 * 공개 환경변수나 Google 엔드포인트를 읽지 않으며 네트워크 요청도 만들지 않는다.
 */
export async function callGeminiAPI(
  _prompt: string,
  _imageBase64?: string,
  _model?: string,
  _retryCount = 0
): Promise<string> {
  throw new Error(DIRECT_GEMINI_DISABLED_MESSAGE);
}

// =============================================================================
// 웹 호환 API (Phase 3 동기화용)
// =============================================================================

/**
 * Gemini 사용 가능 여부 (웹 호환)
 */
export function isGeminiAvailable(): boolean {
  return false;
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
  geminiLogger.warn('모바일 직접 Gemini 호출은 비활성화되어 있어요. 웹 API를 사용해주세요.');
  return false;
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
