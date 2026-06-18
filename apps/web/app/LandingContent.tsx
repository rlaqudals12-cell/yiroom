'use client';

import { useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Scissors,
  Sparkles,
  Palette,
  Wand2,
  User,
  Droplets,
  Sun,
  Shirt,
  Camera,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
// ADR-098 정체성 재정의 v2 — 5축 모델(PC/S/C/H/M) 반영
// 기존 workout 모듈은 WELLNESS_PHASE2 보류로 헤어 분석으로 교체
const MODULE_META = [
  {
    id: 'personal-color',
    href: '/analysis/personal-color',
    gradient: 'from-pink-400 to-rose-500',
    icon: Palette,
  },
  {
    id: 'skin',
    href: '/analysis/skin',
    gradient: 'from-amber-400 to-orange-500',
    icon: Sparkles,
  },
  {
    id: 'body',
    href: '/analysis/body',
    gradient: 'from-blue-400 to-indigo-500',
    icon: User,
  },
  {
    id: 'hair',
    href: '/analysis/hair',
    gradient: 'from-violet-400 to-purple-500',
    icon: Scissors,
  },
  {
    id: 'makeup',
    href: '/analysis/makeup',
    gradient: 'from-fuchsia-400 to-pink-500',
    icon: Wand2,
  },
];

// 1-3: 결과 미리보기 카드 아이콘 + 색상
const PREVIEW_META = [
  {
    icon: Sun,
    iconColor: 'text-pink-400',
    colors: ['#F9A8D4', '#FBCFE8', '#F472B6', '#EC4899', '#DB2777'],
    gradient: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-500/30',
  },
  {
    icon: Droplets,
    iconColor: 'text-amber-400',
    colors: [],
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    score: 78,
  },
  {
    icon: Shirt,
    iconColor: 'text-blue-400',
    colors: [],
    gradient: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/30',
  },
  {
    icon: Scissors,
    iconColor: 'text-violet-400',
    colors: [],
    gradient: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/30',
  },
];

// 2-4: 스크롤 fade-in 훅
// observer를 lazy 초기화하여 ref 콜백 시점에 항상 사용 가능하게 함
function useScrollReveal(): (node: HTMLElement | null) => void {
  const observerRef = useRef<IntersectionObserver | null>(null);

  // lazy 초기화 — ref 콜백이 호출되기 전에 observer 생성 보장
  const getObserver = useCallback((): IntersectionObserver => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('landing-visible');
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
    }
    return observerRef.current;
  }, []);

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (node) getObserver().observe(node);
    },
    [getObserver]
  );

  return ref;
}

export function LandingContent(): React.JSX.Element {
  const t = useTranslations('landing');
  const observe = useScrollReveal();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-950" data-testid="landing-page">
      {/* 스크롤 애니메이션 CSS → globals.css로 분리 */}
      <div className="w-full px-4 md:px-10 lg:px-40 py-5">
        <div className="mx-auto max-w-[960px] w-full">
          {/* 언어 전환은 설정 페이지 LocaleSwitcher에서 관리 */}

          {/* 히어로 섹션 + 2-1: 비주얼 앵커 (우측 결과 카드 목업) */}
          <div className="p-0 md:p-4">
            <div className="relative min-h-[560px] md:rounded-2xl overflow-hidden bg-gradient-to-br from-[#0A0A0B] via-[#1A1A2E] to-[#16213E]">
              <div className="absolute top-6 left-6 z-10 flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs tracking-[0.3em] text-zinc-400 uppercase whitespace-nowrap">
                  Yiroom Intelligence
                </span>
                <span className="text-xs text-pink-400 font-medium whitespace-nowrap">
                  IDENTITY
                </span>
              </div>
              <div className="absolute top-6 right-6 flex gap-2 z-10">
                <span className="px-3 py-1 bg-white/5 backdrop-blur-sm text-zinc-300 rounded-full text-xs font-medium border border-white/10">
                  Beta
                </span>
              </div>

              {/* 2-1: 비주얼 앵커 — 4축 시각 정체성 (ADR-098 PC/S/C/H) 2×2 그리드 */}
              <div className="hidden md:grid grid-cols-2 gap-2.5 absolute top-1/2 right-6 -translate-y-1/2 z-[5]">
                {/* 퍼스널컬러 미니 카드 */}
                <div className="w-[150px] rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 hover:bg-white/10 hover:border-white/20 transition-colors duration-300">
                  <p className="text-[10px] text-pink-400 font-medium mb-1">Personal Color</p>
                  <p className="text-white text-sm font-bold truncate">{t('miniCardSpringWarm')}</p>
                  <div className="flex gap-1 mt-2">
                    {['#F9A8D4', '#F472B6', '#EC4899', '#DB2777'].map((c) => (
                      <div
                        key={c}
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                {/* 피부 점수 미니 카드 */}
                <div className="w-[150px] rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 hover:bg-white/10 hover:border-white/20 transition-colors duration-300">
                  <p className="text-[10px] text-amber-400 font-medium mb-1">Skin Vitality</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-white">78</span>
                    <span className="text-[10px] text-zinc-400">/100</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-700 rounded-full mt-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{ width: '78%' }}
                    />
                  </div>
                </div>
                {/* 체형 미니 카드 */}
                <div className="w-[150px] rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 hover:bg-white/10 hover:border-white/20 transition-colors duration-300">
                  <p className="text-[10px] text-blue-400 font-medium mb-1">Body Type</p>
                  <p className="text-white text-sm font-bold truncate">{t('miniCardSType')}</p>
                  <p className="text-zinc-400 text-[10px] mt-1 truncate">{t('miniCardWaistFit')}</p>
                </div>
                {/* 헤어 미니 카드 */}
                <div className="w-[150px] rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 hover:bg-white/10 hover:border-white/20 transition-colors duration-300">
                  <p className="text-[10px] text-violet-400 font-medium mb-1">Hair Style</p>
                  <p className="text-white text-sm font-bold truncate">{t('miniCardHairLabel')}</p>
                  <p className="text-zinc-400 text-[10px] mt-1 truncate">{t('miniCardHairDesc')}</p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 md:max-w-[60%]">
                <h1
                  style={{
                    fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
                    fontWeight: 900,
                    lineHeight: 1.1,
                    background: 'linear-gradient(to right, #f9a8d4, #e879f9, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {t('heroTitle')}
                </h1>
                <p
                  style={{
                    color: '#d4d4d8',
                    fontSize: '0.875rem',
                    marginTop: '1rem',
                    maxWidth: '28rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {t('heroDesc')}
                </p>

                {/* 1-2: 소셜 프루프 */}
                <p className="mt-3 text-xs text-zinc-500">✦ {t('socialProof')}</p>

                {/* ADR-101: 통합 분석 플로우로 CTA 일원화 */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <SignedOut>
                    <SignInButton mode="modal" forceRedirectUrl="/analysis/integrated">
                      <Button className="h-12 px-6 md:h-14 md:px-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm md:text-base font-bold shadow-lg shadow-pink-500/25 transition-all duration-300">
                        <Palette className="w-4 h-4 mr-2" />
                        {t('startFree')}
                      </Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/home">
                      <Button className="h-12 px-6 md:h-14 md:px-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm md:text-base font-bold shadow-lg shadow-pink-500/25 transition-all duration-300">
                        {t('goToDashboard')}
                      </Button>
                    </Link>
                  </SignedIn>
                  <Link href="/demo/personal-color">
                    <Button
                      variant="outline"
                      className="h-12 px-6 md:h-14 md:px-8 rounded-xl border-zinc-700 text-zinc-300 hover:border-pink-500/50 hover:text-pink-300 text-sm md:text-base font-medium transition-all duration-300"
                    >
                      {t('demoCtaButton')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 모듈 태그 */}
          <div className="flex gap-3 px-4 pt-6 pb-3 overflow-x-auto md:flex-wrap md:px-3 scrollbar-hide">
            {MODULE_META.map((module, i) => (
              <div
                key={module.id}
                className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-neutral-900 border border-zinc-800 text-zinc-300 pl-4 pr-4 hover:border-pink-500/30 transition-colors"
              >
                <module.icon className="w-4 h-4 text-pink-400" />
                <p className="text-sm font-medium leading-normal">{t(`module${i}Title`)}</p>
              </div>
            ))}
          </div>

          {/* How it Works 3-Step */}
          <div ref={observe} className="landing-reveal px-4 pt-8 pb-2">
            <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4">
              {t('howItWorksTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Camera, gradient: 'from-rose-400 to-pink-500' },
                { icon: Sparkles, gradient: 'from-violet-400 to-purple-500' },
                { icon: BarChart3, gradient: 'from-blue-400 to-indigo-500' },
              ].map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className="flex items-center gap-3 md:flex-col md:gap-0">
                    {/* 숫자 배지 + 아이콘 */}
                    <div className="relative">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center`}
                      >
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-neutral-950 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                    {/* 제목 + 설명 (모바일: 가로 배치) */}
                    <div className="text-left md:text-center md:mt-3">
                      <h3 className="text-white font-semibold text-sm">{t(`step${i}Title`)}</h3>
                      <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                        {t(`step${i}Desc`)}
                      </p>
                    </div>
                  </div>
                  {/* 화살표 (md 이상, 마지막 제외) */}
                  {i < 2 && (
                    <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 웰니스 모듈 섹션 — 2-2: 강화된 설명 + 2-4: 스크롤 애니메이션 */}
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-8">
            {t('modulesTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 p-4">
            {MODULE_META.map((module, i) => (
              <Link key={module.id} href={module.href} className="group h-full">
                <div
                  ref={observe}
                  className="landing-reveal relative h-full rounded-2xl bg-neutral-900 border-glow-pink p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/10"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-3`}
                  >
                    <module.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">{t(`module${i}Title`)}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{t(`module${i}Desc`)}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* ADR-101: 통합 분석 플로우로 CTA 일원화 */}
          <div className="flex justify-center pt-4">
            <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 max-w-[600px] justify-center">
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/analysis/integrated">
                  <Button className="min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-11 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm font-bold leading-normal tracking-[0.015em] grow transition-all duration-300 shadow-lg shadow-pink-500/20">
                    <Palette className="w-4 h-4 mr-2" />
                    {t('ctaStart')}
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/home" className="grow">
                  <Button className="w-full min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-11 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-all duration-300 shadow-lg shadow-pink-500/20">
                    {t('ctaViewResults')}
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* 1-3: 결과 미리보기 섹션 — ADR-098 4축 정체성 (PC/S/C/H) */}
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-8">
            {t('previewTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {PREVIEW_META.map((meta, i) => {
              const Icon = meta.icon;
              return (
                <div
                  key={i}
                  ref={observe}
                  className={`landing-reveal rounded-2xl bg-neutral-900/50 backdrop-blur-sm border ${meta.border} p-6 hover:bg-neutral-900/80 transition-all duration-300`}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1">
                    {t(`preview${i}Tag`)}
                  </p>
                  <h3 className="text-white text-lg font-bold mb-1">{t(`preview${i}Label`)}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{t(`preview${i}Sub`)}</p>
                  {/* 퍼스널컬러 팔레트 미리보기 */}
                  {meta.colors.length > 0 && (
                    <div className="flex gap-1.5 mt-3">
                      {meta.colors.map((c) => (
                        <div
                          key={c}
                          className="w-6 h-6 rounded-full border border-white/10"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  )}
                  {/* 피부 점수 바 미리보기 */}
                  {meta.score && (
                    <div className="mt-3">
                      <div className="w-full h-2 bg-zinc-700 rounded-full">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                          style={{ width: `${meta.score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 데모 결과 링크 */}
          <div className="flex justify-center px-4 pt-2 pb-4">
            <Link
              href="/demo/personal-color"
              className="text-sm text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
            >
              {t('demoLink')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 하단 CTA — 1-5: 퍼스널컬러 통일 */}
          <section className="px-4 py-16" ref={observe}>
            <div
              className="landing-reveal"
              style={{
                maxWidth: '42rem',
                margin: '0 auto',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '0.75rem',
                  letterSpacing: '0.2em',
                  color: '#71717a',
                  textTransform: 'uppercase',
                  marginBottom: '1rem',
                }}
              >
                {t('bottomCtaLabel')}
              </p>
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '1rem',
                }}
              >
                {t('bottomCtaTitle')}
              </h2>
              <p
                style={{
                  color: '#a1a1aa',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  whiteSpace: 'pre-line',
                }}
              >
                {t('bottomCtaDesc')}
              </p>
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/analysis/integrated">
                  <Button className="inline-flex items-center gap-2 h-14 px-8 text-lg rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-pink-500/25 transition-all duration-300">
                    <Sparkles className="w-5 h-5" />
                    <span>{t('bottomCtaSignUp')}</span>
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/analysis/integrated">
                  <Button className="inline-flex items-center gap-2 h-14 px-8 text-lg rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-pink-500/25 transition-all duration-300">
                    <Sparkles className="w-5 h-5" />
                    <span>{t('bottomCtaAnalysis')}</span>
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </section>
        </div>
      </div>

      {/* 푸터 + 1-4: 면책 고지 */}
      <footer className="border-t border-zinc-800 bg-zinc-950" data-testid="footer">
        <div className="mx-auto max-w-[960px] px-4 py-8">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
            <Link href="/terms" className="hover:text-pink-400 transition-colors">
              {t('footerTerms')}
            </Link>
            <Link href="/privacy" className="hover:text-pink-400 transition-colors">
              {t('footerPrivacy')}
            </Link>
            <Link href="/licenses" className="hover:text-pink-400 transition-colors">
              {t('footerLicenses')}
            </Link>
            <Link href="/help/faq" className="hover:text-pink-400 transition-colors">
              {t('footerHelp')}
            </Link>
          </div>
          {/* 1-4: AI 면책 고지 */}
          <p className="mt-4 text-center text-[11px] text-zinc-600">{t('footerDisclaimer')}</p>
          <div className="mt-4 text-center text-xs text-zinc-500">
            <p>© {new Date().getFullYear()} Yiroom. All rights reserved.</p>
            <p className="mt-1 text-zinc-600">{t('footerSlogan')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
