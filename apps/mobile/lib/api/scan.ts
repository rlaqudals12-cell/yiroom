/**
 * 성분표 OCR HTTP 클라이언트 (웹 API 재사용) — thin client
 *
 * @module lib/api/scan
 * @description
 *   웹 POST /api/scan/ocr를 모바일에서 호출한다. Gemini 키는 서버에만 존재한다.
 *
 *   왜 웹 API 경유인가 (2026-07-16 감사 수리):
 *   기존 온디바이스 OCR(lib/scan/ingredient-ocr)은 EXPO_PUBLIC_GEMINI_API_KEY를
 *   APK에 내장해야 동작했다 — eas.json에 키가 없으면 프로덕션 빌드에서 스캔이
 *   통째로 죽고, 키를 넣으면 APK에서 추출 가능해 서버의 예산캡·레이트리밋을
 *   우회하는 과금 경로가 된다. thin client 원칙(ADR-118)대로 서버 경유로 교체.
 *
 * @see apps/web/app/api/scan/ocr/route.ts
 * @see docs/PLAY-STORE-LISTING-DRAFT.md 심층 감사 2차
 */

import type { OcrResult } from '@/lib/scan/ingredient-ocr';

import { getApiBaseUrl } from './base-url';

export class ScanOcrApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ScanOcrApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * 성분표 이미지 OCR (서버 Gemini 경유).
 *
 * @param clerkToken Clerk JWT (getToken()으로 획득) — 없으면 즉시 실패
 * @param imageBase64 다운스케일된 성분표 base64
 * @param baseUrl 웹 API base URL (미지정 시 getApiBaseUrl()이 env·프로덕션 웹 순으로 해석)
 * @throws ScanOcrApiError 설정 누락·미인증·네트워크/서버 실패
 */
export async function fetchIngredientOcr(
  clerkToken: string | null,
  imageBase64: string,
  baseUrl?: string
): Promise<OcrResult> {
  const url = getApiBaseUrl(baseUrl);
  if (!clerkToken) {
    throw new ScanOcrApiError('로그인이 필요해요.', 401, 'AUTH_ERROR');
  }

  let response: Response;
  try {
    response = await fetch(`${url}/api/scan/ocr`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'Content-Type': 'application/json',
        // 서버사이드 계측용 플랫폼 식별 (브리핑과 동일 관례 — ADR-103)
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ image: imageBase64 }),
    });
  } catch {
    throw new ScanOcrApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: Partial<OcrResult> & { error?: string } = {};
  try {
    json = (await response.json()) as typeof json;
  } catch {
    json = {};
  }

  if (!response.ok) {
    throw new ScanOcrApiError(json.error ?? '성분표 분석에 실패했어요.', response.status);
  }

  // 웹 라우트는 OcrResult를 그대로 반환한다 (성공/실패 여부는 result.success)
  return json as OcrResult;
}
