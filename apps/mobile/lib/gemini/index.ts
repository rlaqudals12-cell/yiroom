/**
 * Gemini AI 분석 모듈
 *
 * @module lib/gemini
 * @description 모바일 앱 AI 분석 — 퍼스널컬러, 피부, 체형, 음식, 헤어, 메이크업, 구강건강, 자세
 *
 * @example
 * import { analyzePersonalColor, analyzeHair, analyzeMakeup } from '@/lib/gemini';
 */

// 타입
export type {
  PersonalColorAnalysisResult,
  SkinAnalysisResult,
  BodyAnalysisResult,
  FoodAnalysisResult,
  HairAnalysisResult,
  MakeupAnalysisResult,
  OralHealthAnalysisResult,
  PostureAnalysisResult,
  TrafficLight,
  AnalysisResponse,
} from './types';

// 분석 함수
export {
  analyzePersonalColor,
  analyzeSkin,
  analyzeBody,
  analyzeFood,
  analyzeHair,
  analyzeMakeup,
  analyzeOralHealth,
  analyzePosture,
} from './analyzers';

// 클라이언트
export { imageToBase64, validateGeminiConfig } from './client';

// 유틸리티
export { getConfidenceFeedback } from './utils';
