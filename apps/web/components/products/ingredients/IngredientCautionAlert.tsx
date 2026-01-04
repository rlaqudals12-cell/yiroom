'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, ChevronDown, ChevronUp, AlertCircle, Sparkles, Info } from 'lucide-react';
import type { CosmeticIngredient } from '@/types/ingredient';
import { IngredientEWGBadge } from './IngredientEWGBadge';

interface IngredientCautionAlertProps {
  /** 주의 성분 목록 */
  cautionIngredients: CosmeticIngredient[];
  /** 알레르기 성분 목록 */
  allergenIngredients: CosmeticIngredient[];
  /** 접기/펼치기 초기 상태 */
  defaultExpanded?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 주의 성분 알림 컴포넌트
 * - 20가지 주의 성분
 * - 알레르기 유발 성분
 * - 펼치기/접기 기능
 */
export function IngredientCautionAlert({
  cautionIngredients,
  allergenIngredients,
  defaultExpanded = false,
  className,
}: IngredientCautionAlertProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const totalCount = cautionIngredients.length + allergenIngredients.length;

  // 주의 성분이 없으면 표시 안함
  if (totalCount === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/30',
          className
        )}
        data-testid="caution-alert-safe"
      >
        <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
          주의가 필요한 성분이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800/30 overflow-hidden',
        className
      )}
      data-testid="caution-alert"
    >
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-orange-100/50 dark:hover:bg-orange-800/20 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="w-5 h-5 text-orange-600 dark:text-orange-400"
            aria-hidden="true"
          />
          <span className="font-medium text-orange-800 dark:text-orange-200">
            주의가 필요한 성분
          </span>
          <span className="px-2 py-0.5 bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 text-xs font-bold rounded-full">
            {totalCount}개
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        )}
      </button>

      {/* 상세 목록 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 20가지 주의 성분 */}
          {cautionIngredients.length > 0 && (
            <div>
              <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                20가지 주의 성분
              </p>
              <div className="space-y-2">
                {cautionIngredients.map((ingredient) => (
                  <CautionIngredientItem
                    key={ingredient.id}
                    ingredient={ingredient}
                    type="caution"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 알레르기 유발 성분 */}
          {allergenIngredients.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                알레르기 유발 가능 성분
              </p>
              <div className="space-y-2">
                {allergenIngredients.map((ingredient) => (
                  <CautionIngredientItem
                    key={ingredient.id}
                    ingredient={ingredient}
                    type="allergen"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 안내 문구 */}
          <p className="text-xs text-muted-foreground flex items-start gap-1 pt-2 border-t border-orange-200/50 dark:border-orange-800/30">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            개인의 피부 상태에 따라 반응이 다를 수 있습니다. 민감한 피부는 패치 테스트를 권장합니다.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 개별 주의 성분 아이템
 */
interface CautionIngredientItemProps {
  ingredient: CosmeticIngredient;
  type: 'caution' | 'allergen';
}

function CautionIngredientItem({ ingredient, type }: CautionIngredientItemProps) {
  const bgColor =
    type === 'caution' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-red-100 dark:bg-red-900/30';

  return (
    <div className={cn('flex items-center justify-between px-3 py-2 rounded-lg', bgColor)}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{ingredient.nameKo}</p>
        {ingredient.concerns && ingredient.concerns.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">{ingredient.concerns[0]}</p>
        )}
      </div>
      <IngredientEWGBadge score={ingredient.ewgScore} size="sm" showLabel={false} />
    </div>
  );
}

export default IngredientCautionAlert;
