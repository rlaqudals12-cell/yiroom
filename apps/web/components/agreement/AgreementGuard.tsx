'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { withReturnTo, currentDestination } from '@/lib/navigation';

// 동의 체크 제외 경로
const EXCLUDED_PATHS = [
  '/agreement',
  '/terms',
  '/privacy',
  '/licenses',
  '/help',
  '/sign-in',
  '/sign-up',
];

/**
 * 약관동의 가드 컴포넌트
 * 미동의 사용자를 /agreement 페이지로 리디렉션
 * SDD-TERMS-AGREEMENT.md §7.1
 */
export function AgreementGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const checkedRef = useRef(false);

  useEffect(() => {
    async function checkAgreement() {
      // 이미 체크했거나 로딩 중이면 스킵
      if (!isLoaded || checkedRef.current) return;

      // 미로그인 사용자는 체크 안 함
      if (!isSignedIn) return;

      // 제외 경로는 체크 안 함
      if (EXCLUDED_PATHS.some((path) => pathname?.startsWith(path))) return;

      checkedRef.current = true;

      try {
        const { data, error } = await supabase
          .from('user_agreements')
          .select('terms_agreed, privacy_agreed, biometric_agreed')
          .maybeSingle();

        if (error) {
          console.error('[AgreementGuard] Error:', error?.code, error?.message);
          return;
        }

        // 동의 정보가 없거나 필수 동의(약관·개인정보·생체정보)가 false인 경우
        // 원 목적지(pathname+search)를 returnTo로 보존 — 동의 완료 후 복귀
        // (가입=첫 미팅 퍼널: /analysis/integrated?onboarding=1 도달 보장, ADR-114)
        if (!data || !data.terms_agreed || !data.privacy_agreed || !data.biometric_agreed) {
          router.replace(withReturnTo('/agreement', currentDestination(pathname)));
        }
      } catch (err) {
        console.error('[AgreementGuard] Exception:', err);
      }
    }

    checkAgreement();
  }, [isLoaded, isSignedIn, pathname, router, supabase]);

  // 체크 중에는 아무것도 렌더링하지 않음 (레이아웃에서 children은 별도로 렌더링)
  return null;
}

export default AgreementGuard;
