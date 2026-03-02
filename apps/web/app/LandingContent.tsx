'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Heart, Brain, Dumbbell, Sparkles, Palette, User } from 'lucide-react';

type Lang = 'ko' | 'en';

const TEXT = {
  ko: {
    heroTitle: '온전한 나를 찾는 여정',
    heroDesc:
      'AI 기반 통합 웰니스 플랫폼. 퍼스널 컬러, 피부, 체형, 운동까지 당신만을 위한 맞춤 분석을 제공합니다.',
    startFree: '무료로 시작하기',
    goToDashboard: '대시보드로 이동',
    modulesTitle: '이룸 웰니스 모듈',
    modules: [
      {
        title: '퍼스널컬러 AI',
        description: 'AI 이미지 분석으로 나에게 어울리는 계절 타입을 찾아드려요.',
      },
      { title: '피부 AI', description: '피부 상태를 분석하고 맞춤 화장품을 추천해요.' },
      { title: '체형 AI', description: '체형을 분석하고 맞춤 스타일링을 제안해요.' },
      { title: '운동 AI', description: 'AI 기반 맞춤 운동 플랜을 제공해요.' },
    ],
    ctaStart: '시작하기',
    ctaViewResults: '내 분석 결과 보기',
    ctaPersonalColor: '퍼스널컬러 진단',
    featuresTitle: '이룸만의 특별함',
    features: [
      {
        title: '개인 맞춤 인사이트',
        desc: '당신만의 건강 데이터와 목표에 기반한 맞춤형 추천을 받아보세요.',
      },
      {
        title: 'AI 기반 추천',
        desc: '최신 AI 기술로 당신의 웰니스 여정을 최적화하는 실행 가능한 조언을 받으세요.',
      },
      {
        title: '성장 추적',
        desc: '시간에 따른 변화를 모니터링하고 성과를 확인하세요.',
      },
    ],
    bottomCtaLabel: 'Start Your Journey',
    bottomCtaTitle: '지금 바로 시작해보세요',
    bottomCtaDesc:
      '회원가입 후 퍼스널 컬러 진단부터 시작하면\n더 정확한 맞춤 분석을 받을 수 있어요',
    bottomCtaSignUp: '무료 회원가입',
    bottomCtaAnalysis: '퍼스널 컬러 진단 시작',
    footerTerms: '이용약관',
    footerPrivacy: '개인정보처리방침',
    footerLicenses: '오픈소스 라이선스',
    footerHelp: '도움말',
    footerSlogan: '온전한 나를 찾는 여정',
  },
  en: {
    heroTitle: 'Know yourself, wholly.',
    heroDesc:
      'AI-powered integrated wellness platform. Personalized analysis for your color palette, skin health, body type, and fitness — all in one place.',
    startFree: 'Get Started Free',
    goToDashboard: 'Go to Dashboard',
    modulesTitle: 'Wellness Modules',
    modules: [
      {
        title: 'Personal Color AI',
        description: 'Discover your seasonal color type through AI-powered image analysis.',
      },
      {
        title: 'Skin AI',
        description: 'Analyze your skin condition and get personalized skincare recommendations.',
      },
      {
        title: 'Body Type AI',
        description: 'Analyze your body type and receive tailored styling suggestions.',
      },
      {
        title: 'Workout AI',
        description: 'Get AI-generated personalized workout plans for your goals.',
      },
    ],
    ctaStart: 'Get Started',
    ctaViewResults: 'View My Results',
    ctaPersonalColor: 'Try Color Analysis',
    featuresTitle: 'What Makes Yiroom Special',
    features: [
      {
        title: 'Personalized Insights',
        desc: 'Receive tailored recommendations based on your unique health data and goals.',
      },
      {
        title: 'AI-Powered Analysis',
        desc: 'Leverage cutting-edge AI technology for actionable wellness advice powered by Google Gemini.',
      },
      {
        title: 'Track Your Progress',
        desc: 'Monitor changes over time and celebrate your achievements with detailed reports.',
      },
    ],
    bottomCtaLabel: 'Start Your Journey',
    bottomCtaTitle: 'Ready to begin?',
    bottomCtaDesc:
      'Sign up and start with a personal color analysis\nto unlock your full personalized experience.',
    bottomCtaSignUp: 'Sign Up Free',
    bottomCtaAnalysis: 'Start Color Analysis',
    footerTerms: 'Terms of Service',
    footerPrivacy: 'Privacy Policy',
    footerLicenses: 'Open Source',
    footerHelp: 'Help',
    footerSlogan: 'Know yourself, wholly.',
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

const FEATURE_ICONS = [Heart, Brain, Dumbbell];

export function LandingContent() {
  const searchParams = useSearchParams();
  const initialLang = searchParams.get('lang') === 'en' ? 'en' : 'ko';
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = TEXT[lang];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-neutral-950" data-testid="landing-page">
      <div className="w-full px-4 md:px-10 lg:px-40 py-5">
        <div className="mx-auto max-w-[960px] w-full">
          {/* 언어 토글 */}
          <div className="flex justify-end px-4 mb-2">
            <div className="flex gap-1.5 bg-zinc-900 rounded-lg p-1">
              <button
                onClick={() => setLang('ko')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
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
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
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

          {/* 히어로 섹션 */}
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
                    maxWidth: '32rem',
                    lineHeight: 1.6,
                  }}
                >
                  {t.heroDesc}
                </p>
                <div className="mt-6">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button className="h-12 px-6 md:h-14 md:px-8 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm md:text-base font-bold shadow-lg shadow-pink-500/25 transition-all duration-300">
                        {t.startFree}
                      </Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard">
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

          {/* 웰니스 모듈 섹션 */}
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-8">
            {t.modulesTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4">
            {MODULE_META.map((module, i) => (
              <Link key={module.id} href={module.href} className="group">
                <div className="relative rounded-2xl bg-neutral-900 border-glow-pink p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/10">
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

          {/* CTA 버튼 */}
          <div className="flex justify-center pt-4">
            <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 max-w-[600px] justify-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-10 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm font-bold leading-normal tracking-[0.015em] grow transition-all duration-300 shadow-lg shadow-pink-500/20">
                    {t.ctaStart}
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="grow">
                  <Button className="w-full min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-10 px-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-all duration-300 shadow-lg shadow-pink-500/20">
                    {t.ctaViewResults}
                  </Button>
                </Link>
              </SignedIn>
              <Link href="/analysis/personal-color" className="grow">
                <Button
                  variant="secondary"
                  className="w-full min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] bg-neutral-900 text-zinc-200 border border-zinc-800 hover:border-pink-500/30 hover:bg-neutral-800 transition-all duration-300"
                >
                  {t.ctaPersonalColor}
                </Button>
              </Link>
            </div>
          </div>

          {/* Key Features 섹션 */}
          <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-8">
            {t.featuresTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {t.features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-neutral-900/50 backdrop-blur-sm border border-zinc-800 p-6 hover:border-pink-500/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-pink-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>

          {/* 하단 CTA */}
          <section className="px-4 py-16">
            <div style={{ maxWidth: '42rem', margin: '0 auto', textAlign: 'center' }}>
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

      {/* 푸터 */}
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
          <div className="mt-6 text-center text-xs text-zinc-500">
            <p>© {new Date().getFullYear()} Yiroom. All rights reserved.</p>
            <p className="mt-1 text-zinc-600">{t.footerSlogan}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
