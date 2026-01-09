'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

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
          .select('terms_agreed, privacy_agreed')
          .maybeSingle();

        if (error) {
          console.error('[AgreementGuard] Error:', error);
          return;
        }

        // 동의 정보가 없거나 필수 동의가 false인 경우
        if (!data || !data.terms_agreed || !data.privacy_agreed) {
          router.replace('/agreement');
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
