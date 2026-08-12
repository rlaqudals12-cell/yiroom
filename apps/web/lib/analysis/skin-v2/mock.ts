/**
 * S-2 Mock 데이터 생성
 * AI 타임아웃/실패 시 Fallback용
 *
 * @description S-2 Mock 데이터
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 */

import type {
  SkinZoneType,
  ZoneMetricsV2,
  ZoneAnalysisV2,
  SixZoneAnalysisV2,
  SkinAnalysisV2Result,
  SkinTypeV2,
  SkinCareRoutineRecommendation,
  TextureAnalysis,
  GLCMResult,
  LBPResult,
} from './types';
import { ZONE_GROUP_MAPPING } from './types';
import {
  calculateZoneScore,
  calculateGroupAverages,
  calculateTUZoneDifference,
  calculateVitalityScore,
  calculateVitalityGrade,
  calculateScoreBreakdown,
  determineSkinType,
  extractPrimaryConcerns,
} from './scorer';
import { analyzeZoneConcerns, generateZoneRecommendations } from './zone-extractor';
import { createSeededRandom, DEFAULT_SEED } from '@/lib/utils/seeded-random';

// =============================================================================
// Mock 데이터 생성
//
// 재현성 계약: 폴백 Mock은 시드(사용자·이미지 지문 등)로부터 결정론적으로
// 생성한다. Math.random() 금지 — 같은 시드는 항상 같은 피부 지표를 낸다.
// 시드 미지정 시 고정 기본 시드로 항상 동일한 결과.
// =============================================================================

/**
 * GLCM "미측정" 중립값
 *
 * 왜 지어내지 않는가: GLCM/LBP는 픽셀 단위 실측 결과인데(texture-analyzer.ts),
 * Mock 경로엔 픽셀이 없다. 예전엔 난수로 채워 DB(zones JSONB)에 그대로 저장돼
 * "측정한 적 없는 텍스처 수치"가 진짜처럼 남았다. texture-analyzer가 크롭 실패 시
 * 쓰는 중립 기본값과 동일한 값을 사용해 지어낸 수치 저장을 0으로 만든다.
 * @see lib/analysis/skin-v2/texture-analyzer.ts (최소 크기 미달 시 기본값)
 */
const UNMEASURED_GLCM: GLCMResult = {
  contrast: 0,
  homogeneity: 1,
  energy: 1,
  correlation: 0,
  entropy: 0,
};

/** LBP "미측정" 중립값 (근거는 UNMEASURED_GLCM과 동일) */
function unmeasuredLbp(): LBPResult {
  return {
    histogram: new Array(256).fill(0),
    uniformPatternRatio: 1,
    roughnessScore: 100,
  };
}

/**
 * Mock 텍스처 분석 생성
 *
 * glcm/lbp는 미측정 중립값, 3개 점수는 존 메트릭에서 결정론적으로 파생한다
 * (난수 대신 이미 생성된 지표를 재사용 — 같은 시드면 같은 값).
 */
function generateMockTextureAnalysis(metrics: ZoneMetricsV2): TextureAnalysis {
  return {
    glcm: UNMEASURED_GLCM,
    lbp: unmeasuredLbp(),
    poreScore: metrics.pores,
    wrinkleScore: metrics.elasticity,
    textureScore: metrics.texture,
  };
}

/**
 * Mock 존별 메트릭 생성
 *
 * @param zoneType - 존 타입
 * @param skinType - 지정 시 해당 피부 타입 기준값 사용
 * @param seed - 결정론 시드 (미지정 시 고정 기본 시드)
 */
export function generateMockZoneMetrics(
  zoneType: SkinZoneType,
  skinType?: SkinTypeV2,
  seed?: string
): ZoneMetricsV2 {
  const rng = createSeededRandom(seed ?? DEFAULT_SEED);
  // 피부 타입별 기본 특성
  const baseMetrics: Record<SkinTypeV2, Partial<ZoneMetricsV2>> = {
    dry: { hydration: 35, oiliness: 25, sensitivity: 45 },
    oily: { hydration: 55, oiliness: 75, sensitivity: 30 },
    combination: { hydration: 50, oiliness: 50, sensitivity: 35 },
    normal: { hydration: 60, oiliness: 40, sensitivity: 25 },
    sensitive: { hydration: 45, oiliness: 35, sensitivity: 70 },
  };

  const base = baseMetrics[skinType || 'normal'];
  // 편차 ±5 — 존 보너스(+15)보다 반드시 작게 유지한다.
  // 왜: 시드 고정 후에는 평균이 편차를 상쇄해주지 않는다. 편차가 보너스보다 크면
  // "T존이 U존보다 유분이 많다" 같은 도메인 규칙이 특정 시드에서 뒤집힌다.
  const variance = (): number => Math.round((rng() - 0.5) * 10);

  // T존은 더 유분기 많음
  const isTZone = zoneType === 'forehead' || zoneType === 'nose';
  const oilinessBonus = isTZone ? 15 : 0;

  // 눈가는 더 민감함
  const isEyeArea = zoneType === 'eyeArea';
  const sensitivityBonus = isEyeArea ? 15 : 0;

  return {
    hydration: Math.max(0, Math.min(100, (base.hydration || 50) + variance())),
    oiliness: Math.max(0, Math.min(100, (base.oiliness || 40) + variance() + oilinessBonus)),
    pores: Math.round(50 + rng() * 40),
    texture: Math.round(55 + rng() * 35),
    pigmentation: Math.round(60 + rng() * 30),
    sensitivity: Math.max(
      0,
      Math.min(100, (base.sensitivity || 30) + variance() + sensitivityBonus)
    ),
    elasticity: Math.round(55 + rng() * 35),
  };
}

/**
 * Mock 존별 분석 생성
 *
 * @param seed - 결정론 시드 (미지정 시 고정 기본 시드)
 */
export function generateMockZoneAnalysis(
  zoneType: SkinZoneType,
  skinType?: SkinTypeV2,
  previousScore?: number,
  seed?: string
): ZoneAnalysisV2 {
  const metrics = generateMockZoneMetrics(zoneType, skinType, seed);
  const textureAnalysis = generateMockTextureAnalysis(metrics);
  const score = calculateZoneScore(metrics);

  return {
    zone: zoneType,
    group: ZONE_GROUP_MAPPING[zoneType],
    score,
    previousScore,
    metrics,
    textureAnalysis,
    concerns: analyzeZoneConcerns(metrics),
    recommendations: generateZoneRecommendations(zoneType, analyzeZoneConcerns(metrics)),
  };
}

/**
 * Mock 6존 분석 결과 생성
 *
 * 존마다 파생 시드(`시드:존`)를 써서 한 시드로 7존 전체가 결정론적으로 재현되게 한다.
 */
function generateMockSixZoneAnalysis(skinType?: SkinTypeV2, seed?: string): SixZoneAnalysisV2 {
  const baseSeed = seed ?? DEFAULT_SEED;
  const zone = (zoneType: SkinZoneType): ZoneAnalysisV2 =>
    generateMockZoneAnalysis(zoneType, skinType, undefined, `${baseSeed}:${zoneType}`);

  const zones: Record<SkinZoneType, ZoneAnalysisV2> = {
    forehead: zone('forehead'),
    nose: zone('nose'),
    leftCheek: zone('leftCheek'),
    rightCheek: zone('rightCheek'),
    chin: zone('chin'),
    eyeArea: zone('eyeArea'),
    lipArea: zone('lipArea'),
  };

  return {
    zones,
    groupAverages: calculateGroupAverages(zones),
    tUzoneDifference: calculateTUZoneDifference(zones),
  };
}

/**
 * Mock 스킨케어 루틴 추천 생성
 */
function generateMockRoutineRecommendations(skinType: SkinTypeV2): SkinCareRoutineRecommendation[] {
  const routines: SkinCareRoutineRecommendation[] = [
    {
      step: 1,
      category: 'cleanser',
      reason: skinType === 'oily' ? '유분 제거를 위한 폼 클렌저 추천' : '순한 저자극 클렌저 추천',
      ingredients: skinType === 'oily' ? ['살리실산', '티트리'] : ['세라마이드', '히알루론산'],
      avoidIngredients: skinType === 'sensitive' ? ['SLS', '향료', '알코올'] : [],
    },
    {
      step: 2,
      category: 'toner',
      reason: '피부 진정 및 pH 밸런스 조절',
      ingredients: ['나이아신아마이드', 'PHA'],
      avoidIngredients: [],
    },
    {
      step: 3,
      category: 'serum',
      reason:
        skinType === 'dry' ? '집중 보습을 위한 히알루론산 세럼' : '피부결 개선을 위한 비타민C 세럼',
      ingredients:
        skinType === 'dry' ? ['히알루론산', '스쿠알란'] : ['비타민C', '나이아신아마이드'],
      avoidIngredients: [],
    },
    {
      step: 4,
      category: 'moisturizer',
      reason: '피부 장벽 강화 및 보습',
      ingredients: ['세라마이드', '판테놀', '시어버터'],
      avoidIngredients: skinType === 'oily' ? ['미네랄오일', '실리콘'] : [],
    },
    {
      step: 5,
      category: 'sunscreen',
      reason: '자외선 차단 및 피부 보호',
      ingredients: ['징크옥사이드', '나이아신아마이드'],
      avoidIngredients: [],
    },
  ];

  return routines;
}

/**
 * Mock SkinAnalysisV2Result 전체 생성
 *
 * @param skinType - 지정 시 해당 피부 타입 사용
 * @param seed - 결정론 시드 (미지정 시 고정 기본 시드) — 같은 시드 = 같은 결과
 */
export function generateMockSkinAnalysisV2Result(
  skinType?: SkinTypeV2,
  seed?: string
): SkinAnalysisV2Result {
  const zoneAnalysis = generateMockSixZoneAnalysis(skinType, seed);
  const determinedSkinType = skinType || determineSkinType(zoneAnalysis.zones);
  const vitalityScore = calculateVitalityScore(zoneAnalysis.zones);

  return {
    // 레코드 ID는 재현 대상이 아니라 레코드마다 고유해야 함 (Math.random 아님)
    id: `mock-s2-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 9)}`,
    skinType: determinedSkinType,
    vitalityScore,
    vitalityGrade: calculateVitalityGrade(vitalityScore),
    zoneAnalysis,
    scoreBreakdown: calculateScoreBreakdown(zoneAnalysis.zones),
    primaryConcerns: extractPrimaryConcerns(zoneAnalysis.zones),
    routineRecommendations: generateMockRoutineRecommendations(determinedSkinType),
    analyzedAt: new Date().toISOString(),
    usedFallback: true,
  };
}
