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
