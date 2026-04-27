'use client';

/**
 * 신규 사용자 히어로 섹션
 *
 * ADR-101: Primary CTA는 통합 분석 1개로 일원화 (이전: 2개 분기 카드)
 * P-UX6: Social Proof + 설문 대안
 * 비주얼 증거: 분석 결과 미리보기 카드 3종
 * 차별화: 통합 시너지 인과 체인 시각화
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Palette, Sparkles, ChevronRight, Droplet, Shirt, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 시드 데이터 기반 Social Proof (MVP: 실시간 API는 Phase 2)
function useSocialProofCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // 기본 시드값 + 시간대 기반 변동
    const hour = new Date().getHours();
    const base = 127;
    const variation = Math.floor(Math.sin(hour) * 30 + 50);
    setCount(base + variation);
  }, []);

  return count;
}

/**
 * 분석 결과 미리보기 카드 3종
 * CSS로 구현된 미니 프리뷰 — 실제 이미지 불필요
 */
function AnalysisPreviewCards({
  t,
}: {
  t: ReturnType<typeof useTranslations<'home'>>;
}): React.ReactElement {
  return (
    <div
      className="flex gap-3 mt-6"
      data-testid="hero-analysis-preview"
      role="group"
      aria-label={t('previewLabel')}
    >
      {/* 퍼스널컬러 미니카드 */}
      <div className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-xl p-3 flex-1 min-w-0">
        <div className="flex gap-1.5 mb-2">
          <div className="w-4 h-4 rounded-full bg-[#F472B6]" />
          <div className="w-4 h-4 rounded-full bg-[#EC4899]" />
          <div className="w-4 h-4 rounded-full bg-[#A855F7]" />
        </div>
        <p className="text-xs text-foreground/80 dark:text-white/80 font-medium">
          {t('previewSpringWarm')}
        </p>
        <p className="text-[10px] text-muted-foreground dark:text-white/50">
          {t('previewPersonalColor')}
        </p>
      </div>

      {/* 피부 분석 미니카드 */}
      <div className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-xl p-3 flex-1 min-w-0">
        <div className="text-lg font-bold text-foreground dark:text-white leading-tight">85</div>
        <p className="text-xs text-foreground/80 dark:text-white/80 font-medium">
          {t('previewSkinScore')}
        </p>
        <p className="text-[10px] text-muted-foreground dark:text-white/50">
          {t('previewSkinAnalysis')}
        </p>
      </div>

      {/* 체형 분석 미니카드 */}
      <div className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-xl p-3 flex-1 min-w-0">
        <div className="w-6 h-6 mb-1">
          <Shirt className="w-5 h-5 text-foreground/60 dark:text-white/60" aria-hidden="true" />
        </div>
        <p className="text-xs text-foreground/80 dark:text-white/80 font-medium">
          {t('previewNatural')}
        </p>
        <p className="text-[10px] text-muted-foreground dark:text-white/50">
          {t('previewBodyType')}
        </p>
      </div>
    </div>
  );
}

// 시너지 스텝 데이터
const SYNERGY_STEPS = [
  {
    icon: Palette,
    colorFrom: 'from-pink-400',
    colorTo: 'to-rose-500',
    key: 'synergyStep1' as const,
  },
  {
    icon: Droplet,
    colorFrom: 'from-sky-400',
    colorTo: 'to-blue-500',
    key: 'synergyStep2' as const,
  },
  {
    icon: Sparkles,
    colorFrom: 'from-violet-400',
    colorTo: 'to-purple-500',
    key: 'synergyStep3' as const,
  },
  {
    icon: ShoppingBag,
    colorFrom: 'from-amber-400',
    colorTo: 'to-orange-500',
    key: 'synergyStep4' as const,
  },
];

/**
 * 통합 시너지 인과 체인 시각화
 * 퍼스널컬러 → 피부 분석 → 메이크업 추천 → 제품 매칭
 */
function SynergyChain({
  t,
}: {
  t: ReturnType<typeof useTranslations<'home'>>;
}): React.ReactElement {
  return (
    <div
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-sm"
      data-testid="hero-synergy-chain"
      role="region"
      aria-label={t('synergyLabel')}
    >
      <h3 className="text-sm font-bold text-foreground mb-1">{t('synergyTitle')}</h3>
      <p className="text-xs text-muted-foreground mb-5">{t('synergySubtitle')}</p>

      {/* 가로 스텝 인디케이터 */}
      <div className="flex items-start justify-between gap-1">
        {SYNERGY_STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-start flex-1 min-w-0">
              {/* 스텝 */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.colorFrom} ${step.colorTo} flex items-center justify-center shadow-sm`}
                >
                  <Icon className="w-[18px] h-[18px] text-white" aria-hidden="true" />
                </div>
                <p className="text-[11px] font-medium text-foreground mt-2 text-center leading-tight">
                  {t(step.key)}
                </p>
              </div>

              {/* 연결 화살표 (마지막 스텝 제외) */}
              {idx < SYNERGY_STEPS.length - 1 && (
                <div className="flex items-center pt-3 px-0.5 shrink-0">
                  <ChevronRight
                    className="w-3.5 h-3.5 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function NewUserHero(): React.ReactElement {
  const todayCount = useSocialProofCount();
  const t = useTranslations('home');

  return (
    <div data-testid="home-new-hero" role="region" aria-label={t('newUserGuide')}>
      {/* 히어로 카드 */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-2xl p-6 mb-4">
        <h2 className="text-lg font-bold text-foreground mb-2 whitespace-pre-line">
          {t('heroTitle')}
        </h2>

        {/* Social Proof */}
        {todayCount > 0 && (
          <p className="text-sm text-muted-foreground mb-5">
            {t('socialProof', { count: todayCount.toLocaleString() })}
          </p>
        )}

        {/* ADR-101: Primary CTA 통합 진입점 (이전 2개 분기 → 1개) */}
        <Link
          href="/analysis/integrated"
          data-testid="home-hero-integrated-cta"
          className="flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 rounded-xl text-white font-bold shadow-md shadow-pink-500/20 transition-all"
        >
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          <span className="text-base leading-snug">
            내 정체성 5축 알아보기
            <span className="block text-xs font-normal text-white/80 mt-0.5">
              색 · 피부 · 체형 · 헤어 한 번에 · 약 2분
            </span>
          </span>
        </Link>

        {/* Secondary: 개별 분석 (심화/재측정용) */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-4 text-xs text-muted-foreground">
          <span className="text-muted-foreground/60">개별 분석:</span>
          <Link href="/analysis/personal-color" className="hover:text-foreground transition-colors">
            {t('personalColor')}
          </Link>
          <span>·</span>
          <Link href="/analysis/skin" className="hover:text-foreground transition-colors">
            {t('skinAnalysis')}
          </Link>
          <span>·</span>
          <Link href="/analysis/body" className="hover:text-foreground transition-colors">
            {t('bodyAnalysis')}
          </Link>
          <span>·</span>
          <Link href="/analysis/hair" className="hover:text-foreground transition-colors">
            {t('hairAnalysis')}
          </Link>
          <span>·</span>
          <Link href="/analysis/makeup" className="hover:text-foreground transition-colors">
            {t('makeupAnalysis')}
          </Link>
        </div>

        {/* 분석 결과 미리보기 카드 3종 */}
        <AnalysisPreviewCards t={t} />
      </div>

      {/* 통합 시너지 인과 체인 */}
      <div className="mb-4">
        <SynergyChain t={t} />
      </div>

      {/* 설문 대안 (P-UX6: 사진 거부감 대안) */}
      <div data-testid="home-new-survey-alt">
        <Link
          href="/onboarding/survey"
          className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{t('surveyAltLabel')}</span>
          <div className="flex items-center gap-1">
            <span>{t('surveyAltAction')}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
