'use client';

import { useState } from 'react';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackCustomEvent } from '@/lib/analytics';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { PriceRange, SkinType, SkinConcern, PersonalColorSeason } from '@/types/product';

/** 필터 상태 타입 */
export interface ProductFilterState {
  priceRange?: PriceRange[];
  skinTypes?: SkinType[];
  skinConcerns?: SkinConcern[];
  personalColorSeasons?: PersonalColorSeason[];
}

interface ProductFiltersProps {
  filters: ProductFilterState;
  onFiltersChange: (filters: ProductFilterState) => void;
  /** 사용자 분석 데이터로 자동 필터 설정 */
  userAnalysis?: {
    skinType?: SkinType;
    skinConcerns?: SkinConcern[];
    personalColorSeason?: PersonalColorSeason;
  };
  className?: string;
}

/** 가격대 옵션 */
const PRICE_OPTIONS: Array<{ value: PriceRange; label: string }> = [
  { value: 'budget', label: '~2만원' },
  { value: 'mid', label: '2~5만원' },
  { value: 'premium', label: '5만원~' },
];

/** 피부 타입 옵션 */
const SKIN_TYPE_OPTIONS: Array<{ value: SkinType; label: string }> = [
  { value: 'dry', label: '건성' },
  { value: 'oily', label: '지성' },
  { value: 'combination', label: '복합성' },
  { value: 'sensitive', label: '민감성' },
  { value: 'normal', label: '중성' },
];

/** 피부 고민 옵션 */
const SKIN_CONCERN_OPTIONS: Array<{ value: SkinConcern; label: string }> = [
  { value: 'acne', label: '여드름' },
  { value: 'aging', label: '노화' },
  { value: 'whitening', label: '미백' },
  { value: 'hydration', label: '수분' },
  { value: 'pore', label: '모공' },
  { value: 'redness', label: '홍조' },
];

/** 퍼스널 컬러 옵션 */
const PERSONAL_COLOR_OPTIONS: Array<{ value: PersonalColorSeason; label: string }> = [
  { value: 'Spring', label: '봄 웜톤' },
  { value: 'Summer', label: '여름 쿨톤' },
  { value: 'Autumn', label: '가을 웜톤' },
  { value: 'Winter', label: '겨울 쿨톤' },
];

/**
 * 제품 필터 컴포넌트
 * - 모바일: Sheet(바텀시트)
 * - 가격대, 피부타입, 피부고민, 퍼스널컬러 필터
 * - "내 분석 결과 적용" 버튼 (사용자 분석 데이터 연동)
 */
export function ProductFilters({
  filters,
  onFiltersChange,
  userAnalysis,
  className,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  // 로컬 필터 상태 (Sheet 내부에서 관리)
  const [localFilters, setLocalFilters] = useState<ProductFilterState>(filters);

  // 활성화된 필터 수 계산
  const activeFilterCount =
    (filters.priceRange?.length || 0) +
    (filters.skinTypes?.length || 0) +
    (filters.skinConcerns?.length || 0) +
    (filters.personalColorSeasons?.length || 0);

  // Sheet 열릴 때 로컬 상태 동기화
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalFilters(filters);
    }
    setIsOpen(open);
  };

  // 배열 필터 토글
  const toggleArrayFilter = <T extends string>(
    key: keyof ProductFilterState,
    value: T
  ) => {
    setLocalFilters((prev) => {
      const current = (prev[key] as T[] | undefined) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated.length > 0 ? updated : undefined };
    });
  };

  // 필터 초기화
  const handleReset = () => {
    setLocalFilters({});
  };

  // 필터 적용
  const handleApply = () => {
    // 필터 사용 트래킹
    const filterSummary = {
      priceRange: localFilters.priceRange?.length || 0,
      skinTypes: localFilters.skinTypes?.length || 0,
      skinConcerns: localFilters.skinConcerns?.length || 0,
      personalColorSeasons: localFilters.personalColorSeasons?.length || 0,
    };
    trackCustomEvent('feature_use', 'Product Filter Applied', filterSummary);

    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  // 내 분석 결과 적용
  const handleApplyUserAnalysis = () => {
    if (!userAnalysis) return;

    // 분석 결과 적용 트래킹
    trackCustomEvent('feature_use', 'Apply User Analysis to Filter', {
      hasSkinType: !!userAnalysis.skinType,
      hasSkinConcerns: !!userAnalysis.skinConcerns?.length,
      hasPersonalColor: !!userAnalysis.personalColorSeason,
    });

    const newFilters: ProductFilterState = {};

    if (userAnalysis.skinType) {
      newFilters.skinTypes = [userAnalysis.skinType];
    }

    if (userAnalysis.skinConcerns && userAnalysis.skinConcerns.length > 0) {
      newFilters.skinConcerns = userAnalysis.skinConcerns;
    }

    if (userAnalysis.personalColorSeason) {
      newFilters.personalColorSeasons = [userAnalysis.personalColorSeason];
    }

    setLocalFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // 필터 배지 제거
  const removeFilter = (key: keyof ProductFilterState, value: string) => {
    const updated = { ...filters };
    const current = updated[key] as string[] | undefined;
    if (current) {
      const newValue = current.filter((v) => v !== value);
      updated[key] = newValue.length > 0 ? (newValue as never) : undefined;
    }
    onFiltersChange(updated);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* 필터 버튼 + 배지 */}
      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              필터
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle>필터</SheetTitle>
            </SheetHeader>

            <div className="space-y-6">
              {/* 내 분석 결과 적용 버튼 */}
              {userAnalysis && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleApplyUserAnalysis}
                >
                  내 분석 결과 적용
                </Button>
              )}

              {/* 가격대 */}
              <FilterSection title="가격대">
                <div className="flex flex-wrap gap-2">
                  {PRICE_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      selected={localFilters.priceRange?.includes(option.value)}
                      onToggle={() => toggleArrayFilter('priceRange', option.value)}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 피부 타입 */}
              <FilterSection title="피부 타입">
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPE_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      selected={localFilters.skinTypes?.includes(option.value)}
                      onToggle={() => toggleArrayFilter('skinTypes', option.value)}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 피부 고민 */}
              <FilterSection title="피부 고민">
                <div className="flex flex-wrap gap-2">
                  {SKIN_CONCERN_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      selected={localFilters.skinConcerns?.includes(option.value)}
                      onToggle={() => toggleArrayFilter('skinConcerns', option.value)}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* 퍼스널 컬러 */}
              <FilterSection title="퍼스널 컬러">
                <div className="flex flex-wrap gap-2">
                  {PERSONAL_COLOR_OPTIONS.map((option) => (
                    <FilterChip
                      key={option.value}
                      label={option.label}
                      selected={localFilters.personalColorSeasons?.includes(option.value)}
                      onToggle={() =>
                        toggleArrayFilter('personalColorSeasons', option.value)
                      }
                    />
                  ))}
                </div>
              </FilterSection>
            </div>

            <SheetFooter className="mt-6 flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                초기화
              </Button>
              <SheetClose asChild>
                <Button className="flex-1" onClick={handleApply}>
                  적용하기
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* 활성 필터 배지 */}
        {filters.priceRange?.map((value) => (
          <FilterBadge
            key={`price-${value}`}
            label={PRICE_OPTIONS.find((o) => o.value === value)?.label || value}
            onRemove={() => removeFilter('priceRange', value)}
          />
        ))}
        {filters.skinTypes?.map((value) => (
          <FilterBadge
            key={`skin-${value}`}
            label={SKIN_TYPE_OPTIONS.find((o) => o.value === value)?.label || value}
            onRemove={() => removeFilter('skinTypes', value)}
          />
        ))}
        {filters.skinConcerns?.map((value) => (
          <FilterBadge
            key={`concern-${value}`}
            label={SKIN_CONCERN_OPTIONS.find((o) => o.value === value)?.label || value}
            onRemove={() => removeFilter('skinConcerns', value)}
          />
        ))}
        {filters.personalColorSeasons?.map((value) => (
          <FilterBadge
            key={`pc-${value}`}
            label={PERSONAL_COLOR_OPTIONS.find((o) => o.value === value)?.label || value}
            onRemove={() => removeFilter('personalColorSeasons', value)}
          />
        ))}
      </div>
    </div>
  );
}

/** 필터 섹션 */
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

/** 필터 칩 (선택 가능) */
function FilterChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1.5 text-sm transition-colors',
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      )}
    >
      {label}
    </button>
  );
}

/** 활성 필터 배지 (제거 가능) */
function FilterBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 hover:bg-muted"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

export default ProductFilters;
