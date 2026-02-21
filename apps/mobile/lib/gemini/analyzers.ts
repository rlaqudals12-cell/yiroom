/**
 * Gemini AI 분석 함수
 * 각 도메인별 분석 로직 + Fallback 처리
 */
import { geminiLogger } from '../utils/logger';

import { callGeminiAPI } from './client';
import {
  generateMockPersonalColorResult,
  generateMockSkinResult,
  generateMockBodyResult,
  generateMockFoodResult,
} from './mocks';
import type {
  PersonalColorAnalysisResult,
  SkinAnalysisResult,
  BodyAnalysisResult,
  FoodAnalysisResult,
  TrafficLight,
} from './types';
import { getSeasonColors, validateTrafficLight } from './utils';

/**
 * 퍼스널 컬러 분석
 */
export async function analyzePersonalColor(
  imageBase64: string,
  questionAnswers: Record<number, string>
): Promise<PersonalColorAnalysisResult> {
  const prompt = `
당신은 퍼스널 컬러 전문가입니다. 제공된 얼굴 이미지와 문진 결과를 분석하여 퍼스널 컬러를 진단해주세요.

문진 결과:
${Object.entries(questionAnswers)
  .map(([q, a]) => `질문 ${q}: ${a}`)
  .join('\n')}

다음 JSON 형식으로만 응답해주세요:
{
  "season": "spring" | "summer" | "autumn" | "winter",
  "confidence": 0.0-1.0,
  "description": "진단 설명"
}
`;

  try {
    const response = await callGeminiAPI(prompt, imageBase64);
    const result = JSON.parse(response);

    return {
      season: result.season,
      confidence: result.confidence,
      colors: getSeasonColors(result.season),
      description: result.description,
    };
  } catch {
    return generateMockPersonalColorResult(questionAnswers);
  }
}

/**
 * 피부 분석
 */
export async function analyzeSkin(imageBase64: string): Promise<SkinAnalysisResult> {
  const prompt = `
당신은 피부과 전문의입니다. 제공된 얼굴 이미지를 분석하여 피부 상태를 진단해주세요.

다음 JSON 형식으로만 응답해주세요:
{
  "skinType": "dry" | "oily" | "combination" | "sensitive" | "normal",
  "metrics": {
    "moisture": 0-100,
    "oil": 0-100,
    "pores": 0-100,
    "wrinkles": 0-100,
    "pigmentation": 0-100,
    "sensitivity": 0-100,
    "elasticity": 0-100
  },
  "concerns": ["주요 고민 항목"],
  "recommendations": ["추천 사항"]
}
`;

  try {
    const response = await callGeminiAPI(prompt, imageBase64);
    return JSON.parse(response);
  } catch {
    return generateMockSkinResult();
  }
}

/**
 * 체형 분석
 */
export async function analyzeBody(
  imageBase64: string,
  height: number,
  weight: number
): Promise<BodyAnalysisResult> {
  const bmi = weight / (height / 100) ** 2;

  const prompt = `
당신은 스타일리스트입니다. 제공된 전신 이미지와 신체 정보를 분석하여 체형을 진단해주세요.

신체 정보:
- 키: ${height}cm
- 체중: ${weight}kg
- BMI: ${bmi.toFixed(1)}

다음 JSON 형식으로만 응답해주세요:
{
  "bodyType": "rectangle" | "triangle" | "inverted_triangle" | "hourglass" | "oval" | "athletic" | "petite" | "tall",
  "proportions": {
    "shoulderHipRatio": 0.0-2.0,
    "waistHipRatio": 0.0-2.0
  },
  "recommendations": ["추천 스타일"],
  "avoidItems": ["피해야 할 스타일"]
}
`;

  try {
    const response = await callGeminiAPI(prompt, imageBase64);
    const result = JSON.parse(response);

    return {
      ...result,
      bmi: Math.round(bmi * 10) / 10,
    };
  } catch {
    return generateMockBodyResult(height, weight);
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
export async function analyzeFood(imageBase64: string): Promise<FoodAnalysisResult> {
  try {
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
      foods,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      insight: parsed.insight,
    };
  } catch (error) {
    geminiLogger.error('Food analysis error, falling back to mock:', error);
    return generateMockFoodResult();
  }
}
