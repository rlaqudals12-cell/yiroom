'use client';

import { FilterChipGroup } from '@/components/common/FilterChip';
import { cn } from '@/lib/utils';
import type { AgeGroup } from '@/types/hybrid';

export interface AgeGroupFilterProps {
  /** 선택된 연령대 */
  selectedAgeGroups: AgeGroup[];
  /** 변경 콜백 */
  onAgeGroupChange: (groups: AgeGroup[]) => void;
  /** 연령대별 리뷰 수 표시 */
  reviewCounts?: Record<AgeGroup, number>;
  /** 다중 선택 허용 */
  multiple?: boolean;
  /** 추가 className */
  className?: string;
}

// 연령대 옵션
const AGE_GROUP_OPTIONS: Array<{ value: AgeGroup; label: string }> = [
  { value: '10s', label: '10대' },
  { value: '20s', label: '20대' },
  { value: '30s', label: '30대' },
  { value: '40s', label: '40대' },
  { value: '50plus', label: '50대+' },
];

/**
 * 연령대 필터 (Beauty 도메인)
 * - 10대 ~ 50대+ 선택
 * - 연령대별 리뷰 수 표시
 */
export function AgeGroupFilter({
  selectedAgeGroups,
  onAgeGroupChange,
  reviewCounts,
  multiple = true,
  className,
}: AgeGroupFilterProps) {
  const options = AGE_GROUP_OPTIONS.map((opt) => ({
    value: opt.value,
    label: reviewCounts
      ? `${opt.label} (${reviewCounts[opt.value]?.toLocaleString() || 0})`
      : opt.label,
  }));

  return (
    <div className={cn('space-y-2', className)} data-testid="age-group-filter">
      <p className="text-sm font-medium text-muted-foreground">연령대</p>
      <FilterChipGroup
        options={options}
        selected={selectedAgeGroups}
        onChange={onAgeGroupChange}
        multiple={multiple}
        variant="beauty"
        size="sm"
      />
    </div>
  );
}

export default AgeGroupFilter;
