/**
 * OH-1 구강건강 분석 타입 정의
 *
 * @module types/oral-health
 * @description VITA 셰이드 시스템, Lab 색공간, 잇몸 건강 분석
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

// =============================================================================
// 색공간 타입
// =============================================================================

/**
 * CIE Lab 색공간 좌표
 * - L*: 명도 (0=검정, 100=흰색)
 * - a*: 녹색(-) ~ 빨간색(+)
 * - b*: 파란색(-) ~ 노란색(+)
 */
export interface LabColor {
  L: number;
  a: number;
  b: number;
}

/**
 * RGB 색공간 (0-255)
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

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
export type VitaShade =
  | 'B1' | 'A1' | 'B2' | 'D2' | 'A2' | 'C1' | 'C2' | 'D4'
  | 'A3' | 'D3' | 'B3' | 'A3.5' | 'B4' | 'C3' | 'A4' | 'C4'
  | '0M1' | '0M2' | '0M3';

/**
 * VITA 시리즈
 */
export type VitaSeries = 'A' | 'B' | 'C' | 'D';

/**
 * VITA 셰이드 참조값
 */
export interface VitaShadeReference {
  shade: VitaShade;
  lab: LabColor;
  series: VitaSeries;
  brightnessRank: number;  // 1 = 가장 밝음, 16 = 가장 어두움, 0 = Bleached
  description?: string;
}

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
  deltaE: number;  // CIEDE2000 색차
  confidence: number;  // 0-100
  alternativeMatches: Array<{
    shade: VitaShade;
    deltaE: number;
  }>;
  interpretation: {
    brightness: 'very_bright' | 'bright' | 'medium' | 'dark' | 'very_dark';
    yellowness: 'minimal' | 'mild' | 'moderate' | 'significant';
    series: VitaSeries;
  };
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
  aStarMean: number;  // a* 평균값 (붉은기)
  aStarStd: number;   // a* 표준편차
  rednessPercentage: number;  // 붉은 영역 비율 (%)
  swellingIndicator: number;  // 부종 지표
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
  inflammationScore: number;  // 0-100
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
    type: 'floss_waxed' | 'floss_unwaxed' | 'floss_ptfe' | 'interdental_brush' | 'water_flosser' | 'superfloss';
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

  overallScore: number;  // 0-100
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
