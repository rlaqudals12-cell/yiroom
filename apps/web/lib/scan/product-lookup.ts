/**
 * 제품 조회 유틸리티
 * - 내부 DB 우선 조회
 * - Open Beauty Facts API 폴백
 */

import type {
  GlobalProduct,
  ProductLookupResult,
  ProductIngredient,
  ProductCategory,
} from '@/types/scan';

// ============================================
// Open Beauty Facts API
// ============================================

const OPEN_BEAUTY_FACTS_API = 'https://world.openbeautyfacts.org/api/v0/product';

interface OpenBeautyFactsProduct {
  product_name?: string;
  product_name_ko?: string;
  product_name_en?: string;
  brands?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  ingredients_text_ko?: string;
  image_url?: string;
  countries_tags?: string[];
  nutriscore_grade?: string;
}

interface OpenBeautyFactsResponse {
  status: number;
  product?: OpenBeautyFactsProduct;
}

// ============================================
// 카테고리 매핑
// ============================================

const CATEGORY_MAP: Record<string, ProductCategory> = {
  'en:face-creams': 'skincare',
  'en:moisturizers': 'skincare',
  'en:cleansers': 'skincare',
  'en:serums': 'skincare',
  'en:toners': 'skincare',
  'en:masks': 'skincare',
  'en:lipsticks': 'makeup',
  'en:foundations': 'makeup',
  'en:mascaras': 'makeup',
  'en:eyeshadows': 'makeup',
  'en:blushes': 'makeup',
  'en:body-lotions': 'bodycare',
  'en:body-washes': 'bodycare',
  'en:shampoos': 'haircare',
  'en:conditioners': 'haircare',
  'en:sunscreens': 'suncare',
  'en:sun-protection': 'suncare',
  'en:perfumes': 'fragrance',
};

function mapCategory(categories?: string[]): ProductCategory {
  if (!categories || categories.length === 0) return 'other';

  for (const cat of categories) {
    const mapped = CATEGORY_MAP[cat];
    if (mapped) return mapped;
  }

  return 'other';
}

// ============================================
// 성분 파싱
// ============================================

/**
 * 성분 텍스트를 파싱하여 ProductIngredient 배열로 변환
 */
export function parseIngredientsText(text: string): ProductIngredient[] {
  if (!text) return [];

  // 쉼표로 구분된 성분 목록 파싱
  const ingredients = text
    .split(/,|、/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return ingredients.map((name, index) => ({
    order: index + 1,
    inciName: name.toUpperCase(),
    nameKo: undefined, // 추후 성분 마스터 DB에서 매칭
    concentration: index < 5 ? 'high' : index < 15 ? 'medium' : 'low',
  }));
}

// ============================================
// Open Beauty Facts 조회
// ============================================

/**
 * Open Beauty Facts에서 제품 조회
 */
async function lookupFromOpenBeautyFacts(barcode: string): Promise<ProductLookupResult> {
  try {
    const response = await fetch(`${OPEN_BEAUTY_FACTS_API}/${barcode}.json`, {
      headers: { 'User-Agent': 'Yiroom/1.0' },
    });

    if (!response.ok) {
      return {
        found: false,
        source: 'open_beauty_facts',
        confidence: 0,
        error: `API 오류: ${response.status}`,
      };
    }

    const data: OpenBeautyFactsResponse = await response.json();

    if (data.status !== 1 || !data.product) {
      return {
        found: false,
        source: 'open_beauty_facts',
        confidence: 0,
      };
    }

    const p = data.product;

    const product: GlobalProduct = {
      id: `obf_${barcode}`,
      barcode,
      name: p.product_name_ko || p.product_name || p.product_name_en || '알 수 없는 제품',
      nameEn: p.product_name_en,
      brand: p.brands || '알 수 없음',
      category: mapCategory(p.categories_tags),
      ingredients: parseIngredientsText(p.ingredients_text_ko || p.ingredients_text || ''),
      imageUrl: p.image_url,
      originCountry: p.countries_tags?.[0]?.replace('en:', ''),
      dataSource: 'open_beauty_facts',
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      found: true,
      source: 'open_beauty_facts',
      product,
      confidence: 0.85,
    };
  } catch (error) {
    console.error('[Scan] Open Beauty Facts 조회 실패:', error);
    return {
      found: false,
      source: 'open_beauty_facts',
      confidence: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

// ============================================
// 내부 DB 조회 (시드 데이터 + Supabase)
// ============================================

import { findProductByBarcode } from './korean-products-seed';

/**
 * 내부 DB에서 제품 조회
 * 1. Supabase global_products 조회 (추후 활성화)
 * 2. 한국 제품 시드 데이터 fallback
 */
async function lookupFromInternalDb(barcode: string): Promise<ProductLookupResult> {
  // TODO: Supabase 연동 (마이그레이션 후 활성화)
  // const supabase = createClerkSupabaseClient();
  // const { data, error } = await supabase
  //   .from('global_products')
  //   .select('*')
  //   .eq('barcode', barcode)
  //   .single();
  // if (data) {
  //   return { found: true, source: 'internal_db', product: data, confidence: 1.0 };
  // }

  // 한국 제품 시드 데이터에서 검색 (30개+ 제품)
  const seedProduct = findProductByBarcode(barcode);

  if (seedProduct) {
    return {
      found: true,
      source: 'internal_db',
      product: seedProduct,
      confidence: 1.0,
    };
  }

  return {
    found: false,
    source: 'internal_db',
    confidence: 0,
  };
}

// ============================================
// 통합 조회
// ============================================

/**
 * 바코드로 제품 조회
 * 1. 내부 DB 먼저 조회
 * 2. 없으면 Open Beauty Facts 조회
 */
export async function lookupProduct(barcode: string): Promise<ProductLookupResult> {
  // 1. 내부 DB 조회
  const internalResult = await lookupFromInternalDb(barcode);
  if (internalResult.found) {
    return internalResult;
  }

  // 2. Open Beauty Facts 조회
  const obfResult = await lookupFromOpenBeautyFacts(barcode);
  if (obfResult.found) {
    return obfResult;
  }

  // 3. 미발견
  return {
    found: false,
    source: 'internal_db',
    confidence: 0,
    error: '제품을 찾을 수 없습니다. 성분표 촬영을 시도해주세요.',
  };
}

/**
 * 제품 검색 (이름/브랜드/성분)
 */
export async function searchProducts(query: string, limit: number = 10): Promise<GlobalProduct[]> {
  // TODO: Supabase 연동 (마이그레이션 후 활성화)
  // const supabase = createClerkSupabaseClient();
  // const { data } = await supabase
  //   .from('global_products')
  //   .select('*')
  //   .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
  //   .limit(limit);
  // if (data) return data;

  // 시드 데이터에서 검색
  const lowerQuery = query.toLowerCase();
  const { KOREAN_PRODUCTS_SEED } = await import('./korean-products-seed');

  const results = KOREAN_PRODUCTS_SEED.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.brand.toLowerCase().includes(lowerQuery) ||
      p.nameEn?.toLowerCase().includes(lowerQuery) ||
      p.keyIngredients?.some((k) => k.toLowerCase().includes(lowerQuery))
  );

  return results.slice(0, limit);
}
