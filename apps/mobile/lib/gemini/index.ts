/**
 * Gemini AI 분석 모듈
 *
 * @module lib/gemini
 * @description 모바일 앱 AI 분석 — 퍼스널컬러, 피부, 체형, 음식
 *
 * @example
 * import { analyzePersonalColor, analyzeSkin } from '@/lib/gemini';
 */

// 타입
export type {
  PersonalColorAnalysisResult,
  SkinAnalysisResult,
  BodyAnalysisResult,
  FoodAnalysisResult,
  TrafficLight,
  AnalysisResponse,
} from './types';

// 분석 함수
export { analyzePersonalColor, analyzeSkin, analyzeBody, analyzeFood } from './analyzers';

// 클라이언트
export { imageToBase64, validateGeminiConfig } from './client';

// 유틸리티
export { getConfidenceFeedback } from './utils';
