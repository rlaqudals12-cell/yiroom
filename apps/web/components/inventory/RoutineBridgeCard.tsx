'use client';

/**
 * 인벤토리-루틴 브릿지 카드 컴포넌트
 *
 * @description 보유 제품 기반 스킨케어 루틴 완성도 시각화
 * @see lib/inventory/routine-bridge.ts
 */

import { Droplets, AlertCircle, CheckCircle2, ShoppingCart, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type {
  RoutineInventoryResult,
  RoutineStepMatch,
  InventoryProduct,
} from '@/lib/inventory/routine-bridge';

// ============================================
// 루틴 완성도 바
// ============================================

// 완성도에 따른 색상 결정
function getCoverageColor(percent: number): string {
  if (percent >= 100) return 'text-green-600 dark:text-green-400';
  if (percent >= 80) return 'text-blue-600 dark:text-blue-400';
  if (percent >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function CoverageBar({ percent }: { percent: number }) {
  const colorClass = getCoverageColor(percent);

  return (
    <div className="space-y-2" data-testid="coverage-bar">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">루틴 완성도</span>
        <span className={cn('text-sm font-bold', colorClass)}>{percent}%</span>
      </div>
      <Progress value={percent} className="h-3" />
    </div>
  );
}

// ============================================
// 루틴 단계 아이템
// ============================================

function RoutineStepItem({ match }: { match: RoutineStepMatch }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border',
        match.isMissing
          ? 'border-dashed border-muted-foreground/30 bg-muted/30'
          : 'border-border bg-card'
      )}
      data-testid="routine-step-item"
    >
      {/* 상태 아이콘 */}
      <div className="shrink-0">
        {match.isMissing ? (
          <AlertCircle className="w-5 h-5 text-muted-foreground/50" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
        )}
      </div>

      {/* 단계명 + 매칭 제품 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', match.isMissing && 'text-muted-foreground')}>
            {match.stepLabel}
          </span>
          {match.isMissing && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              없음
            </Badge>
          )}
        </div>
        {match.matchedProducts.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {match.matchedProducts.map((product) => (
              <Badge key={product.id} variant="secondary" className="text-xs">
                {product.name}
                {product.remainingPercent !== undefined && product.remainingPercent < 20 && (
                  <span className="ml-1 text-red-500">({product.remainingPercent}%)</span>
                )}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 누락 단계 알림
// ============================================

function MissingStepAlert({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div
      className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
      data-testid="missing-step-alert"
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          루틴에 빈 자리가 있어요
        </span>
      </div>
      <ul className="space-y-1">
        {messages.map((msg, i) => (
          <li
            key={i}
            className="text-sm text-amber-700 dark:text-amber-200 flex items-start gap-1.5"
          >
            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
            {msg}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// 재구매 필요 제품
// ============================================

function LowStockSection({ products }: { products: InventoryProduct[] }) {
  if (products.length === 0) return null;

  return (
    <div data-testid="low-stock-section">
      <div className="flex items-center gap-2 mb-2">
        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">재구매 필요</span>
      </div>
      <div className="space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
          >
            <span className="text-sm font-medium">{product.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${product.remainingPercent ?? 0}%` }}
                />
              </div>
              <span className="text-xs text-red-600 dark:text-red-400 font-medium w-8 text-right">
                {product.remainingPercent ?? 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface RoutineBridgeCardProps {
  /** 루틴-인벤토리 연동 결과 */
  result: RoutineInventoryResult;
  /** 시간대 (아침/저녁) */
  timeOfDay?: 'morning' | 'evening';
  /** 루틴 완성도 요약 메시지 */
  summaryMessage?: string;
  /** 누락 단계 메시지 목록 */
  missingMessages?: string[];
  /** "제품 추가하기" 클릭 핸들러 */
  onAddProduct?: () => void;
  /** 클래스명 */
  className?: string;
}

export function RoutineBridgeCard({
  result,
  timeOfDay = 'morning',
  summaryMessage,
  missingMessages = [],
  onAddProduct,
  className,
}: RoutineBridgeCardProps) {
  const timeLabel = timeOfDay === 'morning' ? '아침' : '저녁';

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="routine-bridge-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          {timeLabel} 루틴 현황
        </CardTitle>
        {summaryMessage && <p className="text-sm text-muted-foreground">{summaryMessage}</p>}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* 완성도 바 */}
        <CoverageBar percent={result.coveragePercent} />

        {/* 루틴 단계 리스트 */}
        <div className="space-y-2">
          {result.stepMatches.map((match) => (
            <RoutineStepItem key={match.step} match={match} />
          ))}
        </div>

        {/* 누락 단계 알림 */}
        <MissingStepAlert messages={missingMessages} />

        {/* 재구매 필요 제품 */}
        <LowStockSection products={result.lowStockProducts} />

        {/* 제품 추가 CTA */}
        {onAddProduct && result.missingSteps.length > 0 && (
          <Button variant="outline" className="w-full gap-2" onClick={onAddProduct}>
            <ChevronRight className="w-4 h-4" />
            부족한 제품 추가하기
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default RoutineBridgeCard;
