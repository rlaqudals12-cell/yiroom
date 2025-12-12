/**
 * R-2 체중 변화 카드 컴포넌트
 * C-1 체형 분석 연동
 */

'use client';

import { Scale, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BodyProgress } from '@/types/report';

interface BodyProgressCardProps {
  bodyProgress: BodyProgress;
  onReanalyze?: () => void;
}

export function BodyProgressCard({
  bodyProgress,
  onReanalyze,
}: BodyProgressCardProps) {
  const { startWeight, endWeight, weightChange, reanalysisRecommended, message } =
    bodyProgress;

  const hasWeightData = startWeight !== null && endWeight !== null;

  const TrendIcon =
    weightChange > 0 ? TrendingUp : weightChange < 0 ? TrendingDown : Minus;
  const trendColor =
    weightChange > 0.5
      ? 'text-orange-500'
      : weightChange < -0.5
      ? 'text-blue-500'
      : 'text-muted-foreground';

  return (
    <Card data-testid="body-progress-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          체중 변화
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasWeightData ? (
          <div className="space-y-3">
            {/* 체중 변화 표시 */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">월초</div>
                <div className="text-xl font-bold">{startWeight}kg</div>
              </div>

              <div className="flex flex-col items-center">
                <TrendIcon className={`h-5 w-5 ${trendColor}`} />
                <span className={`text-lg font-bold ${trendColor}`}>
                  {weightChange > 0 ? '+' : ''}
                  {weightChange}kg
                </span>
              </div>

              <div className="text-center">
                <div className="text-xs text-muted-foreground">월말</div>
                <div className="text-xl font-bold">{endWeight}kg</div>
              </div>
            </div>

            {/* 메시지 */}
            <p className="text-sm text-center text-muted-foreground">{message}</p>

            {/* 재분석 권장 */}
            {reanalysisRecommended && onReanalyze && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onReanalyze}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                체형 재분석 하기
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Scale className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">{message}</p>
            {onReanalyze && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onReanalyze}
              >
                체형 분석 시작
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
