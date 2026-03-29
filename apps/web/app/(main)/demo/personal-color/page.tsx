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
import { ArrowRight, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AnalysisResult from '@/app/(main)/analysis/personal-color/_components/AnalysisResult';
import { generateMockPersonalColorResult, type SeasonType } from '@/lib/mock/personal-color';

// 봄 웜톤 고정 데모 데이터
function createDemoResult() {
  const result = generateMockPersonalColorResult();
  // 봄 웜톤으로 고정 (데모 일관성)
  return {
    ...result,
    seasonType: 'spring' as SeasonType,
    seasonLabel: '봄 웜톤',
    seasonDescription: '밝고 화사한 웜톤',
    confidence: 92,
    analyzedAt: new Date(),
  };
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
      <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm border-b border-amber-600/30">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white text-sm font-medium">
            <Info className="w-4 h-4 shrink-0" />
            <span>{t('demoBanner')}</span>
          </div>
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs shrink-0"
              >
                {t('demoBannerCta')}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Button
              size="sm"
              className="bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs shrink-0"
              onClick={() => router.push('/analysis/personal-color')}
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
            <SignInButton mode="modal">
              <Button className="h-12 px-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-pink-500/25">
                <Sparkles className="w-4 h-4 mr-2" />내 퍼스널컬러 분석하기
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Button
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-pink-500/25"
              onClick={() => router.push('/analysis/personal-color')}
            >
              <Sparkles className="w-4 h-4 mr-2" />내 퍼스널컬러 분석하기
            </Button>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}
