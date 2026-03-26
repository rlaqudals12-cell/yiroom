import { ReactNode } from 'react';
import nextDynamic from 'next/dynamic';
import { AgreementGuard } from '@/components/agreement';
import { AgeVerificationProvider } from '@/components/providers/AgeVerificationProvider';

// 조건부 렌더링 컴포넌트 — 대부분 사용자에게 불필요하므로 지연 로드 (-80KB)
const OnboardingTutorial = nextDynamic(
  () => import('@/components/onboarding').then((mod) => ({ default: mod.OnboardingTutorial })),
  { loading: () => null }
);
const ProductCompare = nextDynamic(
  () =>
    import('@/components/products/ProductCompare').then((mod) => ({
      default: mod.ProductCompare,
    })),
  { loading: () => null }
);

// (main) 그룹 전체를 dynamic으로 설정
// Supabase/Clerk를 사용하는 페이지들은 빌드 시 prerendering 불가
export const dynamic = 'force-dynamic';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AgeVerificationProvider>
      <AgreementGuard />
      {children}
      <OnboardingTutorial />
      <ProductCompare />
    </AgeVerificationProvider>
  );
}
