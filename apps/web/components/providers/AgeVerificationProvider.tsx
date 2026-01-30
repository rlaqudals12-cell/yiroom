'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AgeVerificationContextType {
  isVerified: boolean;
  isLoading: boolean;
  hasBirthDate: boolean;
}

const AgeVerificationContext = createContext<AgeVerificationContextType>({
  isVerified: false,
  isLoading: true,
  hasBirthDate: false,
});

export function useAgeVerification() {
  return useContext(AgeVerificationContext);
}

// 연령 검증 제외 경로
const EXCLUDED_PATHS = [
  '/sign-in',
  '/sign-up',
  '/age-restricted',
  '/complete-profile',
  '/privacy',
  '/terms',
  '/help',
  '/announcements',
  '/licenses',
  '/offline',
  '/',
  '/home',
  '/agreement',
];

interface Props {
  children: ReactNode;
}

/**
 * 연령 검증 Provider
 * 로그인한 사용자의 생년월일 검증 후 적절한 페이지로 리다이렉트
 */
export function AgeVerificationProvider({ children }: Props) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasBirthDate, setHasBirthDate] = useState(false);

  // 제외 경로인지 확인
  const isExcludedPath = EXCLUDED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  useEffect(() => {
    async function checkAgeVerification() {
      // Clerk 로딩 중
      if (!isLoaded) return;

      // 로그인하지 않은 경우
      if (!isSignedIn) {
        setIsLoading(false);
        setIsVerified(true); // 비로그인은 검증 불필요
        return;
      }

      // 제외 경로인 경우
      if (isExcludedPath) {
        setIsLoading(false);
        setIsVerified(true);
        return;
      }

      try {
        const response = await fetch('/api/user/birthdate');
        const data = await response.json();

        if (!data.success) {
          // API 오류 시 서비스 차단하지 않음
          console.error('[AgeVerification] API error:', data);
          setIsVerified(true);
          setIsLoading(false);
          return;
        }

        const { birthDate, hasBirthDate: hasBd } = data.data;
        setHasBirthDate(hasBd);

        // 생년월일 미입력
        if (!hasBd) {
          router.push('/complete-profile');
          return;
        }

        // 미성년자 확인 (클라이언트에서 재검증)
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }

        if (age < 14) {
          router.push('/age-restricted');
          return;
        }

        // 검증 완료
        setIsVerified(true);
      } catch (error) {
        console.error('[AgeVerification] Error:', error);
        // 에러 시 서비스 차단하지 않음
        setIsVerified(true);
      } finally {
        setIsLoading(false);
      }
    }

    checkAgeVerification();
  }, [isLoaded, isSignedIn, isExcludedPath, pathname, router]);

  // 로딩 중이고 보호된 경로인 경우
  if (isLoading && !isExcludedPath && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <AgeVerificationContext.Provider value={{ isVerified, isLoading, hasBirthDate }}>
      {children}
    </AgeVerificationContext.Provider>
  );
}
