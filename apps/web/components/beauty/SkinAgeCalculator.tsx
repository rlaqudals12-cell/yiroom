'use client';

import { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScoreGauge } from '@/components/common/ScoreGauge';
import { cn } from '@/lib/utils';
import { assessImpact, getTrendDirection, selectByKey } from '@/lib/utils/conditional-helpers';
import type { SkinAgeResult } from '@/types/hybrid';

/** 피부나이 계산 입력 지표 (skin_analyses 실지표 기반) */
export interface SkinAgeMetrics {
  hydration: number; // 수분 (0-100)
  oil: number; // 유분 (0-100)
  /** 탄력 (0-100) — skin_analyses에 없는 지표라 선택적. 없으면 나머지 지표로 가중치 재분배 */
  elasticity?: number;
  wrinkles: number; // 주름 (0-100, 낮을수록 좋음)
  pores: number; // 모공 (0-100, 낮을수록 좋음)
  pigmentation: number; // 색소침착 (0-100, 낮을수록 좋음)
}

export interface SkinAgeCalculatorProps {
  /** 실제 나이 */
  actualAge: number;
  /** 피부 분석 점수들 */
  skinMetrics: SkinAgeMetrics;
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
    const hasElasticity = typeof skinMetrics.elasticity === 'number';

    // 긍정 요인 (높을수록 좋음) — 탄력은 데이터가 있을 때만 포함
    const positiveFactors = [
      { value: skinMetrics.hydration, weight: 0.25 },
      ...(hasElasticity ? [{ value: skinMetrics.elasticity as number, weight: 0.3 }] : []),
    ];

    // 부정 요인 (낮을수록 좋음)
    const negativeFactors = [
      { value: skinMetrics.wrinkles, weight: 0.2 },
      { value: skinMetrics.pores, weight: 0.1 },
      { value: skinMetrics.pigmentation, weight: 0.1 },
    ];

    // 유분은 중간값이 좋음 (40-60이 최적)
    const oilBalance = 100 - Math.abs(skinMetrics.oil - 50) * 2;

    // 종합 피부 점수 (0-100) — 사용된 가중치 합으로 정규화해 탄력 유무와 무관하게 동일 척도 유지
    let weightedSum = 0;
    let totalWeight = 0;

    // 긍정 요인 점수
    positiveFactors.forEach((f) => {
      weightedSum += f.value * f.weight;
      totalWeight += f.weight;
    });

    // 부정 요인 점수 (역산)
    negativeFactors.forEach((f) => {
      weightedSum += (100 - f.value) * f.weight;
      totalWeight += f.weight;
    });

    // 유분 밸런스 추가
    weightedSum += oilBalance * 0.05;
    totalWeight += 0.05;

    const skinScore = weightedSum / totalWeight;

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
    // 긍정 요인: 값이 높을수록 좋음 (positiveMin 이상 = positive)
    // 부정 요인: 값이 낮을수록 좋음 (negativeMax 이하 = positive, positiveMin 이상 = negative)
    const factors: SkinAgeResult['factors'] = [
      {
        name: '수분',
        value: skinMetrics.hydration,
        impact: assessImpact(skinMetrics.hydration, { positiveMin: 60, negativeMax: 30 }),
      },
      ...(hasElasticity
        ? [
            {
              name: '탄력',
              value: skinMetrics.elasticity as number,
              impact: assessImpact(skinMetrics.elasticity as number, {
                positiveMin: 60,
                negativeMax: 30,
              }),
            },
          ]
        : []),
      {
        name: '주름',
        value: skinMetrics.wrinkles,
        // 주름은 역산: 낮을수록 좋음. 100에서 뒤집어서 assessImpact 적용
        impact: assessImpact(100 - skinMetrics.wrinkles, { positiveMin: 70, negativeMax: 40 }),
      },
      {
        name: '모공',
        value: skinMetrics.pores,
        impact: assessImpact(100 - skinMetrics.pores, { positiveMin: 70, negativeMax: 40 }),
      },
      {
        name: '색소침착',
        value: skinMetrics.pigmentation,
        impact: assessImpact(100 - skinMetrics.pigmentation, { positiveMin: 70, negativeMax: 40 }),
      },
      {
        name: '유분 밸런스',
        value: Math.round(oilBalance),
        impact: assessImpact(oilBalance, { positiveMin: 70, negativeMax: 40 }),
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
  const trendDir = getTrendDirection(result.difference);
  const DifferenceIcon =
    selectByKey(trendDir, { up: TrendingUp, down: TrendingDown, neutral: Minus }) ?? Minus;
  const differenceColor =
    selectByKey(trendDir, {
      up: 'text-green-600',
      down: 'text-amber-600',
      neutral: 'text-muted-foreground',
    }) ?? 'text-muted-foreground';
  const differenceText =
    selectByKey(trendDir, {
      up: '젊어 보여요!',
      down: '케어에 신경쓰면 좋아요',
      neutral: '적정 상태',
    }) ?? '적정 상태';

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
              {Math.abs(result.difference)}살{' '}
              {selectByKey(trendDir, { up: '어려', down: '많아', neutral: '' })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{differenceText}</p>
        </div>

        {/* 등급 배지 */}
        <div className="flex justify-center mb-6">
          <div
            className={cn(
              'px-4 py-2 rounded-full font-bold text-lg',
              result.grade === 'A' &&
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              result.grade === 'B' &&
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              result.grade === 'C' &&
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
              result.grade === 'D' &&
                'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
              result.grade === 'F' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
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
                  <span
                    className={cn(
                      'text-sm font-medium',
                      factor.impact === 'positive' && 'text-green-600',
                      factor.impact === 'negative' && 'text-red-600',
                      factor.impact === 'neutral' && 'text-muted-foreground'
                    )}
                  >
                    {factor.value}점
                  </span>
                  {factor.impact === 'positive' && (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  )}
                  {factor.impact === 'negative' && (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
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
