import { LATEST_CONSENT_VERSION } from '@/lib/consent';

import { getApiBaseUrl } from './base-url';
import { toUserMessage } from './error-text';

export type ImageStorageConsentType =
  | 'skin'
  | 'body'
  | 'personal-color'
  | 'hair'
  | 'makeup'
  | 'twin';

interface ImageStorageConsentRecord {
  consent_given?: unknown;
  consent_version?: unknown;
  retention_until?: unknown;
}

export class ImageStorageConsentApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ImageStorageConsentApiError';
    this.status = status;
    this.code = code;
  }
}

/** 최신 버전이고 보관 기한이 남은 명시 동의만 활성으로 본다. */
export function isImageStorageConsentActive(
  consent: ImageStorageConsentRecord | null | undefined,
  now: Date = new Date()
): boolean {
  if (
    consent?.consent_given !== true ||
    consent.consent_version !== LATEST_CONSENT_VERSION ||
    typeof consent.retention_until !== 'string'
  ) {
    return false;
  }

  const retentionUntil = new Date(consent.retention_until).getTime();
  return Number.isFinite(retentionUntil) && retentionUntil > now.getTime();
}

function headers(clerkToken: string, withBody = false): Record<string, string> {
  return {
    ...(withBody ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${clerkToken}`,
    'x-yiroom-client': 'mobile',
  };
}

function parseError(
  json: unknown,
  fallback: string
): { message: string; code: string | undefined } {
  if (json && typeof json === 'object') {
    const body = json as Record<string, unknown>;
    if (typeof body.error === 'string') {
      return { message: body.error, code: undefined };
    }
    if (body.error && typeof body.error === 'object') {
      const error = body.error as Record<string, unknown>;
      return {
        message: toUserMessage(error.userMessage, fallback),
        code: typeof error.code === 'string' ? error.code : undefined,
      };
    }
  }
  return { message: fallback, code: undefined };
}

/** 웹 정본의 축별 이미지 저장 동의 상태를 조회한다. 조회 실패는 호출부가 fail-closed한다. */
export async function fetchImageStorageConsent(
  analysisType: ImageStorageConsentType,
  clerkToken: string,
  baseUrl?: string
): Promise<boolean> {
  const url = getApiBaseUrl(baseUrl);
  let response: Response;
  try {
    response = await fetch(`${url}/api/consent?analysisType=${analysisType}`, {
      method: 'GET',
      headers: headers(clerkToken),
    });
  } catch {
    throw new ImageStorageConsentApiError(
      '사진 저장 동의 상태를 확인할 수 없어요.',
      0,
      'NETWORK_ERROR'
    );
  }

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = parseError(json, '사진 저장 동의 상태를 확인할 수 없어요.');
    throw new ImageStorageConsentApiError(error.message, response.status, error.code);
  }

  const consent =
    json && typeof json === 'object'
      ? ((json as { consent?: ImageStorageConsentRecord | null }).consent ?? null)
      : null;
  return isImageStorageConsentActive(consent);
}

/** 웹 정본 API를 통해 축별 이미지 저장 동의를 명시적으로 저장한다. */
export async function saveImageStorageConsent(
  analysisType: ImageStorageConsentType,
  clerkToken: string,
  baseUrl?: string
): Promise<void> {
  const url = getApiBaseUrl(baseUrl);
  let response: Response;
  try {
    response = await fetch(`${url}/api/consent`, {
      method: 'POST',
      headers: headers(clerkToken, true),
      body: JSON.stringify({ analysisType }),
    });
  } catch {
    throw new ImageStorageConsentApiError('사진 저장 동의를 저장할 수 없어요.', 0, 'NETWORK_ERROR');
  }

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = parseError(json, '사진 저장 동의를 저장할 수 없어요.');
    throw new ImageStorageConsentApiError(error.message, response.status, error.code);
  }
}
