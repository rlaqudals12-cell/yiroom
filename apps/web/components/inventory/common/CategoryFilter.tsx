'use client';

/**
 * 카테고리 필터 컴포넌트
 * - 수평 스크롤 가능한 필터 칩
 * - 의류 카테고리 / 계절 / TPO 필터 지원
 * - 다중 선택 지원
 */

import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  CLOTHING_SUB_CATEGORIES,
  SEASON_LABELS,
  OCCASION_LABELS,
} from '@/types/inventory';
import type { ClothingCategory } from '@/types/inventory';

// 의류 카테고리 라벨
const CLOTHING_CATEGORY_LABELS: Record<ClothingCategory, string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

type FilterType = 'category' | 'season' | 'occasion' | 'custom';

interface FilterOption {
  value: string;
  label: string;
}

interface CategoryFilterProps {
  type?: FilterType;
  options?: FilterOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  showAll?: boolean;
  allLabel?: string;
}

export function CategoryFilter({
  type = 'category',
  options: customOptions,
  selected,
  onChange,
  multiple = false,
  showAll = true,
  allLabel = '전체',
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // 옵션 목록 생성
  const options: FilterOption[] = customOptions || getDefaultOptions(type);

  // 스크롤 화살표 표시 여부 확인
  const checkScrollArrows = () => {
    const container = scrollRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener('resize', checkScrollArrows);
    return () => window.removeEventListener('resize', checkScrollArrows);
  }, [options]);

  // 스크롤 이동
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = 150;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // 선택 처리
  const handleSelect = (value: string) => {
    if (value === 'all') {
      onChange([]);
      return;
    }

    if (multiple) {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    } else {
      onChange(selected.includes(value) ? [] : [value]);
    }
  };

  const isSelected = (value: string) => {
    if (value === 'all') {
      return selected.length === 0;
    }
    return selected.includes(value);
  };

  return (
    <div data-testid="category-filter" className="relative">
      {/* 왼쪽 스크롤 버튼 */}
      {showLeftArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* 필터 칩 컨테이너 */}
      <div
        ref={scrollRef}
        onScroll={checkScrollArrows}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* 전체 버튼 */}
        {showAll && (
          <FilterChip
            label={allLabel}
            selected={isSelected('all')}
            onClick={() => handleSelect('all')}
          />
        )}

        {/* 옵션 버튼들 */}
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={isSelected(option.value)}
            onClick={() => handleSelect(option.value)}
          />
        ))}
      </div>

      {/* 오른쪽 스크롤 버튼 */}
      {showRightArrow && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// 필터 칩 컴포넌트
interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function FilterChip({ label, selected, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
        'border focus:outline-none focus:ring-2 focus:ring-primary/20',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

// 기본 옵션 생성
function getDefaultOptions(type: FilterType): FilterOption[] {
  switch (type) {
    case 'category':
      return Object.entries(CLOTHING_CATEGORY_LABELS).map(([value, label]) => ({
        value,
        label,
      }));
    case 'season':
      return Object.entries(SEASON_LABELS).map(([value, label]) => ({
        value,
        label,
      }));
    case 'occasion':
      return Object.entries(OCCASION_LABELS).map(([value, label]) => ({
        value,
        label,
      }));
    default:
      return [];
  }
}

// 서브카테고리 필터 (특정 카테고리에 종속)
interface SubCategoryFilterProps {
  category: ClothingCategory;
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
}

export function SubCategoryFilter({
  category,
  selected,
  onChange,
  multiple = false,
}: SubCategoryFilterProps) {
  const subCategories = CLOTHING_SUB_CATEGORIES[category] || [];

  const options: FilterOption[] = subCategories.map((sub) => ({
    value: sub,
    label: sub,
  }));

  return (
    <CategoryFilter
      type="custom"
      options={options}
      selected={selected}
      onChange={onChange}
      multiple={multiple}
      showAll
      allLabel="전체"
    />
  );
}
