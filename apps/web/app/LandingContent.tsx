'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Dumbbell, Sparkles, Palette, User, Droplets, Sun, Shirt } from 'lucide-react';

type Lang = 'ko' | 'en';

const TEXT = {
  ko: {
    heroTitle: '온전한 나를 찾는 여정',
    // 1-1: 구체적 가치 + 행동(셀카) + 결과(분석) 명시
    heroDesc:
      '셀카 한 장으로 퍼스널컬러 · 피부타입 · 체형을 AI가 분석해요.\n8개 웰니스 모듈로 나만의 맞춤 인사이트를 받아보세요.',
    // 1-5: CTA 통일 — 퍼스널컬러 우선 (ADR-039)
    startFree: '무료 퍼스널컬러 진단 시작',
    goToDashboard: '대시보드로 이동',
    // 1-2: 사실 기반 소셜 프루프
    socialProof: '8개 AI 분석 모듈 · 23,000+ 테스트 검증 · Beta',
    modulesTitle: '이룸 웰니스 모듈',
    // 2-2: 모듈 설명 강화 — 소요 시간 + 결과 예시
    modules: [
      {
        title: '퍼스널컬러 AI',
        description: '셀카 한 장 → 30초 만에 봄/여름/가을/겨울 타입 분석',
      },
      {
        title: '피부 AI',
        description: '셀카 한 장 → 수분·유분·민감도 6존 분석',
      },
      {
        title: '체형 AI',
        description: '전신 사진 → 체형 분류 + 맞춤 스타일링 제안',
      },
      {
        title: '운동 AI',
        description: '체형·목표 기반 → 주간 운동 플랜 자동 생성',
      },
    ],
    // 1-5: CTA 통일
    ctaStart: '무료 퍼스널컬러 진단',
    ctaViewResults: '내 분석 결과 보기',
    // 1-3: 결과 미리보기 섹션
    previewTitle: '이런 결과를 받아보세요',
    previews: [
      {
        label: '봄 웜톤',
        sub: '코랄 핑크가 잘 어울려요',
        tag: '퍼스널컬러',
      },
      {
        label: '바이탈리티 78점',
        sub: '복합성 피부 · T존 유분 관리 추천',
        tag: '피부 분석',
      },
      {
        label: 'S타입 체형',
        sub: '허리 강조 핏이 베스트',
        tag: '체형 분석',
      },
    ],
    bottomCtaLabel: 'Start Your Journey',
    bottomCtaTitle: '지금 바로 시작해보세요',
    bottomCtaDesc: '퍼스널컬러 진단부터 시작하면\n나만의 맞춤 분석을 바로 받을 수 있어요',
    bottomCtaSignUp: '무료 퍼스널컬러 진단 시작',
    bottomCtaAnalysis: '퍼스널컬러 진단 시작',
    footerTerms: '이용약관',
    footerPrivacy: '개인정보처리방침',
    footerLicenses: '오픈소스 라이선스',
    footerHelp: '도움말',
    footerSlogan: '온전한 나를 찾는 여정',
    // 1-4: 면책 고지 (ADR-024, AI기본법)
    footerDisclaimer:
      '이룸의 분석 결과는 AI가 생성한 참고 정보이며, 의학적 진단을 대체하지 않아요.',
  },
  en: {
    heroTitle: 'Know yourself, wholly.',
    heroDesc:
      'One selfie — AI analyzes your colors, skin type & body shape.\n8 wellness modules for personalized insights, all in one place.',
    startFree: 'Free Color Analysis',
    goToDashboard: 'Go to Dashboard',
    socialProof: '8 AI Modules · 23,000+ Tests Verified · Beta',
    modulesTitle: 'Wellness Modules',
    modules: [
      {
        title: 'Personal Color AI',
        description: 'One selfie → Find your Spring/Summer/Autumn/Winter type in 30s',
      },
      {
        title: 'Skin AI',
        description: 'One selfie → Hydration, oil & sensitivity across 6 zones',
      },
      {
        title: 'Body Type AI',
        description: 'Full-body photo → Body type classification + styling tips',
      },
      {
        title: 'Workout AI',
        description: 'Based on your body & goals → Auto-generated weekly plan',
      },
    ],
    ctaStart: 'Free Color Analysis',
    ctaViewResults: 'View My Results',
    previewTitle: "See what you'll discover",
    previews: [
      {
        label: 'Spring Warm',
        sub: 'Coral pink looks great on you',
        tag: 'Personal Color',
      },
      {
        label: 'Vitality 78',
        sub: 'Combination skin · T-zone oil care recommended',
        tag: 'Skin Analysis',
      },
      {
        label: 'S-Type Body',
        sub: 'Waist-defining fits are your best match',
        tag: 'Body Analysis',
      },
    ],
    bottomCtaLabel: 'Start Your Journey',
    bottomCtaTitle: 'Ready to begin?',
    bottomCtaDesc:
      'Start with a personal color analysis\nto unlock your full personalized experience.',
    bottomCtaSignUp: 'Free Color Analysis',
    bottomCtaAnalysis: 'Start Color Analysis',
    footerTerms: 'Terms of Service',
    footerPrivacy: 'Privacy Policy',
    footerLicenses: 'Open Source',
    footerHelp: 'Help',
    footerSlogan: 'Know yourself, wholly.',
    footerDisclaimer:
      "Yiroom's results are AI-generated reference information and do not replace medical diagnosis.",
  },
} as const;

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
    id: 'workout',
    href: '/workout/onboarding/step1',
    gradient: 'from-green-400 to-emerald-500',
    icon: Dumbbell,
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
  const searchParams = useSearchParams();
  const initialLang = searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = TEXT[lang];
  const observe = useScrollReveal();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-950" data-testid="landing-page">
      {/* 스크롤 애니메이션 CSS → globals.css로 분리 */}
      <div className="w-full px-4 md:px-10 lg:px-40 py-5">
        <div className="mx-auto max-w-[960px] w-full">
          {/* 언어 토글 */}
          <div className="flex justify-end px-4 mb-2">
            <div className="flex gap-1.5 bg-zinc-900 rounded-lg p-1">
              <button
                onClick={() => setLang('ko')}
                className={`px-3 py-1 min-h-[44px] text-xs rounded-md transition-colors ${
                  lang === 'ko'
                    ? 'bg-pink-500/20 text-pink-300'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                aria-label="한국어로 보기"
              >
                한국어
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 min-h-[44px] text-xs rounded-md transition-colors ${
                  lang === 'en'
                    ? 'bg-pink-500/20 text-pink-300'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                aria-label="View in English"
              >
                EN
              </button>
            </div>
          </div>

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

              {/* 2-1: 비주얼 앵커 — 결과 카드 스택 (우측, md 이상) */}
              <div className="hidden md:flex absolute top-1/2 right-8 -translate-y-1/2 z-[5] flex-col gap-3">
                {/* 퍼스널컬러 미니 카드 */}
                <div className="w-[180px] rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <p className="text-[10px] text-pink-400 font-medium mb-1">Personal Color</p>
                  <p className="text-white text-sm font-bold">
                    {lang === 'ko' ? '봄 웜톤' : 'Spring Warm'}
                  </p>
                  <div className="flex gap-1 mt-2">
                    {['#F9A8D4', '#FBCFE8', '#F472B6', '#EC4899', '#DB2777'].map((c) => (
                      <div
                        key={c}
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                {/* 피부 점수 미니 카드 */}
                <div className="w-[180px] rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                  <p className="text-[10px] text-amber-400 font-medium mb-1">Skin Vitality</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">78</span>
                    <span className="text-xs text-zinc-400">/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-700 rounded-full mt-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{ width: '78%' }}
                    />
                  </div>
                </div>
                {/* 체형 미니 카드 */}
                <div className="w-[180px] rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-3 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  <p className="text-[10px] text-blue-400 font-medium mb-1">Body Type</p>
                  <p className="text-white text-sm font-bold">
                    {lang === 'ko' ? 'S타입' : 'S-Type'}
                  </p>
                  <p className="text-zinc-400 text-[10px] mt-1">
                    {lang === 'ko' ? '허리 강조 핏 추천' : 'Waist-defining fits'}
                  </p>
                </div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1.5rem',
                }}
              >
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
                  {t.heroTitle}
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
                  {t.heroDesc}
                </p>

                {/* 1-2: 소셜 프루프 */}
                <p className="mt-3 text-xs text-zinc-500">✦ {t.socialProof}</p>

                {/* 1-5: CTA 통일 — 퍼스널컬러 진단 */}
                <div className="mt-5">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button className="h-12 px-6 md:h-14 md:px-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm md:text-base font-bold shadow-lg shadow-pink-500/25 transition-all duration-300">
                        <Palette className="w-4 h-4 mr-2" />
                        {t.startFree}
                      </Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/home">
                      <Button className="h-12 px-6 md:h-14 md:px-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm md:text-base font-bold shadow-lg shadow-pink-500/25 transition-all duration-300">
                        {t.goToDashboard}
                      </Button>
                    </Link>
                  </SignedIn>
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
                <p className="text-sm font-medium leading-normal">{t.modules[i].title}</p>
              </div>
            ))}
          </div>

          {/* 웰니스 모듈 섹션 — 2-2: 강화된 설명 + 2-4: 스크롤 애니메이션 */}
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-8">
            {t.modulesTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {MODULE_META.map((module, i) => (
              <Link key={module.id} href={module.href} className="group">
                <div
                  ref={observe}
                  className="landing-reveal relative rounded-2xl bg-neutral-900 border-glow-pink p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/10"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-3`}
                  >
                    <module.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">{t.modules[i].title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {t.modules[i].description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* 1-5: CTA 단일화 — 퍼스널컬러 진단만 */}
          <div className="flex justify-center pt-4">
            <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 max-w-[600px] justify-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-11 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm font-bold leading-normal tracking-[0.015em] grow transition-all duration-300 shadow-lg shadow-pink-500/20">
                    <Palette className="w-4 h-4 mr-2" />
                    {t.ctaStart}
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/home" className="grow">
                  <Button className="w-full min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-11 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-all duration-300 shadow-lg shadow-pink-500/20">
                    {t.ctaViewResults}
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* 1-3: 결과 미리보기 섹션 (기존 "특별함" 대체) */}
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-8">
            {t.previewTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {t.previews.map((preview, i) => {
              const meta = PREVIEW_META[i];
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
                    {preview.tag}
                  </p>
                  <h3 className="text-white text-lg font-bold mb-1">{preview.label}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{preview.sub}</p>
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
                {t.bottomCtaLabel}
              </p>
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '1rem',
                }}
              >
                {t.bottomCtaTitle}
              </h2>
              <p
                style={{
                  color: '#a1a1aa',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  whiteSpace: 'pre-line',
                }}
              >
                {t.bottomCtaDesc}
              </p>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="inline-flex items-center gap-2 h-14 px-8 text-lg rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-pink-500/25 transition-all duration-300">
                    <Sparkles className="w-5 h-5" />
                    <span>{t.bottomCtaSignUp}</span>
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/analysis/personal-color">
                  <Button className="inline-flex items-center gap-2 h-14 px-8 text-lg rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold shadow-lg shadow-pink-500/25 transition-all duration-300">
                    <Sparkles className="w-5 h-5" />
                    <span>{t.bottomCtaAnalysis}</span>
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
              {t.footerTerms}
            </Link>
            <Link
              href={`/privacy${lang === 'en' ? '?lang=en' : ''}`}
              className="hover:text-pink-400 transition-colors"
            >
              {t.footerPrivacy}
            </Link>
            <Link href="/licenses" className="hover:text-pink-400 transition-colors">
              {t.footerLicenses}
            </Link>
            <Link href="/help/faq" className="hover:text-pink-400 transition-colors">
              {t.footerHelp}
            </Link>
          </div>
          {/* 1-4: AI 면책 고지 */}
          <p className="mt-4 text-center text-[11px] text-zinc-600">{t.footerDisclaimer}</p>
          <div className="mt-4 text-center text-xs text-zinc-500">
            <p>© {new Date().getFullYear()} Yiroom. All rights reserved.</p>
            <p className="mt-1 text-zinc-600">{t.footerSlogan}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
