/**
 * Voice Parser - 음성 텍스트를 식품 정보로 파싱
 * Gemini AI + Mock Fallback 패턴
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface ParsedFoodItem {
  name: string;
  quantity: number;
  unit: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  confidence: number;
}

export interface VoiceParseResult {
  parsedItems: ParsedFoodItem[];
  inferredMealType: MealType;
  originalText: string;
  confidence: number;
  usedMock: boolean;
}

const KOREAN_FOOD_DB = {
  비빔밥: { estimatedCalories: 580, estimatedProtein: 18, estimatedCarbs: 85, estimatedFat: 15 },
  김치찌개: { estimatedCalories: 280, estimatedProtein: 15, estimatedCarbs: 12, estimatedFat: 18 },
  된장찌개: { estimatedCalories: 250, estimatedProtein: 12, estimatedCarbs: 15, estimatedFat: 14 },
  제육볶음: { estimatedCalories: 450, estimatedProtein: 25, estimatedCarbs: 20, estimatedFat: 28 },
  삼겹살: { estimatedCalories: 520, estimatedProtein: 22, estimatedCarbs: 2, estimatedFat: 45 },
  불고기: { estimatedCalories: 380, estimatedProtein: 28, estimatedCarbs: 18, estimatedFat: 20 },
  김밥: { estimatedCalories: 320, estimatedProtein: 10, estimatedCarbs: 45, estimatedFat: 10 },
  떡볶이: { estimatedCalories: 380, estimatedProtein: 8, estimatedCarbs: 65, estimatedFat: 10 },
  라면: { estimatedCalories: 500, estimatedProtein: 10, estimatedCarbs: 70, estimatedFat: 18 },
  치킨: { estimatedCalories: 450, estimatedProtein: 30, estimatedCarbs: 15, estimatedFat: 28 },
  피자: { estimatedCalories: 280, estimatedProtein: 12, estimatedCarbs: 35, estimatedFat: 12 },
  햄버거: { estimatedCalories: 550, estimatedProtein: 25, estimatedCarbs: 45, estimatedFat: 28 },
  샐러드: { estimatedCalories: 150, estimatedProtein: 5, estimatedCarbs: 20, estimatedFat: 6 },
  밥: { estimatedCalories: 300, estimatedProtein: 6, estimatedCarbs: 65, estimatedFat: 1 },
  국수: { estimatedCalories: 350, estimatedProtein: 12, estimatedCarbs: 55, estimatedFat: 8 },
  우동: { estimatedCalories: 380, estimatedProtein: 14, estimatedCarbs: 60, estimatedFat: 8 },
  짜장면: { estimatedCalories: 650, estimatedProtein: 15, estimatedCarbs: 90, estimatedFat: 22 },
  짬뽕: { estimatedCalories: 550, estimatedProtein: 20, estimatedCarbs: 65, estimatedFat: 18 },
  탕수육: { estimatedCalories: 480, estimatedProtein: 22, estimatedCarbs: 45, estimatedFat: 22 },
  계란: { estimatedCalories: 80, estimatedProtein: 6, estimatedCarbs: 1, estimatedFat: 5 },
  두부: { estimatedCalories: 80, estimatedProtein: 8, estimatedCarbs: 2, estimatedFat: 4 },
  커피: { estimatedCalories: 5, estimatedProtein: 0, estimatedCarbs: 1, estimatedFat: 0 },
  아메리카노: { estimatedCalories: 10, estimatedProtein: 0, estimatedCarbs: 2, estimatedFat: 0 },
  라떼: { estimatedCalories: 150, estimatedProtein: 8, estimatedCarbs: 15, estimatedFat: 6 },
  빵: { estimatedCalories: 250, estimatedProtein: 8, estimatedCarbs: 45, estimatedFat: 4 },
  과일: { estimatedCalories: 80, estimatedProtein: 1, estimatedCarbs: 20, estimatedFat: 0 },
  사과: { estimatedCalories: 95, estimatedProtein: 0, estimatedCarbs: 25, estimatedFat: 0 },
  바나나: { estimatedCalories: 105, estimatedProtein: 1, estimatedCarbs: 27, estimatedFat: 0 },
  우유: { estimatedCalories: 150, estimatedProtein: 8, estimatedCarbs: 12, estimatedFat: 8 },
  요거트: { estimatedCalories: 120, estimatedProtein: 6, estimatedCarbs: 18, estimatedFat: 3 },
  샌드위치: { estimatedCalories: 350, estimatedProtein: 15, estimatedCarbs: 40, estimatedFat: 14 },
};

function inferMealType(text: string): MealType {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('아침') || lowerText.includes('breakfast')) return 'breakfast';
  if (lowerText.includes('점심') || lowerText.includes('lunch')) return 'lunch';
  if (lowerText.includes('저녁') || lowerText.includes('dinner')) return 'dinner';
  if (lowerText.includes('간식') || lowerText.includes('snack')) return 'snack';

  // 시간대 기반 추론 (한국 시간)
  const now = new Date();
  const koreaOffset = 9 * 60;
  const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
  const hour = koreaTime.getHours();

  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 21) return 'dinner';
  return 'snack';
}

// 수량 패턴
const QUANTITY_PATTERNS: Array<{ pattern: RegExp; getValue: (m: RegExpMatchArray) => number; unit: string }> = [
  { pattern: /(\d+)\s*인분/, getValue: (m) => parseInt(m[1], 10), unit: '인분' },
  { pattern: /(\d+)\s*공기/, getValue: (m) => parseInt(m[1], 10), unit: '공기' },
  { pattern: /(\d+)\s*그릇/, getValue: (m) => parseInt(m[1], 10), unit: '그릇' },
  { pattern: /(\d+)\s*개/, getValue: (m) => parseInt(m[1], 10), unit: '개' },
  { pattern: /(\d+)\s*조각/, getValue: (m) => parseInt(m[1], 10), unit: '조각' },
  { pattern: /(\d+)\s*잔/, getValue: (m) => parseInt(m[1], 10), unit: '잔' },
  { pattern: /반\s*공기/, getValue: () => 0.5, unit: '공기' },
  { pattern: /반\s*그릇/, getValue: () => 0.5, unit: '그릇' },
];

/**
 * 음성 텍스트에서 음식 정보 파싱 (Mock 구현)
 *
 * @param transcript - 음성 인식된 텍스트 (예: "오늘 점심에 김치찌개랑 공기밥 먹었어")
 * @returns 파싱된 음식 목록
 */
export function parseVoiceInput(transcript: string): ParsedFoodItem[] {
  const results: ParsedFoodItem[] = [];
  const normalizedText = transcript.toLowerCase().trim();

  // 음식 DB에서 매칭되는 항목 찾기
  for (const [foodName, nutrition] of Object.entries(KOREAN_FOOD_DB)) {
    if (normalizedText.includes(foodName)) {
      // 수량 파악
      let quantity = 1;
      let unit = '인분';

      for (const { pattern, getValue, unit: patternUnit } of QUANTITY_PATTERNS) {
        const match = normalizedText.match(pattern);
        if (match) {
          quantity = getValue(match);
          unit = patternUnit;
          break;
        }
      }

      // 영양 정보에 수량 반영
      results.push({
        name: foodName,
        quantity,
        unit,
        estimatedCalories: Math.round(nutrition.estimatedCalories * quantity),
        estimatedProtein: Math.round(nutrition.estimatedProtein * quantity * 10) / 10,
        estimatedCarbs: Math.round(nutrition.estimatedCarbs * quantity * 10) / 10,
        estimatedFat: Math.round(nutrition.estimatedFat * quantity * 10) / 10,
        confidence: 0.8, // Mock이므로 80% 신뢰도
      });
    }
  }

  return results;
}

/**
 * 전체 음성 파싱 (아이템 + 식사타입)
 */
export function parseVoiceTranscript(transcript: string): VoiceParseResult {
  const parsedItems = parseVoiceInput(transcript);
  const inferredMealType = inferMealType(transcript);

  const avgConfidence =
    parsedItems.length > 0
      ? parsedItems.reduce((sum, item) => sum + item.confidence, 0) / parsedItems.length
      : 0;

  return {
    parsedItems,
    inferredMealType,
    originalText: transcript,
    confidence: avgConfidence,
    usedMock: true,
  };
}

// GoogleGenerativeAI import는 향후 AI 연동을 위해 유지 (현재 미사용)
void GoogleGenerativeAI;

/** Mock 결과 생성 */
export function generateMockVoiceParseResult(text: string): VoiceParseResult {
  return parseVoiceTranscript(text);
}

/** 음성 텍스트를 음식 정보로 파싱 (AI + Mock Fallback) */
export async function parseVoiceToFood(text: string): Promise<VoiceParseResult> {
  // 현재는 Mock만 사용, 향후 Gemini AI 연동 예정
  console.log("[VoiceParser] Using mock parser");
  return parseVoiceTranscript(text);
}
