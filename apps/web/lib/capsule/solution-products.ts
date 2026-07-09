/**
 * 데일리 캡슐 솔루션 → 실제 제품 연결
 *
 * @module lib/capsule/solution-products
 * @description
 *   DailyItem의 (moduleCode, category)를 cosmetic_products 쿼리 조건으로 변환해
 *   프로필 기준 최고 매칭 제품 1개를 아이템에 붙인다 (Phase 3 실물 연결).
 *   "토너를 바르세요"가 아니라 "이 토너를 바르세요"가 되기 위한 배선.
 *
 *   원칙:
 *   - 전체 아이템에 대해 DB 쿼리 1회 (카테고리 일괄 조회 후 코드에서 선별)
 *   - 매칭 실패 아이템은 solutionProduct 미부여 — 지어내지 않는다
 *   - 실패가 캡슐 생성을 깨면 안 됨 — 호출부에서 방어
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getShelfItems, type ShelfItem } from '@/lib/scan/product-shelf';
import { detectProductCategory } from '@/lib/skincare';
import type { DailyItem, DailySolutionProduct, BeautyProfile } from '@/types/capsule';

/** 아이템별 제품 검색 조건 */
interface ProductSpec {
  /** cosmetic_products.category 후보 */
  categories: string[];
  /** 세분류 후보 (일치만 허용) */
  subcategories?: string[];
  /** 제외 세분류 (예: 아침 세안 스텝에 클렌징 오일 방지) */
  excludeSubcategories?: string[];
  /** 색조 여부 — true면 personal_color_seasons 매칭 가산 */
  colorMatched?: boolean;
}

/** 선별에 필요한 최소 컬럼 */
interface CandidateRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  price_krw: number | null;
  image_url: string | null;
  rating: number | null;
  skin_types: string[] | null;
  personal_color_seasons: string[] | null;
  hair_types: string[] | null;
  scalp_types: string[] | null;
}

// 스킨케어 루틴 스텝 카테고리 → DB 카테고리 (lib/skincare ProductCategory 기준)
// oil/spot_treatment은 대응 DB 카테고리가 없어 미연결 (지어내지 않음)
const SKIN_STEP_TO_DB: Record<string, string[]> = {
  cleanser: ['cleanser'],
  toner: ['toner'],
  essence: ['essence'],
  serum: ['serum'],
  ampoule: ['serum'],
  mask: ['mask'],
  eye_cream: ['eye_cream'],
  cream: ['moisturizer'],
  sunscreen: ['sunscreen'],
};

// 메이크업 캡슐 카테고리 → makeup subcategory 후보
const MAKEUP_TO_SUB: Record<string, string[]> = {
  base: ['cushion', 'foundation'],
  eye: ['eyeshadow', 'eye'],
  lip: ['lip', 'lip-gloss'],
  cheek: ['blush'],
  brow: ['brow'],
  setting: ['setting-spray', 'powder'],
};

// 헤어 캡슐 카테고리 → DB 카테고리 (styling은 제품 아닌 행동이라 미연결)
const HAIR_TO_DB: Record<string, string[]> = {
  shampoo: ['shampoo'],
  conditioner: ['conditioner'],
  treatment: ['hair-treatment'],
  'scalp-care': ['scalp-care'],
  'hair-oil': ['hair-treatment'],
};

/** (moduleCode, category) → 검색 조건. 대응 없으면 null (연결 안 함) */
function specForItem(item: DailyItem): ProductSpec | null {
  const category = item.category;
  if (!category) return null;

  switch (item.moduleCode) {
    case 'S': {
      const dbCats = SKIN_STEP_TO_DB[category];
      if (!dbCats) return null;
      // 더블클렌징 스텝은 서브타입까지 일치해야 함 — "오일 클렌저" 스텝에
      // 미셀라 워터가 붙으면 틀린 추천이다 (없으면 미부착이 정직).
      if (category === 'cleanser') {
        if (item.name.includes('오일')) {
          return { categories: dbCats, subcategories: ['oil', 'cleansing-oil', 'cleansing-balm'] };
        }
        if (item.name.includes('폼')) {
          return { categories: dbCats, subcategories: ['foam', 'gel', 'gentle'] };
        }
        // 일반 "클렌저"(아침 세안)에 클렌징 오일/밤이 붙지 않도록
        return {
          categories: dbCats,
          excludeSubcategories: ['oil', 'cleansing-oil', 'cleansing-balm'],
        };
      }
      return { categories: dbCats };
    }
    case 'M': {
      const subs = MAKEUP_TO_SUB[category];
      // base는 톤 매칭보다 피부 대응, 색조(eye/lip/cheek)는 시즌 매칭
      return subs
        ? {
            categories: ['makeup'],
            subcategories: subs,
            colorMatched: category !== 'base' && category !== 'setting',
          }
        : null;
    }
    case 'H': {
      const dbCats = HAIR_TO_DB[category];
      return dbCats ? { categories: dbCats } : null;
    }
    // Fashion/C(체형)는 화장품 테이블에 대응 제품이 없음
    default:
      return null;
  }
}

/** URL 파라미터/프로필의 소문자 시즌 → DB 값(Capitalized) */
function toDbSeason(season: string | undefined): string | undefined {
  if (!season) return undefined;
  const s = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
  return ['Spring', 'Summer', 'Autumn', 'Winter'].includes(s) ? s : undefined;
}

/** 스킨 스텝 카테고리 정규화 — 앰플=세럼 슬롯 (감지 카테고리 정합) */
function normalizeSkinCategory(category: string): string {
  return category === 'ampoule' ? 'serum' : category;
}

/**
 * 내 제품함(owned)을 감지 카테고리별로 그룹핑 (ADR-117 shelf-우선).
 * detectProductCategory는 스킨케어 카테고리만 감지 → 실질적으로 S 모듈에 적용.
 * unknown 카테고리는 제외(지어내지 않음). 조회 실패 시 빈 맵 → 카탈로그 폴백.
 */
async function loadShelfByCategory(userId: string): Promise<Map<string, ShelfItem[]>> {
  const map = new Map<string, ShelfItem[]>();
  try {
    const supabase = createServiceRoleClient();
    const { items } = await getShelfItems(supabase, userId, { status: 'owned', limit: 200 });
    for (const item of items) {
      const detected = detectProductCategory(item);
      if (!detected) continue;
      const key = normalizeSkinCategory(detected);
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }
  } catch (e) {
    console.error('[SolutionProducts] 제품함 조회 실패 (카탈로그 폴백):', e);
    return new Map();
  }
  return map;
}

/**
 * shelf-우선 배치 (in-place) — 내 보유 제품을 스킨 스텝에 먼저 붙인다 (ADR-117).
 * detectProductCategory가 스킨케어 카테고리만 감지하므로 S 모듈에 한정. 중복 배치 방지.
 */
async function attachShelfProducts(items: DailyItem[], userId: string): Promise<void> {
  const hasSkinSteps = items.some((i) => i.moduleCode === 'S' && i.category);
  if (!hasSkinSteps) return;

  const shelfByCategory = await loadShelfByCategory(userId);
  if (shelfByCategory.size === 0) return;

  const usedShelf = new Set<string>();
  for (const item of items) {
    if (item.moduleCode !== 'S' || !item.category) continue;
    const candidates = shelfByCategory.get(normalizeSkinCategory(item.category));
    const pick = candidates?.find((c) => !usedShelf.has(c.id));
    if (!pick) continue;
    usedShelf.add(pick.id);
    item.solutionProduct = {
      id: pick.id,
      name: pick.productName,
      brand: pick.productBrand ?? '',
      ...(pick.productImageUrl ? { imageUrl: pick.productImageUrl } : {}),
      source: 'shelf',
      shelfItemId: pick.id,
    };
  }
}

/**
 * 데일리 아이템들에 실제 제품 부착 (in-place)
 *
 * shelf-우선 (ADR-117): 내 제품함에 스텝 카테고리와 맞는 보유 제품이 있으면 그것을 배치
 * (`source:'shelf'`). 없으면 카탈로그 후보 풀에서 프로필 적합(피부타입/시즌/모발) > 평점 순
 * 선별(`source:'catalog'` = 빈 슬롯 구매 연결). 아이템 간 중복 제품 방지.
 */
export async function attachSolutionProducts(
  items: DailyItem[],
  profile: BeautyProfile
): Promise<void> {
  // 0단계: shelf-우선 — 내 보유 제품을 먼저 배치 (그 위에 카탈로그로 빈 슬롯 채움)
  await attachShelfProducts(items, profile.userId);

  const specs = new Map<string, ProductSpec>();
  for (const item of items) {
    if (item.solutionProduct) continue; // 이미 내 제품 배치됨 — 카탈로그 스킵
    const spec = specForItem(item);
    if (spec) specs.set(item.id, spec);
  }
  if (specs.size === 0) return;

  const allCategories = [...new Set([...specs.values()].flatMap((s) => s.categories))];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('cosmetic_products')
    .select(
      'id, name, brand, category, subcategory, price_krw, image_url, rating, skin_types, personal_color_seasons, hair_types, scalp_types'
    )
    .eq('is_active', true)
    .in('category', allCategories)
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(300);

  if (error || !data?.length) return;
  const candidates = data as CandidateRow[];

  const skinType = profile.skin?.type;
  const season = toDbSeason(profile.personalColor?.season);
  const hairType = profile.hair?.type;
  const scalpType = profile.hair?.scalp;
  const used = new Set<string>();

  for (const item of items) {
    if (item.solutionProduct) continue; // shelf 배치된 아이템은 카탈로그 대상 아님
    const spec = specs.get(item.id);
    if (!spec) continue;

    let best: CandidateRow | null = null;
    let bestScore = -1;

    for (const row of candidates) {
      if (used.has(row.id)) continue;
      if (!spec.categories.includes(row.category)) continue;
      if (spec.subcategories && !spec.subcategories.includes(row.subcategory ?? '')) continue;
      if (spec.excludeSubcategories?.includes(row.subcategory ?? '')) continue;

      // 색조인데 시즌 정보가 서로 있고 안 맞으면 제외 — 오매칭 방지
      const rowSeasons = row.personal_color_seasons ?? [];
      if (spec.colorMatched && season && rowSeasons.length > 0 && !rowSeasons.includes(season)) {
        continue;
      }

      // 적합도: 프로필 일치 가산 + 평점 + 가격 접근성
      let score = (row.rating ?? 0) * 10;
      // 가격 접근성 — 타겟(10-30대) 데일리 실행 맥락에서 58만원 크림이 기본
      // 추천이 되지 않도록. lib/products/matching.ts 대중성 보너스와 같은 철학.
      if (row.price_krw != null) {
        if (row.price_krw <= 30000) score += 18;
        else if (row.price_krw <= 60000) score += 10;
        else if (row.price_krw > 150000) score -= 10;
      }
      if (skinType && item.moduleCode === 'S' && row.skin_types?.includes(skinType)) score += 30;
      if (spec.colorMatched && season && rowSeasons.includes(season)) score += 30;
      if (item.moduleCode === 'H') {
        if (hairType && row.hair_types?.includes(hairType)) score += 15;
        if (scalpType && row.scalp_types?.includes(scalpType)) score += 15;
      }

      if (score > bestScore) {
        bestScore = score;
        best = row;
      }
    }

    if (best) {
      used.add(best.id);
      // 시드 name이 브랜드를 이미 포함("바이오더마 센시비오…")하는 경우 중복 제거
      const displayName = best.name.startsWith(best.brand)
        ? best.name.slice(best.brand.length).trim() || best.name
        : best.name;
      const product: DailySolutionProduct = {
        id: best.id,
        name: displayName,
        brand: best.brand,
        ...(best.price_krw != null ? { priceKrw: best.price_krw } : {}),
        ...(best.image_url ? { imageUrl: best.image_url } : {}),
        source: 'catalog',
      };
      item.solutionProduct = product;
    }
  }
}
