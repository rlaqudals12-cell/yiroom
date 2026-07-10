/**
 * Gemini AI 분석 함수
 * 각 도메인별 분석 로직 + Rate Limit + Fallback 처리
 */

import { callGeminiAPI } from './client';
import {
  generateMockPersonalColorResult,
  generateMockSkinResult,
  generateMockBodyResult,
  generateMockFoodResult,
  generateMockHairResult,
  generateMockMakeupResult,
  generateMockOralHealthResult,
  generateMockPostureResult,
} from './mocks';
import {
  buildPersonalColorPrompt,
  SKIN_ANALYSIS_PROMPT,
  buildBodyPrompt,
  HAIR_ANALYSIS_PROMPT,
  MAKEUP_ANALYSIS_PROMPT,
} from './prompts';
import type {
  PersonalColorAnalysisResult,
  SkinAnalysisResult,
  BodyAnalysisResult,
  FoodAnalysisResult,
  HairAnalysisResult,
  MakeupAnalysisResult,
  OralHealthAnalysisResult,
  PostureAnalysisResult,
  AnalysisResponse,
  TrafficLight,
} from './types';
import { getSeasonColors, validateTrafficLight } from './utils';
import { checkRateLimit, incrementRateLimit } from '../api/rate-limit';
import { geminiLogger } from '../utils/logger';

/**
 * 퍼스널 컬러 분석
 */
export async function analyzePersonalColor(
  imageBase64: string,
  questionAnswers: Record<number, string>
): Promise<AnalysisResponse<PersonalColorAnalysisResult>> {
  // Rate limit 확인
  const allowed = await checkRateLimit();
  if (!allowed) {
    geminiLogger.warn('PC-1: Rate limit exceeded, using mock');
    return { result: generateMockPersonalColorResult(questionAnswers), usedFallback: true };
  }

  const prompt = buildPersonalColorPrompt(questionAnswers);

  try {
    await incrementRateLimit();
    const response = await callGeminiAPI(prompt, imageBase64);
    const result = JSON.parse(response);

    return {
      result: {
        season: result.season,
        confidence: result.confidence,
        colors: getSeasonColors(result.season),
        description: result.description,
      },
      usedFallback: false,
    };
  } catch (error) {
    geminiLogger.error('PC-1 analysis error, falling back to mock:', error);
    return { result: generateMockPersonalColorResult(questionAnswers), usedFallback: true };
  }
}

/**
 * 피부 분석
 */
export async function analyzeSkin(
  imageBase64: string
): Promise<AnalysisResponse<SkinAnalysisResult>> {
  const allowed = await checkRateLimit();
  if (!allowed) {
    geminiLogger.warn('S-1: Rate limit exceeded, using mock');
    return { result: generateMockSkinResult(), usedFallback: true };
  }

  const prompt = SKIN_ANALYSIS_PROMPT;

  try {
    await incrementRateLimit();
    const response = await callGeminiAPI(prompt, imageBase64);
    return { result: JSON.parse(response), usedFallback: false };
  } catch (error) {
    geminiLogger.error('S-1 analysis error, falling back to mock:', error);
    return { result: generateMockSkinResult(), usedFallback: true };
  }
}

/**
 * 체형 분석
 */
export async function analyzeBody(
  imageBase64: string,
  height: number,
  weight: number
): Promise<AnalysisResponse<BodyAnalysisResult>> {
  const allowed = await checkRateLimit();
  if (!allowed) {
    geminiLogger.warn('C-1: Rate limit exceeded, using mock');
    return { result: generateMockBodyResult(height, weight), usedFallback: true };
  }

  const bmi = weight / (height / 100) ** 2;

  const prompt = buildBodyPrompt(height, weight, bmi);

  try {
    await incrementRateLimit();
    const response = await callGeminiAPI(prompt, imageBase64);
    const result = JSON.parse(response);

    return {
      result: {
        ...result,
        bmi: Math.round(bmi * 10) / 10,
      },
      usedFallback: false,
    };
  } catch (error) {
    geminiLogger.error('C-1 analysis error, falling back to mock:', error);
    return { result: generateMockBodyResult(height, weight), usedFallback: true };
  }
}

// N-1 음식 분석 프롬프트
const FOOD_ANALYSIS_PROMPT = `당신은 전문 영양사 AI입니다. 업로드된 음식 사진을 분석하여 음식을 인식하고 영양 정보를 추정해주세요.

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "foods": [
    {
      "name": "[음식명 - 한국어]",
      "calories": [예상 칼로리 kcal],
      "protein": [단백질 g],
      "carbs": [탄수화물 g],
      "fat": [지방 g],
      "trafficLight": "[green|yellow|red]",
      "confidence": [0.0-1.0 신뢰도]
    }
  ],
  "insight": "[식사에 대한 간단한 영양 조언 1문장]"
}

스톱라이트 기준:
- green (초록): 칼로리 밀도 낮음, 영양가 높음 (채소, 과일, 저지방 단백질)
- yellow (노랑): 적당한 칼로리, 균형 잡힌 영양 (곡물, 살코기, 유제품)
- red (빨강): 고칼로리, 고지방 또는 가공식품 (튀김, 디저트, 패스트푸드)

주의사항:
- 사진에서 보이는 모든 음식을 인식하세요 (1-5개)
- 한국 음식에 익숙해야 합니다
- 1인분 기준으로 영양 정보를 추정하세요
- confidence는 이미지 품질과 음식 인식 확실성에 따라 설정하세요
- 한국어로 응답하세요`;

/**
 * N-1 음식 분석
 */
export async function analyzeFood(
  imageBase64: string
): Promise<AnalysisResponse<FoodAnalysisResult>> {
  const allowed = await checkRateLimit();
  if (!allowed) {
    geminiLogger.warn('N-1: Rate limit exceeded, using mock');
    return { result: generateMockFoodResult(), usedFallback: true };
  }

  try {
    await incrementRateLimit();
    const response = await callGeminiAPI(FOOD_ANALYSIS_PROMPT, imageBase64);

    // JSON 파싱 — 코드 블록 마크다운 제거
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.slice(7);
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.slice(3);
    }
    if (cleanResponse.endsWith('```')) {
      cleanResponse = cleanResponse.slice(0, -3);
    }
    cleanResponse = cleanResponse.trim();

    const parsed = JSON.parse(cleanResponse);

    const foods = (parsed.foods || []).map(
      (
        food: {
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          trafficLight: TrafficLight;
          confidence: number;
        },
        index: number
      ) => ({
        id: `food-${Date.now()}-${index}`,
        name: food.name || '알 수 없는 음식',
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        trafficLight: validateTrafficLight(food.trafficLight),
        portion: 1,
        confidence: Math.min(1, Math.max(0, food.confidence || 0.7)),
      })
    );

    const totals = foods.reduce(
      (
        acc: { calories: number; protein: number; carbs: number; fat: number },
        food: { calories: number; protein: number; carbs: number; fat: number }
      ) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      result: {
        foods,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        insight: parsed.insight,
      },
      usedFallback: false,
    };
  } catch (error) {
    geminiLogger.error('N-1 food analysis error, falling back to mock:', error);
    return { result: generateMockFoodResult(), usedFallback: true };
  }
}

/**
 * H-1 헤어 분석
 */
export async function analyzeHair(
  imageBase64: string
): Promise<AnalysisResponse<HairAnalysisResult>> {
  const allowed = await checkRateLimit();
  if (!allowed) {
    geminiLogger.warn('H-1: Rate limit exceeded, using mock');
    return { result: generateMockHairResult(), usedFallback: true };
  }

  const prompt = HAIR_ANALYSIS_PROMPT;

  try {
    await incrementRateLimit();
    const response = await callGeminiAPI(prompt, imageBase64);
    return { result: JSON.parse(response), usedFallback: false };
  } catch (error) {
    geminiLogger.error('H-1 analysis error, falling back to mock:', error);
    return { result: generateMockHairResult(), usedFallback: true };
  }
}

/**
 * M-1 메이크업 분석
 */
export async function analyzeMakeup(
  imageBase64: string
): Promise<AnalysisResponse<MakeupAnalysisResult>> {
  const allowed = await checkRateLimit();
  if (!allowed) {
    geminiLogger.warn('M-1: Rate limit exceeded, using mock');
    return { result: generateMockMakeupResult(), usedFallback: true };
  }

  const prompt = MAKEUP_ANALYSIS_PROMPT;

  try {
    await incrementRateLimit();
    const response = await callGeminiAPI(prompt, imageBase64);
    return { result: JSON.parse(response), usedFallback: false };
  } catch (error) {
    geminiLogger.error('M-1 analysis error, falling back to mock:', error);
    return { result: generateMockMakeupResult(), usedFallback: true };
  }
}

/**
 * OH-1 구강건강 분석
 */
export async function analyzeOralHealth(
  imageBase64: string
): Promise<AnalysisResponse<OralHealthAnalysisResult>> {
  const allowed = await checkRateLimit();
  if (!allowed) {
    geminiLogger.warn('OH-1: Rate limit exceeded, using mock');
    return { result: generateMockOralHealthResult(), usedFallback: true };
  }

  const prompt = `당신은 치과 전문의입니다. 제공된 구강 이미지를 분석하여 구강 건강 상태를 평가해주세요.

다음 JSON 형식으로만 응답해주세요:
{
  "toothShade": "A1-D4 사이 VITA 치아 색상 코드",
  "gumHealth": "healthy" | "mild_inflammation" | "moderate_inflammation" | "severe",
  "overallScore": 0-100,
  "scores": {
    "whiteness": 0-100,
    "alignment": 0-100,
    "gumCondition": 0-100,
    "hygiene": 0-100
  },
  "concerns": ["발견된 문제"],
  "recommendations": ["관리 추천"],
  "whiteningPotential": "high" | "medium" | "low"
}

한국어로 응답하세요.`;

  try {
    await incrementRateLimit();
    const response = await callGeminiAPI(prompt, imageBase64);
    return { result: JSON.parse(response), usedFallback: false };
  } catch (error) {
    geminiLogger.error('OH-1 analysis error, falling back to mock:', error);
    return { result: generateMockOralHealthResult(), usedFallback: true };
  }
}

/**
 * Posture 자세 분석
 */
export async function analyzePosture(
  imageBase64: string
): Promise<AnalysisResponse<PostureAnalysisResult>> {
  const allowed = await checkRateLimit();
  if (!allowed) {
    geminiLogger.warn('Posture: Rate limit exceeded, using mock');
    return { result: generateMockPostureResult(), usedFallback: true };
  }

  const prompt = `당신은 물리치료사입니다. 제공된 전신 측면 이미지를 분석하여 자세 상태를 평가해주세요.

다음 JSON 형식으로만 응답해주세요:
{
  "postureType": "normal" | "forward_head" | "rounded_shoulders" | "swayback" | "flat_back" | "kyphosis",
  "overallScore": 0-100,
  "scores": {
    "headAlignment": 0-100,
    "shoulderBalance": 0-100,
    "spineAlignment": 0-100,
    "hipAlignment": 0-100
  },
  "issues": ["발견된 자세 문제"],
  "exercises": [
    {"name": "운동명", "description": "설명", "duration": "횟수/시간"}
  ],
  "dailyTips": ["일상 팁"]
}

한국어로 응답하세요.`;

  try {
    await incrementRateLimit();
    const response = await callGeminiAPI(prompt, imageBase64);
    return { result: JSON.parse(response), usedFallback: false };
  } catch (error) {
    geminiLogger.error('Posture analysis error, falling back to mock:', error);
    return { result: generateMockPostureResult(), usedFallback: true };
  }
}
