/**
 * 계정 즉시 삭제 HTTP 클라이언트
 *
 * 모바일은 사용자 행을 직접 수정하지 않고 웹 정본 API에 삭제를 위임한다.
 * 웹은 DB 행·비공개 스토리지·Clerk 계정을 모두 파기한 뒤에만 성공을 반환한다.
 *
 * @see apps/web/app/api/user/account/route.ts
 */

import type { DeleteAccountResponse } from '@/types/user-data';

import { getApiBaseUrl } from './base-url';

export class AccountApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AccountApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * 현재 사용자의 계정과 소유 데이터를 즉시 영구 삭제한다.
 *
 * @param confirmation Clerk 기본 이메일 — 웹이 인증 사용자 이메일과 다시 대조한다.
 * @param clerkToken Clerk JWT (`useAuth().getToken()`으로 획득)
 * @param baseUrl 웹 API base URL (미지정 시 공용 base-url 정본으로 해석)
 */
export async function deleteAccount(
  confirmation: string,
  clerkToken: string,
  baseUrl?: string
): Promise<DeleteAccountResponse> {
  const url = getApiBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/user/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ confirmation }),
    });
  } catch {
    throw new AccountApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let payload: Record<string, unknown> = {};
  try {
    const json: unknown = await response.json();
    if (typeof json === 'object' && json !== null) {
      payload = json as Record<string, unknown>;
    }
  } catch {
    // 왜: 프록시·플랫폼 오류가 HTML을 반환해도 JSON 파싱 오류를 사용자에게 노출하지 않는다.
  }

  if (!response.ok || payload.success !== true) {
    throw new AccountApiError(
      typeof payload.message === 'string'
        ? payload.message
        : '계정 삭제에 실패했어요. 잠시 후 다시 시도해주세요.',
      response.status,
      typeof payload.error === 'string' ? payload.error : undefined
    );
  }

  return {
    success: true,
    message:
      typeof payload.message === 'string' ? payload.message : '계정이 성공적으로 삭제되었습니다.',
    deletedAt: typeof payload.deletedAt === 'string' ? payload.deletedAt : undefined,
  };
}
