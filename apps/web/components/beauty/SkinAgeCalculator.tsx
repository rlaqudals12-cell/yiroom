'use client';

import { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScoreGauge } from '@/components/common/ScoreGauge';
import { cn } from '@/lib/utils';
import type { SkinAgeResult } from '@/types/hybrid';

export interface SkinAgeCalculatorProps {
  /** 실제 나이 */
  actualAge: number;
  /** 피부 분석 점수들 */
  skinMetrics: {
    hydration: number; // 수분 (0-100)
    oil: number; // 유분 (0-100)
    elasticity: number; // 탄력 (0-100)
    wrinkles: number; // 주름 (0-100, 낮을수록 좋음)
    pores: number; // 모공 (0-100, 낮을수록 좋음)
    pigmentation: number; // 색소침착 (0-100, 낮을수록 좋음)
  };
  /** 결과 변경 콜백 */
  onResultChange?: (result: SkinAgeResult) => void;
  /** 추가 className */
  className?: string;
}

/**
 * 피부나이 계산기 (Beauty 도메인)
 * - 피부 분석 결과 기반 피부나이 계산
 * - 실제나이와 비교 표시
 * - 영향 요인 분석
 */
export function SkinAgeCalculator({
  actualAge,
  skinMetrics,
  onResultChange,
  className,
}: SkinAgeCalculatorProps) {
  // 피부나이 계산 로직
  const result = useMemo<SkinAgeResult>(() => {
    // 긍정 요인 (높을수록 좋음)
    const positiveFactors = {
      hydration: { value: skinMetrics.hydration, weight: 0.25 },
      elasticity: { value: skinMetrics.elasticity, weight: 0.3 },
    };

    // 부정 요인 (낮을수록 좋음)
    const negativeFactors = {
      wrinkles: { value: skinMetrics.wrinkles, weight: 0.2 },
      pores: { value: skinMetrics.pores, weight: 0.1 },
      pigmentation: { value: skinMetrics.pigmentation, weight: 0.1 },
    };

    // 유분은 중간값이 좋음 (40-60이 최적)
    const oilBalance = 100 - Math.abs(skinMetrics.oil - 50) * 2;

    // 종합 피부 점수 (0-100)
    let skinScore = 0;

    // 긍정 요인 점수
    Object.values(positiveFactors).forEach((f) => {
      skinScore += f.value * f.weight;
    });

    // 부정 요인 점수 (역산)
    Object.values(negativeFactors).forEach((f) => {
      skinScore += (100 - f.value) * f.weight;
    });

    // 유분 밸런스 추가
    skinScore += oilBalance * 0.05;

    // 피부나이 계산 (점수가 높을수록 젊음)
    // 기준: 50점 = 실제나이, 점수 10점 차이 = 나이 3살 차이
    const scoreDiff = skinScore - 50;
    const ageDiff = Math.round((scoreDiff / 10) * 3);
    const skinAge = Math.max(10, actualAge - ageDiff);

    // 등급 계산
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (skinScore >= 80) grade = 'A';
    else if (skinScore >= 65) grade = 'B';
    else if (skinScore >= 50) grade = 'C';
    else if (skinScore >= 35) grade = 'D';
    else grade = 'F';

    // 영향 요인 분석
    const factors: SkinAgeResult['factors'] = [
      {
        name: '수분',
        value: skinMetrics.hydration,
        impact: skinMetrics.hydration >= 60 ? 'positive' : skinMetrics.hydration <= 30 ? 'negative' : 'neutral',
      },
      {
        name: '탄력',
        value: skinMetrics.elasticity,
        impact: skinMetrics.elasticity >= 60 ? 'positive' : skinMetrics.elasticity <= 30 ? 'negative' : 'neutral',
      },
      {
        name: '주름',
        value: skinMetrics.wrinkles,
        impact: skinMetrics.wrinkles <= 30 ? 'positive' : skinMetrics.wrinkles >= 60 ? 'negative' : 'neutral',
      },
      {
        name: '모공',
        value: skinMetrics.pores,
        impact: skinMetrics.pores <= 30 ? 'positive' : skinMetrics.pores >= 60 ? 'negative' : 'neutral',
      },
      {
        name: '색소침착',
        value: skinMetrics.pigmentation,
        impact: skinMetrics.pigmentation <= 30 ? 'positive' : skinMetrics.pigmentation >= 60 ? 'negative' : 'neutral',
      },
      {
        name: '유분 밸런스',
        value: Math.round(oilBalance),
        impact: oilBalance >= 70 ? 'positive' : oilBalance <= 40 ? 'negative' : 'neutral',
      },
    ];

    const calculatedResult: SkinAgeResult = {
      score: Math.round(skinScore),
      maxScore: 100,
      grade,
      factors,
      actualAge,
      skinAge,
      difference: actualAge - skinAge,
    };

    // 콜백 호출
    onResultChange?.(calculatedResult);

    return calculatedResult;
  }, [actualAge, skinMetrics, onResultChange]);

  // 차이 표시
  const DifferenceIcon = result.difference > 0 ? TrendingUp : result.difference < 0 ? TrendingDown : Minus;
  const differenceColor = result.difference > 0 ? 'text-green-600' : result.difference < 0 ? 'text-amber-600' : 'text-muted-foreground';
  const differenceText = result.difference > 0 ? '젊어 보여요!' : result.difference < 0 ? '관리가 필요해요' : '적정 상태';

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="skin-age-calculator">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-pink-500" />
          피부나이 분석
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        {/* 피부나이 게이지 */}
        <div className="flex justify-center mb-6">
          <ScoreGauge
            score={result.skinAge}
            maxScore={100}
            label="피부나이"
            suffix="세"
            variant="beauty"
            size="lg"
            comparison={{
              value: actualAge,
              label: '실제나이',
            }}
          />
        </div>

        {/* 차이 표시 */}
        <div className="text-center mb-6">
          <div className={cn('flex items-center justify-center gap-2', differenceColor)}>
            <DifferenceIcon className="h-5 w-5" />
            <span className="font-bold text-lg">
              {Math.abs(result.difference)}살 {result.difference > 0 ? '어려' : result.difference < 0 ? '많아' : ''}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{differenceText}</p>
        </div>

        {/* 등급 배지 */}
        <div className="flex justify-center mb-6">
          <div className={cn(
            'px-4 py-2 rounded-full font-bold text-lg',
            result.grade === 'A' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            result.grade === 'B' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            result.grade === 'C' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            result.grade === 'D' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            result.grade === 'F' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          )}>
            피부 등급: {result.grade}
          </div>
        </div>

        {/* 영향 요인 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">영향 요인</p>
          <div className="grid grid-cols-2 gap-2">
            {result.factors.map((factor) => (
              <div
                key={factor.name}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <span className="text-sm">{factor.name}</span>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    'text-sm font-medium',
                    factor.impact === 'positive' && 'text-green-600',
                    factor.impact === 'negative' && 'text-red-600',
                    factor.impact === 'neutral' && 'text-muted-foreground',
                  )}>
                    {factor.value}점
                  </span>
                  {factor.impact === 'positive' && <TrendingUp className="h-3 w-3 text-green-600" />}
                  {factor.impact === 'negative' && <TrendingDown className="h-3 w-3 text-red-600" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SkinAgeCalculator;
