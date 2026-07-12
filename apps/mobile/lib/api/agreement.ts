/**
 * 약관·생체정보 동의 조회·저장 HTTP 클라이언트 (웹 /api/agreement 재사용)
 *
 * @module lib/api/agreement
 * @description
 *   왜 필요한가 (근본 원인):
 *     서버가 생체분석 라우트(POST /api/analyze/integrated 등)에 생체정보 수집·이용 동의
 *     게이트(requireBiometricConsent, fail-closed — BIPA/PIPA 제23조)를 배포했다.
 *     user_agreements.biometric_agreed가 true가 아니면 403. 웹은 /agreement 화면이
 *     게이트하지만 모바일에는 동의 수집 UI가 없어 모바일 가입자는 분석이 항상 403으로
 *     막혔다(생년월일 게이트와 동일 구조의 공백). 이 클라이언트로 온보딩에서 필수 동의를
 *     수집·저장해 게이트를 통과시킨다.
 *
 *   서버 계약 (apps/web/app/api/agreement/route.ts):
 *     - GET  → { hasAgreed } (필수 3종 동의 + 버전 일치 시에만 true)
 *     - POST → termsAgreed·privacyAgreed·biometricAgreed 모두 true 필수(아니면 400),
 *               gender('male'|'female') 필수(400). marketingAgreed는 선택.
 *
 * @see apps/web/app/api/agreement/route.ts
 * @see apps/web/lib/api/biometric-consent.ts (fail-closed 게이트)
 * @see docs/adr/ADR-119-legal-compliance-gates.md
 */

import { toUserMessage } from './error-text';

// ============================================
// 1. 타입
// ============================================

/** GET /api/agreement 응답 요약 */
export interface AgreementStatus {
  /** 필수 동의(약관·개인정보·생체) 완료 + 버전 일치 여부 */
  hasAgreed: boolean;
}

export type AgreementGender = 'male' | 'female';

/** 동의 화면에서 사용자가 체크한 상태 */
export interface AgreementChecks {
  terms: boolean;
  privacy: boolean;
  biometric: boolean;
}

/**
 * 제출 시점 동의 게이트 결과 (순수 함수 evaluateAgreementGate 반환값).
 * - ok:true + needsSave:false → 이미 서버에 동의돼 있어 추가 조치 불필요
 * - ok:true + needsSave:true  → 필수 체크·성별 완료 → 저장 후 분석 진행
 * - ok:false                  → 필수 미체크/성별 미선택 → message로 안내, 분석 호출 금지
 */
export type AgreementGate =
  | { ok: true; needsSave: boolean; gender?: AgreementGender }
  | { ok: false; message: string };

// ============================================
// 2. 에러 클래스
// ============================================

export class AgreementApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AgreementApiError';
    this.status = status;
    this.code = code;
  }
}

// ============================================
// 3. 순수 게이트 (서버 POST 검증과 동일 기준)
// ============================================

/**
 * 제출 시점 동의 게이트 (순수 함수).
 *
 * 서버 fail-closed 게이트(403)와 POST 검증(400)을 클라에서 미리 재현해
 * (1) 이미 동의한 사용자에게 중복 요구를 하지 않고,
 * (2) 필수 동의 없이는 분석 호출 자체를 막고 정직하게 안내한다.
 *
 * @param hasAgreed 서버에 이미 필수 동의가 저장돼 있으면 true
 * @param checks 사용자가 체크한 동의 상태
 * @param gender 선택한 성별 (서버 계약상 필수)
 */
export function evaluateAgreementGate(
  hasAgreed: boolean,
  checks: AgreementChecks,
  gender: AgreementGender | undefined
): AgreementGate {
  // 이미 동의돼 있으면 추가 요구 불필요 (중복 요구 금지)
  if (hasAgreed) return { ok: true, needsSave: false };

  if (!checks.terms || !checks.privacy || !checks.biometric) {
    return {
      ok: false,
      message: '분석을 위해 필수 약관(이용약관·개인정보·생체정보)에 모두 동의해주세요.',
    };
  }
  if (gender !== 'male' && gender !== 'female') {
    return { ok: false, message: '맞춤 분석을 위해 성별을 선택해주세요.' };
  }
  return { ok: true, needsSave: true, gender };
}

// ============================================
// 4. HTTP 클라이언트
// ============================================

function resolveBaseUrl(baseUrl?: string): string {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new AgreementApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }
  return url;
}

/**
 * 현재 사용자의 필수 동의 완료 여부 조회.
 *
 * @param clerkToken Clerk JWT (getToken()으로 획득)
 * @param baseUrl 웹 API base URL (기본: EXPO_PUBLIC_YIROOM_API_URL)
 * @throws AgreementApiError 설정 누락·네트워크·서버 오류
 */
export async function fetchAgreementStatus(
  clerkToken: string,
  baseUrl?: string
): Promise<AgreementStatus> {
  const url = resolveBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/agreement`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
    });
  } catch {
    throw new AgreementApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  // 웹 응답: { hasAgreed: boolean, agreement, requiresUpdate? } | { error }
  // error는 계약상 문자열이나, 예외 응답에선 객체일 수 있어 unknown으로 받는다.
  let json: { hasAgreed?: boolean; error?: unknown } = {};
  try {
    json = (await response.json()) as typeof json;
  } catch {
    json = {};
  }

  if (!response.ok) {
    // 마운트 조회 실패는 Promise.allSettled로 삼켜지지만, code에도 객체가 새지 않도록 문자열만 통과.
    throw new AgreementApiError(
      '동의 상태를 불러올 수 없어요.',
      response.status,
      typeof json.error === 'string' ? json.error : undefined
    );
  }

  return { hasAgreed: json.hasAgreed === true };
}

/**
 * 필수 동의 저장 (upsert). UI에서 필수 3종 체크를 확인한 뒤에만 호출한다.
 *
 * @param params gender(서버 필수) + marketingAgreed(선택)
 * @param clerkToken Clerk JWT
 * @param baseUrl 웹 API base URL (기본: EXPO_PUBLIC_YIROOM_API_URL)
 * @throws AgreementApiError 검증(400)·네트워크·서버 오류 — message는 사용자 대면 한국어
 */
export async function saveAgreement(
  params: { gender: AgreementGender; marketingAgreed?: boolean },
  clerkToken: string,
  baseUrl?: string
): Promise<void> {
  const url = resolveBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/agreement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({
        // 이 함수는 UI 게이트(evaluateAgreementGate) 통과 후에만 호출 — 필수 3종은 항상 true
        termsAgreed: true,
        privacyAgreed: true,
        biometricAgreed: true,
        marketingAgreed: params.marketingAgreed ?? false,
        gender: params.gender,
      }),
    });
  } catch {
    throw new AgreementApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  // error는 계약상 문자열이나, 예외 응답에선 객체일 수 있어 unknown으로 받는다.
  let json: { success?: boolean; error?: unknown } = {};
  try {
    json = (await response.json()) as typeof json;
  } catch {
    json = {};
  }

  if (!response.ok || json.success !== true) {
    // 왜: 서버가 flat 봉투가 아닌 예외 응답(Next 500 { error:{...} }, 게이트웨이 객체 등)을
    // 주면 json.error가 객체일 수 있다. 객체를 메시지로 승격하면 "[object Object]"가
    // 배너에 노출되므로(에뮬 실측) 문자열만 메시지로 쓴다.
    throw new AgreementApiError(
      toUserMessage(json.error, '동의 내용을 저장할 수 없어요.'),
      response.status,
      typeof json.error === 'string' ? json.error : undefined
    );
  }
}
