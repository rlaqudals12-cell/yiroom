/**
 * 연령 확인 게이트 (서버 사이드, Fail-Closed)
 *
 * 생체정보(얼굴·체형) 분석 라우트 진입 전에 만 14세 이상 여부를 서버에서 강제한다.
 *
 * 왜 서버에서 강제하나 (근본 원인):
 *   기존 연령 게이트는 클라이언트(AgeVerificationProvider)에만 있었고 fail-open이라,
 *   클라이언트 리다이렉트를 우회하면 미성년자도 생체분석 API에 직접 도달할 수 있었다.
 *   PIPA §22-2(만 14세 미만 법정대리인 동의)·미국 COPPA/BIPA 노출을 차단하려면
 *   생체분석 호출 직전에 서버에서 fail-closed로 막아야 한다.
 *
 * Fail-Closed 원칙:
 *   생년월일이 없거나 / 만 14세 미만이거나 / 조회가 실패하면 → 403으로 차단한다.
 *   "확인 불가"는 "통과"가 아니라 "차단"으로 처리한다 (생체정보 보호 우선).
 *   ※ lib/age-verification의 isMinor()는 null을 fail-open(false)으로 보므로 여기서 재사용하지 않고,
 *     연령 계산(calculateAge)만 재사용하고 판정은 fail-closed로 직접 구현한다.
 *
 * @module lib/api/age-verification-gate
 */

import type { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { forbiddenError } from '@/lib/api/error-response';
import { calculateAge, MINIMUM_AGE } from '@/lib/age-verification';

// 사용자 대면 한국어 메시지 (정중·자연스럽게)
const AGE_RESTRICTED_MESSAGE =
  '만 14세 이상만 이용할 수 있어요. 만 14세 미만은 법정대리인 동의가 필요해 생체정보 분석을 제공하지 않아요.';

/**
 * 생체분석 라우트용 연령 확인 게이트.
 *
 * @param userId - Clerk 사용자 ID
 * @returns 차단 시 403 NextResponse, 통과 시 null
 *
 * @example
 * const ageDenied = await requireAgeVerified(userId);
 * if (ageDenied) return ageDenied;
 */
export async function requireAgeVerified(userId: string): Promise<NextResponse | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('users')
      .select('birth_date')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    // Fail-closed: 조회 오류 또는 생년월일 부재(레코드 없음 포함) → 차단
    if (error || !data?.birth_date) {
      return forbiddenError(AGE_RESTRICTED_MESSAGE);
    }

    // Fail-closed: 만 14세 미만 → 차단
    if (calculateAge(data.birth_date) < MINIMUM_AGE) {
      return forbiddenError(AGE_RESTRICTED_MESSAGE);
    }

    // 만 14세 이상 → 통과
    return null;
  } catch (err) {
    // 예외도 fail-closed — 연령 확인이 불가능하면 생체분석을 막는다.
    console.error('[age-verification-gate] Fail-closed on error:', err);
    return forbiddenError(AGE_RESTRICTED_MESSAGE);
  }
}
