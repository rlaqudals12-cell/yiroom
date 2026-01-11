'use client';

/**
 * 성분 충돌 경고 Alert 컴포넌트
 * - 심각도별 색상 표시 (high: 빨강, medium: 노랑)
 * - 해결책 제안
 * @version 1.0
 * @date 2026-01-11
 */

import { memo, useState } from 'react';
import { AlertTriangle, XCircle, Info, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { IngredientConflict, ConflictSeverity } from '@/lib/scan/ingredient-conflict';

// ================================================
// 타입 정의
// ================================================

interface IngredientConflictAlertProps {
  /** 충돌 목록 */
  conflicts: IngredientConflict[];
  /** 닫기 콜백 */
  onDismiss?: () => void;
  /** 전체 보기 콜백 */
  onViewAll?: () => void;
  /** 컴팩트 모드 (최대 2개만 표시) */
  compact?: boolean;
  className?: string;
}

interface ConflictItemProps {
  conflict: IngredientConflict;
  showSolution?: boolean;
}

// ================================================
// 스타일 상수
// ================================================

const SEVERITY_STYLES: Record<
  ConflictSeverity,
  {
    bg: string;
    border: string;
    icon: string;
    badge: string;
    label: string;
  }
> = {
  high: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    label: '주의',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    label: '참고',
  },
  low: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    label: '정보',
  },
};

// ================================================
// 서브 컴포넌트
// ================================================

/**
 * 개별 충돌 항목
 */
const ConflictItem = memo(function ConflictItem({
  conflict,
  showSolution = true,
}: ConflictItemProps) {
  const style = SEVERITY_STYLES[conflict.severity];

  return (
    <div
      className={cn('rounded-lg p-3 border', style.bg, style.border)}
      data-testid="conflict-item"
    >
      <div className="flex items-start gap-2">
        {/* 심각도 아이콘 */}
        <div className={cn('mt-0.5 flex-shrink-0', style.icon)}>
          {conflict.severity === 'high' ? (
            <XCircle className="h-4 w-4" aria-hidden="true" />
          ) : conflict.severity === 'medium' ? (
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Info className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* 성분 조합 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{conflict.ingredientA}</span>
            <span className="text-muted-foreground text-xs">+</span>
            <span className="font-medium text-sm">{conflict.ingredientB}</span>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', style.badge)}>
              {style.label}
            </span>
          </div>

          {/* 이유 */}
          <p className="text-sm text-muted-foreground">{conflict.reason}</p>

          {/* 해결책 */}
          {showSolution && (
            <p className="text-sm text-foreground/80">
              <span className="font-medium">해결: </span>
              {conflict.solution}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

// ================================================
// 메인 컴포넌트
// ================================================

const IngredientConflictAlert = memo(function IngredientConflictAlert({
  conflicts,
  onDismiss,
  onViewAll,
  compact = false,
  className,
}: IngredientConflictAlertProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  // 충돌이 없으면 렌더링하지 않음
  if (conflicts.length === 0) {
    return null;
  }

  // 심각도 순으로 정렬 (high > medium > low)
  const sortedConflicts = [...conflicts].sort((a, b) => {
    const order: Record<ConflictSeverity, number> = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  // 심각도별 개수
  const highCount = conflicts.filter((c) => c.severity === 'high').length;
  const mediumCount = conflicts.filter((c) => c.severity === 'medium').length;

  // 표시할 항목 (컴팩트 모드에서는 최대 2개)
  const displayConflicts = compact && !isExpanded ? sortedConflicts.slice(0, 2) : sortedConflicts;
  const hasMore = compact && sortedConflicts.length > 2;

  // 가장 심각한 레벨의 스타일 사용
  const headerSeverity = highCount > 0 ? 'high' : mediumCount > 0 ? 'medium' : 'low';
  const headerStyle = SEVERITY_STYLES[headerSeverity];

  return (
    <div
      className={cn('rounded-xl border overflow-hidden', headerStyle.border, className)}
      data-testid="ingredient-conflict-alert"
      role="alert"
      aria-live="polite"
    >
      {/* 헤더 */}
      <div className={cn('px-4 py-3 flex items-center justify-between', headerStyle.bg)}>
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn('h-5 w-5', headerStyle.icon)} aria-hidden="true" />
          <span className="font-medium">성분 조합 주의 ({conflicts.length}건)</span>
          {highCount > 0 && (
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', SEVERITY_STYLES.high.badge)}>
              심각 {highCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* 펼치기/접기 버튼 */}
          {compact && hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? '접기' : '펼치기'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}

          {/* 닫기 버튼 */}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onDismiss}
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 충돌 목록 */}
      <div className="p-3 space-y-2 bg-card">
        {displayConflicts.map((conflict, index) => (
          <ConflictItem
            key={`${conflict.ingredientA}-${conflict.ingredientB}-${index}`}
            conflict={conflict}
            showSolution={!compact || isExpanded}
          />
        ))}

        {/* 더 보기 */}
        {hasMore && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-center text-sm text-primary hover:underline py-1"
          >
            +{sortedConflicts.length - 2}건 더 보기
          </button>
        )}

        {/* 전체 보기 버튼 */}
        {onViewAll && isExpanded && conflicts.length > 3 && (
          <Button variant="outline" size="sm" className="w-full mt-2" onClick={onViewAll}>
            성분 상세 분석 보기
          </Button>
        )}
      </div>
    </div>
  );
});

export default IngredientConflictAlert;

// Named export for convenience
export { IngredientConflictAlert };
