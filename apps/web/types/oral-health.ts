/**
 * OH-1 구강건강 분석 타입 정의
 *
 * @module types/oral-health
 * @description VITA 셰이드 시스템, Lab 색공간, 잇몸 건강 분석
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

// =============================================================================
// 색공간 타입 (SSOT: @/lib/color에서 import + re-export)
// =============================================================================

import type { LabColor as _LabColor, RGBColor as _RGBColor } from '@/lib/color';

/**
 * CIE Lab 색공간 좌표
 * - L*: 명도 (0=검정, 100=흰색)
 * - a*: 녹색(-) ~ 빨간색(+)
 * - b*: 파란색(-) ~ 노란색(+)
 */
export type LabColor = _LabColor;

/**
 * RGB 색공간 (0-255)
 */
export type RGBColor = _RGBColor;

// =============================================================================
// VITA 셰이드 시스템
// =============================================================================

/**
 * VITA Classical 16색 셰이드
 * - A 계열: 적갈색 (Reddish Brown)
 * - B 계열: 적황색 (Reddish Yellow)
 * - C 계열: 회색 (Grey)
 * - D 계열: 적회색 (Reddish Grey)
 * - 0M: Bleached (추가 셰이드)
 */
export type VitaClassicalShade =
  | 'B1'
  | 'A1'
  | 'B2'
  | 'D2'
  | 'A2'
  | 'C1'
  | 'C2'
  | 'D4'
  | 'A3'
  | 'D3'
  | 'B3'
  | 'A3.5'
  | 'B4'
  | 'C3'
  | 'A4'
  | 'C4';

/**
 * VITA 3D-Master 26색 자연 셰이드
 * 명도 그룹(1-5) × 채도(L/M/R) 조합
 * + Bleached 3색(0M1~0M3) = 총 29색
 */
export type Vita3DMasterShade =
  | '1M1'
  | '1M2'
  | '2L1.5'
  | '2L2.5'
  | '2M1'
  | '2M2'
  | '2M3'
  | '2R1.5'
  | '2R2.5'
  | '3L1.5'
  | '3L2.5'
  | '3M1'
  | '3M2'
  | '3M3'
  | '3R1.5'
  | '3R2.5'
  | '4L1.5'
  | '4L2.5'
  | '4M1'
  | '4M2'
  | '4M3'
  | '4R1.5'
  | '4R2.5'
  | '5M1'
  | '5M2'
  | '5M3';

/**
 * Bleached 셰이드 (미백 후 목표)
 */
export type VitaBleachedShade = '0M1' | '0M2' | '0M3';

/**
 * VITA 통합 셰이드 (Classical + Bleached — 기존 호환)
 */
export type VitaShade = VitaClassicalShade | VitaBleachedShade;

/**
 * VITA 3D-Master 명도 그룹
 */
export type Vita3DValueGroup = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * VITA 3D-Master 채도 분류
 */
export type Vita3DChroma = 'L' | 'M' | 'R';

/**
 * VITA 시리즈 (Classical)
 */
export type VitaSeries = 'A' | 'B' | 'C' | 'D';

/**
 * VITA 셰이드 참조값
 */
export interface VitaShadeReference {
  shade: VitaShade;
  lab: LabColor;
  series: VitaSeries;
  brightnessRank: number; // 1 = 가장 밝음, 16 = 가장 어두움, 0 = Bleached
  description?: string;
}

/**
 * VITA 3D-Master 셰이드 참조값
 */
export interface Vita3DShadeReference {
  shade: Vita3DMasterShade | VitaBleachedShade;
  lab: LabColor;
  valueGroup: Vita3DValueGroup;
  chroma: Vita3DChroma;
  brightnessRank: number;
  classicalEquivalent?: VitaClassicalShade;
  description?: string;
}

/**
 * 미백 변색 원인 분류 (4종)
 */
export type DiscolorationCause = 'surface' | 'intrinsic' | 'aging' | 'antibiotic';

// =============================================================================
// 치아 색상 분석
// =============================================================================

/**
 * 치아 색상 분석 입력
 */
export interface ToothColorInput {
  imageBase64: string;
  regionOfInterest?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 치아 색상 분석 결과
 */
export interface ToothColorResult {
  measuredLab: LabColor;
  matchedShade: VitaShade;
  deltaE: number; // CIEDE2000 색차
  confidence: number; // 0-100
  alternativeMatches: Array<{
    shade: VitaShade;
    deltaE: number;
  }>;
  interpretation: {
    brightness: 'very_bright' | 'bright' | 'medium' | 'dark' | 'very_dark';
    yellowness: 'minimal' | 'mild' | 'moderate' | 'significant';
    series: VitaSeries;
  };
  /** 3D-Master 29색 매칭 결과 (Classical 분석 시 함께 제공) */
  matched3DShade?: Vita3DMatchInfo;
}

/**
 * VITA 3D-Master 매칭 정보
 */
export interface Vita3DMatchInfo {
  shade: Vita3DMasterShade | VitaBleachedShade;
  deltaE: number;
  valueGroup: Vita3DValueGroup;
  chroma: Vita3DChroma;
  classicalEquivalent?: VitaClassicalShade;
}

// =============================================================================
// 잇몸 건강 분석
// =============================================================================

/**
 * 잇몸 건강 상태
 */
export type GumHealthStatus =
  | 'healthy'
  | 'mild_gingivitis'
  | 'moderate_gingivitis'
  | 'severe_inflammation';

/**
 * 잇몸 건강 지표
 */
export interface GumHealthMetrics {
  aStarMean: number; // a* 평균값 (붉은기)
  aStarStd: number; // a* 표준편차
  rednessPercentage: number; // 붉은 영역 비율 (%)
  swellingIndicator: number; // 부종 지표
}

/**
 * 잇몸 건강 분석 입력
 */
export interface GumHealthInput {
  imageBase64: string;
  includeTeeth?: boolean;
}

/**
 * 잇몸 건강 분석 결과
 */
export interface GumHealthResult {
  healthStatus: GumHealthStatus;
  inflammationScore: number; // 0-100
  needsDentalVisit: boolean;
  metrics: GumHealthMetrics;
  recommendations: string[];
  affectedAreas?: Array<{
    region: 'upper_front' | 'upper_back' | 'lower_front' | 'lower_back';
    severity: 'mild' | 'moderate' | 'severe';
  }>;
}

// =============================================================================
// 미백 목표
// =============================================================================

/**
 * 퍼스널컬러 시즌
 */
export type PersonalColorSeason = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * 미백 목표 입력
 */
export interface WhiteningGoalInput {
  currentShade: VitaShade;
  personalColorSeason: PersonalColorSeason;
  desiredLevel: 'subtle' | 'moderate' | 'dramatic';
}

/**
 * 미백 목표 결과
 */
export interface WhiteningGoalResult {
  targetShade: VitaShade;
  shadeStepsNeeded: number;
  expectedDuration: {
    minWeeks: number;
    maxWeeks: number;
  };
  isOverWhitening: boolean;
  overWhiteningReason?: string;
  harmonySuggestion: string;
  recommendedMethods: Array<{
    method: 'whitening_toothpaste' | 'strips' | 'professional_bleaching' | 'in_office';
    effectiveness: 'low' | 'medium' | 'high';
    duration: string;
    notes: string;
  }>;
}

// =============================================================================
// 제품 추천
// =============================================================================

/**
 * 사용자 구강 프로필
 */
export interface UserOralProfile {
  sensitivity: 'none' | 'mild' | 'severe';
  gumHealth: 'healthy' | 'gingivitis' | 'periodontitis';
  cavityRisk: 'low' | 'medium' | 'high';
  calculus: 'none' | 'mild' | 'heavy';
  halitosis: boolean;
  dentalWork: Array<'braces' | 'implant' | 'bridge' | 'crown' | 'veneer'>;
}

/**
 * 제품 선호도
 */
export interface ProductPreferences {
  budgetLevel: 'low' | 'mid' | 'high';
  preferNatural: boolean;
  alcoholFree: boolean;
}

/**
 * 치간 청소 추천
 */
export interface InterdentalRecommendation {
  primary: Array<{
    type:
      | 'floss_waxed'
      | 'floss_unwaxed'
      | 'floss_ptfe'
      | 'interdental_brush'
      | 'water_flosser'
      | 'superfloss';
    reason: string;
  }>;
  alternative: Array<{
    type: string;
    reason: string;
  }>;
}

/**
 * 구강 제품 추천
 */
export interface OralProductRecommendation {
  toothpaste: Array<{
    name: string;
    brand: string;
    keyIngredients: string[];
    matchScore: number;
    reason: string;
    affiliateLink?: string;
  }>;
  mouthwash: Array<{
    name: string;
    brand: string;
    keyIngredients: string[];
    matchScore: number;
    reason: string;
    affiliateLink?: string;
  }>;
  interdental: InterdentalRecommendation;
  accessories: Array<{
    type: string;
    reason: string;
  }>;
  avoidIngredients: string[];
  keyIngredients: string[];
  careRoutine: Array<{
    step: number;
    action: string;
    timing: string;
    product?: string;
    duration?: string;
  }>;
}

// =============================================================================
// 종합 분석 결과
// =============================================================================

/**
 * 구강건강 종합 평가
 */
export interface OralHealthAssessment {
  id: string;
  clerkUserId: string;
  createdAt: string;
  usedFallback: boolean;

  toothColor?: ToothColorResult;
  gumHealth?: GumHealthResult;
  whiteningGoal?: {
    targetShade: VitaShade;
    personalColorSeason: PersonalColorSeason;
    shadeStepsNeeded: number;
    isOverWhitening: boolean;
    harmonySuggestion: string;
  };

  overallScore: number; // 0-100
  recommendations: string[];
}

// =============================================================================
// N-1 영양 모듈 연동
// =============================================================================

/**
 * OH-1 → N-1 연동 데이터
 * 구강 상태에 따른 영양 권장 사항
 */
export interface OH1ToN1IntegrationData {
  oralHealthAlerts: Array<{
    condition: string;
    nutrientRecommendations: string[];
    foodRecommendations: string[];
    avoidFoods: string[];
  }>;
  supplementSuggestions: Array<{
    name: string;
    reason: string;
    dosage: string;
  }>;
}

// =============================================================================
// API 요청/응답 타입
// =============================================================================

/**
 * 구강건강 분석 API 요청
 */
export interface OralHealthAnalysisRequest {
  imageBase64: string;
  analysisType: 'tooth_color' | 'gum_health' | 'full';
  personalColorSeason?: PersonalColorSeason;
  oralProfile?: UserOralProfile;
}

/**
 * 구강건강 분석 API 응답
 */
export interface OralHealthAnalysisResponse {
  success: boolean;
  data?: {
    assessment: OralHealthAssessment;
    productRecommendations?: OralProductRecommendation;
  };
  error?: {
    code: string;
    message: string;
  };
}
