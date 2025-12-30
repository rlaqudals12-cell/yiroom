/**
 * Open Food Facts API 연동
 *
 * - 무료 오픈 데이터 API
 * - 글로벌 식품 데이터베이스
 * - https://world.openfoodfacts.org/api/v2/product/{barcode}.json
 */

import type { BarcodeFood } from '@/types/nutrition';

// Open Food Facts API 응답 타입
interface OpenFoodFactsProduct {
  code: string;
  product?: {
    product_name?: string;
    product_name_ko?: string;
    brands?: string;
    serving_size?: string;
    serving_quantity?: number;
    nutriments?: {
      'energy-kcal_100g'?: number;
      'energy-kcal_serving'?: number;
      carbohydrates_100g?: number;
      carbohydrates_serving?: number;
      proteins_100g?: number;
      proteins_serving?: number;
      fat_100g?: number;
      fat_serving?: number;
      sugars_100g?: number;
      sugars_serving?: number;
      fiber_100g?: number;
      fiber_serving?: number;
      sodium_100g?: number;
      sodium_serving?: number;
      salt_100g?: number;
    };
    image_front_url?: string;
    image_front_small_url?: string;
    categories?: string;
    allergens_tags?: string[];
  };
  status: number; // 1 = found, 0 = not found
  status_verbose?: string;
}

// API 응답 결과
export interface OpenFoodFactsResult {
  found: boolean;
  food?: BarcodeFood;
  error?: string;
}

// API 타임아웃 (3초)
const API_TIMEOUT_MS = 3000;

/**
 * Open Food Facts에서 바코드로 식품 조회
 *
 * @param barcode EAN-13/EAN-8/UPC-A 바코드
 * @returns 식품 정보 또는 미발견
 */
export async function lookupOpenFoodFacts(
  barcode: string
): Promise<OpenFoodFactsResult> {
  try {
    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Yiroom/1.0 (https://yiroom.app)',
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { found: false, error: `API error: ${response.status}` };
    }

    const data: OpenFoodFactsProduct = await response.json();

    // 식품 미발견
    if (data.status !== 1 || !data.product) {
      return { found: false };
    }

    const product = data.product;

    // 필수 데이터 확인 (이름 또는 칼로리)
    const productName = product.product_name_ko || product.product_name;
    const calories =
      product.nutriments?.['energy-kcal_100g'] ||
      product.nutriments?.['energy-kcal_serving'];

    if (!productName && !calories) {
      return { found: false, error: 'Insufficient product data' };
    }

    // BarcodeFood 형식으로 변환
    const food: BarcodeFood = {
      id: `off_${barcode}`, // 임시 ID (DB 저장 후 실제 ID로 교체)
      barcode,
      name: productName || `제품 ${barcode}`,
      brand: product.brands || undefined,
      servingSize: product.serving_quantity || 100,
      servingUnit: 'g',
      calories: Math.round(product.nutriments?.['energy-kcal_100g'] || 0),
      protein: Math.round(product.nutriments?.proteins_100g || 0),
      carbs: Math.round(product.nutriments?.carbohydrates_100g || 0),
      fat: Math.round(product.nutriments?.fat_100g || 0),
      sugar: product.nutriments?.sugars_100g
        ? Math.round(product.nutriments.sugars_100g)
        : undefined,
      fiber: product.nutriments?.fiber_100g
        ? Math.round(product.nutriments.fiber_100g)
        : undefined,
      // 나트륨 mg 변환 (salt g → sodium mg: salt * 400)
      sodium: product.nutriments?.sodium_100g
        ? Math.round(product.nutriments.sodium_100g * 1000) // g to mg
        : product.nutriments?.salt_100g
          ? Math.round(product.nutriments.salt_100g * 400)
          : undefined,
      imageUrl:
        product.image_front_small_url || product.image_front_url || undefined,
      category: product.categories?.split(',')[0]?.trim() || undefined,
      allergens: product.allergens_tags?.map((tag) =>
        tag.replace('en:', '').replace('ko:', '')
      ),
      source: 'api',
      verified: false, // API 데이터는 검증 안됨
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

/**
 * 식품안전나라 API 조회 (향후 구현)
 *
 * - 한국 공공데이터 포털 API
 * - API 키 필요
 */
export async function lookupFoodSafetyKorea(
  _barcode: string
): Promise<OpenFoodFactsResult> {
  // TODO: 식품안전나라 API 연동
  // https://www.data.go.kr/data/15050816/openapi.do
  return { found: false, error: 'Not implemented' };
}
