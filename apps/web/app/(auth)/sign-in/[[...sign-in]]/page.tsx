'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  // 웜 크림 지면 위 백색 카드 = 2단 깊이 — 장식 그라데·zinc 다크 아일랜드 소거 (깊이 레시피)
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-ground">
      <SignIn
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
