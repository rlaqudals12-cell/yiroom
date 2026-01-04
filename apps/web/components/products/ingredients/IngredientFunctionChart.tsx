'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Droplets, Sun, Sparkles, Shield, Beaker, Leaf, Zap } from 'lucide-react';

interface FunctionData {
  name: string;
  count: number;
}

interface IngredientFunctionChartProps {
  /** 기능별 데이터 */
  data: FunctionData[];
  /** 최대 표시 개수 */
  maxItems?: number;
  /** 추가 클래스 */
  className?: string;
}

// 기능별 색상 및 아이콘
const FUNCTION_STYLES: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  보습: {
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500',
    icon: <Droplets className="w-3.5 h-3.5" />,
  },
  미백: {
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-500',
    icon: <Sun className="w-3.5 h-3.5" />,
  },
  항산화: {
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  진정: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500',
    icon: <Leaf className="w-3.5 h-3.5" />,
  },
  세정: {
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-500',
    icon: <Beaker className="w-3.5 h-3.5" />,
  },
  유화: {
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500',
    icon: <Beaker className="w-3.5 h-3.5" />,
  },
  방부: {
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-500',
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  자외선차단: {
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500',
    icon: <Sun className="w-3.5 h-3.5" />,
  },
  각질제거: {
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-500',
    icon: <Zap className="w-3.5 h-3.5" />,
  },
};

// 기본 스타일
const DEFAULT_STYLE = {
  color: 'text-gray-600 dark:text-gray-400',
  bgColor: 'bg-gray-500',
  icon: <Beaker className="w-3.5 h-3.5" />,
};

/**
 * 성분 기능별 분포 차트
 * - 수평 막대 그래프
 * - 기능별 색상 구분
 */
export function IngredientFunctionChart({
  data,
  maxItems = 6,
  className,
}: IngredientFunctionChartProps) {
  // 정렬 및 제한
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.count - a.count).slice(0, maxItems);
  }, [data, maxItems]);

  // 최대값 (백분율 계산용)
  const maxCount = useMemo(() => {
    return Math.max(...sortedData.map((d) => d.count), 1);
  }, [sortedData]);

  if (sortedData.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        기능별 분류 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="function-chart">
      <h4 className="text-sm font-medium text-muted-foreground">기능별 분포</h4>

      <div className="space-y-2">
        {sortedData.map((item) => {
          const style = FUNCTION_STYLES[item.name] || DEFAULT_STYLE;
          const percentage = (item.count / maxCount) * 100;

          return (
            <div key={item.name} className="space-y-1">
              {/* 라벨 */}
              <div className="flex items-center justify-between text-sm">
                <span className={cn('flex items-center gap-1.5', style.color)}>
                  {style.icon}
                  {item.name}
                </span>
                <span className="text-muted-foreground">{item.count}개</span>
              </div>

              {/* 바 */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', style.bgColor)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * EWG 분포 도넛 차트 (간단 버전 - CSS로 구현)
 */
interface EWGDistributionChartProps {
  distribution: {
    low: number;
    moderate: number;
    high: number;
    unknown: number;
  };
  className?: string;
}

export function EWGDistributionChart({ distribution, className }: EWGDistributionChartProps) {
  const total = distribution.low + distribution.moderate + distribution.high + distribution.unknown;

  if (total === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        EWG 등급 정보가 없습니다.
      </div>
    );
  }

  const segments = [
    { key: 'low', count: distribution.low, color: 'bg-green-500', label: '1-2등급 (안전)' },
    {
      key: 'moderate',
      count: distribution.moderate,
      color: 'bg-yellow-500',
      label: '3-6등급 (보통)',
    },
    { key: 'high', count: distribution.high, color: 'bg-red-500', label: '7-10등급 (주의)' },
    { key: 'unknown', count: distribution.unknown, color: 'bg-gray-400', label: '미확인' },
  ].filter((s) => s.count > 0);

  return (
    <div className={cn('space-y-3', className)} data-testid="ewg-distribution-chart">
      <h4 className="text-sm font-medium text-muted-foreground">EWG 위험등급 분포</h4>

      {/* 스택 바 */}
      <div className="h-4 bg-muted rounded-full overflow-hidden flex">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={cn('h-full transition-all duration-500', segment.color)}
            style={{ width: `${(segment.count / total) * 100}%` }}
            title={`${segment.label}: ${segment.count}개`}
          />
        ))}
      </div>

      {/* 범례 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', segment.color)} />
            <span className="text-muted-foreground">
              {segment.label.split(' ')[0]} ({segment.count}개)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IngredientFunctionChart;
