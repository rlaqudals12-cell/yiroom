/**
 * 선택 동의(이용기록 분석·마케팅) HTTP 클라이언트.
 * 웹 `/api/agreement/preferences`가 저장 정본이며 모바일은 thin client로만 동작한다.
 */

import { getApiBaseUrl } from './base-url';
import { toUserMessage } from './error-text';

export interface ConsentPreferences {
  analyticsConsent: boolean;
  marketingConsent: boolean;
}

export interface ConsentPreferencesPatch {
  analyticsConsent?: boolean;
  marketingConsent?: boolean;
}

interface ApiErrorPayload {
  code?: unknown;
  userMessage?: unknown;
}

export class ConsentPreferencesApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ConsentPreferencesApiError';
    this.status = status;
    this.code = code;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function parsePreferences(value: unknown): ConsentPreferences | null {
  const record = asRecord(value);
  if (
    !record ||
    typeof record.analyticsConsent !== 'boolean' ||
    typeof record.marketingConsent !== 'boolean'
  ) {
    return null;
  }
  return {
    analyticsConsent: record.analyticsConsent,
    marketingConsent: record.marketingConsent,
  };
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return asRecord((await response.json()) as unknown) ?? {};
  } catch {
    return {};
  }
}

function readApiError(json: Record<string, unknown>): ApiErrorPayload {
  return asRecord(json.error) ?? {};
}

function throwResponseError(
  response: Response,
  json: Record<string, unknown>,
  fallback: string
): never {
  const error = readApiError(json);
  throw new ConsentPreferencesApiError(
    toUserMessage(error.userMessage, fallback),
    response.status,
    typeof error.code === 'string' ? error.code : undefined
  );
}

/** 서버에 저장된 선택 동의 상태를 조회한다. 행이 없으면 서버가 false/false를 반환한다. */
export async function fetchConsentPreferences(
  clerkToken: string,
  baseUrl?: string
): Promise<ConsentPreferences> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl(baseUrl)}/api/agreement/preferences`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
    });
  } catch {
    throw new ConsentPreferencesApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  const json = await readJson(response);
  if (!response.ok || json.success !== true) {
    throwResponseError(response, json, '동의 상태를 불러올 수 없어요.');
  }

  const preferences = parsePreferences(json.data);
  if (!preferences) {
    throw new ConsentPreferencesApiError(
      '동의 상태를 불러올 수 없어요.',
      response.status,
      'INVALID_RESPONSE'
    );
  }
  return preferences;
}

/** 하나 또는 두 선택 동의를 서버에 저장한다. */
export async function updateConsentPreferences(
  patch: ConsentPreferencesPatch,
  clerkToken: string,
  baseUrl?: string
): Promise<ConsentPreferences> {
  if (patch.analyticsConsent === undefined && patch.marketingConsent === undefined) {
    throw new ConsentPreferencesApiError('변경할 동의 설정이 없습니다.', 400, 'VALIDATION_ERROR');
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl(baseUrl)}/api/agreement/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify(patch),
    });
  } catch {
    throw new ConsentPreferencesApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  const json = await readJson(response);
  if (!response.ok || json.success !== true) {
    throwResponseError(response, json, '동의 설정을 저장할 수 없어요.');
  }

  const preferences = parsePreferences(json.data);
  if (!preferences) {
    throw new ConsentPreferencesApiError(
      '동의 설정을 저장할 수 없어요.',
      response.status,
      'INVALID_RESPONSE'
    );
  }
  return preferences;
}
