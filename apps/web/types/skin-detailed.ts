/**
 * S-1 피부 분석 전문성 강화 타입 정의
 * @description Progressive Disclosure 분석 시스템용 상세 타입
 * @version 1.0
 * @date 2026-01-13
 */

import type { DetailedZoneId, DetailedStatusLevel } from './skin-zones';

// ============================================
// 지표별 상세 설명 타입 (Layer 3: WHY + HOW)
// ============================================

/** 전문 용어 정의 */
export interface TechnicalTerm {
  /** 용어 (영문 약어 포함) */
  term: string;
  /** 정의 (한국어 설명) */
  definition: string;
}

/** 추천 성분 */
export interface RecommendedIngredientDetail {
  /** 성분명 (한국어) */
  name: string;
  /** 효능 설명 */
  benefit: string;
}

/** 상세 분석 정보 */
export interface DetailedAnalysis {
  /** 측정 기준 설명 */
  measurementBasis: string;
  /** 정상 범위 */
  normalRange: string;
  /** 사용자 상태 (동적으로 계산) */
  userStatus: string;
  /** 가능한 원인 목록 */
  possibleCauses: string[];
}

/** 과학적 배경 정보 */
export interface ScientificBackground {
  /** 쉬운 설명 (초보자용) */
  explanation: string;
  /** 전문 용어 목록 */
  technicalTerms: TechnicalTerm[];
  /** 논문/연구 참조 (선택) */
  reference?: string;
}

/** 솔루션 정보 */
export interface Solutions {
  /** 추천 성분 */
  ingredients: RecommendedIngredientDetail[];
  /** 추천 제품 카테고리 */
  products: string[];
  /** 라이프스타일 팁 */
  lifestyle: string[];
}

/** 지표별 상세 설명 데이터 */
export interface MetricDetailedExplanation {
  /** 지표 ID (hydration, oil, pores 등) */
  metricId: string;
  /** 점수 (0-100) */
  score: number;
  /** 상태 (good, normal, warning) */
  status: 'good' | 'normal' | 'warning';
  /** 간단한 설명 (한 줄) */
  simpleDescription: string;
  /** 상세 분석 (Progressive Disclosure) */
  detailedAnalysis: DetailedAnalysis;
  /** 과학적 근거 */
  scientificBackground: ScientificBackground;
  /** 솔루션 */
  solutions: Solutions;
}

/** 지표 설명 템플릿 (점수/상태 제외) */
export type MetricExplanationTemplate = Omit<MetricDetailedExplanation, 'score' | 'status'>;

// ============================================
// 존별 상세 설명 타입
// ============================================

/** 측정 상세 정보 */
export interface MeasurementDetail {
  /** 측정 지표명 */
  indicator: string;
  /** 측정값 (동적) */
  value: string;
  /** 정상 대비 비교 */
  comparison: string;
}

/** 존별 상세 설명 데이터 */
export interface ZoneDetailedExplanation {
  /** 존 ID */
  zoneId: DetailedZoneId;
  /** 점수 (0-100) */
  score: number;
  /** 상태 (5단계) */
  status: DetailedStatusLevel;
  /** 주요 문제점 */
  concerns: string[];
  /** 측정 상세 정보 */
  measurementDetails: MeasurementDetail[];
  /** 추천 관리법 */
  recommendations: string[];
  /** 피해야 할 것 */
  avoidance: string[];
}

/** 존 설명 템플릿 (점수/상태 제외) */
export type ZoneExplanationTemplate = Omit<ZoneDetailedExplanation, 'score' | 'status'>;

// ============================================
// 7개 지표 ID 타입
// ============================================

/** 피부 분석 7개 지표 ID */
export type SkinMetricId =
  | 'hydration'
  | 'oil'
  | 'pores'
  | 'wrinkles'
  | 'elasticity'
  | 'pigmentation'
  | 'trouble'
  | 'sensitivity'; // DB 호환성

/** 7개 지표 한국어 라벨 */
export const SKIN_METRIC_LABELS: Record<SkinMetricId, string> = {
  hydration: '수분도',
  oil: '유분도',
  pores: '모공',
  wrinkles: '주름',
  elasticity: '탄력',
  pigmentation: '색소침착',
  trouble: '트러블',
  sensitivity: '민감도',
};

// ============================================
// 상태 유틸리티
// ============================================

/** 점수 → 3단계 상태 변환 */
export function getMetricStatus(score: number): 'good' | 'normal' | 'warning' {
  if (score >= 71) return 'good';
  if (score >= 41) return 'normal';
  return 'warning';
}

/** 상태별 한국어 라벨 */
export const METRIC_STATUS_LABELS: Record<'good' | 'normal' | 'warning', string> = {
  good: '좋음',
  normal: '보통',
  warning: '주의',
};

/** 상태별 색상 (Tailwind) */
export const METRIC_STATUS_COLORS: Record<'good' | 'normal' | 'warning', string> = {
  good: 'text-green-500',
  normal: 'text-yellow-500',
  warning: 'text-red-500',
};

/** 상태별 배경색 (Tailwind) */
export const METRIC_STATUS_BG_COLORS: Record<'good' | 'normal' | 'warning', string> = {
  good: 'bg-green-500/20',
  normal: 'bg-yellow-500/20',
  warning: 'bg-red-500/20',
};
