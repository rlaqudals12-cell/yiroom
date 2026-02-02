'use client';

// 분석 타입별 그라디언트 색상
const ANALYSIS_GRADIENTS: Record<string, string> = {
  'personal-color': 'from-violet-400 to-purple-500',
  skin: 'from-rose-400 to-pink-500',
  body: 'from-blue-400 to-indigo-500',
  hair: 'from-amber-400 to-orange-500',
  makeup: 'from-pink-400 to-rose-500',
};

interface AnalysisProgressBarProps {
  completed: number;
  total: number;
  completedTypes?: string[];
}

/**
 * 분석 진행도 바 컴포넌트
 * Archive 디자인 요소 - 시각적 진행률 표시
 */
export function AnalysisProgressBar({
  completed,
  total,
  completedTypes = [],
}: AnalysisProgressBarProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  // 첫 번째 완료된 분석 타입의 그라디언트 사용
  const gradientClass =
    completedTypes.length > 0
      ? ANALYSIS_GRADIENTS[completedTypes[0]] || 'from-blue-400 to-indigo-500'
      : 'from-blue-400 to-indigo-500';

  return (
    <div className="flex items-center gap-3 mb-4">
      {/* 진행도 바 */}
      <div
        className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`분석 진행도: ${completed}/${total} 완료`}
      >
        <div
          className={`h-full bg-gradient-to-r ${gradientClass} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 진행 텍스트 */}
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {completed}/{total} 완료
      </span>
    </div>
  );
}

export default AnalysisProgressBar;
