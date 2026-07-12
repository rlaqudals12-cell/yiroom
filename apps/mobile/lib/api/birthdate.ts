/**
 * 생년월일 조회·저장 HTTP 클라이언트 (웹 /api/user/birthdate 재사용)
 *
 * @module lib/api/birthdate
 * @description
 *   왜 필요한가 (근본 원인):
 *     서버가 생체분석 라우트(POST /api/analyze/integrated 등)에 연령 확인 게이트
 *     (requireAgeVerified, fail-closed)를 배포했다. users.birth_date가 없으면 403.
 *     그런데 모바일에는 생년월일 수집 UI가 없어 모바일 가입자는 통합분석이 항상 403으로
 *     막혔다. 이 클라이언트로 온보딩에서 생년월일을 수집·저장해 게이트를 통과시킨다.
 *
 *   ⚠️ 반드시 이 엔드포인트를 써야 하는 이유:
 *     서버 게이트는 users.birth_date(밑줄) 컬럼을 읽는다. settings/my-info.tsx가 쓰는
 *     raw supabase users.birthdate(밑줄 없음)와는 다른 컬럼이라 게이트를 만족시키지 못한다.
 *     웹 POST /api/user/birthdate만 birth_date에 upsert하며 만 14세 미만 저장을 거부한다.
 *
 * @see apps/web/app/api/user/birthdate/route.ts
 * @see apps/web/lib/api/age-verification-gate.ts (fail-closed 게이트)
 */

import { isValidBirthDate, parseBirthDate, isMinor, MINIMUM_AGE } from '@/lib/age-verification';

// ============================================
// 1. 타입
// ============================================

/** GET /api/user/birthdate 응답 data */
export interface BirthdateStatus {
  birthDate: string | null;
  hasBirthDate: boolean;
}

/**
 * 제출 시점 생년월일 게이트 결과 (순수 함수 evaluateBirthdateGate 반환값).
 * - ok:true + needsSave:false → 이미 서버에 저장돼 있어 추가 조치 불필요
 * - ok:true + needsSave:true  → 유효·성인 → birthDate를 저장 후 분석 진행
 * - ok:false                  → 검증 실패/미성년자 → message로 안내, 분석 호출 금지
 */
export type BirthdateGate =
  | { ok: true; needsSave: boolean; birthDate?: string }
  | { ok: false; message: string; isMinor?: boolean };

// ============================================
// 2. 에러 클래스
// ============================================

export class BirthdateApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;
  /** 만 14세 미만 등 연령 제한으로 차단됐으면 true (서버 403 AGE_RESTRICTION) */
  public readonly isMinor: boolean;

  constructor(message: string, status: number, code?: string, isMinor = false) {
    super(message);
    this.name = 'BirthdateApiError';
    this.status = status;
    this.code = code;
    this.isMinor = isMinor;
  }
}

// ============================================
// 3. 순수 게이트 (서버 requireAgeVerified와 동일 기준)
// ============================================

// 서버(age-verification-gate.ts)와 동일한 사용자 대면 메시지
const AGE_RESTRICTED_MESSAGE =
  `만 ${MINIMUM_AGE}세 이상만 이용할 수 있어요. 만 ${MINIMUM_AGE}세 미만은 법정대리인 동의가 필요해 ` +
  `생체정보 분석을 제공하지 않아요.`;

/**
 * 제출 시점 생년월일 게이트 (순수 함수).
 *
 * 서버 fail-closed 게이트를 클라에서 미리 재현해 (1) 중복 요구 방지, (2) 미성년자면
 * 분석 호출 자체를 막고 정직하게 안내한다. 저장은 이 함수가 통과시킨 값만 수행한다.
 *
 * @param hasStoredBirthdate 서버에 이미 생년월일이 저장돼 있으면 true
 * @param input 사용자가 입력한 생년월일 (YYYY-MM-DD, 미입력이면 빈 문자열)
 */
export function evaluateBirthdateGate(hasStoredBirthdate: boolean, input: string): BirthdateGate {
  // 이미 저장돼 있으면 추가 입력·저장 불필요 (중복 요구 금지)
  if (hasStoredBirthdate) return { ok: true, needsSave: false };

  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, message: '생년월일을 입력해주세요. (만 14세 이상 확인)' };
  }
  if (!isValidBirthDate(trimmed)) {
    return { ok: false, message: '올바른 생년월일 형식이 아니에요. (예: 2000-06-15)' };
  }
  // 서버와 동일 기준으로 만 14세 미만은 정직하게 차단 (분석 호출 안 함)
  const parsed = parseBirthDate(trimmed);
  if (parsed && isMinor(parsed)) {
    return { ok: false, message: AGE_RESTRICTED_MESSAGE, isMinor: true };
  }
  return { ok: true, needsSave: true, birthDate: trimmed };
}

// ============================================
// 4. HTTP 클라이언트
// ============================================

function resolveBaseUrl(baseUrl?: string): string {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new BirthdateApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }
  return url;
}

/**
 * 현재 사용자의 생년월일 저장 여부 조회.
 *
 * @param clerkToken Clerk JWT (getToken()으로 획득)
 * @param baseUrl 웹 API base URL (기본: EXPO_PUBLIC_YIROOM_API_URL)
 * @throws BirthdateApiError 설정 누락·네트워크·서버 오류
 */
export async function fetchBirthdate(
  clerkToken: string,
  baseUrl?: string
): Promise<BirthdateStatus> {
  const url = resolveBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/user/birthdate`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        // 서버사이드 계측용 플랫폼 식별 (통합분석과 동일 관례)
        'x-yiroom-client': 'mobile',
      },
    });
  } catch {
    throw new BirthdateApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  // 웹 응답: 성공 { success:true, data:{ birthDate, hasBirthDate } }
  //          실패 { success:false, error: <코드>, message: <사용자 메시지> }
  let json: {
    success?: boolean;
    data?: { birthDate?: string | null; hasBirthDate?: boolean };
    error?: string;
    message?: string;
  } = {};
  try {
    json = (await response.json()) as typeof json;
  } catch {
    json = {};
  }

  if (!response.ok || json.success !== true || !json.data) {
    throw new BirthdateApiError(
      json.message ?? '생년월일을 불러올 수 없어요.',
      response.status,
      json.error
    );
  }

  return {
    birthDate: json.data.birthDate ?? null,
    hasBirthDate: json.data.hasBirthDate === true,
  };
}

/**
 * 생년월일 저장 (upsert). 서버가 만 14세 미만이면 403(AGE_RESTRICTION)으로 거부한다.
 *
 * @param birthDate YYYY-MM-DD
 * @param clerkToken Clerk JWT
 * @param baseUrl 웹 API base URL (기본: EXPO_PUBLIC_YIROOM_API_URL)
 * @throws BirthdateApiError 검증(400)·연령제한(403)·네트워크·서버 오류 — message는 사용자 대면 한국어
 */
export async function saveBirthdate(
  birthDate: string,
  clerkToken: string,
  baseUrl?: string
): Promise<void> {
  const url = resolveBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/user/birthdate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ birthDate }),
    });
  } catch {
    throw new BirthdateApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: { success?: boolean; error?: string; message?: string; isMinor?: boolean } = {};
  try {
    json = (await response.json()) as typeof json;
  } catch {
    json = {};
  }

  if (!response.ok || json.success !== true) {
    throw new BirthdateApiError(
      json.message ?? '생년월일을 저장할 수 없어요.',
      response.status,
      json.error,
      json.isMinor === true
    );
  }
}
