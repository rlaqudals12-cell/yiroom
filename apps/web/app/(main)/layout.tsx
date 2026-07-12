import { ReactNode } from 'react';
import nextDynamic from 'next/dynamic';
import { AgreementGuard } from '@/components/agreement';
import { AgeVerificationProvider } from '@/components/providers/AgeVerificationProvider';
import { Footer } from '@/components/common';

// 조건부 렌더링 컴포넌트 — 대부분 사용자에게 불필요하므로 지연 로드
// OnboardingTutorial 오버레이는 ADR-114로 폐기(실제 통합분석 온보딩 모드가 대체)
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
      {/* 법적 링크 푸터 — 페이지 콘텐츠 흐름 끝에 배치 (root <main>의 pb-bottom-nav가
          모바일 고정 탭바와의 겹침을 방지) */}
      <Footer />
      <ProductCompare />
    </AgeVerificationProvider>
  );
}
