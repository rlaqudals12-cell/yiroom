'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 to-sky-50 dark:from-zinc-900 dark:to-zinc-800">
      <SignUp
        // 가입 = 전속 뷰티팀 첫 미팅 — 가입 직후 통합분석 온보딩 모드로 직행 (ADR-114)
        forceRedirectUrl="/analysis/integrated?onboarding=1"
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl',
          },
        }}
      />
    </div>
  );
}
