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

// =============================================================================
// Mock 데이터 생성
// =============================================================================

/**
 * Mock GLCM 결과 생성
 */
function generateMockGLCM(): GLCMResult {
  return {
    contrast: 10 + Math.random() * 30,
    homogeneity: 0.7 + Math.random() * 0.25,
    energy: 0.1 + Math.random() * 0.2,
    correlation: 0.8 + Math.random() * 0.15,
    entropy: 3 + Math.random() * 2,
  };
}

/**
 * Mock LBP 결과 생성
 */
function generateMockLBP(): LBPResult {
  const histogram = new Array(256).fill(0).map(() => Math.random());
  const sum = histogram.reduce((a, b) => a + b, 0);
  const normalizedHistogram = histogram.map(v => v / sum);

  return {
    histogram: normalizedHistogram,
    uniformPatternRatio: 0.6 + Math.random() * 0.3,
    roughnessScore: 50 + Math.random() * 40,
  };
}

/**
 * Mock 텍스처 분석 생성
 */
function generateMockTextureAnalysis(): TextureAnalysis {
  const glcm = generateMockGLCM();
  const lbp = generateMockLBP();

  return {
    glcm,
    lbp,
    poreScore: Math.round(55 + Math.random() * 35),
    wrinkleScore: Math.round(60 + Math.random() * 30),
    textureScore: Math.round(55 + Math.random() * 35),
  };
}

/**
 * Mock 존별 메트릭 생성
 */
export function generateMockZoneMetrics(
  zoneType: SkinZoneType,
  skinType?: SkinTypeV2
): ZoneMetricsV2 {
  // 피부 타입별 기본 특성
  const baseMetrics: Record<SkinTypeV2, Partial<ZoneMetricsV2>> = {
    dry: { hydration: 35, oiliness: 25, sensitivity: 45 },
    oily: { hydration: 55, oiliness: 75, sensitivity: 30 },
    combination: { hydration: 50, oiliness: 50, sensitivity: 35 },
    normal: { hydration: 60, oiliness: 40, sensitivity: 25 },
    sensitive: { hydration: 45, oiliness: 35, sensitivity: 70 },
  };

  const base = baseMetrics[skinType || 'normal'];
  const variance = () => Math.round((Math.random() - 0.5) * 20);

  // T존은 더 유분기 많음
  const isTZone = zoneType === 'forehead' || zoneType === 'nose';
  const oilinessBonus = isTZone ? 15 : 0;

  // 눈가는 더 민감함
  const isEyeArea = zoneType === 'eyeArea';
  const sensitivityBonus = isEyeArea ? 15 : 0;

  return {
    hydration: Math.max(0, Math.min(100, (base.hydration || 50) + variance())),
    oiliness: Math.max(0, Math.min(100, (base.oiliness || 40) + variance() + oilinessBonus)),
    pores: Math.round(50 + Math.random() * 40),
    texture: Math.round(55 + Math.random() * 35),
    pigmentation: Math.round(60 + Math.random() * 30),
    sensitivity: Math.max(0, Math.min(100, (base.sensitivity || 30) + variance() + sensitivityBonus)),
    elasticity: Math.round(55 + Math.random() * 35),
  };
}

/**
 * Mock 존별 분석 생성
 */
export function generateMockZoneAnalysis(
  zoneType: SkinZoneType,
  skinType?: SkinTypeV2,
  previousScore?: number
): ZoneAnalysisV2 {
  const metrics = generateMockZoneMetrics(zoneType, skinType);
  const textureAnalysis = generateMockTextureAnalysis();
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
 */
function generateMockSixZoneAnalysis(skinType?: SkinTypeV2): SixZoneAnalysisV2 {
  const zones: Record<SkinZoneType, ZoneAnalysisV2> = {
    forehead: generateMockZoneAnalysis('forehead', skinType),
    nose: generateMockZoneAnalysis('nose', skinType),
    leftCheek: generateMockZoneAnalysis('leftCheek', skinType),
    rightCheek: generateMockZoneAnalysis('rightCheek', skinType),
    chin: generateMockZoneAnalysis('chin', skinType),
    eyeArea: generateMockZoneAnalysis('eyeArea', skinType),
    lipArea: generateMockZoneAnalysis('lipArea', skinType),
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
function generateMockRoutineRecommendations(
  skinType: SkinTypeV2
): SkinCareRoutineRecommendation[] {
  const routines: SkinCareRoutineRecommendation[] = [
    {
      step: 1,
      category: 'cleanser',
      reason: skinType === 'oily'
        ? '유분 제거를 위한 폼 클렌저 추천'
        : '순한 저자극 클렌저 추천',
      ingredients: skinType === 'oily'
        ? ['살리실산', '티트리']
        : ['세라마이드', '히알루론산'],
      avoidIngredients: skinType === 'sensitive'
        ? ['SLS', '향료', '알코올']
        : [],
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
      reason: skinType === 'dry'
        ? '집중 보습을 위한 히알루론산 세럼'
        : '피부결 개선을 위한 비타민C 세럼',
      ingredients: skinType === 'dry'
        ? ['히알루론산', '스쿠알란']
        : ['비타민C', '나이아신아마이드'],
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
 */
export function generateMockSkinAnalysisV2Result(
  skinType?: SkinTypeV2
): SkinAnalysisV2Result {
  const zoneAnalysis = generateMockSixZoneAnalysis(skinType);
  const determinedSkinType = skinType || determineSkinType(zoneAnalysis.zones);
  const vitalityScore = calculateVitalityScore(zoneAnalysis.zones);

  return {
    id: `mock-s2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
