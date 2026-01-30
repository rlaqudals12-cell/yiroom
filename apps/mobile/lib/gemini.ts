/**
 * Gemini AI 분석 모듈
 * 모바일 앱에서 AI 분석을 위한 유틸리티
 */
import type { PersonalColorSeason, SkinType, BodyType } from '@yiroom/shared';

import { geminiLogger } from './utils/logger';

// Gemini API 설정
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// 분석 타임아웃 (3초)
const ANALYSIS_TIMEOUT = 3000;

// 재시도 횟수
const MAX_RETRIES = 2;

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
 * 이미지를 Base64로 변환
 */
export async function imageToBase64(imageUri: string): Promise<string> {
  // React Native에서는 fetch로 이미지를 가져와서 변환
  const response = await fetch(imageUri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // data:image/jpeg;base64, 부분 제거
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Gemini API 호출
 */
async function callGeminiAPI(
  prompt: string,
  imageBase64?: string,
  retryCount = 0
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const parts: (
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }
  )[] = [{ text: prompt }];

  if (imageBase64) {
    parts.unshift({
      inline_data: {
        mime_type: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    clearTimeout(timeoutId);

    // 재시도
    if (retryCount < MAX_RETRIES) {
      geminiLogger.warn(`API retry ${retryCount + 1}/${MAX_RETRIES}`);
      return callGeminiAPI(prompt, imageBase64, retryCount + 1);
    }

    throw error;
  }
}

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
    // 폴백: 문진 결과 기반 분석
    return generateMockPersonalColorResult(questionAnswers);
  }
}

/**
 * 피부 분석
 */
export async function analyzeSkin(
  imageBase64: string
): Promise<SkinAnalysisResult> {
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
    // 폴백: Mock 분석
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
    // 폴백: Mock 분석
    return generateMockBodyResult(height, weight);
  }
}

// 헬퍼 함수들

function getSeasonColors(season: PersonalColorSeason): string[] {
  const colorMap: Record<PersonalColorSeason, string[]> = {
    Spring: ['#FFB6C1', '#FFDAB9', '#FFA07A', '#F0E68C', '#98FB98'],
    Summer: ['#E6E6FA', '#DDA0DD', '#B0C4DE', '#F0FFFF', '#FFC0CB'],
    Autumn: ['#8B4513', '#DAA520', '#BC8F8F', '#CD853F', '#556B2F'],
    Winter: ['#000000', '#FFFFFF', '#4169E1', '#DC143C', '#800080'],
  };
  return colorMap[season];
}

function generateMockPersonalColorResult(
  answers: Record<number, string>
): PersonalColorAnalysisResult {
  const warmCount = Object.values(answers).filter((v) => v === 'warm').length;
  const coolCount = Object.values(answers).filter((v) => v === 'cool').length;

  let season: PersonalColorSeason;
  if (warmCount > coolCount) {
    season = Math.random() > 0.5 ? 'Spring' : 'Autumn';
  } else {
    season = Math.random() > 0.5 ? 'Summer' : 'Winter';
  }

  return {
    season,
    confidence: 0.75,
    colors: getSeasonColors(season),
    description: '문진 결과를 기반으로 분석되었습니다.',
  };
}

function generateMockSkinResult(): SkinAnalysisResult {
  const types: SkinType[] = [
    'dry',
    'oily',
    'combination',
    'sensitive',
    'normal',
  ];
  const skinType = types[Math.floor(Math.random() * types.length)];

  return {
    skinType,
    metrics: {
      moisture: Math.floor(Math.random() * 40) + 40,
      oil: Math.floor(Math.random() * 40) + 30,
      pores: Math.floor(Math.random() * 30) + 50,
      wrinkles: Math.floor(Math.random() * 30) + 60,
      pigmentation: Math.floor(Math.random() * 30) + 50,
      sensitivity: Math.floor(Math.random() * 40) + 30,
      elasticity: Math.floor(Math.random() * 30) + 55,
    },
    concerns: ['수분 부족', '유분 과다'],
    recommendations: ['보습 강화', '순한 클렌저 사용'],
  };
}

function generateMockBodyResult(
  height: number,
  weight: number
): BodyAnalysisResult {
  const bmi = weight / (height / 100) ** 2;
  const types: BodyType[] = [
    'Rectangle',
    'Triangle',
    'InvertedTriangle',
    'Hourglass',
    'Oval',
    'Athletic',
  ];
  const bodyType = types[Math.floor(Math.random() * types.length)];

  return {
    bodyType,
    bmi: Math.round(bmi * 10) / 10,
    proportions: {
      shoulderHipRatio: 0.9 + Math.random() * 0.3,
      waistHipRatio: 0.7 + Math.random() * 0.2,
    },
    recommendations: ['허리 강조', 'A라인 실루엣'],
    avoidItems: ['박시한 옷', '일자 핏'],
  };
}

// ============================================
// N-1 음식 분석 (Food Analysis)
// ============================================

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
 * N-1 음식 분석 프롬프트
 */
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
 * N-1 음식 분석 실행
 * Gemini API를 호출하여 음식 사진을 분석하고, 실패 시 Mock 데이터를 반환
 *
 * @param imageBase64 - Base64 인코딩된 음식 이미지
 * @returns 음식 분석 결과
 */
export async function analyzeFood(
  imageBase64: string
): Promise<FoodAnalysisResult> {
  try {
    const response = await callGeminiAPI(FOOD_ANALYSIS_PROMPT, imageBase64);

    // JSON 파싱
    let cleanResponse = response.trim();
    // JSON 코드 블록 제거
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

    // 결과 정규화 및 ID 생성
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

    // 총 영양 정보 계산
    const totals = foods.reduce(
      (
        acc: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        },
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
    // AI 실패 시 Mock Fallback
    return generateMockFoodResult();
  }
}

/**
 * 스톱라이트 값 검증
 */
function validateTrafficLight(value: string): TrafficLight {
  if (value === 'green' || value === 'yellow' || value === 'red') {
    return value;
  }
  return 'yellow'; // 기본값
}

/**
 * Mock 음식 분석 결과 생성
 * AI 호출 실패 시 사용되는 Fallback
 */
function generateMockFoodResult(): FoodAnalysisResult {
  // 한국 음식 Mock 데이터베이스
  const MOCK_FOODS: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    trafficLight: TrafficLight;
  }[] = [
    {
      name: '비빔밥',
      calories: 550,
      protein: 18,
      carbs: 65,
      fat: 12,
      trafficLight: 'yellow',
    },
    {
      name: '된장찌개',
      calories: 120,
      protein: 9,
      carbs: 8,
      fat: 5,
      trafficLight: 'green',
    },
    {
      name: '김치찌개',
      calories: 150,
      protein: 12,
      carbs: 10,
      fat: 6,
      trafficLight: 'green',
    },
    {
      name: '불고기',
      calories: 350,
      protein: 28,
      carbs: 15,
      fat: 20,
      trafficLight: 'yellow',
    },
    {
      name: '삼겹살',
      calories: 500,
      protein: 25,
      carbs: 2,
      fat: 45,
      trafficLight: 'red',
    },
    {
      name: '라면',
      calories: 500,
      protein: 10,
      carbs: 70,
      fat: 18,
      trafficLight: 'red',
    },
    {
      name: '샐러드',
      calories: 80,
      protein: 3,
      carbs: 10,
      fat: 3,
      trafficLight: 'green',
    },
    {
      name: '치킨',
      calories: 450,
      protein: 35,
      carbs: 15,
      fat: 28,
      trafficLight: 'red',
    },
    {
      name: '김밥',
      calories: 320,
      protein: 8,
      carbs: 45,
      fat: 12,
      trafficLight: 'yellow',
    },
    {
      name: '떡볶이',
      calories: 380,
      protein: 6,
      carbs: 65,
      fat: 10,
      trafficLight: 'red',
    },
  ];

  // 랜덤 음식 1-3개 선택
  const numFoods = Math.floor(Math.random() * 3) + 1;
  const selectedFoods: FoodAnalysisResult['foods'] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < numFoods; i++) {
    let food;
    do {
      food = MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)];
    } while (usedNames.has(food.name));

    usedNames.add(food.name);
    selectedFoods.push({
      id: `food-${Date.now()}-${i}`,
      ...food,
      portion: 1,
      confidence: 0.7 + Math.random() * 0.25,
    });
  }

  // 총 영양 정보 계산
  const totals = selectedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    foods: selectedFoods,
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    insight:
      'AI 분석이 불가하여 예시 데이터가 표시됩니다. 음식을 직접 수정해주세요.',
  };
}

/**
 * 신뢰도 기반 피드백 메시지 생성
 */
export function getConfidenceFeedback(confidence: number): {
  level: 'high' | 'medium' | 'low';
  message: string;
  color: string;
} {
  if (confidence >= 0.85) {
    return {
      level: 'high',
      message: '높은 정확도로 인식됨',
      color: '#22c55e',
    };
  } else if (confidence >= 0.65) {
    return {
      level: 'medium',
      message: '확인이 필요할 수 있어요',
      color: '#eab308',
    };
  } else {
    return {
      level: 'low',
      message: '정확도가 낮아요. 수정해주세요',
      color: '#ef4444',
    };
  }
}

/**
 * Gemini API 설정 검증
 */
export function validateGeminiConfig(): boolean {
  if (!GEMINI_API_KEY) {
    geminiLogger.warn('Missing EXPO_PUBLIC_GEMINI_API_KEY');
    return false;
  }
  return true;
}
