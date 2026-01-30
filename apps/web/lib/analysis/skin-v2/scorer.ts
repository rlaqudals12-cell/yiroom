/**
 * S-2 피부 점수 계산
 * 6존 기반 종합 점수 및 등급 산출
 *
 * @description S-2 피부 점수화
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 * @see docs/principles/skin-physiology.md
 */

import type {
  ZoneMetricsV2,
  ZoneAnalysisV2,
  SixZoneAnalysisV2,
  SkinZoneType,
  ZoneGroup,
  SkinTypeV2,
  TextureAnalysis,
} from './types';
import { ZONE_GROUP_MAPPING, VITALITY_GRADE_THRESHOLDS } from './types';

// =============================================================================
// 존별 가중치
// =============================================================================

/**
 * 존별 종합 점수 계산 가중치
 * T존(이마, 코)과 U존(볼, 턱)에 더 높은 가중치
 */
const ZONE_WEIGHTS: Record<SkinZoneType, number> = {
  forehead: 0.15,
  nose: 0.10,
  leftCheek: 0.20,
  rightCheek: 0.20,
  chin: 0.15,
  eyeArea: 0.10,
  lipArea: 0.10,
};

/**
 * 메트릭별 종합 점수 가중치
 */
const METRIC_WEIGHTS = {
  hydration: 0.25,
  elasticity: 0.20,
  texture: 0.20,
  pigmentation: 0.15,
  pores: 0.10,
  sensitivity: 0.10, // 낮을수록 좋으므로 역산
};

// =============================================================================
// 존별 점수 계산
// =============================================================================

/**
 * 존별 메트릭에서 종합 점수 계산
 */
export function calculateZoneScore(metrics: ZoneMetricsV2): number {
  const {
    hydration,
    elasticity,
    texture,
    pigmentation,
    pores,
    sensitivity,
  } = metrics;

  // 민감도는 낮을수록 좋으므로 반전
  const sensitivityScore = 100 - sensitivity;

  const weightedSum =
    hydration * METRIC_WEIGHTS.hydration +
    elasticity * METRIC_WEIGHTS.elasticity +
    texture * METRIC_WEIGHTS.texture +
    pigmentation * METRIC_WEIGHTS.pigmentation +
    pores * METRIC_WEIGHTS.pores +
    sensitivityScore * METRIC_WEIGHTS.sensitivity;

  return Math.round(Math.max(0, Math.min(100, weightedSum)));
}

/**
 * 텍스처 분석 결과에서 메트릭 추출
 */
export function extractTextureMetrics(texture: TextureAnalysis): {
  pores: number;
  texture: number;
} {
  return {
    pores: texture.poreScore,
    texture: texture.textureScore,
  };
}

// =============================================================================
// 6존 분석 결과 계산
// =============================================================================

/**
 * 존 그룹별 평균 점수 계산
 */
export function calculateGroupAverages(
  zones: Record<SkinZoneType, ZoneAnalysisV2>
): Record<ZoneGroup, number> {
  const groupSums: Record<ZoneGroup, number[]> = {
    tZone: [],
    uZone: [],
    eyeZone: [],
    lipZone: [],
  };

  for (const [zoneType, analysis] of Object.entries(zones)) {
    const group = ZONE_GROUP_MAPPING[zoneType as SkinZoneType];
    groupSums[group].push(analysis.score);
  }

  const groupAverages: Record<ZoneGroup, number> = {
    tZone: 0,
    uZone: 0,
    eyeZone: 0,
    lipZone: 0,
  };

  for (const [group, scores] of Object.entries(groupSums)) {
    if (scores.length > 0) {
      groupAverages[group as ZoneGroup] = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      );
    }
  }

  return groupAverages;
}

/**
 * T존-U존 차이 분석
 */
export function calculateTUZoneDifference(
  zones: Record<SkinZoneType, ZoneAnalysisV2>
): SixZoneAnalysisV2['tUzoneDifference'] {
  // T존 평균 (이마, 코)
  const tZoneOiliness =
    (zones.forehead.metrics.oiliness + zones.nose.metrics.oiliness) / 2;
  const tZoneHydration =
    (zones.forehead.metrics.hydration + zones.nose.metrics.hydration) / 2;

  // U존 평균 (볼, 턱)
  const uZoneOiliness =
    (zones.leftCheek.metrics.oiliness +
      zones.rightCheek.metrics.oiliness +
      zones.chin.metrics.oiliness) / 3;
  const uZoneHydration =
    (zones.leftCheek.metrics.hydration +
      zones.rightCheek.metrics.hydration +
      zones.chin.metrics.hydration) / 3;

  const oilinessDiff = Math.abs(tZoneOiliness - uZoneOiliness);
  const hydrationDiff = Math.abs(tZoneHydration - uZoneHydration);

  // 복합성 판정: 유분 차이 20 이상
  const isCombiSkin = oilinessDiff >= 20;

  return {
    oilinessDiff: Math.round(oilinessDiff),
    hydrationDiff: Math.round(hydrationDiff),
    isCombiSkin,
  };
}

// =============================================================================
// 종합 점수 및 등급
// =============================================================================

/**
 * 바이탈리티 종합 점수 계산
 */
export function calculateVitalityScore(
  zones: Record<SkinZoneType, ZoneAnalysisV2>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [zoneType, analysis] of Object.entries(zones)) {
    const weight = ZONE_WEIGHTS[zoneType as SkinZoneType];
    weightedSum += analysis.score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0
    ? Math.round(weightedSum / totalWeight)
    : 0;
}

/**
 * 바이탈리티 등급 산출
 */
export function calculateVitalityGrade(
  score: number
): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= VITALITY_GRADE_THRESHOLDS.S) return 'S';
  if (score >= VITALITY_GRADE_THRESHOLDS.A) return 'A';
  if (score >= VITALITY_GRADE_THRESHOLDS.B) return 'B';
  if (score >= VITALITY_GRADE_THRESHOLDS.C) return 'C';
  return 'D';
}

/**
 * 점수 구성 요소 계산
 */
export function calculateScoreBreakdown(
  zones: Record<SkinZoneType, ZoneAnalysisV2>
): {
  hydration: number;
  elasticity: number;
  clarity: number;
  tone: number;
} {
  const allMetrics: ZoneMetricsV2[] = Object.values(zones).map(z => z.metrics);
  const count = allMetrics.length;

  if (count === 0) {
    return { hydration: 0, elasticity: 0, clarity: 0, tone: 0 };
  }

  const avgHydration =
    allMetrics.reduce((sum, m) => sum + m.hydration, 0) / count;
  const avgElasticity =
    allMetrics.reduce((sum, m) => sum + m.elasticity, 0) / count;
  // clarity = texture + pores 평균
  const avgClarity =
    allMetrics.reduce((sum, m) => sum + (m.texture + m.pores) / 2, 0) / count;
  // tone = pigmentation (높을수록 균일한 톤)
  const avgTone =
    allMetrics.reduce((sum, m) => sum + m.pigmentation, 0) / count;

  return {
    hydration: Math.round(avgHydration),
    elasticity: Math.round(avgElasticity),
    clarity: Math.round(avgClarity),
    tone: Math.round(avgTone),
  };
}

// =============================================================================
// 피부 타입 판정
// =============================================================================

/**
 * 메트릭에서 피부 타입 판정
 */
export function determineSkinType(
  zones: Record<SkinZoneType, ZoneAnalysisV2>
): SkinTypeV2 {
  const allMetrics: ZoneMetricsV2[] = Object.values(zones).map(z => z.metrics);
  const count = allMetrics.length;

  if (count === 0) return 'normal';

  const avgOiliness =
    allMetrics.reduce((sum, m) => sum + m.oiliness, 0) / count;
  const avgHydration =
    allMetrics.reduce((sum, m) => sum + m.hydration, 0) / count;
  const avgSensitivity =
    allMetrics.reduce((sum, m) => sum + m.sensitivity, 0) / count;

  // T존-U존 차이
  const tuDiff = calculateTUZoneDifference(zones);

  // 민감성 우선 판정
  if (avgSensitivity >= 60) {
    return 'sensitive';
  }

  // 복합성 판정
  if (tuDiff.isCombiSkin) {
    return 'combination';
  }

  // 유분/수분 기반 판정
  if (avgOiliness >= 60) {
    return 'oily';
  }

  if (avgHydration <= 40) {
    return 'dry';
  }

  return 'normal';
}

// =============================================================================
// 주요 피부 고민 추출
// =============================================================================

/**
 * 모든 존의 concern을 분석하여 주요 고민 추출
 */
export function extractPrimaryConcerns(
  zones: Record<SkinZoneType, ZoneAnalysisV2>
): string[] {
  const concernCounts: Record<string, number> = {};

  for (const analysis of Object.values(zones)) {
    for (const concern of analysis.concerns) {
      concernCounts[concern] = (concernCounts[concern] || 0) + 1;
    }
  }

  // 빈도순 정렬, 상위 3개 반환
  return Object.entries(concernCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([concern]) => concern);
}

/**
 * 이전 분석 대비 변화 계산
 */
export function calculateChangeFromPrevious(
  currentScore: number,
  previousScore: number,
  currentZones: Record<SkinZoneType, ZoneAnalysisV2>,
  previousZones: Record<SkinZoneType, ZoneAnalysisV2>
): {
  vitalityScoreChange: number;
  improvedZones: SkinZoneType[];
  worsenedZones: SkinZoneType[];
} {
  const vitalityScoreChange = currentScore - previousScore;

  const improvedZones: SkinZoneType[] = [];
  const worsenedZones: SkinZoneType[] = [];

  for (const zoneType of Object.keys(currentZones) as SkinZoneType[]) {
    const currentZone = currentZones[zoneType];
    const previousZone = previousZones[zoneType];

    if (previousZone) {
      const scoreDiff = currentZone.score - previousZone.score;
      if (scoreDiff >= 5) {
        improvedZones.push(zoneType);
      } else if (scoreDiff <= -5) {
        worsenedZones.push(zoneType);
      }
    }
  }

  return {
    vitalityScoreChange,
    improvedZones,
    worsenedZones,
  };
}
