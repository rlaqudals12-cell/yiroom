/**
 * 제품함-루틴 연동 시스템
 * @description 보유 제품 기반 루틴 자동 생성 및 레이어링 순서 정렬
 * @version 1.0
 * @date 2026-01-11
 */

import type { ShelfItem } from '@/lib/scan/product-shelf';
import type { RoutineStep, ProductCategory, TimeOfDay } from '@/types/skincare-routine';
import type { SkinTypeId } from '@/lib/mock/skin-analysis';
import type { InteractionWarning } from '@/lib/scan/ingredient-interactions';
import { detectInteractions, categorizeInteractions } from '@/lib/scan/ingredient-interactions';

// ================================================
// 타입 정의
// ================================================

export interface ShelfRoutineSync {
  generatedRoutine: RoutineStep[];
  usedProducts: ShelfItem[];
  missingCategories: ProductCategory[];
  conflicts: InteractionWarning[];
  synergies: InteractionWarning[];
  personalizationNote: string;
}

export interface ProductLayeringInfo {
  product: ShelfItem;
  order: number;
  category: ProductCategory;
  layeringReason: string;
}

// ================================================
// 레이어링 순서 정의 (K-뷰티 기준)
// ================================================

// 아침 순서
const MORNING_LAYER_ORDER: ProductCategory[] = [
  'cleanser',
  'toner',
  'essence',
  'serum',
  'ampoule',
  'eye_cream',
  'cream',
  'sunscreen',
];

// 저녁 순서
const EVENING_LAYER_ORDER: ProductCategory[] = [
  'cleanser', // 더블 클렌징: 오일 → 폼
  'toner',
  'essence',
  'serum',
  'ampoule',
  'mask',
  'eye_cream',
  'cream',
  'oil',
  'spot_treatment',
];

// 카테고리 키워드 매핑 (구체적인 카테고리부터 우선 검사)
// 순서 중요: eye_cream을 cream보다 먼저 검사해야 "아이크림"을 정확히 감지
const CATEGORY_KEYWORDS_ORDERED: { category: ProductCategory; keywords: string[] }[] = [
  {
    category: 'eye_cream',
    keywords: ['eye cream', '아이크림', '아이 크림', 'eye', '아이', '눈가', '눈'],
  },
  { category: 'sunscreen', keywords: ['sunscreen', '선크림', 'sun', 'spf', 'uv', 'sunblock'] },
  { category: 'spot_treatment', keywords: ['spot', 'acne', 'blemish', '트러블', 'pimple'] },
  {
    category: 'cleanser',
    keywords: [
      'cleanser',
      '클렌저',
      'cleansing',
      '폼',
      'foam',
      'gel',
      'milk',
      'oil cleanser',
      '오일 클렌저',
      'wash',
    ],
  },
  { category: 'toner', keywords: ['toner', '토너', '스킨', 'skin', '화장수', 'mist'] },
  { category: 'essence', keywords: ['essence', '에센스', 'first treatment'] },
  { category: 'serum', keywords: ['serum', '세럼', 'concentrate'] },
  { category: 'ampoule', keywords: ['ampoule', '앰플', 'booster'] },
  { category: 'mask', keywords: ['mask', '마스크', 'sheet', 'pack', 'sleeping mask'] },
  { category: 'oil', keywords: ['facial oil', 'face oil', '페이스 오일'] },
  {
    category: 'cream',
    keywords: ['cream', '크림', 'moisturizer', 'moisturiser', '보습', 'lotion', 'emulsion'],
  },
];

// ================================================
// 제품 카테고리 감지
// ================================================

/**
 * 제품명/키워드로 카테고리 추측
 */
export function detectProductCategory(product: ShelfItem): ProductCategory | null {
  const searchText = [
    product.productName,
    product.productBrand,
    ...(product.productIngredients?.map((i) => i.inciName) || []),
  ]
    .join(' ')
    .toLowerCase();

  // 구체적인 카테고리부터 순서대로 검사
  for (const { category, keywords } of CATEGORY_KEYWORDS_ORDERED) {
    if (keywords.some((keyword) => searchText.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return null;
}

// ================================================
// 레이어링 순서 정렬
// ================================================

/**
 * 제품을 레이어링 순서대로 정렬
 */
export function sortByLayeringOrder(
  products: ShelfItem[],
  timeOfDay: TimeOfDay
): ProductLayeringInfo[] {
  const layerOrder = timeOfDay === 'morning' ? MORNING_LAYER_ORDER : EVENING_LAYER_ORDER;

  const productsWithCategory = products.map((product) => ({
    product,
    category: detectProductCategory(product),
  }));

  // 카테고리가 있는 제품만 필터링
  const categorizedProducts = productsWithCategory.filter(
    (p): p is { product: ShelfItem; category: ProductCategory } => p.category !== null
  );

  // 레이어링 순서대로 정렬
  const sorted = categorizedProducts.sort((a, b) => {
    const orderA = layerOrder.indexOf(a.category);
    const orderB = layerOrder.indexOf(b.category);
    return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
  });

  return sorted.map((item, index) => ({
    product: item.product,
    order: index + 1,
    category: item.category,
    layeringReason: getLayeringReason(item.category, index, sorted.length),
  }));
}

/**
 * 레이어링 순서 이유 생성
 */
function getLayeringReason(category: ProductCategory, index: number, total: number): string {
  const reasons: Record<ProductCategory, string> = {
    cleanser: '세안으로 피부를 깨끗하게 준비해요',
    toner: '피부 pH를 정돈하고 수분을 공급해요',
    essence: '다음 제품 흡수를 도와줘요',
    serum: '활성 성분을 피부 깊숙이 전달해요',
    ampoule: '고농축 성분으로 집중 케어해요',
    cream: '수분을 가두고 보호막을 형성해요',
    sunscreen: '자외선으로부터 피부를 보호해요 (마지막!)',
    mask: '집중 영양을 공급해요',
    eye_cream: '민감한 눈가를 케어해요',
    oil: '수분을 잠그고 영양을 공급해요',
    spot_treatment: '문제 부위에 집중 케어해요 (맨 마지막)',
  };

  return reasons[category] || '';
}

// ================================================
// 보유 제품 기반 루틴 생성
// ================================================

/**
 * 제품함 제품으로 루틴 생성
 */
export function generateRoutineFromShelf(
  shelfItems: ShelfItem[],
  skinType: SkinTypeId,
  timeOfDay: TimeOfDay
): ShelfRoutineSync {
  // 1. 보유 중인 제품만 필터링
  const ownedProducts = shelfItems.filter((item) => item.status === 'owned');

  // 2. 레이어링 순서로 정렬
  const sortedProducts = sortByLayeringOrder(ownedProducts, timeOfDay);

  // 3. 루틴 단계 생성
  const generatedRoutine: RoutineStep[] = sortedProducts.map((item, index) => ({
    order: index + 1,
    category: item.category,
    name: item.product.productName,
    purpose: item.layeringReason,
    duration: estimateDuration(item.category),
    tips: generateProductTips(item.product, item.category),
    isOptional: isOptionalCategory(item.category, timeOfDay),
    shelfProductId: item.product.id,
  }));

  // 4. 누락된 카테고리 확인
  const essentialCategories = getEssentialCategories(timeOfDay);
  const usedCategories = new Set(sortedProducts.map((p) => p.category));
  const missingCategories = essentialCategories.filter((cat) => !usedCategories.has(cat));

  // 5. 성분 충돌 검사
  const allIngredients = ownedProducts.flatMap(
    (p) => p.productIngredients?.map((i) => i.inciName) || []
  );
  const interactions = detectInteractions(allIngredients);
  const { avoidTogether, synergies } = categorizeInteractions(interactions);

  // 6. 개인화 노트 생성
  const personalizationNote = generateSyncNote(
    sortedProducts.length,
    missingCategories,
    avoidTogether.length,
    skinType
  );

  return {
    generatedRoutine,
    usedProducts: sortedProducts.map((p) => p.product),
    missingCategories,
    conflicts: avoidTogether,
    synergies,
    personalizationNote,
  };
}

/**
 * 카테고리별 예상 소요 시간
 */
function estimateDuration(category: ProductCategory): string {
  const durations: Record<ProductCategory, string> = {
    cleanser: '1분',
    toner: '30초',
    essence: '30초',
    serum: '30초',
    ampoule: '30초',
    cream: '30초',
    sunscreen: '30초',
    mask: '15분',
    eye_cream: '20초',
    oil: '30초',
    spot_treatment: '10초',
  };
  return durations[category] || '30초';
}

/**
 * 제품별 사용 팁 생성
 */
function generateProductTips(product: ShelfItem, category: ProductCategory): string[] {
  const baseTips: Record<ProductCategory, string[]> = {
    cleanser: ['미온수로 충분히 거품 내서 사용'],
    toner: ['화장솜 또는 손으로 패팅'],
    essence: ['손바닥에 덜어 가볍게 두드리기'],
    serum: ['소량씩 여러 번 덧바르기'],
    ampoule: ['가볍게 눌러주며 흡수'],
    cream: ['안쪽에서 바깥쪽으로 펴바르기'],
    sunscreen: ['2시간마다 덧바르기 권장'],
    mask: ['15-20분 후 제거, 남은 에센스 흡수'],
    eye_cream: ['약지로 가볍게 톡톡 두드리기'],
    oil: ['마지막 단계에서 수분 잠금'],
    spot_treatment: ['해당 부위에만 점 도포'],
  };

  const tips = [...(baseTips[category] || [])];

  // 호환성 점수 기반 추가 팁
  if (product.compatibilityScore && product.compatibilityScore >= 80) {
    tips.push('피부에 잘 맞는 제품이에요 ✨');
  }

  return tips;
}

/**
 * 필수 카테고리 목록
 */
function getEssentialCategories(timeOfDay: TimeOfDay): ProductCategory[] {
  if (timeOfDay === 'morning') {
    return ['cleanser', 'toner', 'cream', 'sunscreen'];
  }
  return ['cleanser', 'toner', 'cream'];
}

/**
 * 선택적 카테고리 여부
 */
function isOptionalCategory(category: ProductCategory, timeOfDay: TimeOfDay): boolean {
  const essentials = getEssentialCategories(timeOfDay);
  return !essentials.includes(category);
}

/**
 * 연동 노트 생성
 */
function generateSyncNote(
  productCount: number,
  missingCategories: ProductCategory[],
  conflictCount: number,
  skinType: SkinTypeId
): string {
  let note = `보유 중인 ${productCount}개 제품으로 루틴을 구성했어요. `;

  if (missingCategories.length > 0) {
    const categoryLabels: Record<ProductCategory, string> = {
      cleanser: '클렌저',
      toner: '토너',
      essence: '에센스',
      serum: '세럼',
      ampoule: '앰플',
      cream: '크림',
      sunscreen: '선크림',
      mask: '마스크',
      eye_cream: '아이크림',
      oil: '페이스오일',
      spot_treatment: '스팟 트리트먼트',
    };
    const missing = missingCategories.map((c) => categoryLabels[c]).join(', ');
    note += `${missing}이 부족해요. `;
  }

  if (conflictCount > 0) {
    note += `⚠️ 함께 사용 시 주의가 필요한 성분이 ${conflictCount}개 있어요.`;
  }

  return note;
}

/**
 * 제품함 업데이트 시 루틴 갱신 필요 여부 확인
 */
export function shouldRefreshRoutine(
  currentRoutine: RoutineStep[],
  shelfItems: ShelfItem[]
): boolean {
  // 제품함에 새 제품이 추가되었거나 삭제된 경우
  const routineProductIds = new Set(
    currentRoutine.filter((s) => s.shelfProductId).map((s) => s.shelfProductId)
  );
  const ownedProductIds = new Set(shelfItems.filter((i) => i.status === 'owned').map((i) => i.id));

  // 차이가 있으면 갱신 필요
  const added = [...ownedProductIds].filter((id) => !routineProductIds.has(id));
  const removed = [...routineProductIds].filter(
    (id): id is string => id !== undefined && !ownedProductIds.has(id)
  );

  return added.length > 0 || removed.length > 0;
}
