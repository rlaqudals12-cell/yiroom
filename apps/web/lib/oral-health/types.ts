/**
 * OH-1 구강건강 분석 타입 재내보내기
 *
 * @module lib/oral-health/types
 * @description 공개 타입 API
 */

export type {
  // 색공간 타입
  LabColor,
  RGBColor,

  // VITA 셰이드 시스템
  VitaShade,
  VitaSeries,
  VitaShadeReference,

  // 치아 색상 분석
  ToothColorInput,
  ToothColorResult,

  // 잇몸 건강 분석
  GumHealthStatus,
  GumHealthMetrics,
  GumHealthInput,
  GumHealthResult,

  // 미백 목표
  PersonalColorSeason,
  WhiteningGoalInput,
  WhiteningGoalResult,

  // 제품 추천
  UserOralProfile,
  ProductPreferences,
  InterdentalRecommendation,
  OralProductRecommendation,

  // 종합 분석
  OralHealthAssessment,

  // N-1 연동
  OH1ToN1IntegrationData,

  // API 타입
  OralHealthAnalysisRequest,
  OralHealthAnalysisResponse,
} from '@/types/oral-health';
