/**
 * 분석 이력 관련 타입 정의
 * Before/After 비교 기능용
 */

// 분석 타입
export type AnalysisType = 'body' | 'skin' | 'personal-color' | 'hair' | 'makeup';

// 공통 분석 이력 아이템
export interface AnalysisHistoryItem {
  id: string;
  date: string;
  overallScore: number;
  imageUrl?: string;
  type: AnalysisType;
}

// 피부 분석 이력 아이템
export interface SkinAnalysisHistoryItem extends AnalysisHistoryItem {
  type: 'skin';
  details: {
    skinType: string;
    hydration: number;
    oilLevel: number;
    pores: number;
    pigmentation: number;
    wrinkles: number;
    sensitivity: number;
  };
}

// 체형 분석 이력 아이템
export interface BodyAnalysisHistoryItem extends AnalysisHistoryItem {
  type: 'body';
  details: {
    bodyType: string;
    height?: number;
    weight?: number;
    shoulder: number;
    waist: number;
    hip: number;
    ratio?: number;
  };
}

// 퍼스널 컬러 분석 이력 아이템
export interface PersonalColorHistoryItem extends AnalysisHistoryItem {
  type: 'personal-color';
  details: {
    season: string;
    undertone: string;
    confidence: number;
  };
}

// 헤어 분석 이력 아이템
export interface HairAnalysisHistoryItem extends AnalysisHistoryItem {
  type: 'hair';
  details: {
    hairType: string;
    scalpHealth: number;
    hairDensity: number;
    hairThickness: number;
    damageLevel: number;
  };
}

// 메이크업 분석 이력 아이템
export interface MakeupAnalysisHistoryItem extends AnalysisHistoryItem {
  type: 'makeup';
  details: {
    undertone: string;
    faceShape: string;
    eyeShape?: string;
    lipShape?: string;
  };
}

// 이력 조회 응답
export interface AnalysisHistoryResponse {
  analyses: AnalysisHistoryItem[];
  trend: 'improving' | 'declining' | 'stable';
  totalCount: number;
}

// 비교 응답
export interface AnalysisCompareResponse {
  before: AnalysisHistoryItem;
  after: AnalysisHistoryItem;
  changes: {
    overall: number;
    period: string;
    details: Record<string, number>;
  };
  insights: string[];
}

// 기간 필터 타입
export type PeriodFilter = '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

// 기간별 일수
export const PERIOD_DAYS: Record<PeriodFilter, number | null> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  all: null,
};

// 기간 라벨
export const PERIOD_LABELS: Record<PeriodFilter, string> = {
  '1w': '1주',
  '1m': '1개월',
  '3m': '3개월',
  '6m': '6개월',
  '1y': '1년',
  all: '전체',
};
