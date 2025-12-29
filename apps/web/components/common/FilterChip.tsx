'use client';

import { cn } from '@/lib/utils';

// 도메인 variant 타입
export type FilterChipVariant = 'default' | 'beauty' | 'style';

export interface FilterChipProps<T extends string = string> {
  /** 표시할 라벨 */
  label: string;
  /** 칩의 값 (토글 시 콜백으로 전달) */
  value: T;
  /** 선택 상태 */
  selected?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 아이콘 (라벨 앞에 표시) */
  icon?: React.ReactNode;
  /** 도메인별 색상 테마 */
  variant?: FilterChipVariant;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 토글 시 콜백 */
  onToggle: (value: T) => void;
  /** 추가 className */
  className?: string;
}

// variant별 선택 상태 색상
const variantStyles: Record<FilterChipVariant, { selected: string; unselected: string }> = {
  default: {
    selected: 'bg-primary text-primary-foreground',
    unselected: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  },
  beauty: {
    selected: 'bg-pink-500 text-white',
    unselected: 'bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/30 dark:text-pink-300 dark:hover:bg-pink-900/40',
  },
  style: {
    selected: 'bg-indigo-500 text-white',
    unselected: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-900/40',
  },
};

// 크기별 스타일
const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

/**
 * 필터 칩 공통 컴포넌트
 * - Beauty/Style 도메인별 색상 테마
 * - 아이콘 지원
 * - 다양한 크기
 */
export function FilterChip<T extends string = string>({
  label,
  value,
  selected = false,
  disabled = false,
  icon,
  variant = 'default',
  size = 'md',
  onToggle,
  className,
}: FilterChipProps<T>) {
  const styles = variantStyles[variant];

  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(value)}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
        sizeStyles[size],
        selected ? styles.selected : styles.unselected,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {label}
    </button>
  );
}

export interface FilterChipGroupProps<T extends string> {
  /** 옵션 목록 */
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>;
  /** 선택된 값들 */
  selected: T[];
  /** 변경 콜백 */
  onChange: (selected: T[]) => void;
  /** 다중 선택 허용 */
  multiple?: boolean;
  /** 도메인 variant */
  variant?: FilterChipVariant;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 className */
  className?: string;
}

/**
 * 필터 칩 그룹 컴포넌트
 * - 단일/다중 선택 지원
 * - 옵션 배열로 일괄 렌더링
 */
export function FilterChipGroup<T extends string>({
  options,
  selected,
  onChange,
  multiple = true,
  variant = 'default',
  size = 'md',
  className,
}: FilterChipGroupProps<T>) {
  const handleToggle = (value: T) => {
    if (multiple) {
      // 다중 선택
      const newSelected = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      onChange(newSelected);
    } else {
      // 단일 선택 (토글)
      onChange(selected.includes(value) ? [] : [value]);
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group">
      {options.map((option) => (
        <FilterChip
          key={option.value}
          label={option.label}
          value={option.value}
          selected={selected.includes(option.value)}
          icon={option.icon}
          variant={variant}
          size={size}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}

export default FilterChip;
