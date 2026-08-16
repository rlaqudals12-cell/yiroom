/**
 * 데모 결과 페이지 — 가입 없이 샘플 퍼스널컬러 결과 체험
 *
 * 서버 컴포넌트: 페이지 전용 메타데이터(공유 시 랜딩 OG가 뜨던 문제 해소)와
 * CTA를 서버 HTML에 실어 보낸다. 진단지 시트만 클라이언트 자식(DemoReportSheet).
 * DB 조회/API 호출 없이 순수 정적 데모.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Info } from 'lucide-react';
import { DemoReportSheet } from './_components/DemoReportSheet';

const DEMO_DESCRIPTION =
  '가입 없이 미리 보는 이룸 퍼스널컬러 진단지 샘플이에요. 12톤 진단명·컬러 팔레트·스타일 가이드를 실제 결과 그대로 확인해보세요.';

export const metadata: Metadata = {
  title: '퍼스널컬러 샘플 리포트',
  description: DEMO_DESCRIPTION,
  alternates: { canonical: '/demo/personal-color' },
  openGraph: {
    title: '퍼스널컬러 샘플 리포트 | 이룸',
    description: DEMO_DESCRIPTION,
    url: '/demo/personal-color',
    type: 'website',
  },
};

/**
 * 분석 시작 경로 — 미로그인이면 Clerk가 로그인 후 이 경로로 되돌려 준다.
 * (SignedIn/SignedOut으로 감싸면 서버 HTML에 CTA가 0개로 나가므로 게이팅 밖에 둔다)
 */
const START_HREF = '/analysis/integrated?onboarding=1';

export default async function DemoPersonalColorPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('landing');

  // 깊이: 결과 페이지와 동일한 크림 지면 — 데모는 PC 결과의 공개 미러라 지면도 동기화
  return (
    <div className="min-h-screen bg-surface-ground" data-testid="demo-personal-color">
      {/* 데모 배너 */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-foreground text-sm font-medium">
            <Info className="w-4 h-4 shrink-0 text-primary" />
            <span>{t('demoBanner')}</span>
          </div>
          <Link
            href={START_HREF}
            data-testid="demo-banner-cta"
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('demoBannerCta')}
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* 기존 AnalysisResult 컴포넌트 재사용 — md+ 진단지 2단 밀도용 ~880px (R5, 결과 페이지와 동기화) */}
      <div className="mx-auto max-w-[880px] px-4 py-6">
        <DemoReportSheet />

        {/* 하단 CTA — 문구는 랜딩과 동일(startFree), 퍼널도 온보딩 파라미터까지 동일 */}
        <div className="mt-8 mb-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">{t('demoBottomNote')}</p>
          <Link
            href={START_HREF}
            data-testid="demo-bottom-cta"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('startFree')}
          </Link>
        </div>
      </div>
    </div>
  );
}
