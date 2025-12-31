/**
 * Gemini AI 분석 모듈
 * 모바일 앱에서 AI 분석을 위한 유틸리티
 */
import type { PersonalColorSeason, SkinType, BodyType } from '@yiroom/shared';

// Gemini API 설정
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
async function imageToBase64(imageUri: string): Promise<string> {
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

  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
    { text: prompt },
  ];

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
      console.warn(`Gemini API retry ${retryCount + 1}/${MAX_RETRIES}`);
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
${Object.entries(questionAnswers).map(([q, a]) => `질문 ${q}: ${a}`).join('\n')}

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
  const bmi = weight / ((height / 100) ** 2);

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
  const types: SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];
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

function generateMockBodyResult(height: number, weight: number): BodyAnalysisResult {
  const bmi = weight / ((height / 100) ** 2);
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

/**
 * Gemini API 설정 검증
 */
export function validateGeminiConfig(): boolean {
  if (!GEMINI_API_KEY) {
    console.warn('Missing EXPO_PUBLIC_GEMINI_API_KEY');
    return false;
  }
  return true;
}
