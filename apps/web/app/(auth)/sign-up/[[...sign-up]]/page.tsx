'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  // 웜 크림 지면 위 백색 카드 = 2단 깊이 — 장식 그라데·zinc 다크 아일랜드 소거 (깊이 레시피)
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-ground">
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
