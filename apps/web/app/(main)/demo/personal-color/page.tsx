'use client';

/**
 * 데모 결과 페이지 — 가입 없이 샘플 퍼스널컬러 결과 체험
 *
 * 기존 AnalysisResult 컴포넌트를 그대로 재사용하고,
 * 봄 웜톤 고정 Mock 데이터를 표시합니다.
 * DB 조회/API 호출 없이 순수 정적 데모.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SignedOut, SignInButton, SignedIn } from '@clerk/nextjs';
import { ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnalysisResult from '@/app/(main)/analysis/personal-color/_components/AnalysisResult';
import { generateSeasonPersonalColorResult } from '@/lib/mock/personal-color';
import { getCardPalette } from '@/lib/share/tone-palettes';

// 봄 웜톤 고정 데모 데이터 — 립/스타일은 spring 시즌 상수에서 결정론 구성.
// 팔레트는 12톤 표준 큐레이션(트루 스프링)으로 교체 — 웹세이프 목업색(골드×2 등
// 이름 중복)이 첫 방문 표면에 노출되지 않게, 공유카드·통합 리포트와 같은 색을 말한다.
function createDemoResult() {
  const base = generateSeasonPersonalColorResult('spring', 92);
  const curated = getCardPalette('true-spring', 'ko');
  if (curated) {
    base.bestColors = curated.best.map((c) => ({ hex: c.hex, name: c.name }));
    base.personalizedColors = false;
    base.paletteToneKey = 'true-spring';
  }
  return base;
}

export default function DemoPersonalColorPage(): React.JSX.Element {
  const t = useTranslations('landing');
  const router = useRouter();
  const demoResult = createDemoResult();

  const handleRetry = useCallback(() => {
    router.push('/analysis/personal-color');
  }, [router]);

  return (
    <div className="min-h-screen" data-testid="demo-personal-color">
      {/* 데모 배너 */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-foreground text-sm font-medium">
            <Info className="w-4 h-4 shrink-0 text-primary" />
            <span>{t('demoBanner')}</span>
          </div>
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/analysis/integrated?onboarding=1">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shrink-0"
              >
                {t('demoBannerCta')}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shrink-0"
              onClick={() => router.push('/analysis/integrated')}
            >
              {t('demoBannerCta')}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </SignedIn>
        </div>
      </div>

      {/* 기존 AnalysisResult 컴포넌트 재사용 */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        <AnalysisResult result={demoResult} onRetry={handleRetry} />

        {/* 하단 CTA */}
        <div className="mt-8 mb-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            이것은 샘플이에요. 내 사진으로 분석하면 더 정확한 결과를 받을 수 있어요.
          </p>
          <SignedOut>
            <SignInButton mode="modal" forceRedirectUrl="/analysis/integrated?onboarding=1">
              <Button className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                내 퍼스널컬러 분석하기
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Button
              className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              onClick={() => router.push('/analysis/integrated')}
            >
              내 퍼스널컬러 분석하기
            </Button>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
