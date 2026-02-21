/**
 * Gemini AI 분석 타입 정의
 */
import type { PersonalColorSeason, SkinType, BodyType } from '@yiroom/shared';

/**
 * 퍼스널 컬러 분석 결과 타입
 */
export interface PersonalColorAnalysisResult {
  season: PersonalColorSeason;
  confidence: number;
  colors: string[];
  description: string;
}

/**
 * 피부 분석 결과 타입
 */
export interface SkinAnalysisResult {
  skinType: SkinType;
  metrics: {
    moisture: number;
    oil: number;
    pores: number;
    wrinkles: number;
    pigmentation: number;
    sensitivity: number;
    elasticity: number;
  };
  concerns: string[];
  recommendations: string[];
}

/**
 * 체형 분석 결과 타입
 */
export interface BodyAnalysisResult {
  bodyType: BodyType;
  bmi: number;
  proportions: {
    shoulderHipRatio: number;
    waistHipRatio: number;
  };
  recommendations: string[];
  avoidItems: string[];
}

/**
 * 스톱라이트 색상 타입 (Noom 스타일)
 */
export type TrafficLight = 'green' | 'yellow' | 'red';

/**
 * N-1 음식 분석 결과 타입
 */
export interface FoodAnalysisResult {
  foods: {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    trafficLight: TrafficLight;
    portion: number;
    confidence: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  insight?: string;
}

/**
 * 헤어 분석 결과 타입 (H-1)
 */
export interface HairAnalysisResult {
  texture: 'straight' | 'wavy' | 'curly' | 'coily';
  thickness: 'fine' | 'medium' | 'thick';
  scalpCondition: 'dry' | 'oily' | 'normal' | 'sensitive';
  damageLevel: number;
  scores: {
    shine: number;
    elasticity: number;
    density: number;
    scalpHealth: number;
  };
  mainConcerns: string[];
  careRoutine: string[];
  recommendedStyles: string[];
}

/**
 * 메이크업 분석 결과 타입 (M-1)
 */
export interface MakeupAnalysisResult {
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';
  undertone: 'warm' | 'cool' | 'neutral';
  eyeShape: 'monolid' | 'double' | 'hooded' | 'round' | 'almond';
  lipShape: 'full' | 'thin' | 'wide' | 'bow';
  scores: {
    skinTone: number;
    eyeBalance: number;
    lipBalance: number;
    overall: number;
  };
  recommendations: {
    base: string;
    eye: string;
    lip: string;
    blush: string;
    contour: string;
  };
  bestColors: string[];
}

/**
 * 구강건강 분석 결과 타입 (OH-1)
 */
export interface OralHealthAnalysisResult {
  toothShade: string;
  gumHealth: 'healthy' | 'mild_inflammation' | 'moderate_inflammation' | 'severe';
  overallScore: number;
  scores: {
    whiteness: number;
    alignment: number;
    gumCondition: number;
    hygiene: number;
  };
  concerns: string[];
  recommendations: string[];
  whiteningPotential: 'high' | 'medium' | 'low';
}

/**
 * 자세 분석 결과 타입 (Posture)
 */
export interface PostureAnalysisResult {
  postureType:
    | 'normal'
    | 'forward_head'
    | 'rounded_shoulders'
    | 'swayback'
    | 'flat_back'
    | 'kyphosis';
  overallScore: number;
  scores: {
    headAlignment: number;
    shoulderBalance: number;
    spineAlignment: number;
    hipAlignment: number;
  };
  issues: string[];
  exercises: {
    name: string;
    description: string;
    duration: string;
  }[];
  dailyTips: string[];
}

/**
 * 분석 응답 래퍼 — fallback 사용 여부를 명시적으로 전달
 */
export interface AnalysisResponse<T> {
  result: T;
  usedFallback: boolean;
}
