'use client';

import { X, AlertCircle, CheckCircle, XCircle, Info, Beaker } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
import {
  getZoneExplanation,
  type ZoneDetailedExplanation,
} from '@/lib/mock/skin-zone-explanations';
import type { DetailedZoneId } from '@/types/skin-zones';

/**
 * 점수에 따른 색상 결정
 * 71+ 녹색 (좋음), 41-70 노랑 (보통), 0-40 빨강 (주의)
 */
function getScoreColorClass(score: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (score >= 71) {
    return {
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
    };
  }
  if (score >= 41) {
    return {
      text: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800',
    };
  }
  return {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
  };
}

/**
 * 점수 라벨 반환
 */
function getScoreLabel(score: number): string {
  if (score >= 71) return '좋음';
  if (score >= 41) return '보통';
  return '주의';
}

export interface ZoneDetailCardProps {
  /** 12존 세부 존 ID */
  zoneId: DetailedZoneId;
  /** 해당 존의 점수 (0-100) */
  score: number;
  /** 닫기 콜백 */
  onClose: () => void;
}

/**
 * 존 상세 설명 카드
 * 존 클릭 시 표시되며, 해당 영역의 특성/문제점/관리법 등 상세 정보 제공
 */
export function ZoneDetailCard({ zoneId, score, onClose }: ZoneDetailCardProps) {
  const explanation: ZoneDetailedExplanation = getZoneExplanation(zoneId);
  const scoreColors = getScoreColorClass(score);
  const scoreLabel = getScoreLabel(score);

  return (
    <Card
      className={cn('w-full max-w-md shadow-lg', scoreColors.border)}
      data-testid="zone-detail-card"
    >
      {/* 헤더: 존 이름 + 점수 + 닫기 버튼 */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg">{explanation.zoneName}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={cn('font-semibold', scoreColors.bg, scoreColors.text)}>
                {score}점
              </Badge>
              <span className={cn('text-sm font-medium', scoreColors.text)}>{scoreLabel}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 존 특성 설명 */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>이 부위의 특성</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {explanation.zoneCharacteristic}
          </p>
        </div>

        {/* 주요 문제점 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>주요 문제점</span>
          </div>
          <ul className="space-y-1">
            {explanation.concerns.map((concern, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 측정 상세 (Progressive Disclosure) */}
        <ProgressiveDisclosure
          title="측정 상세 정보"
          icon={<Beaker className="h-4 w-4" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {explanation.measurementDetails.map((detail, index) => (
              <div key={index} className="rounded-lg bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{detail.indicator}</span>
                  <Badge variant="outline" className="text-xs">
                    {detail.normalRange}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{detail.description}</p>
              </div>
            ))}
          </div>
        </ProgressiveDisclosure>

        {/* 추천 관리법 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>추천 관리법</span>
          </div>
          <ul className="space-y-1">
            {explanation.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 피해야 할 것 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>피해야 할 것</span>
          </div>
          <ul className="space-y-1">
            {explanation.avoidance.map((avoid, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                <span>{avoid}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
