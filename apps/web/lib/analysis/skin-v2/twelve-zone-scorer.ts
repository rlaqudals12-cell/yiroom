/**
 * S-2 12존 독립 스코어러
 * 12존 × 7지표 독립 채점 + 종합 바이탈리티 계산
 *
 * @description 각 세부 존을 독립적으로 채점하고, 6존으로 집계하며,
 * 전체 바이탈리티 점수를 산출합니다.
 * @see types/skin-zones.ts - DetailedZoneId, aggregateToSixZones
 */

import type { DetailedZoneId, DetailedZoneMap } from '@/types/skin-zones';
import { getDetailedStatusLevel } from '@/types/skin-zones';
import type { ZoneMetricsV2, SkinZoneType } from './types';
import {
  analyzeDetailedZoneConcerns,
  generateDetailedZoneRecommendations,
} from './twelve-zone-extractor';

// =============================================================================
// 타입
// =============================================================================

/** 12존 분석 결과 (전체) */
export interface TwelveZoneAnalysis {
  /** 12존 상세 */
  detailedZones: DetailedZoneMap;
  /** 6존 집계 (역호환) */
  sixZoneAggregation: Record<
    SkinZoneType,
    {
      score: number;
      metrics: ZoneMetricsV2;
    }
  >;
  /** 종합 바이탈리티 점수 */
  vitalityScore: number;
  /** 최악 존 (가장 점수 낮은 존) */
  worstZones: DetailedZoneId[];
  /** 최상 존 */
  bestZones: DetailedZoneId[];
}

// =============================================================================
// 12존 가중치
// =============================================================================

/** 12존별 종합 점수 가중치 (합계 = 1.0) */
const DETAILED_ZONE_WEIGHTS: Record<DetailedZoneId, number> = {
  forehead_center: 0.08,
  forehead_left: 0.04,
  forehead_right: 0.04,
  eye_left: 0.06,
  eye_right: 0.06,
  cheek_left: 0.14,
  cheek_right: 0.14,
  nose_bridge: 0.06,
  nose_tip: 0.05,
  chin_center: 0.1,
  chin_left: 0.06,
  chin_right: 0.06,
  // SUM: 0.08+0.04+0.04+0.06+0.06+0.14+0.14+0.06+0.05+0.10+0.06+0.06 ≈ 0.89
  // 나머지 0.11은 분모로 정규화
};

/** 메트릭별 종합 점수 가중치 */
const METRIC_WEIGHTS = {
  hydration: 0.22,
  elasticity: 0.18,
  texture: 0.18,
  pigmentation: 0.15,
  pores: 0.12,
  oiliness: 0.08, // 균형 점수화
  sensitivity: 0.07, // 역산
};

// =============================================================================
// 존별 점수 계산
// =============================================================================

/**
 * 단일 존 종합 점수 계산
 */
export function scoreDetailedZone(metrics: ZoneMetricsV2): number {
  // 유분은 50에 가까울수록 좋음
  const oilinessScore = 100 - Math.abs(metrics.oiliness - 50) * 2;
  // 민감도는 낮을수록 좋음
  const sensitivityScore = 100 - metrics.sensitivity;

  const score =
    metrics.hydration * METRIC_WEIGHTS.hydration +
    metrics.elasticity * METRIC_WEIGHTS.elasticity +
    metrics.texture * METRIC_WEIGHTS.texture +
    metrics.pigmentation * METRIC_WEIGHTS.pigmentation +
    metrics.pores * METRIC_WEIGHTS.pores +
    Math.max(0, oilinessScore) * METRIC_WEIGHTS.oiliness +
    sensitivityScore * METRIC_WEIGHTS.sensitivity;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * 12존 전체 분석 실행
 *
 * @param zoneMetrics - 12개 존별 메트릭
 * @returns 12존 분석 결과
 */
export function analyzeTwelveZones(
  zoneMetrics: Record<DetailedZoneId, ZoneMetricsV2>
): TwelveZoneAnalysis {
  const detailedZones: Partial<DetailedZoneMap> = {};
  const scores: { zoneId: DetailedZoneId; score: number }[] = [];

  // 각 존 독립 채점
  for (const [zoneId, metrics] of Object.entries(zoneMetrics) as [
    DetailedZoneId,
    ZoneMetricsV2,
  ][]) {
    const score = scoreDetailedZone(metrics);
    const concerns = analyzeDetailedZoneConcerns(zoneId, metrics);
    const recommendations = generateDetailedZoneRecommendations(zoneId, concerns);

    detailedZones[zoneId] = {
      zoneId,
      score,
      status: getDetailedStatusLevel(score),
      concerns,
      recommendations,
    };

    scores.push({ zoneId, score });
  }

  // 6존 집계
  const sixZoneAggregation = aggregateToSixZoneMetrics(zoneMetrics);

  // 종합 바이탈리티 계산
  const vitalityScore = calculateDetailedVitality(scores);

  // 최악/최상 존 (상위/하위 3개)
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const worstZones = sorted.slice(0, 3).map((s) => s.zoneId);
  const bestZones = sorted
    .slice(-3)
    .reverse()
    .map((s) => s.zoneId);

  return {
    detailedZones: detailedZones as DetailedZoneMap,
    sixZoneAggregation,
    vitalityScore,
    worstZones,
    bestZones,
  };
}

// =============================================================================
// 6존 집계 (역호환)
// =============================================================================

// 12존 DetailedZoneId → 7존 SkinZoneType 매핑
const TWELVE_TO_SEVEN_MAPPING: Record<DetailedZoneId, SkinZoneType> = {
  forehead_center: 'forehead',
  forehead_left: 'forehead',
  forehead_right: 'forehead',
  eye_left: 'eyeArea',
  eye_right: 'eyeArea',
  cheek_left: 'leftCheek',
  cheek_right: 'rightCheek',
  nose_bridge: 'nose',
  nose_tip: 'nose',
  chin_center: 'chin',
  chin_left: 'chin',
  chin_right: 'chin',
};

/**
 * 12존 메트릭을 7존(SkinZoneType)으로 평균 집계
 */
function aggregateToSixZoneMetrics(
  zoneMetrics: Record<DetailedZoneId, ZoneMetricsV2>
): Record<SkinZoneType, { score: number; metrics: ZoneMetricsV2 }> {
  const grouped: Record<string, ZoneMetricsV2[]> = {};

  for (const [zoneId, metrics] of Object.entries(zoneMetrics) as [
    DetailedZoneId,
    ZoneMetricsV2,
  ][]) {
    const sixZone = TWELVE_TO_SEVEN_MAPPING[zoneId];
    if (!grouped[sixZone]) grouped[sixZone] = [];
    grouped[sixZone].push(metrics);
  }

  const result: Partial<Record<SkinZoneType, { score: number; metrics: ZoneMetricsV2 }>> = {};

  for (const [sixZone, metricsList] of Object.entries(grouped)) {
    const avgMetrics = averageMetrics(metricsList);
    result[sixZone as SkinZoneType] = {
      score: scoreDetailedZone(avgMetrics),
      metrics: avgMetrics,
    };
  }

  return result as Record<SkinZoneType, { score: number; metrics: ZoneMetricsV2 }>;
}

/**
 * 여러 ZoneMetricsV2의 평균 계산
 */
function averageMetrics(metricsList: ZoneMetricsV2[]): ZoneMetricsV2 {
  const count = metricsList.length;
  if (count === 0) {
    return {
      hydration: 0,
      oiliness: 0,
      pores: 0,
      texture: 0,
      pigmentation: 0,
      sensitivity: 0,
      elasticity: 0,
    };
  }

  return {
    hydration: Math.round(metricsList.reduce((s, m) => s + m.hydration, 0) / count),
    oiliness: Math.round(metricsList.reduce((s, m) => s + m.oiliness, 0) / count),
    pores: Math.round(metricsList.reduce((s, m) => s + m.pores, 0) / count),
    texture: Math.round(metricsList.reduce((s, m) => s + m.texture, 0) / count),
    pigmentation: Math.round(metricsList.reduce((s, m) => s + m.pigmentation, 0) / count),
    sensitivity: Math.round(metricsList.reduce((s, m) => s + m.sensitivity, 0) / count),
    elasticity: Math.round(metricsList.reduce((s, m) => s + m.elasticity, 0) / count),
  };
}

// =============================================================================
// 바이탈리티 계산
// =============================================================================

function calculateDetailedVitality(scores: { zoneId: DetailedZoneId; score: number }[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const { zoneId, score } of scores) {
    const weight = DETAILED_ZONE_WEIGHTS[zoneId] ?? 0.05;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}
