'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Clock, Lightbulb, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getCategoryInfo } from '@/lib/mock/skincare-routine';
import type { RoutineStepItemProps } from '@/types/skincare-routine';

/**
 * 루틴 개별 단계 컴포넌트
 * - 단계 정보 표시 (이름, 목적, 소요시간)
 * - 팁 토글
 * - 추천 제품 표시
 */
const RoutineStepItem = memo(function RoutineStepItem({
  step,
  showProducts = false,
  onProductClick,
  className,
}: RoutineStepItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const categoryInfo = getCategoryInfo(step.category);

  const hasProducts = step.recommendedProducts && step.recommendedProducts.length > 0;
  const hasTips = step.tips && step.tips.length > 0;
  const hasExpandableContent = hasTips || (showProducts && hasProducts);

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-200',
        isExpanded && 'ring-1 ring-primary/20',
        className
      )}
      data-testid="routine-step-item"
    >
      {/* 메인 영역 */}
      <div
        className={cn(
          'flex items-center gap-3 p-4',
          hasExpandableContent && 'cursor-pointer hover:bg-muted/30'
        )}
        onClick={() => hasExpandableContent && setIsExpanded(!isExpanded)}
        role={hasExpandableContent ? 'button' : undefined}
        aria-expanded={hasExpandableContent ? isExpanded : undefined}
      >
        {/* 순서 번호 */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
          {step.order}
        </div>

        {/* 카테고리 아이콘 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
          {categoryInfo.emoji}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">{step.name}</h3>
            {step.isOptional && (
              <Badge variant="outline" className="text-xs">
                선택
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{step.purpose}</p>
        </div>

        {/* 소요 시간 */}
        {step.duration && (
          <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{step.duration}</span>
          </div>
        )}

        {/* 확장 아이콘 */}
        {hasExpandableContent && (
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      {/* 확장 영역 */}
      {isExpanded && hasExpandableContent && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
          {/* 팁 */}
          {hasTips && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                <span>사용 팁</span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 추천 제품 */}
          {showProducts && hasProducts && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>추천 제품</span>
              </div>
              <div className="grid gap-2">
                {step.recommendedProducts!.slice(0, 3).map((product) => (
                  <button
                    key={product.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductClick?.(product);
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    data-testid="product-recommendation-item"
                  >
                    {product.thumbnailUrl && (
                      <div className="w-10 h-10 relative rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={product.thumbnailUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      {product.brand && (
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                      )}
                    </div>
                    {product.priceKrw && (
                      <span className="text-sm font-medium text-primary">
                        {product.priceKrw.toLocaleString()}원
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default RoutineStepItem;
