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

// 분석 카드 공통 컴포넌트
function AnalysisCard({
  card,
  onClick,
}: {
  card: (typeof ANALYSIS_CARDS)[0];
  onClick: () => void;
}) {
  const Icon = card.icon;

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center p-3 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-700/30 hover:scale-105 transition-all duration-200"
      data-testid={`home-analysis-card-${card.id}`}
    >
      {/* 추천 배지 */}
      {card.recommended && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full z-10">
          추천
        </span>
      )}

      {/* 아이콘 */}
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-2 shadow-lg ${card.shadow} group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* 텍스트 */}
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{card.title}</span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
        {card.description}
      </span>
    </button>
  );
}

/**
 * 홈 - 신규 사용자용 분석 시작 CTA
 * Option C: 5개 카드 동일 스타일 + 3+2 중앙 정렬 + 하단 CTA
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

      {/* 분석 카드 그리드 - 5개 균등 배치 */}
      <div className="grid grid-cols-5 gap-1 mb-5">
        {ANALYSIS_CARDS.map((card) => (
          <AnalysisCard key={card.id} card={card} onClick={() => router.push(card.href)} />
        ))}
      </div>

      {/* 하단 CTA 버튼 */}
      <button
        onClick={() => router.push('/analysis/personal-color')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] transition-all"
      >
        퍼스널 컬러부터 시작하기
        <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
}
