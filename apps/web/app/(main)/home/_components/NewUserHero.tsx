'use client';

/**
 * 신규 사용자 히어로 섹션
 *
 * ADR-101: Primary CTA는 통합 분석 1개로 일원화 (이전: 2개 분기 카드)
 * P-UX6: 결과를 지어내지 않는 신뢰 문구 + 단일 진입점
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PAPER_GRAIN_URI } from '@/components/share/paper-grain';

export default function NewUserHero(): React.ReactElement {
  const t = useTranslations('home');

  return (
    <div data-testid="home-new-hero" role="region" aria-label={t('newUserGuide')}>
      {/* 히어로 카드 — 신규 상태 표면의 유일한 주인공(raised 섀도 + 세리프 앵커).
          보더는 히어로 전용 웜 시트 토큰(라이트 한정 — 다크는 기존 보더 유지) */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-warm-sheet)] bg-card p-6 shadow-[var(--shadow-raised)] dark:border-border dark:shadow-none">
        {/* 종이 그레인 — 히어로 한정 1겹(전 카드 살포 금지) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: PAPER_GRAIN_URI }}
        />
        <div className="relative">
          <h2 className="break-keep font-serif text-2xl font-semibold leading-snug text-foreground mb-2 whitespace-pre-line">
            {t('heroTitle')}
          </h2>

          {/* 가치/신뢰 문구 (가짜 DAU 제거 — 정직한 무료·삭제 카피) */}
          <p className="text-sm text-muted-foreground mb-5">{t('socialProof')}</p>

          {/* ADR-101: Primary CTA 통합 진입점 (이전 2개 분기 → 1개) */}
          <Link
            href="/analysis/integrated"
            data-testid="home-hero-integrated-cta"
            className="flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-primary hover:bg-primary/90 rounded-xl text-white font-bold shadow-sm transition-all"
          >
            <span className="text-base leading-snug">
              내 정체성 5가지 알아보기
              <span className="block text-xs font-normal text-white/80 mt-0.5">
                색 · 피부 · 체형 · 헤어 · 메이크업 한 번에 · 최대 1분
              </span>
            </span>
          </Link>

          {/* Secondary: 개별 분석 (심화/재측정용) */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-4 text-xs text-muted-foreground">
            <span className="text-muted-foreground/60">개별 분석:</span>
            <Link
              href="/analysis/personal-color"
              className="hover:text-foreground transition-colors"
            >
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
        </div>
      </div>
    </div>
  );
}
