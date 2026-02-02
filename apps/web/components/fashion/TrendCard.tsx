'use client';

/**
 * K-2 패션 확장: 트렌드 시각화 카드 컴포넌트
 *
 * @description 2026 패션 트렌드 및 스타일 카테고리 시각화
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 3.3
 * @see lib/fashion/style-categories.ts
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Minus,
  Star,
  ChevronRight,
  Sparkles,
  Calendar,
  Tag,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STYLE_CATEGORIES_DETAIL,
  STYLE_TREND_ITEMS_2026,
  STYLE_BY_PERSONAL_COLOR,
  getStyleLabel,
  getRisingTrendStyles,
  type StyleCategory,
  type StyleCategoryDetail,
} from '@/lib/fashion/style-categories';
import type { PersonalColorSeason } from '@/lib/color-recommendations';

// 트렌드 레벨별 스타일
const TREND_LEVEL_STYLES: Record<
  'rising' | 'steady' | 'classic',
  { icon: typeof TrendingUp; color: string; bg: string; label: string }
> = {
  rising: {
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    label: '상승 중',
  },
  steady: {
    icon: Minus,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    label: '안정',
  },
  classic: {
    icon: Star,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    label: '클래식',
  },
};

interface TrendCardProps {
  /** 사용자의 퍼스널컬러 시즌 */
  personalColor?: PersonalColorSeason;
  /** 클래스명 */
  className?: string;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 스타일 카테고리 아이템 컴포넌트
 */
function StyleCategoryItem({
  category,
  detail,
  isRecommended,
  isSelected,
  onSelect,
}: {
  category: StyleCategory;
  detail: StyleCategoryDetail;
  isRecommended: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const trendStyle = TREND_LEVEL_STYLES[detail.trendLevel2026];
  const TrendIcon = trendStyle.icon;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full p-4 rounded-xl border text-left transition-all',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 bg-white dark:bg-slate-800'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground">{detail.label}</h4>
            <span className="text-xs text-muted-foreground">({detail.labelEn})</span>
            {isRecommended && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                추천
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{detail.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn('px-2 py-1 rounded-full flex items-center gap-1', trendStyle.bg)}>
            <TrendIcon className={cn('w-3 h-3', trendStyle.color)} />
            <span className={cn('text-xs font-medium', trendStyle.color)}>
              {trendStyle.label}
            </span>
          </div>
          <ChevronRight className={cn(
            'w-4 h-4 transition-transform',
            isSelected ? 'text-primary rotate-90' : 'text-muted-foreground'
          )} />
        </div>
      </div>

      {/* 확장 정보 */}
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
          {/* 트렌드 아이템 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>2026 트렌드 아이템</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_TREND_ITEMS_2026[category].map((item, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* 추천 상황 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>추천 상황</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {detail.suitableOccasions.map((occasion, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                >
                  {occasion}
                </span>
              ))}
            </div>
          </div>

          {/* 추천 체형 */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>추천 체형</span>
            </div>
            <div className="flex gap-1.5">
              {detail.recommendedBodyTypes.map((type, idx) => (
                <span
                  key={idx}
                  className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full bg-slate-200 dark:bg-slate-700 text-foreground"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

/**
 * 트렌드 카드 메인 컴포넌트
 */
export function TrendCard({
  personalColor,
  className,
  compact = false,
}: TrendCardProps) {
  const [selectedCategory, setSelectedCategory] = useState<StyleCategory | null>(null);
  const [filter, setFilter] = useState<'all' | 'rising' | 'recommended'>('all');

  // 상승 트렌드 스타일
  const risingStyles = useMemo(() => getRisingTrendStyles(), []);

  // 추천 스타일 (퍼스널컬러 기반)
  const recommendedStyles = useMemo(() => {
    if (!personalColor) return [];
    return STYLE_BY_PERSONAL_COLOR[personalColor] || [];
  }, [personalColor]);

  // 필터링된 카테고리
  const filteredCategories = useMemo(() => {
    const allCategories = Object.keys(STYLE_CATEGORIES_DETAIL) as StyleCategory[];

    switch (filter) {
      case 'rising':
        return allCategories.filter((cat) =>
          STYLE_CATEGORIES_DETAIL[cat].trendLevel2026 === 'rising'
        );
      case 'recommended':
        return recommendedStyles.length > 0 ? recommendedStyles : allCategories;
      default:
        return allCategories;
    }
  }, [filter, recommendedStyles]);

  const toggleCategory = (category: StyleCategory) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  return (
    <div
      className={cn(
        'bg-slate-50 dark:bg-slate-900/50 rounded-2xl shadow-sm overflow-hidden',
        className
      )}
      data-testid="trend-card"
    >
      {/* 헤더 */}
      <div className="p-5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">2026 패션 트렌드</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              올해의 스타일 트렌드
            </p>
          </div>
        </div>

        {/* 필터 버튼 */}
        {!compact && (
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filter === 'all'
                  ? 'bg-foreground text-background'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('rising')}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                filter === 'rising'
                  ? 'bg-green-500 text-white'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              상승 트렌드
            </button>
            {personalColor && (
              <button
                onClick={() => setFilter('recommended')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                  filter === 'recommended'
                    ? 'bg-pink-500 text-white'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                맞춤 추천
              </button>
            )}
          </div>
        )}
      </div>

      {/* 스타일 카테고리 목록 */}
      <div className="p-5 space-y-3 max-h-[600px] overflow-y-auto">
        {(compact ? filteredCategories.slice(0, 4) : filteredCategories).map((category) => {
          const detail = STYLE_CATEGORIES_DETAIL[category];
          const isRecommended = recommendedStyles.includes(category);

          return (
            <StyleCategoryItem
              key={category}
              category={category}
              detail={detail}
              isRecommended={isRecommended}
              isSelected={selectedCategory === category}
              onSelect={() => toggleCategory(category)}
            />
          );
        })}
      </div>

      {/* 상승 트렌드 하이라이트 */}
      {!compact && (
        <div className="p-5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="font-medium text-sm text-foreground">
                2026 상승 트렌드 스타일
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {risingStyles.map((style) => (
                <span
                  key={style}
                  className="px-3 py-1.5 text-sm font-medium rounded-full bg-white dark:bg-slate-800 text-foreground shadow-sm"
                >
                  {getStyleLabel(style)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 면책조항 */}
      <div className="px-5 pb-4 bg-white dark:bg-slate-800">
        <p className="text-xs text-muted-foreground text-center">
          ※ 트렌드는 개인 스타일과 체형에 맞게 참고하세요.
        </p>
      </div>
    </div>
  );
}

export default TrendCard;
