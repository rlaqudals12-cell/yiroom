import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/common';
import { Heart, Brain, Dumbbell, Sparkles, Palette, User } from 'lucide-react';

// 웰니스 모듈 데이터 (아이콘 + 그라디언트 기반 UI)
const WELLNESS_MODULES = [
  {
    id: 'personal-color',
    title: '퍼스널컬러 AI',
    description: 'AI 이미지 분석으로 나에게 어울리는 계절 타입을 찾아드려요.',
    href: '/analysis/personal-color',
    gradient: 'from-pink-400 to-rose-500',
    icon: Palette,
    tagColor: 'bg-module-personal-color-light text-module-personal-color-dark',
  },
  {
    id: 'skin',
    title: '피부 AI',
    description: '피부 상태를 분석하고 맞춤 화장품을 추천해요.',
    href: '/analysis/skin',
    gradient: 'from-amber-400 to-orange-500',
    icon: Sparkles,
    tagColor: 'bg-module-skin-light text-module-skin-dark',
  },
  {
    id: 'body',
    title: '체형 AI',
    description: '체형을 분석하고 맞춤 스타일링을 제안해요.',
    href: '/analysis/body',
    gradient: 'from-blue-400 to-indigo-500',
    icon: User,
    tagColor: 'bg-module-body-light text-module-body-dark',
  },
  {
    id: 'workout',
    title: '운동 AI',
    description: 'AI 기반 맞춤 운동 플랜을 제공해요.',
    href: '/workout/onboarding/step1',
    gradient: 'from-green-400 to-emerald-500',
    icon: Dumbbell,
    tagColor: 'bg-module-workout-light text-module-workout-dark',
  },
];

export default function Home() {
  // SignedIn/SignedOut 조건부 렌더링으로 사용자 상태에 따른 UI 분기 처리
  // 서버 리다이렉트 제거로 LCP +3-4점 개선 예상
  return (
    <main
      className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/30"
      data-testid="landing-page"
    >
      <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
        <div className="flex flex-col max-w-[960px] flex-1">
          {/* 히어로 섹션 - 그라디언트 배경 */}
          <div className="p-0 md:p-4">
            <div className="relative min-h-[480px] md:rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900/50 to-purple-900/30">
              {/* Trust Badge */}
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-medium">
                  10만+ 사용자 신뢰
                </span>
              </div>

              {/* 콘텐츠 */}
              <div className="absolute inset-0 flex flex-col gap-6 md:gap-8 items-start justify-end px-4 pb-10 md:px-10">
                <div className="flex flex-col gap-2 text-left animate-fade-in-up">
                  <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
                    온전한 나를 찾는 여정
                  </h1>
                  <h2 className="text-white text-sm md:text-base font-normal leading-normal">
                    AI 기반 통합 웰니스 플랫폼. 퍼스널 컬러, 피부, 체형, 운동까지 당신만을 위한 맞춤
                    분석을 제공합니다.
                  </h2>
                </div>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button className="min-w-[84px] max-w-[480px] cursor-pointer overflow-hidden rounded-xl h-10 px-4 md:h-12 md:px-5 bg-gradient-brand hover:opacity-90 text-white text-sm md:text-base font-bold leading-normal tracking-[0.015em] transition-all duration-300 animate-fade-in-up animation-delay-200">
                      무료로 시작하기
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button className="min-w-[84px] max-w-[480px] cursor-pointer overflow-hidden rounded-xl h-10 px-4 md:h-12 md:px-5 bg-gradient-brand hover:opacity-90 text-white text-sm md:text-base font-bold leading-normal tracking-[0.015em] transition-all duration-300 animate-fade-in-up animation-delay-200">
                      대시보드로 이동
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>

          {/* 모듈 태그 - 모바일에서 가로 스크롤 */}
          <div className="flex gap-3 p-3 overflow-x-auto md:flex-wrap pr-4 scrollbar-hide">
            {WELLNESS_MODULES.map((module) => (
              <div
                key={module.id}
                className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-xl ${module.tagColor} pl-4 pr-4`}
              >
                <module.icon className="w-4 h-4" />
                <p className="text-sm font-medium leading-normal">{module.title}</p>
              </div>
            ))}
          </div>

          {/* 웰니스 모듈 섹션 */}
          <h2 className="text-foreground text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
            이룸 웰니스 모듈
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
            {WELLNESS_MODULES.map((module) => (
              <Link key={module.id} href={module.href} className="flex flex-col gap-3 pb-3 group">
                <div
                  className={`w-full aspect-square rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg`}
                >
                  <module.icon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <p className="text-foreground text-base font-medium leading-normal">
                    {module.title}
                  </p>
                  <p className="text-muted-foreground text-sm font-normal leading-normal">
                    {module.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA 버튼 */}
          <div className="flex justify-center">
            <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 max-w-[480px] justify-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-10 px-4 bg-gradient-brand hover:opacity-90 text-white text-sm font-bold leading-normal tracking-[0.015em] grow transition-all duration-300">
                    시작하기
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="grow">
                  <Button className="w-full min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-10 px-4 bg-gradient-brand hover:opacity-90 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-all duration-300">
                    내 분석 결과 보기
                  </Button>
                </Link>
              </SignedIn>
              <Link href="/analysis/personal-color" className="grow">
                <Button
                  variant="secondary"
                  className="w-full min-w-[84px] max-w-[480px] overflow-hidden rounded-xl h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-module-personal-color-light transition-all duration-300"
                >
                  퍼스널컬러 진단
                </Button>
              </Link>
            </div>
          </div>

          {/* Key Features 섹션 */}
          <h2 className="text-foreground text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
            이룸만의 특별함
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
            <div className="flex flex-1 gap-3 rounded-lg border border-border bg-background p-4 flex-col hover:shadow-md transition-shadow">
              <div className="text-module-personal-color">
                <Heart className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-foreground text-base font-bold leading-tight">
                  개인 맞춤 인사이트
                </h3>
                <p className="text-muted-foreground text-sm font-normal leading-normal">
                  당신만의 건강 데이터와 목표에 기반한 맞춤형 추천을 받아보세요.
                </p>
              </div>
            </div>
            <div className="flex flex-1 gap-3 rounded-lg border border-border bg-background p-4 flex-col hover:shadow-md transition-shadow">
              <div className="text-module-body">
                <Brain className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-foreground text-base font-bold leading-tight">AI 기반 추천</h3>
                <p className="text-muted-foreground text-sm font-normal leading-normal">
                  최신 AI 기술로 당신의 웰니스 여정을 최적화하는 실행 가능한 조언을 받으세요.
                </p>
              </div>
            </div>
            <div className="flex flex-1 gap-3 rounded-lg border border-border bg-background p-4 flex-col hover:shadow-md transition-shadow">
              <div className="text-module-workout">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-foreground text-base font-bold leading-tight">성장 추적</h3>
                <p className="text-muted-foreground text-sm font-normal leading-normal">
                  시간에 따른 변화를 모니터링하고 성과를 확인하세요.
                </p>
              </div>
            </div>
          </div>

          {/* 하단 CTA */}
          <section className="px-4 py-12">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-foreground">
                지금 바로 시작해보세요
              </h2>
              <p className="text-muted-foreground mb-8">
                회원가입 후 퍼스널 컬러 진단부터 시작하면
                <br />더 정확한 맞춤 분석을 받을 수 있어요
              </p>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    size="lg"
                    className="gap-2 text-lg px-8 h-14 bg-gradient-brand hover:opacity-90 text-white transition-all duration-300"
                  >
                    <Sparkles className="w-5 h-5" />
                    무료 회원가입
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/analysis/personal-color">
                  <Button
                    size="lg"
                    className="gap-2 text-lg px-8 h-14 bg-gradient-brand hover:opacity-90 text-white transition-all duration-300"
                  >
                    <Sparkles className="w-5 h-5" />
                    퍼스널 컬러 진단 시작
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </section>
        </div>
      </div>

      {/* 푸터 */}
      <Footer />
    </main>
  );
}
