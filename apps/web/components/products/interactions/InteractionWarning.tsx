'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type {
  ProductInteractionWarning,
  IngredientInteraction,
  InteractionType,
} from '@/types/interaction';
import {
  getInteractionTypeLabel,
  getInteractionTypeColor,
  getInteractionTypeBgColor,
  getSeverityLabel,
} from '@/types/interaction';

// ================================================
// 아이콘 헬퍼
// ================================================

function getInteractionIcon(type: InteractionType) {
  switch (type) {
    case 'contraindication':
      return <AlertTriangle className="h-4 w-4" />;
    case 'caution':
      return <AlertCircle className="h-4 w-4" />;
    case 'timing':
      return <Clock className="h-4 w-4" />;
    case 'synergy':
      return <Sparkles className="h-4 w-4" />;
    default:
      return null;
  }
}

// ================================================
// 개별 상호작용 카드
// ================================================

interface InteractionCardProps {
  interaction: IngredientInteraction;
  className?: string;
}

export function InteractionCard({ interaction, className }: InteractionCardProps) {
  const bgColor = getInteractionTypeBgColor(interaction.interactionType);
  const textColor = getInteractionTypeColor(interaction.interactionType);

  return (
    <div
      className={cn('rounded-lg border p-3', bgColor, className)}
      data-testid="interaction-card"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <span className={textColor}>
          {getInteractionIcon(interaction.interactionType)}
        </span>
        <span className={cn('font-medium text-sm', textColor)}>
          {getInteractionTypeLabel(interaction.interactionType)}
        </span>
        {interaction.severity && (
          <span className="text-xs text-muted-foreground">
            (심각도: {getSeverityLabel(interaction.severity)})
          </span>
        )}
      </div>

      {/* 성분 쌍 */}
      <p className="mt-2 text-sm font-medium">
        {interaction.ingredientA} + {interaction.ingredientB}
      </p>

      {/* 설명 */}
      <p className="mt-1 text-sm text-muted-foreground">
        {interaction.description}
      </p>

      {/* 권장 사항 */}
      {interaction.recommendation && (
        <p className="mt-2 text-sm">
          <span className="font-medium">권장:</span> {interaction.recommendation}
        </p>
      )}

      {/* 출처 */}
      {interaction.source && (
        <p className="mt-1 text-xs text-muted-foreground">
          출처: {interaction.source}
        </p>
      )}
    </div>
  );
}

// ================================================
// 제품 쌍 경고 배너
// ================================================

interface ProductWarningBannerProps {
  warning: ProductInteractionWarning;
  showDetails?: boolean;
  className?: string;
}

export function ProductWarningBanner({
  warning,
  showDetails = true,
  className,
}: ProductWarningBannerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 시너지만 있으면 긍정적 표시
  const hasOnlySynergy = warning.interactions.every(
    (i) => i.interactionType === 'synergy'
  );

  // 심각한 경고가 있는지
  const hasHighSeverity = warning.interactions.some(
    (i) => i.severity === 'high' && i.interactionType !== 'synergy'
  );

  const bgColor = hasOnlySynergy
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    : hasHighSeverity
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';

  const iconColor = hasOnlySynergy
    ? 'text-green-600 dark:text-green-400'
    : hasHighSeverity
    ? 'text-red-600 dark:text-red-400'
    : 'text-yellow-600 dark:text-yellow-400';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn('rounded-lg border p-4', bgColor, className)}
        data-testid="product-warning-banner"
      >
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <span className={iconColor}>
                {hasOnlySynergy ? (
                  <Sparkles className="h-5 w-5" />
                ) : hasHighSeverity ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </span>
              <div>
                <p className="font-medium text-sm">
                  {warning.productA.name} + {warning.productB.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {hasOnlySynergy
                    ? `${warning.interactions.length}개 시너지 효과`
                    : `${warning.interactions.length}개 상호작용 주의`}
                </p>
              </div>
            </div>
            {showDetails && (
              <span className="text-muted-foreground">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        {/* 상세 내용 */}
        {showDetails && (
          <CollapsibleContent className="mt-3 space-y-2">
            {warning.interactions.map((interaction) => (
              <InteractionCard
                key={interaction.id}
                interaction={interaction}
              />
            ))}
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

// ================================================
// 요약 배너 (위시리스트용)
// ================================================

interface InteractionSummaryBannerProps {
  warnings: ProductInteractionWarning[];
  onViewDetails?: () => void;
  className?: string;
}

export function InteractionSummaryBanner({
  warnings,
  onViewDetails,
  className,
}: InteractionSummaryBannerProps) {
  if (warnings.length === 0) {
    return null;
  }

  // 경고만 필터 (시너지 제외)
  const actualWarnings = warnings.filter((w) =>
    w.interactions.some((i) => i.interactionType !== 'synergy')
  );

  if (actualWarnings.length === 0) {
    return null;
  }

  // 가장 심각한 경고
  const hasHighSeverity = actualWarnings.some((w) =>
    w.interactions.some((i) => i.severity === 'high')
  );

  const bgColor = hasHighSeverity
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';

  const iconColor = hasHighSeverity
    ? 'text-red-600 dark:text-red-400'
    : 'text-yellow-600 dark:text-yellow-400';

  return (
    <div
      className={cn('rounded-lg border p-4', bgColor, className)}
      data-testid="interaction-summary-banner"
    >
      <div className="flex items-start gap-3">
        <span className={iconColor}>
          <AlertTriangle className="h-5 w-5 mt-0.5" />
        </span>
        <div className="flex-1">
          <p className="font-medium">
            {actualWarnings.length}개 제품 조합에서 상호작용 주의
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            위시리스트에 있는 영양제/건강식품 간 성분 상호작용이 발견되었습니다.
            함께 복용 시 주의가 필요합니다.
          </p>
          {onViewDetails && (
            <Button
              variant="link"
              size="sm"
              onClick={onViewDetails}
              className="mt-2 h-auto p-0"
            >
              자세히 보기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================
// 시너지 배지
// ================================================

interface SynergyBadgeProps {
  count: number;
  className?: string;
}

export function SynergyBadge({ count, className }: SynergyBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400',
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      {count}개 시너지
    </span>
  );
}
