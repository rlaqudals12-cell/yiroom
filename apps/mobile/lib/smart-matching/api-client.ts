/**
 * Smart Matching 인증 HTTP 전송 계층
 *
 * 모바일은 데이터베이스를 직접 읽거나 쓰지 않고 웹 API에 사용자 토큰을 전달한다.
 */

import { getApiBaseUrl } from '@/lib/api/base-url';

export class SmartMatchingApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code = 'SMART_MATCHING_API_ERROR') {
    super(message);
    this.name = 'SmartMatchingApiError';
    this.status = status;
    this.code = code;
  }
}

function getErrorMessage(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) {
    return undefined;
  }

  const error = payload.error;
  if (typeof error === 'string') return error;
  if (typeof error !== 'object' || error === null) return undefined;

  if ('userMessage' in error && typeof error.userMessage === 'string') {
    return error.userMessage;
  }
  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return undefined;
}

/**
 * 기존 Smart Matching 웹 라우트를 호출한다.
 *
 * @param path `/api/smart-matching/...` 경로
 * @param clerkToken `useAuth().getToken()`으로 얻은 Clerk JWT
 */
export async function requestSmartMatching<T>(
  path: string,
  clerkToken: string | undefined,
  init: RequestInit = {}
): Promise<T> {
  if (!clerkToken) {
    throw new SmartMatchingApiError('로그인이 필요합니다.', 401, 'AUTH_ERROR');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${clerkToken}`,
    'x-yiroom-client': 'mobile',
  };
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...init.headers,
      },
    });
  } catch {
    throw new SmartMatchingApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    throw new SmartMatchingApiError(
      getErrorMessage(payload) ?? '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.',
      response.status
    );
  }

  return payload as T;
}

/** 웹 API가 없는 서버/관리자 작업은 anon DB로 우회하지 않고 명시적으로 중단한다. */
export function missingSmartMatchingApi(operation: string): never {
  throw new SmartMatchingApiError(
    `${operation} 기능은 아직 모바일 API를 지원하지 않습니다.`,
    501,
    'API_NOT_AVAILABLE'
  );
}
