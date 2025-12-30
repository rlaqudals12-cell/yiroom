/**
 * 식품안전나라 API 연동
 *
 * - 한국 공공데이터 포털 API
 * - https://www.data.go.kr/data/15050816/openapi.do
 * - 환경변수: FOOD_SAFETY_KOREA_API_KEY
 */

import type { BarcodeFood } from '@/types/nutrition';

// 식품안전나라 API 응답 타입
interface FoodSafetyKoreaResponse {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    pageNo: number;
    totalCount: number;
    numOfRows: number;
    items: FoodSafetyKoreaItem[];
  };
}

interface FoodSafetyKoreaItem {
  PRDLST_NM: string; // 제품명
  BSSH_NM: string; // 업체명 (브랜드)
  PRDLST_REPORT_NO: string; // 품목보고번호
  BARCODE: string; // 바코드
  CAPACITY: string; // 내용량 (예: "120g")
  RAWMTRL_NM: string; // 원재료명
  NUTRI_CONT_INFO: string; // 영양성분 정보 (예: "열량 500kcal, 탄수화물 80g...")
  ALLERGY_INFO: string; // 알레르기 정보
  PRDLST_DCNM: string; // 식품유형
  IMG_URL?: string; // 이미지 URL
}

// API 응답 결과
export interface FoodSafetyKoreaResult {
  found: boolean;
  food?: BarcodeFood;
  error?: string;
}

// API 타임아웃 (5초 - 공공데이터 API는 좀 느림)
const API_TIMEOUT_MS = 5000;

// 영양성분 파싱 정규식
const NUTRIENT_PATTERNS = {
  calories: /열량\s*[:：]?\s*([\d.]+)\s*k?cal/i,
  protein: /단백질\s*[:：]?\s*([\d.]+)\s*g/i,
  carbs: /탄수화물\s*[:：]?\s*([\d.]+)\s*g/i,
  fat: /지방\s*[:：]?\s*([\d.]+)\s*g/i,
  sugar: /당류\s*[:：]?\s*([\d.]+)\s*g/i,
  sodium: /나트륨\s*[:：]?\s*([\d.]+)\s*m?g/i,
  fiber: /식이섬유\s*[:：]?\s*([\d.]+)\s*g/i,
};

/**
 * 영양성분 문자열에서 값 추출
 */
function parseNutrientValue(text: string, pattern: RegExp): number | undefined {
  const match = text.match(pattern);
  if (match && match[1]) {
    return Math.round(parseFloat(match[1]));
  }
  return undefined;
}

/**
 * 내용량 문자열에서 숫자와 단위 추출
 * 예: "120g" -> { size: 120, unit: "g" }
 */
function parseCapacity(capacity: string): { size: number; unit: string } {
  const match = capacity.match(/([\d.]+)\s*(g|ml|kg|l)/i);
  if (match) {
    let size = parseFloat(match[1]);
    let unit = match[2].toLowerCase();

    // kg, l을 g, ml로 변환
    if (unit === 'kg') {
      size *= 1000;
      unit = 'g';
    } else if (unit === 'l') {
      size *= 1000;
      unit = 'ml';
    }

    return { size: Math.round(size), unit };
  }
  return { size: 100, unit: 'g' };
}

/**
 * 알레르기 정보 파싱
 */
function parseAllergens(allergyInfo: string): string[] | undefined {
  if (!allergyInfo) return undefined;

  // "밀, 대두, 우유" 형식 파싱
  const allergens = allergyInfo
    .split(/[,，、]/)
    .map((a) => a.trim())
    .filter((a) => a.length > 0 && a !== '해당없음' && a !== '없음');

  return allergens.length > 0 ? allergens : undefined;
}

/**
 * 식품안전나라에서 바코드로 식품 조회
 *
 * @param barcode EAN-13/EAN-8 바코드
 * @returns 식품 정보 또는 미발견
 */
export async function lookupFoodSafetyKorea(
  barcode: string
): Promise<FoodSafetyKoreaResult> {
  // API 키 확인
  const apiKey = process.env.FOOD_SAFETY_KOREA_API_KEY;
  if (!apiKey) {
    return { found: false, error: 'API key not configured' };
  }

  try {
    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    // API 호출
    const url = new URL(
      'https://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3'
    );
    url.searchParams.set('serviceKey', apiKey);
    url.searchParams.set('returnType', 'json');
    url.searchParams.set('numOfRows', '1');
    url.searchParams.set('pageNo', '1');
    url.searchParams.set('barcode', barcode);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { found: false, error: `API error: ${response.status}` };
    }

    const data: FoodSafetyKoreaResponse = await response.json();

    // 결과 확인
    if (
      data.header.resultCode !== '00' ||
      !data.body.items ||
      data.body.items.length === 0
    ) {
      return { found: false };
    }

    const item = data.body.items[0];

    // 영양성분 파싱
    const nutriInfo = item.NUTRI_CONT_INFO || '';
    const { size: servingSize, unit: servingUnit } = parseCapacity(
      item.CAPACITY || ''
    );

    // BarcodeFood 형식으로 변환
    const food: BarcodeFood = {
      id: `fsk_${barcode}`,
      barcode,
      name: item.PRDLST_NM,
      brand: item.BSSH_NM || undefined,
      servingSize,
      servingUnit,
      calories: parseNutrientValue(nutriInfo, NUTRIENT_PATTERNS.calories) || 0,
      protein: parseNutrientValue(nutriInfo, NUTRIENT_PATTERNS.protein) || 0,
      carbs: parseNutrientValue(nutriInfo, NUTRIENT_PATTERNS.carbs) || 0,
      fat: parseNutrientValue(nutriInfo, NUTRIENT_PATTERNS.fat) || 0,
      sugar: parseNutrientValue(nutriInfo, NUTRIENT_PATTERNS.sugar),
      fiber: parseNutrientValue(nutriInfo, NUTRIENT_PATTERNS.fiber),
      sodium: parseNutrientValue(nutriInfo, NUTRIENT_PATTERNS.sodium),
      allergens: parseAllergens(item.ALLERGY_INFO),
      category: item.PRDLST_DCNM || undefined,
      imageUrl: item.IMG_URL || undefined,
      source: 'api',
      verified: true, // 공공데이터는 검증된 데이터
    };

    return { found: true, food };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { found: false, error: 'API timeout' };
      }
      return { found: false, error: error.message };
    }
    return { found: false, error: 'Unknown error' };
  }
}
