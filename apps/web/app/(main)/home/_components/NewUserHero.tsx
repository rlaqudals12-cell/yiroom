'use client';

/**
 * 신규 사용자 히어로 섹션
 *
 * P-UX1: 2개 카드형 CTA (퍼스널 컬러 / 피부 분석)
 * P-UX6: Social Proof + 설문 대안
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Palette, Sparkles, ChevronRight } from 'lucide-react';
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

export default function NewUserHero() {
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

        {/* Primary CTA: 2개 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/analysis/personal-color"
            className="flex flex-col items-center gap-2 p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-violet-200/50 dark:border-violet-800/30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <Palette className="w-8 h-8 text-violet-500" />
            <span className="text-sm font-medium text-foreground">{t('personalColor')}</span>
          </Link>
          <Link
            href="/analysis/skin"
            className="flex flex-col items-center gap-2 p-4 bg-white/70 dark:bg-slate-800/70 rounded-xl border border-violet-200/50 dark:border-violet-800/30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <Sparkles className="w-8 h-8 text-indigo-500" />
            <span className="text-sm font-medium text-foreground">{t('skinAnalysis')}</span>
          </Link>
        </div>

        {/* Secondary: 텍스트 링크 */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
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
