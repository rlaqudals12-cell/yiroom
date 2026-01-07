'use client';

import { useRouter } from 'next/navigation';
import { Palette, Sparkles, User, Scissors, Heart, ArrowRight } from 'lucide-react';

// 분석 카드 정의
const ANALYSIS_CARDS = [
  {
    id: 'personal-color',
    title: '퍼스널 컬러',
    description: '어울리는 색상 찾기',
    icon: Palette,
    href: '/analysis/personal-color',
    gradient: 'from-violet-400 to-purple-500',
    shadow: 'shadow-violet-500/30',
    recommended: true,
  },
  {
    id: 'skin',
    title: '피부 분석',
    description: 'AI 피부 진단',
    icon: Sparkles,
    href: '/analysis/skin',
    gradient: 'from-rose-400 to-pink-500',
    shadow: 'shadow-rose-500/30',
    recommended: false,
  },
  {
    id: 'body',
    title: '체형 분석',
    description: '맞춤 스타일',
    icon: User,
    href: '/analysis/body',
    gradient: 'from-blue-400 to-indigo-500',
    shadow: 'shadow-blue-500/30',
    recommended: false,
  },
  {
    id: 'hair',
    title: '헤어 분석',
    description: '두피/모발 체크',
    icon: Scissors,
    href: '/analysis/hair',
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/30',
    recommended: false,
  },
  {
    id: 'makeup',
    title: '메이크업',
    description: '뷰티 스타일',
    icon: Heart,
    href: '/analysis/makeup',
    gradient: 'from-pink-400 to-rose-500',
    shadow: 'shadow-pink-500/30',
    recommended: false,
  },
];

/**
 * 홈 - 신규 사용자용 분석 시작 CTA
 * Glassmorphism 스타일
 */
export default function HomeAnalysisPrompt() {
  const router = useRouter();

  return (
    <section
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-xl shadow-slate-200/50 dark:shadow-none"
      data-testid="home-analysis-prompt"
    >
      {/* 헤더 */}
      <div className="text-center mb-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          나만의 스타일을 찾아볼까요?
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">AI가 맞춤 분석을 해드려요</p>
      </div>

      {/* 분석 카드 그리드 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {ANALYSIS_CARDS.slice(0, 3).map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => router.push(card.href)}
              className="group relative flex flex-col items-center p-3 rounded-xl hover:scale-105 transition-all duration-200"
              data-testid={`home-analysis-card-${card.id}`}
            >
              {/* 추천 배지 */}
              {card.recommended && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full">
                  추천
                </span>
              )}

              {/* 아이콘 */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-2 shadow-lg ${card.shadow}`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              {/* 텍스트 */}
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {card.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* 더보기 (나머지 2개) */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {ANALYSIS_CARDS.slice(3).map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => router.push(card.href)}
              className="group flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors"
              data-testid={`home-analysis-card-${card.id}`}
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md ${card.shadow}`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {card.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{card.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 추천 안내 */}
      <button
        onClick={() => router.push('/analysis/personal-color')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-violet-500/30 transition-all"
      >
        퍼스널 컬러부터 시작하기
        <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
}
