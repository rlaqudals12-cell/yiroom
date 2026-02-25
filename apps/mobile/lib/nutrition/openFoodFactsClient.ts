/**
 * Open Food Facts API 클라이언트 (모바일)
 * 바코드로 식품 영양 정보 조회
 * https://world.openfoodfacts.org/api/v2/product/{barcode}.json
 */

// 바코드 식품 정보
export interface BarcodeFood {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  imageUrl?: string;
  category?: string;
  allergens?: string[];
  source: 'local' | 'api' | 'crowdsourced';
  verified: boolean;
}

// Open Food Facts API 응답 타입
interface OpenFoodFactsProduct {
  code: string;
  product?: {
    product_name?: string;
    product_name_ko?: string;
    brands?: string;
    serving_quantity?: number;
    nutriments?: {
      'energy-kcal_100g'?: number;
      'energy-kcal_serving'?: number;
      carbohydrates_100g?: number;
      proteins_100g?: number;
      fat_100g?: number;
      sugars_100g?: number;
      fiber_100g?: number;
      sodium_100g?: number;
      salt_100g?: number;
    };
    image_front_url?: string;
    image_front_small_url?: string;
    categories?: string;
    allergens_tags?: string[];
  };
  status: number;
}

export interface LookupResult {
  found: boolean;
  food?: BarcodeFood;
  error?: string;
}

const API_TIMEOUT_MS = 3000;

/**
 * Open Food Facts에서 바코드로 식품 조회
 */
export async function lookupOpenFoodFacts(barcode: string): Promise<LookupResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Yiroom/1.0 (mobile)',
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { found: false, error: `API error: ${response.status}` };
    }

    const data: OpenFoodFactsProduct = await response.json();

    if (data.status !== 1 || !data.product) {
      return { found: false };
    }

    const product = data.product;
    const productName = product.product_name_ko || product.product_name;
    const calories =
      product.nutriments?.['energy-kcal_100g'] ||
      product.nutriments?.['energy-kcal_serving'];

    if (!productName && !calories) {
      return { found: false, error: '제품 정보가 부족해요' };
    }

    const food: BarcodeFood = {
      id: `off_${barcode}`,
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
      sodium: product.nutriments?.sodium_100g
        ? Math.round(product.nutriments.sodium_100g * 1000)
        : product.nutriments?.salt_100g
          ? Math.round(product.nutriments.salt_100g * 400)
          : undefined,
      imageUrl: product.image_front_small_url || product.image_front_url || undefined,
      category: product.categories?.split(',')[0]?.trim() || undefined,
      allergens: product.allergens_tags?.map((tag) =>
        tag.replace('en:', '').replace('ko:', '')
      ),
      source: 'api',
      verified: false,
    };

    return { found: true, food };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { found: false, error: '조회 시간이 초과되었어요' };
      }
      return { found: false, error: error.message };
    }
    return { found: false, error: '알 수 없는 오류' };
  }
}
