import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { LandingContent } from './LandingContent';

export default async function Home() {
  // 로그인 사용자는 마케팅 랜딩 대신 내 홈(프로필)으로 — 랜딩의 중복 CTA 혼란 제거
  const { userId } = await auth();
  if (userId) redirect('/home');

  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  );
}
