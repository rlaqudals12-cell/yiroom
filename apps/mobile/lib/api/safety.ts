/**
 * 안전 프로필·제품 안전 검사 모바일 thin client.
 * 민감정보 암호화와 안전 규칙은 웹 API가 정본이며 모바일에 복제하지 않는다(ADR-118).
 */
import { getApiBaseUrl } from './base-url';

export interface SafetyProfileData {
  conditions: string[];
  medications: string[];
  consentGiven: boolean;
}

export interface SafetyAlertData {
  type: 'ALLERGEN' | 'CONTRAINDICATION' | 'INTERACTION' | 'EWG';
  ingredient: string;
  reason: string;
  action: 'BLOCK' | 'WARN' | 'INFORM';
}

export interface SafetyReportData {
  productId: string;
  alerts: SafetyAlertData[];
  disclaimer: string;
}

export interface SaveSafetyProfileInput {
  conditions: string[];
  medications: string[];
  consentGiven: boolean;
  consentVersion?: string;
}

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: { code?: string; userMessage?: string; message?: string };
};

export class SafetyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'SafetyApiError';
  }
}

async function requestSafety<T>(
  path: string,
  clerkToken: string,
  init: RequestInit,
  baseUrl?: string
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl(baseUrl)}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new SafetyApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: ApiEnvelope<T> = {};
  try {
    json = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // 봉투가 아닌 응답도 성공으로 간주하지 않는다.
  }
  if (!response.ok || json.success !== true || !json.data) {
    throw new SafetyApiError(
      json.error?.userMessage ?? '안전 정보를 불러올 수 없어요.',
      response.status,
      json.error?.code
    );
  }
  return json.data;
}

export function fetchSafetyProfile(clerkToken: string, baseUrl?: string) {
  return requestSafety<SafetyProfileData>(
    '/api/safety/profile',
    clerkToken,
    { method: 'GET' },
    baseUrl
  );
}

export function saveSafetyProfile(
  input: SaveSafetyProfileInput,
  clerkToken: string,
  baseUrl?: string
) {
  return requestSafety<SafetyProfileData>(
    '/api/safety/profile',
    clerkToken,
    { method: 'PUT', body: JSON.stringify(input) },
    baseUrl
  );
}

export function checkProductSafety(
  input: { productId: string; ingredients: string[] },
  clerkToken: string,
  baseUrl?: string
) {
  return requestSafety<SafetyReportData>(
    '/api/safety/check',
    clerkToken,
    { method: 'POST', body: JSON.stringify(input) },
    baseUrl
  );
}
