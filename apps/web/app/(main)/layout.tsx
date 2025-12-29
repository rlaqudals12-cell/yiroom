import { ReactNode } from 'react';
import { OnboardingTutorial } from '@/components/onboarding';
import { ProductCompare } from '@/components/products/ProductCompare';

// (main) 그룹 전체를 dynamic으로 설정
// Supabase/Clerk를 사용하는 페이지들은 빌드 시 prerendering 불가
export const dynamic = 'force-dynamic';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <OnboardingTutorial />
      <ProductCompare />
    </>
  );
}
