'use client';

import { cn } from '@/lib/utils';
import { List, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

/**
 * 성분 필터 타입
 */
export type IngredientFilterType = 'all' | 'caution20' | 'allergen' | 'function';

interface FilterTabOption {
  value: IngredientFilterType;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface IngredientFilterTabsProps {
  /** 현재 선택된 필터 */
  selected: IngredientFilterType;
  /** 필터 변경 콜백 */
  onChange: (filter: IngredientFilterType) => void;
  /** 각 필터별 성분 수 */
  counts: {
    all: number;
    caution20: number;
    allergen: number;
  };
  /** 추가 클래스 */
  className?: string;
}

/**
 * 성분 필터 탭 컴포넌트
 * - 전체 / 20가지 주의 / 알레르기 / 기능별
 */
export function IngredientFilterTabs({
  selected,
  onChange,
  counts,
  className,
}: IngredientFilterTabsProps) {
  const options: FilterTabOption[] = [
    {
      value: 'all',
      label: '전체',
      icon: <List className="w-4 h-4" />,
      count: counts.all,
    },
    {
      value: 'caution20',
      label: '20가지 성분',
      icon: <AlertTriangle className="w-4 h-4" />,
      count: counts.caution20,
    },
    {
      value: 'allergen',
      label: '알레르기',
      icon: <AlertCircle className="w-4 h-4" />,
      count: counts.allergen,
    },
    {
      value: 'function',
      label: '기능별',
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className={cn('flex gap-2 overflow-x-auto pb-1', className)}
      role="tablist"
      aria-label="성분 필터"
      data-testid="ingredient-filter-tabs"
    >
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
              isSelected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {option.icon}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  isSelected
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 기능별 서브 필터 (기능별 탭 선택 시 표시)
 */
interface FunctionSubFilterProps {
  /** 기능 목록 */
  functions: { name: string; count: number }[];
  /** 선택된 기능 */
  selected: string | null;
  /** 선택 변경 */
  onChange: (fn: string | null) => void;
  /** 추가 클래스 */
  className?: string;
}

export function FunctionSubFilter({
  functions,
  selected,
  onChange,
  className,
}: FunctionSubFilterProps) {
  return (
    <div
      className={cn('flex gap-2 overflow-x-auto pb-1', className)}
      data-testid="function-sub-filter"
    >
      <button
        onClick={() => onChange(null)}
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
          selected === null
            ? 'bg-foreground text-background'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        전체
      </button>
      {functions.map((fn) => (
        <button
          key={fn.name}
          onClick={() => onChange(fn.name)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
            selected === fn.name
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {fn.name} ({fn.count})
        </button>
      ))}
    </div>
  );
}

export default IngredientFilterTabs;
