/**
 * 연령 검증 미들웨어 유틸리티
 * proxy.ts에서 사용
 */
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { isMinor } from './index';

/**
 * 사용자의 연령 검증 상태를 확인
 *
 * @param clerkUserId - Clerk 사용자 ID
 * @returns 검증 결과
 */
export async function checkUserAgeStatus(clerkUserId: string): Promise<{
  hasBirthDate: boolean;
  isMinor: boolean;
  birthDate: string | null;
}> {
  try {
    const supabase = createClerkSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('birth_date')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error || !data) {
      // 사용자 레코드가 없으면 생년월일 미입력으로 처리
      return {
        hasBirthDate: false,
        isMinor: false,
        birthDate: null,
      };
    }

    const birthDate = data.birth_date;

    if (!birthDate) {
      return {
        hasBirthDate: false,
        isMinor: false,
        birthDate: null,
      };
    }

    return {
      hasBirthDate: true,
      isMinor: isMinor(birthDate),
      birthDate,
    };
  } catch (error) {
    console.error('[AgeVerification] Error checking user age status:', error);
    // 에러 시 안전하게 처리 (서비스 차단하지 않음)
    return {
      hasBirthDate: true,
      isMinor: false,
      birthDate: null,
    };
  }
}

/**
 * 연령 검증이 필요한 라우트인지 확인
 * 공개 라우트, 인증 관련, API, 정적 파일 등은 제외
 */
export function isAgeVerificationRequiredRoute(pathname: string): boolean {
  // 연령 검증 제외 경로 패턴
  const excludedPatterns = [
    // 인증 관련
    /^\/sign-in/,
    /^\/sign-up/,
    /^\/age-restricted/,
    /^\/complete-profile/,
    // 공개 페이지
    /^\/$/,
    /^\/home/,
    /^\/privacy/,
    /^\/terms/,
    /^\/help/,
    /^\/announcements/,
    /^\/licenses/,
    /^\/offline/,
    // API
    /^\/api/,
    // 정적 파일
    /^\/_next/,
    /^\/manifest/,
    /^\/robots\.txt/,
    /^\/sitemap\.xml/,
    /^\/favicon/,
  ];

  return !excludedPatterns.some((pattern) => pattern.test(pathname));
}
