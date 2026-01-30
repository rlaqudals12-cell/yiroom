'use client';

import { useClerk } from '@clerk/nextjs';
import { ShieldAlert, LogOut, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { MINIMUM_AGE } from '@/lib/age-verification';

/**
 * 만 14세 미만 접근 제한 페이지
 * 한국 청소년보호법에 따라 만 14세 미만 사용자의 서비스 이용 제한
 */
export default function AgeRestrictedPage() {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' });
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
      data-testid="age-restricted-page"
    >
      <div className="max-w-md w-full text-center space-y-6">
        {/* 아이콘 */}
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold text-foreground">
          서비스 이용이 제한됩니다
        </h1>

        {/* 설명 */}
        <div className="space-y-3 text-muted-foreground">
          <p>
            이룸은 <strong className="text-foreground">만 {MINIMUM_AGE}세 이상</strong>만 이용할 수 있습니다.
          </p>
          <p className="text-sm">
            한국 청소년보호법에 따라 만 14세 미만 아동의 개인정보 수집이
            제한되어 있습니다.
          </p>
        </div>

        {/* 안내 박스 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
          <p className="text-sm text-amber-800">
            <strong>보호자 안내</strong>
            <br />
            만 14세 미만 아동의 개인정보 수집을 위해서는 법정대리인의 동의가
            필요합니다. 현재 이룸은 법정대리인 동의 기능을 제공하지 않습니다.
          </p>
        </div>

        {/* 버튼 */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>

          <Link
            href="/help"
            className="w-full flex items-center justify-center gap-2 border border-border py-3 rounded-xl font-medium hover:bg-muted transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            도움말
          </Link>
        </div>

        {/* 하단 안내 */}
        <p className="text-xs text-muted-foreground pt-4">
          잘못된 생년월일을 입력하셨다면{' '}
          <Link href="/help" className="text-primary hover:underline">
            고객센터
          </Link>
          에 문의해 주세요.
        </p>
      </div>
    </div>
  );
}
