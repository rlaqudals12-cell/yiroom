'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Palette,
  FlaskConical,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 온보딩 시작 페이지 - UX 리스트럭처링
 * - 앱 소개 캐러셀 (3단계)
 * - 분석 시작 버튼
 * - 건너뛰기 옵션
 */

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: typeof Sparkles;
  gradient: string;
  iconBg: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: '나만의 퍼스널컬러',
    description:
      'AI가 당신에게 어울리는 컬러를 찾아드려요.\n자연광에서 간단한 사진 한 장이면 충분해요.',
    icon: Palette,
    gradient: 'from-rose-100 to-pink-100',
    iconBg: 'bg-rose-500',
  },
  {
    id: 2,
    title: '피부 타입 분석',
    description: '피부 상태를 분석하고\n나에게 맞는 스킨케어 루틴을 추천받으세요.',
    icon: FlaskConical,
    gradient: 'from-blue-100 to-cyan-100',
    iconBg: 'bg-blue-500',
  },
  {
    id: 3,
    title: '체형 맞춤 스타일링',
    description: '체형을 분석해 어울리는 옷 스타일과\n실루엣을 추천해드려요.',
    icon: User,
    gradient: 'from-violet-100 to-purple-100',
    iconBg: 'bg-violet-500',
  },
];

// 분석 모듈 선택
interface AnalysisModule {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  href: string;
  gradient: string;
  duration: string;
}

const analysisModules: AnalysisModule[] = [
  {
    id: 'personal-color',
    title: '퍼스널컬러 분석',
    description: '나에게 어울리는 컬러 찾기',
    icon: Palette,
    href: '/analysis/personal-color',
    gradient: 'bg-gradient-personal-color',
    duration: '약 2분',
  },
  {
    id: 'skin',
    title: '피부 분석',
    description: '피부 타입과 고민 분석',
    icon: FlaskConical,
    href: '/analysis/skin',
    gradient: 'bg-gradient-skin',
    duration: '약 3분',
  },
  {
    id: 'body',
    title: '체형 분석',
    description: '체형에 맞는 스타일 찾기',
    icon: User,
    href: '/analysis/body',
    gradient: 'bg-gradient-body',
    duration: '약 2분',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAnalysisSelection, setShowAnalysisSelection] = useState(false);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowAnalysisSelection(true);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    router.push('/home');
  };

  const handleStartAll = () => {
    // 모든 분석 시작 - 퍼스널컬러부터
    router.push('/analysis/personal-color');
  };

  const slide = slides[currentSlide];

  // 분석 선택 화면
  if (showAnalysisSelection) {
    return (
      <div className="min-h-screen bg-background flex flex-col" data-testid="onboarding-selection">
        {/* 헤더 */}
        <header className="px-4 py-4">
          <button
            onClick={() => setShowAnalysisSelection(false)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">이전</span>
          </button>
        </header>

        {/* 본문 */}
        <div className="flex-1 px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">어떤 분석을 시작할까요?</h1>
          <p className="text-muted-foreground mb-6">
            관심 있는 분석을 선택하거나, 모두 시작해보세요
          </p>

          {/* 분석 모듈 카드 */}
          <div className="space-y-3 mb-6">
            {analysisModules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => router.push(module.href)}
                  className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border hover:shadow-md transition-all text-left"
                >
                  <div
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center',
                      module.gradient
                    )}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{module.title}</p>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {module.duration}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 모두 시작하기 */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-pink-50 rounded-2xl border border-violet-200">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-violet-600" />
              <span className="font-semibold text-foreground">전체 분석 추천</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              퍼스널컬러, 피부, 체형을 모두 분석하면 더 정확한 맞춤 추천을 받을 수 있어요
            </p>
            <button
              onClick={handleStartAll}
              className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              전체 분석 시작하기 (약 7분)
            </button>
          </div>
        </div>

        {/* 건너뛰기 */}
        <footer className="px-4 py-6">
          <button
            onClick={handleSkip}
            className="w-full text-center text-muted-foreground hover:text-foreground text-sm"
          >
            나중에 할게요
          </button>
        </footer>
      </div>
    );
  }

  // 캐러셀 화면
  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="onboarding-page">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-4">
        <div className="w-16" />
        {/* 페이지 인디케이터 */}
        <div className="flex gap-1.5">
          {slides.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === currentSlide ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
              )}
            />
          ))}
        </div>
        {/* 건너뛰기 */}
        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          건너뛰기
        </button>
      </header>

      {/* 슬라이드 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 아이콘 영역 */}
        <div
          className={cn(
            'w-full max-w-xs aspect-square rounded-3xl flex items-center justify-center mb-8',
            `bg-gradient-to-br ${slide.gradient}`
          )}
        >
          <div
            className={cn('w-24 h-24 rounded-full flex items-center justify-center', slide.iconBg)}
          >
            <slide.icon className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* 텍스트 */}
        <h2 className="text-2xl font-bold text-foreground text-center mb-3">{slide.title}</h2>
        <p className="text-muted-foreground text-center whitespace-pre-line leading-relaxed">
          {slide.description}
        </p>
      </div>

      {/* 하단 네비게이션 */}
      <footer className="px-6 py-8">
        <div className="flex items-center justify-between">
          {/* 이전 버튼 */}
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center border transition-colors',
              currentSlide === 0
                ? 'border-muted text-muted cursor-not-allowed'
                : 'border-border text-foreground hover:bg-muted'
            )}
            aria-label="이전"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* 다음/시작 버튼 */}
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            {currentSlide === slides.length - 1 ? '시작하기' : '다음'}
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* 다음 버튼 (보이지 않음, 레이아웃 균형용) */}
          <button
            onClick={handleNext}
            disabled={currentSlide === slides.length - 1}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center border transition-colors',
              currentSlide === slides.length - 1
                ? 'border-muted text-muted cursor-not-allowed'
                : 'border-border text-foreground hover:bg-muted'
            )}
            aria-label="다음"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </footer>
    </div>
  );
}
