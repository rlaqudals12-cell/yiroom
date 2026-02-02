'use client';

import { useRouter } from 'next/navigation';
import { Target, ChevronRight, Palette, Sparkles, User, Scissors, Heart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// 분석 타입별 메타 정보
const ANALYSIS_META: Record<
  string,
  { icon: LucideIcon; label: string; gradient: string; href: string }
> = {
  'personal-color': {
    icon: Palette,
    label: '퍼스널 컬러',
    gradient: 'from-violet-400 to-purple-500',
    href: '/analysis/personal-color',
  },
  skin: {
    icon: Sparkles,
    label: '피부 분석',
    gradient: 'from-rose-400 to-pink-500',
    href: '/analysis/skin',
  },
  body: {
    icon: User,
    label: '체형 분석',
    gradient: 'from-blue-400 to-indigo-500',
    href: '/analysis/body',
  },
  hair: {
    icon: Scissors,
    label: '헤어 분석',
    gradient: 'from-amber-400 to-orange-500',
    href: '/analysis/hair',
  },
  makeup: {
    icon: Heart,
    label: '메이크업',
    gradient: 'from-pink-400 to-rose-500',
    href: '/analysis/makeup',
  },
};

// 레벨 기준
const LEVEL_THRESHOLDS = {
  1: { min: 0, max: 2, label: 'Level 1', description: '기본' },
  2: { min: 3, max: 4, label: 'Level 2', description: '활성' },
  3: { min: 5, max: 5, label: 'Level 3', description: '완전' },
};

interface NextLevelCardProps {
  completedCount: number;
  incompleteTypes: string[];
}

/**
 * 다음 레벨 안내 카드 - Archive 디자인 요소
 * 계층적 진행 표시 및 다음 분석 추천
 */
// 레벨 계산 함수
function calculateLevel(count: number): 1 | 2 | 3 {
  if (count >= 5) return 3;
  if (count >= 3) return 2;
  return 1;
}

export function NextLevelCard({ completedCount, incompleteTypes }: NextLevelCardProps) {
  const router = useRouter();

  // 현재 레벨 계산
  const currentLevel = calculateLevel(completedCount);
  const nextLevel = Math.min(currentLevel + 1, 3) as 1 | 2 | 3;
  const nextLevelThreshold = LEVEL_THRESHOLDS[nextLevel];
  const analysisNeeded = nextLevelThreshold.min - completedCount;

  // 레벨 3이면 완료 상태
  if (currentLevel === 3) {
    return (
      <div
        className="flex items-center gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50"
        aria-label="분석 완료 상태"
      >
        <div className="flex items-center gap-2 text-emerald-500">
          <Target className="w-5 h-5" />
          <span className="text-sm font-medium">모든 분석 완료!</span>
        </div>
        <span className="text-xs text-muted-foreground">Level 3 달성 🎉</span>
      </div>
    );
  }

  // 다음 추천 분석 (첫 번째 미완료 타입)
  const nextAnalysis = incompleteTypes[0];
  const nextMeta = nextAnalysis ? ANALYSIS_META[nextAnalysis] : null;
  const NextIcon = nextMeta?.icon;

  return (
    <div
      className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 space-y-3"
      aria-label="다음 단계 안내"
    >
      {/* 레벨 진행 상태 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {nextLevelThreshold.label} 해제까지
          </span>
        </div>
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
          {analysisNeeded > 0 ? `${analysisNeeded}개 더 필요` : '달성!'}
        </span>
      </div>

      {/* 미니 진행도 바 */}
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500 rounded-full"
          style={{
            width: `${((completedCount - LEVEL_THRESHOLDS[currentLevel].min) / (nextLevelThreshold.min - LEVEL_THRESHOLDS[currentLevel].min)) * 100}%`,
          }}
        />
      </div>

      {/* 다음 추천 분석 */}
      {nextMeta && NextIcon && (
        <button
          onClick={() => router.push(nextMeta.href)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${nextMeta.gradient} flex items-center justify-center`}
            >
              <NextIcon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">추천</p>
              <p className="text-sm font-medium text-slate-800 dark:text-white">{nextMeta.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-blue-500 group-hover:translate-x-1 transition-transform">
            <span className="text-sm font-medium">시작하기</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      )}
    </div>
  );
}

export default NextLevelCard;
