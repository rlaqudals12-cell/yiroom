'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Search } from 'lucide-react';
import type { CosmeticIngredient } from '@/types/ingredient';
import { IngredientCard, IngredientCardSkeleton } from './IngredientCard';
import {
  IngredientFilterTabs,
  FunctionSubFilter,
  type IngredientFilterType,
} from './IngredientFilterTabs';

interface IngredientListProps {
  /** 성분 목록 */
  ingredients: CosmeticIngredient[];
  /** 기능별 집계 데이터 */
  functionCounts?: { name: string; count: number }[];
  /** 초기 표시 개수 */
  initialCount?: number;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 성분 목록 컴포넌트
 * - 필터 탭 (전체/20가지/알레르기/기능별)
 * - 검색 기능
 * - 더보기 버튼
 */
export function IngredientList({
  ingredients,
  functionCounts = [],
  initialCount = 10,
  isLoading = false,
  className,
}: IngredientListProps) {
  // 필터 상태
  const [filter, setFilter] = useState<IngredientFilterType>('all');
  const [functionFilter, setFunctionFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCount, setShowCount] = useState(initialCount);

  // 필터별 성분 수
  const counts = useMemo(
    () => ({
      all: ingredients.length,
      caution20: ingredients.filter((i) => i.isCaution20).length,
      allergen: ingredients.filter((i) => i.isAllergen).length,
    }),
    [ingredients]
  );

  // 필터링된 성분 목록
  const filteredIngredients = useMemo(() => {
    let result = [...ingredients];

    // 탭 필터 적용
    switch (filter) {
      case 'caution20':
        result = result.filter((i) => i.isCaution20);
        break;
      case 'allergen':
        result = result.filter((i) => i.isAllergen);
        break;
      case 'function':
        if (functionFilter) {
          result = result.filter((i) => i.functions.includes(functionFilter));
        }
        break;
    }

    // 검색 필터 적용
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.nameKo.toLowerCase().includes(query) ||
          (i.nameEn && i.nameEn.toLowerCase().includes(query))
      );
    }

    return result;
  }, [ingredients, filter, functionFilter, searchQuery]);

  // 표시할 성분 (페이지네이션)
  const displayedIngredients = filteredIngredients.slice(0, showCount);
  const hasMore = filteredIngredients.length > showCount;

  // 더보기
  const handleShowMore = () => {
    setShowCount((prev) => prev + 10);
  };

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <IngredientFilterTabs
          selected="all"
          onChange={() => {}}
          counts={{ all: 0, caution20: 0, allergen: 0 }}
        />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <IngredientCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="ingredient-list">
      {/* 필터 탭 */}
      <IngredientFilterTabs
        selected={filter}
        onChange={(newFilter) => {
          setFilter(newFilter);
          setFunctionFilter(null);
          setShowCount(initialCount);
        }}
        counts={counts}
      />

      {/* 기능별 서브 필터 */}
      {filter === 'function' && functionCounts.length > 0 && (
        <FunctionSubFilter
          functions={functionCounts}
          selected={functionFilter}
          onChange={setFunctionFilter}
        />
      )}

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="성분 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* 성분 개수 */}
      <p className="text-sm text-muted-foreground">
        총 <span className="font-medium text-foreground">{filteredIngredients.length}</span>개 성분
        {searchQuery && ` (검색: "${searchQuery}")`}
      </p>

      {/* 성분 목록 */}
      {filteredIngredients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>해당하는 성분이 없습니다.</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm text-primary hover:underline"
            >
              검색어 지우기
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedIngredients.map((ingredient, index) => (
            <IngredientCard key={ingredient.id} ingredient={ingredient} order={index + 1} />
          ))}
        </div>
      )}

      {/* 더보기 버튼 */}
      {hasMore && (
        <button
          onClick={handleShowMore}
          className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors border"
        >
          더보기 ({filteredIngredients.length - showCount}개 남음)
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default IngredientList;
