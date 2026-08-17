'use client';

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AttrRow, RowTable } from '@/components/analysis/report';
import { cn } from '@/lib/utils';

/**
 * 피부 컨디션 입력 지표 (skin_analyses 실지표 기반)
 *
 * 방향 규약: 모든 지표는 "점수"로, 높을수록 좋음.
 * skin_analyses 저장 규약(gemini 프롬프트 채점 기준: 매끈한 피부 = 주름 71-100점)과
 * 피부 분석 결과 페이지의 getStatus(≥71 good) 해석을 그대로 따른다.
 * (이전 구현이 주름/모공/색소침착을 "낮을수록 좋음"으로 뒤집어 계산해
 *  분석 결과와 어긋나던 버그 수정 — 2026-07-08)
 */
export interface SkinAgeMetrics {
  hydration: number; // 수분 점수 (0-100, 높을수록 좋음)
  oil: number; // 유분 (0-100, 40-60 중간대가 이상적)
  /** 탄력 (0-100) — skin_analyses에 없는 지표라 선택적. 없으면 나머지 지표로 가중치 재분배 */
  elasticity?: number;
  wrinkles: number; // 주름 점수 (0-100, 높을수록 좋음 = 주름 적음)
  pores: number; // 모공 점수 (0-100, 높을수록 좋음)
  pigmentation: number; // 색소침착 점수 (0-100, 높을수록 좋음 = 깨끗함)
}

/** 근거 행 — 실측 지표 하나 (지어낸 값 없음) */
export interface SkinConditionFactor {
  name: string;
  /** 0-100, 높을수록 좋음 */
  value: number;
}

export interface SkinConditionResult {
  /** 실측 기준 컨디션 점수 (0-100) — 분석 결과 페이지와 동일 척도 */
  score: number;
  /** 점수의 출처: 분석 종합 점수인지, 세부 지표 가중 평균인지 */
  basis: 'overall' | 'metrics';
  /** 근거 지표 행 — 세부 지표가 없으면 빈 배열 */
  factors: SkinConditionFactor[];
}

export interface SkinAgeCalculatorProps {
  /** 피부 분석 세부 지표 — 없으면 overallScore 기반 표기만 수행 */
  skinMetrics: SkinAgeMetrics | null;
  /**
   * 최신 분석의 종합 점수 (0-100).
   * 있으면 그대로 컨디션 점수로 쓴다 — 결과 페이지("내 피부 NN점")와 동일 척도 유지.
   * 없으면 세부 지표 가중 평균으로 계산.
   */
  overallScore?: number | null;
  /** 결과 변경 콜백 */
  onResultChange?: (result: SkinConditionResult) => void;
  /** 추가 className */
  className?: string;
}

/**
 * 피부 컨디션 카드 (Beauty 도메인)
 *
 * 왜 "피부나이"가 아닌가 (2026-08 수리):
 * 이전 구현은 실제나이에서 점수 차를 빼 합성 "피부나이"를 만들고, 실제나이와 나란히 세운 뒤
 * A~F 등급까지 붙였다. 이는 (1) 분석이 측정한 적 없는 값을 지어내고 (2) 외모를 채점하며
 * (3) 컨디션 점수(0-100)를 나이라는 다른 척도로 넘겨 짚는다 — ADR-120 무채점 계약 위반.
 * 지금은 분석이 실제로 매긴 컨디션 점수와 그 근거 지표만 진단지 문법(속성표)으로 보여준다.
 */
export function SkinAgeCalculator({
  skinMetrics,
  overallScore = null,
  onResultChange,
  className,
}: SkinAgeCalculatorProps) {
  const result = useMemo<SkinConditionResult | null>(() => {
    const hasOverall = typeof overallScore === 'number';
    if (!hasOverall && !skinMetrics) return null;

    // 세부 지표 가중 평균 (모든 지표는 높을수록 좋음 — DB 저장 규약과 동일)
    let metricScore: number | null = null;
    let oilBalance: number | null = null;
    if (skinMetrics) {
      const hasElasticity = typeof skinMetrics.elasticity === 'number';

      // 유분만 예외: 과다/과소 모두 부정적이라 중간값(40-60)이 이상적
      oilBalance = 100 - Math.abs(skinMetrics.oil - 50) * 2;

      const weighted = [
        { value: skinMetrics.hydration, weight: 0.25 },
        ...(hasElasticity ? [{ value: skinMetrics.elasticity as number, weight: 0.3 }] : []),
        { value: skinMetrics.wrinkles, weight: 0.2 },
        { value: skinMetrics.pores, weight: 0.1 },
        { value: skinMetrics.pigmentation, weight: 0.1 },
        { value: oilBalance, weight: 0.05 },
      ];

      // 사용된 가중치 합으로 정규화해 탄력 유무와 무관하게 동일 척도 유지
      const totalWeight = weighted.reduce((sum, f) => sum + f.weight, 0);
      metricScore = weighted.reduce((sum, f) => sum + f.value * f.weight, 0) / totalWeight;
    }

    // 기준 점수: 분석 종합 점수(결과 페이지와 동일 척도) 우선, 없으면 세부 지표 가중 평균
    const skinScore = hasOverall ? (overallScore as number) : (metricScore as number);

    // 근거 행 — 저장된 실측값 그대로. 신호등 색·등급 없이 값만 둔다 (ADR-120 무채점)
    const factors: SkinConditionFactor[] = skinMetrics
      ? [
          { name: '수분', value: skinMetrics.hydration },
          ...(typeof skinMetrics.elasticity === 'number'
            ? [{ name: '탄력', value: skinMetrics.elasticity }]
            : []),
          { name: '주름', value: skinMetrics.wrinkles },
          { name: '모공', value: skinMetrics.pores },
          { name: '색소침착', value: skinMetrics.pigmentation },
          { name: '유분 밸런스', value: Math.round(oilBalance as number) },
        ]
      : [];

    const calculatedResult: SkinConditionResult = {
      score: Math.round(skinScore),
      basis: hasOverall ? 'overall' : 'metrics',
      factors,
    };

    onResultChange?.(calculatedResult);

    return calculatedResult;
  }, [skinMetrics, overallScore, onResultChange]);

  // 지표도 종합 점수도 없으면 근거가 없음 — 지어내지 않고 렌더링하지 않는다
  if (!result) return null;

  // 점수가 어디서 왔는지 항상 밝힌다 (합성값 오인 방지)
  const basisNote =
    result.basis === 'overall'
      ? `최근 피부 분석의 종합 점수예요 (100점 만점)`
      : `아래 세부 지표를 가중 평균한 값이에요 (100점 만점)`;

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="skin-age-calculator">
      {/* ADR-120: 그라데이션 벽면 폐지 — 솔리드 헤더 + 색 정체성은 아이콘만 */}
      <CardHeader className="bg-secondary border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-pink-500" aria-hidden="true" />
          피부 컨디션
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        {/* 결론 먼저 — 분석이 실제로 매긴 점수 하나 (게이지·등급 연출 없음) */}
        <p
          className="text-3xl font-semibold tabular-nums text-foreground"
          data-testid="skin-condition-score"
        >
          {result.score}점
        </p>
        <p className="mt-1 text-xs text-muted-foreground" data-testid="skin-age-basis-note">
          {basisNote}
        </p>

        {/* 근거 지표 — 세부 지표가 있을 때만 (없는 값을 지어내지 않음) */}
        {result.factors.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">근거 지표</p>
            <RowTable testId="skin-condition-rows">
              {result.factors.map((factor) => (
                <AttrRow key={factor.name} label={factor.name} value={`${factor.value}점`} />
              ))}
            </RowTable>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SkinAgeCalculator;
