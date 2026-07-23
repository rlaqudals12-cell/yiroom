'use client';

/* eslint-disable no-restricted-syntax --
   랜딩은 진단지·공유카드와 같은 "지면"으로 크림 라이트 고정이다(프리미엄 뷰티 관습 —
   이솝·설화수·탬버린즈 전부 라이트 전용). 테마 토글을 따르지 않으므로 고정 hex를 쓴다.
   (카드 fixed-hex와 동일 관례 · 2026-07-18 레퍼런스 리서치 3갈래 수렴) */

/**
 * 랜딩 v2 — 타이포·여백-포워드 에디토리얼 (2026-07-18 레퍼런스 리서치 수렴안)
 *
 * 문법 출처: 이솝(텍스트-포워드 히어로·정물 부유) + 레어뷰티(인터랙티브 팔레트 스트립) +
 * 탬버린즈(무채색 컨테이너, 색은 콘텐츠에서만) + 진단 퍼널 공통 골격(훅→신뢰 밴드→결과 미리보기→게이트).
 * 무드 층 = 사진 0 정본: CSS 컬러필드 + 그레인 + 오버사이즈 세리프 + 진단 팔레트 파생색.
 * 금지: 장식 그라데·글로우·글래스·Sparkles·인물 사진(스톡·생성형 모두 — 초상권/슬롭).
 */

import { useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Scissors,
  Palette,
  Brush,
  User,
  Droplet,
  Camera,
  Wand2,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { PersonaShareCard } from '@/components/share/PersonaShareCard';
import { PhotocardTilt } from '@/components/share/PhotocardTilt';
import { PAPER_GRAIN_URI } from '@/components/share/paper-grain';
import { getCardPalette, type CardPalette } from '@/lib/share/tone-palettes';
import type { OutputLocale } from '@/lib/gemini/client';

// 지면 고정 팔레트 — 공유카드·리포트와 동일 계열(cream/ink/rose)
const INK = 'text-[#2B2320]';
const MUTED = 'text-[#8C7F78]';
const SOFT = 'text-[#B6A9A1]';
const CTA_SOLID =
  'rounded-full bg-[#EC4899] font-semibold text-white transition-colors hover:bg-[#DB2777]';

// ADR-098 5축 모델 — 축색은 아이콘에만, 카드 지면은 중립(색 산발 금지)
const MODULE_META = [
  {
    id: 'personal-color',
    href: '/analysis/personal-color',
    icon: Palette,
    iconClass: 'text-module-personal-color',
  },
  { id: 'skin', href: '/analysis/skin', icon: Droplet, iconClass: 'text-module-skin' },
  { id: 'body', href: '/analysis/body', icon: User, iconClass: 'text-module-body' },
  { id: 'hair', href: '/analysis/hair', icon: Scissors, iconClass: 'text-module-hair' },
  { id: 'makeup', href: '/analysis/makeup', icon: Brush, iconClass: 'text-module-makeup' },
];

// 12톤 스펙트럼 스트립 순서 — 웜(봄)→쿨(여름)→웜딥(가을)→쿨딥(겨울) 자연 흐름
const SPECTRUM_TONES = [
  'light-spring',
  'true-spring',
  'bright-spring',
  'light-summer',
  'true-summer',
  'muted-summer',
  'muted-autumn',
  'true-autumn',
  'deep-autumn',
  'deep-winter',
  'true-winter',
  'bright-winter',
] as const;

// 미리보기 = 실큐레이션 팔레트로 렌더한 진짜 발급 카드(i18n sampleNTone/Line과 인덱스 정합)
const SAMPLE_TONES = ['true-spring', 'deep-winter', 'true-autumn'] as const;
const SAMPLE_ROTATIONS = ['md:-rotate-1', 'md:rotate-[0.5deg]', 'md:rotate-1'] as const;

const HOW_STEPS = [{ icon: Camera }, { icon: Wand2 }, { icon: FileText }] as const;

// 스크롤 fade-in 훅 — observer를 lazy 초기화하여 ref 콜백 시점에 항상 사용 가능하게 함
function useScrollReveal(): (node: HTMLElement | null) => void {
  const observerRef = useRef<IntersectionObserver | null>(null);

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

/** 지원 4로케일로 좁힘(그 외 ko) — 카드 팔레트 색이름 해석용 */
function toOutputLocale(locale: string): OutputLocale {
  return (['ko', 'en', 'ja', 'zh'] as const).includes(locale as OutputLocale)
    ? (locale as OutputLocale)
    : 'ko';
}

export function LandingContent(): React.JSX.Element {
  const t = useTranslations('landing');
  const locale = toOutputLocale(useLocale());
  const observe = useScrollReveal();

  const heroPalette = getCardPalette('muted-summer', locale);
  const samplePalettes = SAMPLE_TONES.map((tone) => getCardPalette(tone, locale)).filter(
    (p): p is CardPalette => p !== null
  );
  // 12톤 스펙트럼 — 각 톤의 대표색(베스트 1번). 장식이 아니라 실제 판정 기준 팔레트
  const spectrum = SPECTRUM_TONES.flatMap((tone) => {
    const p = getCardPalette(tone, locale);
    return p ? [{ tone, color: p.best[0] }] : [];
  });

  return (
    <div className={`min-h-[calc(100vh-80px)] bg-[#FDF9F7] ${INK}`} data-testid="landing-page">
      {/* (약속 배너는 7/18 사용자 피드백으로 제거 — 신뢰 밴드의 "영원히 무료"와 중복이고
          헤더 직하 얇은 띠는 시스템 공지처럼 읽힘. 무료 약속은 신뢰 밴드·CTA가 담당) */}
      <div className="w-full px-4 py-5 md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-[1080px]">
          {/* [1] 히어로 — 크림 컬러필드+그레인 위 오버사이즈 세리프. 카드 = 이솝의 '정물' */}
          <section className="relative -mx-4 mt-2 overflow-hidden rounded-3xl bg-[#FBF3F1] px-6 py-12 md:mx-0 md:px-12 md:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{ backgroundImage: PAPER_GRAIN_URI }}
            />
            {/* 2컬럼 분할은 xl부터 — 카드(400px)가 옆에 붙는 구간에서 텍스트 컬럼이
                '색·피부·체형·헤어' 어절 렌더폭(~492px@56px)보다 좁으면 break-keep이
                어절 단위 세로 낙하한다. lg(1024~1279)도 컬럼 ~360px라 재발(QA 패널 실측 7/23)
                — xl(1280+)은 컬럼 ~544px로 안전. 그 아래는 검증된 하단 스택 유지 */}
            <div className="relative grid items-center gap-10 xl:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="font-serif text-[13px] italic text-[#C56A84]">
                  Identity Report · Beta
                </p>
                <h1 className="mt-5 whitespace-pre-line break-keep font-serif text-4xl font-semibold leading-[1.16] tracking-tight xl:text-[56px]">
                  {t('heroTitle')}
                </h1>
                <p
                  className={`mt-6 max-w-md whitespace-pre-line break-keep text-sm leading-relaxed ${MUTED}`}
                >
                  {t('heroDesc')}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <SignedOut>
                    <SignInButton mode="modal" forceRedirectUrl="/analysis/integrated">
                      <Button className={`h-12 px-7 text-sm md:h-13 md:text-base ${CTA_SOLID}`}>
                        {t('startFree')}
                      </Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/home">
                      <Button className={`h-12 px-7 text-sm md:h-13 md:text-base ${CTA_SOLID}`}>
                        {t('goToDashboard')}
                      </Button>
                    </Link>
                  </SignedIn>
                  {/* 보조는 버튼이 아닌 텍스트 링크(이솝 절제 관습) — 히어로 CTA는 사실상 1개 */}
                  <Link
                    href="/demo/personal-color"
                    className="flex items-center gap-1 text-sm font-medium text-[#C56A84] transition-colors hover:text-[#A85870]"
                  >
                    {t('demoCtaButton')}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* 진짜 발급 카드(실큐레이션 팔레트) — 이솝의 정물처럼 여백에 부유 + 포토카드 틸트 */}
              {heroPalette && (
                <div className="hidden justify-center md:flex">
                  <PhotocardTilt>
                    <PersonaShareCard
                      oneLine={t('sample1Line')}
                      toneName={t('sample1Tone')}
                      badges={[]}
                      palette={heroPalette.best}
                      worstPalette={heroPalette.avoid}
                      inviteText={t('sampleInvite')}
                      format="square"
                      className="shadow-xl md:rotate-1"
                    />
                  </PhotocardTilt>
                </div>
              )}
            </div>
          </section>

          {/* [2] 신뢰 밴드 — 사진·후기 자산 대신 정직한 사실 4개(진단 퍼널 공통 문법) */}
          <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-2 px-2 sm:grid-cols-2">
            {(['trust1', 'trust2', 'trust3', 'trust4'] as const).map((key) => (
              <p key={key} className={`flex items-start gap-2 text-[13px] leading-snug ${MUTED}`}>
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C56A84"
                  strokeWidth={2.5}
                  className="mt-[3px] shrink-0"
                  aria-hidden="true"
                >
                  <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t(key)}
              </p>
            ))}
          </div>

          {/* 모듈 태그 */}
          <div className="scrollbar-hide mt-10 flex gap-2.5 overflow-x-auto pb-3 md:flex-wrap md:justify-center">
            {MODULE_META.map((module, i) => (
              <div
                key={module.id}
                className={`flex h-8 shrink-0 items-center gap-x-2 rounded-full border border-[#EAD9D4] bg-white/60 px-4 ${MUTED} transition-colors hover:border-[#C56A84]/50`}
              >
                <module.icon className={`h-4 w-4 ${module.iconClass}`} />
                <p className="text-sm font-medium leading-normal">{t(`module${i}Title`)}</p>
              </div>
            ))}
          </div>

          {/* [3] ★인터랙티브 팔레트 스트립 — 레어뷰티 Shade Finder 문법. 색이 유일한 컬러 소스 */}
          <section ref={observe} className="landing-reveal pt-12">
            <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">
              {t('paletteTitle')}
            </h2>
            <p className={`mt-1.5 text-sm ${MUTED}`}>{t('paletteNote')}</p>
            <div
              className="mt-5 flex h-24 overflow-hidden rounded-2xl md:h-28"
              data-testid="landing-spectrum"
            >
              {spectrum.map((s) => (
                <div
                  key={s.tone}
                  title={s.color.name}
                  className="group relative flex-1 transition-all duration-300 hover:flex-[2.2]"
                  style={{ backgroundColor: s.color.hex }}
                >
                  {/* 호버 시 색이름 — CSS만으로 인터랙션(JS 0) */}
                  <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2B2320]/70 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {s.color.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/analysis/integrated">
                  <Button className={`h-10 px-6 text-sm ${CTA_SOLID}`}>{t('paletteCta')}</Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/analysis/integrated">
                  <Button className={`h-10 px-6 text-sm ${CTA_SOLID}`}>{t('paletteCta')}</Button>
                </Link>
              </SignedIn>
            </div>
          </section>

          {/* How it Works 3-Step */}
          <div ref={observe} className="landing-reveal pt-12">
            <h2 className="pb-5 text-[22px] font-bold leading-tight tracking-[-0.015em]">
              {t('howItWorksTitle')}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {HOW_STEPS.map((step, i) => (
                <div
                  key={i}
                  className="relative flex items-center gap-4 rounded-2xl border border-[#F0E3DE] bg-white/60 p-4 md:flex-col md:items-center md:gap-0 md:p-6 md:text-center"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FBF3F1]">
                    <step.icon className="h-6 w-6 text-[#C56A84]" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 md:mt-3">
                    <p className="font-serif text-[12px] italic tabular-nums text-[#C56A84]">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold">{t(`step${i}Title`)}</h3>
                    <p className={`mt-1 text-xs leading-relaxed ${MUTED}`}>{t(`step${i}Desc`)}</p>
                  </div>
                  {i < 2 && (
                    <ChevronRight
                      className={`absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 md:block ${SOFT}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* [4] 5축 프로파일 그리드 */}
          <h2 className="pb-3 pt-12 text-[22px] font-bold leading-tight tracking-[-0.015em]">
            {t('modulesTitle')}
          </h2>
          <div className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 md:grid-cols-5">
            {MODULE_META.map((module, i) => (
              <Link key={module.id} href={module.href} className="group h-full">
                <div
                  ref={observe}
                  className="landing-reveal h-full rounded-2xl border border-[#F0E3DE] bg-white/60 p-4 transition-colors hover:border-[#C56A84]/50"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FBF3F1]">
                    <module.icon className={`h-6 w-6 ${module.iconClass}`} strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-1 font-semibold">{t(`module${i}Title`)}</h3>
                  <p className={`text-sm leading-relaxed ${MUTED}`}>{t(`module${i}Desc`)}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* [5] 결과물 미리보기 — 실카드 부유 + 게이트 카피(미리보기→가입 보상 프레이밍) */}
          <h2 className="pb-1 pt-12 text-[22px] font-bold leading-tight tracking-[-0.015em]">
            {t('previewTitle')}
          </h2>
          <p className={`text-sm ${MUTED}`}>{t('previewRealNote')}</p>
          <div ref={observe} className="landing-reveal mt-6 flex snap-x gap-8 overflow-x-auto pb-4">
            {samplePalettes.map((palette, i) => (
              <div key={SAMPLE_TONES[i]} className={`shrink-0 snap-center ${SAMPLE_ROTATIONS[i]}`}>
                <PersonaShareCard
                  oneLine={t(`sample${i + 2}Line`)}
                  toneName={t(`sample${i + 2}Tone`)}
                  badges={[]}
                  palette={palette.best}
                  worstPalette={palette.avoid}
                  inviteText={t('sampleInvite')}
                  format="square"
                />
              </div>
            ))}
          </div>
          <p className={`mt-2 text-center text-[13px] ${MUTED}`}>{t('gateNote')}</p>

          {/* 데모 결과 링크 */}
          <div className="flex justify-center pb-4 pt-4">
            <Link
              href="/demo/personal-color"
              className="flex items-center gap-1 text-sm text-[#C56A84] transition-colors hover:text-[#A85870]"
            >
              {t('demoLink')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* [6]+[7] 미션 타이포 선언 + CTA 마감 — 사진 0의 대형 세리프 선언(글로시에 문법).
              ref와 landing-reveal은 반드시 같은 요소에(분리 시 가시화 클래스가 부모에 붙는 잠복 버그) */}
          <section className="px-4 py-20">
            <div ref={observe} className="landing-reveal mx-auto max-w-2xl text-center">
              <p className="font-serif text-[13px] italic text-[#C56A84]">{t('bottomCtaLabel')}</p>
              <h2 className="mt-4 break-keep font-serif text-3xl font-semibold leading-snug md:text-[40px]">
                {t('bottomCtaTitle')}
              </h2>
              <p className={`mt-5 whitespace-pre-line break-keep leading-relaxed ${MUTED}`}>
                {t('bottomCtaDesc')}
              </p>
              <div className="mt-9">
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/analysis/integrated">
                    <Button className={`h-13 px-9 text-base ${CTA_SOLID}`}>
                      {t('bottomCtaSignUp')}
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/analysis/integrated">
                    <Button className={`h-13 px-9 text-base ${CTA_SOLID}`}>
                      {t('bottomCtaAnalysis')}
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 푸터 + AI 면책 고지 */}
      <footer className="border-t border-[#F0E3DE] bg-[#FBF3F1]" data-testid="footer">
        <div className="mx-auto max-w-[960px] px-4 py-8">
          <div className={`flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm ${MUTED}`}>
            <Link href="/terms" className="transition-colors hover:text-[#C56A84]">
              {t('footerTerms')}
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-[#C56A84]">
              {t('footerPrivacy')}
            </Link>
            <Link href="/licenses" className="transition-colors hover:text-[#C56A84]">
              {t('footerLicenses')}
            </Link>
            <Link href="/help/faq" className="transition-colors hover:text-[#C56A84]">
              {t('footerHelp')}
            </Link>
          </div>
          <p className={`mt-4 text-center text-[11px] ${SOFT}`}>{t('footerDisclaimer')}</p>
          <div className={`mt-4 text-center text-xs ${SOFT}`}>
            <p>© {new Date().getFullYear()} Yiroom. All rights reserved.</p>
            <p className="mt-1">{t('footerSlogan')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
