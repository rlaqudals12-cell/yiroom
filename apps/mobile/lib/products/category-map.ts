/**
 * 뷰티 대분류 ↔ cosmetic_products 세분류(category) 매핑
 *
 * 왜 필요한가:
 * - cosmetic_products.category는 **세분류**(cleanser, toner, serum, makeup ...)로 저장돼 있고,
 *   모바일 필터 UI는 **대분류**(skincare / makeup / suncare / bodycare / haircare)로 노출한다.
 * - 세분류 집합은 웹 정본(apps/web/lib/analysis/integrated/internal/product-matcher.ts
 *   `SKINCARE_CATEGORIES`)과 prod 실분포(makeup 2444 · serum 59 · moisturizer 54 · cleanser 44 ·
 *   toner 40 · sunscreen 40 · mask 30 · body_care 25 · essence 20 · eye_cream 15 ·
 *   hair-treatment 15 · lip_care 12 · nail_care 12 · shampoo 9 · scalp-care 2)를 기준으로 확정.
 * - 웹 정본과 달리 sunscreen은 suncare, body_care는 bodycare로 분리해 UI 대분류에 맞춘다.
 *
 * @module lib/products/category-map
 */

/** 모바일 뷰티 대분류 필터 키 (정본) */
export type BeautyCoarseCategory = 'skincare' | 'makeup' | 'suncare' | 'bodycare' | 'haircare';

/**
 * 대분류 → cosmetic_products 세분류 배열.
 * `hair`/`body`는 카테고리 화면 slug 별칭(각각 haircare/bodycare와 동일).
 */
export const COARSE_TO_FINE_CATEGORIES: Record<string, string[]> = {
  skincare: [
    'cleanser',
    'toner',
    'serum',
    'essence',
    'moisturizer',
    'eye_cream',
    'mask',
    'lip_care',
  ],
  makeup: ['makeup'],
  suncare: ['sunscreen'],
  bodycare: ['body_care', 'nail_care'],
  body: ['body_care', 'nail_care'], // slug 별칭
  haircare: ['hair-treatment', 'shampoo', 'scalp-care'],
  hair: ['hair-treatment', 'shampoo', 'scalp-care'], // slug 별칭
};

/**
 * 세분류(category) → 대분류 필터 키 (역방향).
 * 클라이언트 카테고리 필터(BeautyProductFeed)가 대분류 키로 비교하므로,
 * DB의 세분류를 대분류로 되돌릴 때 사용한다.
 * conditioner는 prod 분포엔 없으나 타입에 존재하므로 haircare로 안전 매핑.
 */
const FINE_TO_COARSE: Record<string, BeautyCoarseCategory> = {
  cleanser: 'skincare',
  toner: 'skincare',
  serum: 'skincare',
  essence: 'skincare',
  moisturizer: 'skincare',
  eye_cream: 'skincare',
  mask: 'skincare',
  lip_care: 'skincare',
  makeup: 'makeup',
  sunscreen: 'suncare',
  body_care: 'bodycare',
  nail_care: 'bodycare',
  'hair-treatment': 'haircare',
  shampoo: 'haircare',
  'scalp-care': 'haircare',
  conditioner: 'haircare',
};

/**
 * 대분류 키에 해당하는 cosmetic 세분류 배열을 반환한다.
 * 매핑에 없는 키(예: 'all')는 undefined → 호출부는 카테고리 필터를 적용하지 않는다.
 */
export function fineCategoriesFor(coarse: string): string[] | undefined {
  return COARSE_TO_FINE_CATEGORIES[coarse];
}

/**
 * cosmetic 세분류를 대분류 필터 키로 변환한다.
 * 알 수 없는 세분류는 skincare로 폴백(가장 넓은 기본 분류).
 */
export function coarseCategoryOf(fine: string): BeautyCoarseCategory {
  return FINE_TO_COARSE[fine] ?? 'skincare';
}
