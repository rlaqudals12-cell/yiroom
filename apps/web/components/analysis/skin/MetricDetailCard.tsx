'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Beaker, Lightbulb, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { getMetricExplanation } from '@/lib/mock/skin-metric-explanations';
import {
  SKIN_METRIC_LABELS,
  METRIC_STATUS_COLORS,
  METRIC_STATUS_BG_COLORS,
  METRIC_STATUS_LABELS,
  type SkinMetricId,
} from '@/types/skin-detailed';
import { ScientificTermTooltip } from './ScientificTermTooltip';

interface MetricDetailCardProps {
  /** 지표 ID (hydration, oil, pores 등) */
  metricId: SkinMetricId;
  /** 점수 (0-100) */
  score: number;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 추가 className */
  className?: string;
}

/**
 * 지표 상세 설명 카드 컴포넌트
 * - Progressive Disclosure 패턴 적용
 * - 간단 설명 → 상세 분석 → 과학적 배경 (Collapsible) → 솔루션
 */
export function MetricDetailCard({ metricId, score, onClose, className }: MetricDetailCardProps) {
  // 과학적 배경 섹션 열림/닫힘 상태
  const [isScientificOpen, setIsScientificOpen] = useState(false);

  // 지표 상세 데이터 가져오기
  const data = getMetricExplanation(metricId, score);
  const metricLabel = SKIN_METRIC_LABELS[metricId];
  const statusLabel = METRIC_STATUS_LABELS[data.status];
  const statusColor = METRIC_STATUS_COLORS[data.status];
  const statusBgColor = METRIC_STATUS_BG_COLORS[data.status];

  return (
    <Card className={cn('relative overflow-hidden', className)} data-testid="metric-detail-card">
      {/* 헤더: 지표명 + 점수 + 닫기 버튼 */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{metricLabel}</CardTitle>
            {/* 점수 배지 */}
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold',
                statusBgColor,
                statusColor
              )}
            >
              {score}점 · {statusLabel}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* 간단 설명 */}
        <p className="text-muted-foreground">{data.simpleDescription}</p>

        {/* 상세 분석 (항상 표시) */}
        <section className="space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-sm">
            <Beaker className="h-4 w-4 text-primary" />
            상세 분석
          </h4>
          <div className="pl-6 space-y-2 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">측정 기준</span>
              <span>{data.detailedAnalysis.measurementBasis}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">정상 범위</span>
              <span>{data.detailedAnalysis.normalRange}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">현재 상태</span>
              <span className={statusColor}>{data.detailedAnalysis.userStatus}</span>
            </div>
            {/* 가능한 원인 */}
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">가능한 원인</span>
              <ul className="list-disc list-inside space-y-0.5 text-sm">
                {data.detailedAnalysis.possibleCauses.slice(0, 4).map((cause, idx) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 과학적 배경 (Collapsible) */}
        <Collapsible open={isScientificOpen} onOpenChange={setIsScientificOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center justify-between w-full py-2 px-3 rounded-lg',
                'bg-muted/50 hover:bg-muted transition-colors text-left'
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-sm">
                <BookOpen className="h-4 w-4 text-primary" />
                과학적 배경
              </span>
              {isScientificOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pl-6 space-y-3">
            {/* 쉬운 설명 */}
            <p className="text-sm leading-relaxed">{data.scientificBackground.explanation}</p>

            {/* 전문 용어 */}
            {data.scientificBackground.technicalTerms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.scientificBackground.technicalTerms.map((termData, idx) => (
                  <ScientificTermTooltip
                    key={idx}
                    term={termData.term}
                    definition={termData.definition}
                  />
                ))}
              </div>
            )}

            {/* 참조 논문 */}
            {data.scientificBackground.reference && (
              <p className="text-xs text-muted-foreground italic">
                참조: {data.scientificBackground.reference}
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* 추천 솔루션 */}
        <section className="space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-sm">
            <Lightbulb className="h-4 w-4 text-primary" />
            추천 솔루션
          </h4>
          <div className="pl-6 space-y-3 text-sm">
            {/* 추천 성분 */}
            <div className="space-y-1.5">
              <span className="text-muted-foreground block">추천 성분</span>
              <div className="grid gap-1.5">
                {data.solutions.ingredients.slice(0, 3).map((ingredient, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="font-medium">{ingredient.name}</span>
                    <span className="text-muted-foreground text-xs">{ingredient.benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 추천 제품 */}
            <div className="space-y-1">
              <span className="text-muted-foreground block">추천 제품</span>
              <div className="flex flex-wrap gap-1.5">
                {data.solutions.products.slice(0, 4).map((product, idx) => (
                  <span
                    key={idx}
                    className="inline-flex px-2 py-0.5 bg-secondary text-secondary-foreground rounded-md text-xs"
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>

            {/* 라이프스타일 팁 */}
            <div className="space-y-1">
              <span className="text-muted-foreground block">라이프스타일 팁</span>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                {data.solutions.lifestyle.slice(0, 3).map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

export default MetricDetailCard;
