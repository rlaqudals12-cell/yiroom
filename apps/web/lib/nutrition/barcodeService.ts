/**
 * 바코드 서비스 레이어
 *
 * 바코드 조회, 등록, 이력 관리 기능 제공
 * - 로컬 DB + Open Food Facts + 식품안전나라 통합 조회
 * - 크라우드소싱 등록
 * - 스캔 이력 관리
 */

import type {
  BarcodeFood,
  BarcodeSearchResponse,
  BarcodeRegisterRequest,
  BarcodeHistory,
} from '@/types/nutrition';

// API 응답 타입
interface BarcodeApiResponse extends BarcodeSearchResponse {
  error?: string;
}

interface BarcodeRegisterResponse {
  success: boolean;
  food?: BarcodeFood;
  error?: string;
}

interface BarcodeHistoryResponse {
  history: BarcodeHistory[];
  error?: string;
}

/**
 * 바코드 유효성 검사
 * EAN-13, EAN-8, UPC-A 형식 지원
 */
export function isValidBarcode(barcode: string): boolean {
  return /^\d{8,14}$/.test(barcode);
}

/**
 * 바코드로 식품 정보 조회
 *
 * 조회 순서:
 * 1. 로컬 DB
 * 2. Open Food Facts API
 * 3. 식품안전나라 API (한국 바코드)
 *
 * @param barcode EAN-13/EAN-8/UPC-A 바코드
 * @returns 식품 정보 또는 미등록 응답
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeSearchResponse> {
  if (!isValidBarcode(barcode)) {
    return {
      found: false,
      barcode,
      message: '유효하지 않은 바코드 형식입니다',
    };
  }

  try {
    const response = await fetch(`/api/nutrition/foods/barcode/${barcode}`);
    const data: BarcodeApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API 오류');
    }

    return data;
  } catch (error) {
    console.error('[BarcodeService] Lookup error:', error);
    return {
      found: false,
      barcode,
      message: error instanceof Error ? error.message : '조회 중 오류가 발생했습니다',
    };
  }
}

/**
 * 새 바코드 식품 등록 (크라우드소싱)
 *
 * @param data 식품 등록 데이터
 * @returns 등록 결과
 */
export async function registerBarcodeFood(
  data: BarcodeRegisterRequest
): Promise<BarcodeRegisterResponse> {
  if (!isValidBarcode(data.barcode)) {
    return {
      success: false,
      error: '유효하지 않은 바코드 형식입니다',
    };
  }

  if (!data.name || data.calories === undefined) {
    return {
      success: false,
      error: '이름과 칼로리는 필수 입력 항목입니다',
    };
  }

  try {
    const response = await fetch('/api/nutrition/foods/barcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || '등록 중 오류가 발생했습니다',
      };
    }

    return {
      success: true,
      food: result.food,
    };
  } catch (error) {
    console.error('[BarcodeService] Register error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '등록 중 오류가 발생했습니다',
    };
  }
}

/**
 * 최근 바코드 스캔 이력 조회
 *
 * @param limit 조회 개수 (기본 10개, 최대 50개)
 * @returns 스캔 이력 목록
 */
export async function getBarcodeHistory(limit: number = 10): Promise<BarcodeHistoryResponse> {
  try {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const response = await fetch(`/api/nutrition/foods/barcode?limit=${safeLimit}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        history: [],
        error: data.error || '이력 조회 중 오류가 발생했습니다',
      };
    }

    return {
      history: data.history || [],
    };
  } catch (error) {
    console.error('[BarcodeService] History error:', error);
    return {
      history: [],
      error: error instanceof Error ? error.message : '이력 조회 중 오류가 발생했습니다',
    };
  }
}

/**
 * 바코드 식품을 식사 기록으로 저장
 *
 * @param food 바코드 식품
 * @param servings 섭취량 (배수)
 * @param mealType 식사 타입
 * @returns 저장 성공 여부
 */
export async function recordBarcodeFood(
  food: BarcodeFood,
  servings: number,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/nutrition/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType,
        recordType: 'barcode',
        foods: [
          {
            name: food.name,
            servings,
            calories: Math.round(food.calories * servings),
            protein: Math.round(food.protein * servings),
            carbs: Math.round(food.carbs * servings),
            fat: Math.round(food.fat * servings),
            fiber: food.fiber ? Math.round(food.fiber * servings) : undefined,
            sodium: food.sodium ? Math.round(food.sodium * servings) : undefined,
            sugar: food.sugar ? Math.round(food.sugar * servings) : undefined,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || '기록 저장 중 오류가 발생했습니다',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[BarcodeService] Record error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '기록 저장 중 오류가 발생했습니다',
    };
  }
}

/**
 * 바코드 데이터 소스 라벨 반환
 */
export function getSourceLabel(source: string): string {
  switch (source) {
    case 'local':
      return '로컬 DB';
    case 'openfoodfacts':
      return 'Open Food Facts';
    case 'foodsafetykorea':
      return '식품안전나라';
    case 'crowdsourced':
      return '사용자 등록';
    case 'api':
      return 'API';
    case 'manual':
      return '수동 등록';
    default:
      return source;
  }
}

/**
 * 영양 정보 계산 유틸리티
 */
export function calculateNutrition(
  food: BarcodeFood,
  servings: number
): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
} {
  return {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings),
    carbs: Math.round(food.carbs * servings),
    fat: Math.round(food.fat * servings),
    fiber: food.fiber ? Math.round(food.fiber * servings) : undefined,
    sodium: food.sodium ? Math.round(food.sodium * servings) : undefined,
    sugar: food.sugar ? Math.round(food.sugar * servings) : undefined,
  };
}
