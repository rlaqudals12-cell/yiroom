'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Minus } from 'lucide-react';

type SkinType = 'oily' | 'dry' | 'sensitive' | 'combination' | 'normal';
type CompatibilityLevel = 'good' | 'neutral' | 'caution';

interface SkinTypeAnalysisProps {
  /** 피부타입별 호환성 */
  compatibility: Record<string, CompatibilityLevel>;
  /** 추가 클래스 */
  className?: string;
}

// 피부타입 한글 라벨
const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  oily: '지성',
  dry: '건성',
  sensitive: '민감성',
  combination: '복합성',
  normal: '중성',
};

// 호환성 레벨 설정
const COMPATIBILITY_CONFIG: Record<
  CompatibilityLevel,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  good: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: '권장',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  neutral: {
    icon: <Minus className="w-4 h-4" />,
    label: '보통',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800/30',
  },
  caution: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: '주의',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
};

/**
 * 피부타입별 적합도 분석 컴포넌트
 */
export function SkinTypeAnalysis({ compatibility, className }: SkinTypeAnalysisProps) {
  const skinTypes: SkinType[] = ['oily', 'dry', 'sensitive', 'combination', 'normal'];

  return (
    <div className={cn('space-y-3', className)} data-testid="skin-type-analysis">
      <h4 className="text-sm font-medium text-muted-foreground">피부타입별 적합도</h4>

      {/* 그리드 레이아웃 */}
      <div className="grid grid-cols-5 gap-2">
        {skinTypes.map((type) => {
          const level = (compatibility[type] as CompatibilityLevel) || 'neutral';
          const config = COMPATIBILITY_CONFIG[level];

          return (
            <div
              key={type}
              className={cn('flex flex-col items-center gap-1 p-2 rounded-lg', config.bgColor)}
            >
              <span className={config.color}>{config.icon}</span>
              <span className="text-xs font-medium">{SKIN_TYPE_LABELS[type]}</span>
              <span className={cn('text-[10px]', config.color)}>{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* 범례 (가로 배치) */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        {Object.entries(COMPATIBILITY_CONFIG).map(([level, config]) => (
          <div key={level} className="flex items-center gap-1">
            <span className={config.color}>{config.icon}</span>
            <span>{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 간단한 피부타입 적합도 배지 (인라인용)
 */
interface SkinTypeBadgeProps {
  skinType: SkinType;
  level: CompatibilityLevel;
  className?: string;
}

export function SkinTypeBadge({ skinType, level, className }: SkinTypeBadgeProps) {
  const config = COMPATIBILITY_CONFIG[level];

  return (
    <span
      data-testid="skin-type-badge"
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.icon}
      {SKIN_TYPE_LABELS[skinType]}
    </span>
  );
}

export default SkinTypeAnalysis;
