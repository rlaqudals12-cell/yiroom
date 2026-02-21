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
