'use client';

/**
 * K-4 영양 고도화: 재료 대체 추천 카드 컴포넌트
 *
 * @description 건강 목표별 재료 대체 추천 UI
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 5
 * @see lib/nutrition/ingredient-substitutes.ts
 */

import { useState, useMemo } from 'react';
import {
  ArrowRight,
  Leaf,
  Dumbbell,
  TrendingUp,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSubstitutesForIngredient,
  INGREDIENT_SUBSTITUTES,
  type SubstituteInfo,
  type VariationGoal,
} from '@/lib/nutrition/ingredient-substitutes';

// 목표별 스타일 정의
const GOAL_STYLES: Record<
  VariationGoal,
  { icon: typeof Leaf; color: string; bg: string; label: string; description: string }
> = {
  diet: {
    icon: Leaf,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    label: '다이어트',
    description: '칼로리를 줄이고 싶을 때',
  },
  lean: {
    icon: Dumbbell,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    label: '린매스',
    description: '단백질↑ 지방↓',
  },
  bulk: {
    icon: TrendingUp,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    label: '벌크업',
    description: '칼로리와 단백질↑',
  },
  allergen_free: {
    icon: AlertCircle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    label: '알레르기 프리',
    description: '알레르기 유발 재료 제외',
  },
};

interface IngredientSubstituteCardProps {
  /** 선택된 목표 */
  selectedGoal?: VariationGoal;
  /** 클래스명 */
  className?: string;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 대체 재료 아이템 컴포넌트
 */
function SubstituteItem({
  original,
  substitute,
  isExpanded,
  onToggle,
}: {
  original: string;
  substitute: SubstituteInfo;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const goalStyle = GOAL_STYLES[substitute.goal];
  const Icon = goalStyle.icon;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', goalStyle.bg)}>
            <Icon className={cn('w-5 h-5', goalStyle.color)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{original}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className={cn('font-bold', goalStyle.color)}>{substitute.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('text-xs px-2 py-1 rounded-full', goalStyle.bg, goalStyle.color)}>
            {goalStyle.label}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700">
          <div className="pt-3 space-y-3">
            {/* 효과 */}
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground w-16 shrink-0">효과</span>
              <span className="text-sm font-medium text-foreground">{substitute.benefit}</span>
            </div>

            {/* 대체 비율 */}
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground w-16 shrink-0">대체 비율</span>
              <span className="text-sm text-foreground">
                {substitute.ratio === 0
                  ? '제거'
                  : substitute.ratio === 1
                  ? '동량'
                  : `${substitute.ratio}배`}
              </span>
            </div>

            {/* 조리 팁 */}
            {substitute.tips && (
              <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{substitute.tips}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 재료 대체 추천 카드 메인 컴포넌트
 */
export function IngredientSubstituteCard({
  selectedGoal,
  className,
  compact = false,
}: IngredientSubstituteCardProps) {
  const [activeGoal, setActiveGoal] = useState<VariationGoal | undefined>(selectedGoal);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // 검색 결과 필터링
  const filteredIngredients = useMemo(() => {
    const allIngredients = Object.keys(INGREDIENT_SUBSTITUTES);

    return allIngredients.filter((ingredient) => {
      // 검색어 필터
      if (searchQuery && !ingredient.includes(searchQuery)) {
        return false;
      }

      // 목표 필터
      if (activeGoal) {
        const substitutes = getSubstitutesForIngredient(ingredient, activeGoal);
        return substitutes.length > 0;
      }

      return true;
    });
  }, [searchQuery, activeGoal]);

  // 재료별 대체 옵션
  const getSubstitutes = (ingredient: string): SubstituteInfo[] => {
    return getSubstitutesForIngredient(ingredient, activeGoal);
  };

  const toggleItem = (key: string) => {
    setExpandedItem((prev) => (prev === key ? null : key));
  };

  return (
    <div
      className={cn(
        'bg-slate-50 dark:bg-slate-900/50 rounded-2xl shadow-sm overflow-hidden',
        className
      )}
      data-testid="ingredient-substitute-card"
    >
      {/* 헤더 */}
      <div className="p-5 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">건강한 재료 대체</h3>
            <p className="text-sm text-muted-foreground">
              목표에 맞는 대체 재료 추천
            </p>
          </div>
        </div>

        {/* 목표 선택 버튼 */}
        {!compact && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveGoal(undefined)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                !activeGoal
                  ? 'bg-foreground text-background'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              전체
            </button>
            {(Object.keys(GOAL_STYLES) as VariationGoal[]).map((goal) => {
              const style = GOAL_STYLES[goal];
              const Icon = style.icon;
              return (
                <button
                  key={goal}
                  onClick={() => setActiveGoal(goal)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                    activeGoal === goal
                      ? cn(style.bg, style.color)
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {style.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 검색창 */}
        {!compact && (
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="재료 검색 (예: 설탕, 밀가루)"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        )}
      </div>

      {/* 재료 목록 */}
      <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
        {filteredIngredients.length > 0 ? (
          (compact ? filteredIngredients.slice(0, 4) : filteredIngredients).map((ingredient) => {
            const substitutes = getSubstitutes(ingredient);
            if (substitutes.length === 0) return null;

            return substitutes.map((substitute, idx) => (
              <SubstituteItem
                key={`${ingredient}-${idx}`}
                original={ingredient}
                substitute={substitute}
                isExpanded={expandedItem === `${ingredient}-${idx}`}
                onToggle={() => toggleItem(`${ingredient}-${idx}`)}
              />
            ));
          })
        ) : (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      {/* 팁 */}
      {!compact && (
        <div className="p-5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <p className="font-medium text-sm text-amber-800 dark:text-amber-300">
                활용 팁
              </p>
            </div>
            <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-200">
              <li>• 대체 재료는 질감이나 맛이 다를 수 있어 소량으로 테스트하세요.</li>
              <li>• 비율은 참고용이며, 맛에 따라 조절하세요.</li>
              <li>• 알레르기가 있다면 새 재료도 확인하세요.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 면책조항 */}
      <div className="px-5 pb-4 bg-white dark:bg-slate-800">
        <p className="text-xs text-muted-foreground text-center">
          ※ 개인의 건강 상태와 취향에 따라 적합하지 않을 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default IngredientSubstituteCard;
