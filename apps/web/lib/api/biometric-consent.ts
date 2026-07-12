/**
 * 생체정보 수집·이용 동의 서버 게이트 (BIPA / PIPA 제23조 / GDPR Art.9)
 *
 * 얼굴·체형 이미지를 처리하는 분석 라우트에서 auth 직후·AI 호출 전에 호출한다.
 * `user_agreements.biometric_agreed`(가입 시 별도 필수 동의)가 true가 아니면 403을 반환해,
 * 클라이언트 가드(AgreementGuard)를 우회한 직접 API 호출에서도 동의 없는 생체 처리를 차단한다.
 *
 * 저장 동의(image_consents)와는 별개다: 이 게이트는 "수집·처리" 동의(글로벌·1회)를 확인하고,
 * image_consents는 "결과 저장" 동의(분석 유형별)를 관장한다.
 */
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { forbiddenError } from '@/lib/api/error-response';

/**
 * 생체 수집 동의 확인.
 * @param userId - Clerk 사용자 ID
 * @returns 미동의 시 403 응답, 동의 시 null
 * @example
 *   const denied = await requireBiometricConsent(userId);
 *   if (denied) return denied;
 */
export async function requireBiometricConsent(userId: string): Promise<NextResponse | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from('user_agreements')
      .select('biometric_agreed')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (data?.biometric_agreed === true) {
      return null;
    }
  } catch (error) {
    // 조회 실패 시 fail-closed(차단) — 생체 처리 전 동의 확인이 원칙
    console.error('[biometric-consent] check failed:', error);
  }

  return forbiddenError(
    '생체정보(얼굴·체형 이미지) 수집·이용 동의가 필요합니다. 약관 동의 화면에서 동의 후 다시 시도해주세요.'
  );
}
