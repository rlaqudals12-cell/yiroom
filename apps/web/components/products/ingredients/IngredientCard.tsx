'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Droplets,
  Sun,
  Sparkles,
  Shield,
  Beaker,
  Leaf,
  AlertTriangle,
} from 'lucide-react';
import type { CosmeticIngredient, IngredientCategory } from '@/types/ingredient';
import { IngredientEWGBadge } from './IngredientEWGBadge';
import { INGREDIENT_CATEGORY_LABELS } from '@/types/ingredient';

interface IngredientCardProps {
  /** 성분 데이터 */
  ingredient: CosmeticIngredient;
  /** 성분표 순서 (1부터 시작) */
  order?: number;
  /** 펼쳐진 상태로 시작 */
  defaultExpanded?: boolean;
  /** 추가 클래스 */
  className?: string;
}

// 카테고리별 아이콘
const CATEGORY_ICONS: Record<IngredientCategory, React.ReactNode> = {
  moisturizer: <Droplets className="w-4 h-4" />,
  whitening: <Sun className="w-4 h-4" />,
  antioxidant: <Sparkles className="w-4 h-4" />,
  soothing: <Leaf className="w-4 h-4" />,
  surfactant: <Beaker className="w-4 h-4" />,
  preservative: <Shield className="w-4 h-4" />,
  sunscreen: <Sun className="w-4 h-4" />,
  exfoliant: <Sparkles className="w-4 h-4" />,
  emulsifier: <Beaker className="w-4 h-4" />,
  fragrance: <Leaf className="w-4 h-4" />,
  colorant: <Sparkles className="w-4 h-4" />,
  other: <Beaker className="w-4 h-4" />,
};

/**
 * 개별 성분 카드 컴포넌트
 * - 성분명, EWG 등급, 카테고리 표시
 * - 펼치기 시 상세 정보 (효능, 우려사항)
 */
export function IngredientCard({
  ingredient,
  order,
  defaultExpanded = false,
  className,
}: IngredientCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const {
    nameKo,
    nameEn,
    ewgScore,
    category,
    functions,
    isCaution20,
    isAllergen,
    description,
    benefits,
    concerns,
  } = ingredient;

  const hasCaution = isCaution20 || isAllergen;
  const categoryLabel = INGREDIENT_CATEGORY_LABELS[category] || category;
  const CategoryIcon = CATEGORY_ICONS[category] || CATEGORY_ICONS.other;

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all duration-200',
        hasCaution
          ? 'border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-900/10'
          : 'border-border bg-card',
        className
      )}
      data-testid="ingredient-card"
    >
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
        aria-expanded={isExpanded}
      >
        {/* 순서 */}
        {order !== undefined && (
          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
            {order}
          </span>
        )}

        {/* 성분 정보 */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{nameKo}</span>
            {hasCaution && (
              <AlertTriangle
                className="w-3.5 h-3.5 text-orange-500 shrink-0"
                aria-label="주의 성분"
              />
            )}
          </div>
          {nameEn && <p className="text-xs text-muted-foreground truncate">{nameEn}</p>}
        </div>

        {/* 카테고리 */}
        <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground shrink-0">
          {CategoryIcon}
          {categoryLabel}
        </span>

        {/* EWG 배지 */}
        <IngredientEWGBadge score={ewgScore} size="sm" showLabel={false} />

        {/* 펼치기 아이콘 */}
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* 상세 정보 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t">
          {/* 기능 태그 */}
          {functions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3">
              {functions.map((fn) => (
                <span
                  key={fn}
                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {fn}
                </span>
              ))}
            </div>
          )}

          {/* 설명 */}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}

          {/* 효능 */}
          {benefits && benefits.length > 0 && (
            <div>
              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">효능</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-green-500 shrink-0">+</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 우려사항 */}
          {concerns && concerns.length > 0 && (
            <div>
              <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                주의사항
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {concerns.map((concern, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-orange-500 shrink-0">!</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 주의 성분 표시 */}
          {hasCaution && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {isCaution20 && (
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                  20가지 주의 성분
                </span>
              )}
              {isAllergen && (
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                  알레르기 유발 가능
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 성분 카드 스켈레톤
 */
export function IngredientCardSkeleton() {
  return (
    <div
      data-testid="ingredient-card-skeleton"
      className="border rounded-xl px-4 py-3 animate-pulse"
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-muted rounded-full" />
        <div className="flex-1 space-y-1">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-6 bg-muted rounded-full w-16" />
      </div>
    </div>
  );
}

export default IngredientCard;
