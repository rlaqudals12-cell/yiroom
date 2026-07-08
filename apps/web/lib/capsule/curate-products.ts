/**
 * 캡슐 큐레이션 → 실제 제품 연결
 *
 * @module lib/capsule/curate-products
 * @description
 *   도메인 엔진 curate()가 만든 아이템(행동형 스텝)에 cosmetic_products의
 *   실제 제품을 부착한다. daily 경로의 solution-products.ts 패턴을
 *   curate 경로(도메인별 캡슐)에 이식한 것 (2026-07-08 감사 수리).
 *
 *   원칙 (solution-products와 동일):
 *   - 전체 아이템에 대해 DB 쿼리 1회 (카테고리 일괄 조회 후 코드에서 선별)
 *   - 매칭 실패 아이템은 solutionProduct 미부여 — 행동형 스텝으로 정직 표기
 *     (brand ''·가짜 URL 금지, 지어내지 않는다)
 *   - 실패가 캡슐 생성을 깨면 안 됨 — 호출부에서 방어
 *   - fashion/personal-color/body는 화장품 테이블에 대응 제품이 없어 미연결
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { BeautyProfile } from '@/types/capsule';

/** 아이템에 부착되는 실제 제품 정보 */
export interface CurateSolutionProduct {
  id: string;
  name: string;
  brand: string;
  priceKrw?: number;
  imageUrl?: string;
  /** 실제 구매 링크 (DB에 있을 때만 — 가짜 URL 생성 금지) */
  purchaseUrl?: string;
}

/** 부착 대상 아이템의 최소 형상 (SkinProduct/MakeupProduct/HairProduct 교집합) */
export interface CurateTargetItem {
  id: string;
  name: string;
  category?: string;
  solutionProduct?: CurateSolutionProduct;
}

/** 아이템별 제품 검색 조건 */
interface ProductSpec {
  /** cosmetic_products.category 후보 */
  categories: string[];
  /** 세분류 후보 (일치만 허용) */
  subcategories?: string[];
  /** 색조 여부 — true면 personal_color_seasons 매칭 가산/필터 */
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
  purchase_url: string | null;
  rating: number | null;
  skin_types: string[] | null;
  personal_color_seasons: string[] | null;
  hair_types: string[] | null;
  scalp_types: string[] | null;
}

// 스킨 캡슐 카테고리 → DB 카테고리 (exfoliator는 대응 DB 카테고리 없어 미연결)
const SKIN_CATEGORY_TO_DB: Record<string, string[]> = {
  cleanser: ['cleanser'],
  toner: ['toner'],
  serum: ['serum'],
  moisturizer: ['moisturizer'],
  sunscreen: ['sunscreen'],
  mask: ['mask'],
  'eye-cream': ['eye_cream'],
};

// 메이크업 캡슐 카테고리 → makeup subcategory 후보
const MAKEUP_CATEGORY_TO_SUB: Record<string, string[]> = {
  base: ['cushion', 'foundation'],
  eye: ['eyeshadow', 'eye'],
  lip: ['lip', 'lip-gloss'],
  cheek: ['blush'],
  brow: ['brow'],
  setting: ['setting-spray', 'powder'],
};

// 헤어 캡슐 카테고리 → DB 카테고리 (styling은 제품 아닌 행동이라 미연결)
const HAIR_CATEGORY_TO_DB: Record<string, string[]> = {
  shampoo: ['shampoo'],
  conditioner: ['conditioner'],
  treatment: ['hair-treatment'],
  'scalp-care': ['scalp-care'],
  'hair-oil': ['hair-treatment'],
};

/** (domainId, category) → 검색 조건. 대응 없으면 null (연결 안 함) */
function specForItem(domainId: string, item: CurateTargetItem): ProductSpec | null {
  const category = item.category;
  if (!category) return null;

  switch (domainId) {
    case 'skin': {
      const dbCats = SKIN_CATEGORY_TO_DB[category];
      return dbCats ? { categories: dbCats } : null;
    }
    case 'makeup': {
      const subs = MAKEUP_CATEGORY_TO_SUB[category];
      // base/setting은 톤 매칭보다 피부 대응, 색조(eye/lip/cheek)는 시즌 매칭
      return subs
        ? {
            categories: ['makeup'],
            subcategories: subs,
            colorMatched: category !== 'base' && category !== 'setting',
          }
        : null;
    }
    case 'hair': {
      const dbCats = HAIR_CATEGORY_TO_DB[category];
      return dbCats ? { categories: dbCats } : null;
    }
    // fashion/personal-color/body — 화장품 테이블 대응 없음 (행동형 스텝 유지)
    default:
      return null;
  }
}

/** 프로필의 소문자 시즌 → DB 값(Capitalized) */
function toDbSeason(season: string | undefined): string | undefined {
  if (!season) return undefined;
  const s = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
  return ['Spring', 'Summer', 'Autumn', 'Winter'].includes(s) ? s : undefined;
}

/**
 * 큐레이션 아이템들에 실제 제품 부착 (in-place)
 *
 * 후보 풀을 카테고리 일괄 1쿼리로 가져온 뒤 아이템별로:
 * 프로필 적합(피부타입/시즌/모발) > 평점 > 가격 접근성 순으로 선별.
 * 아이템 간 중복 제품 방지. 매칭 실패 시 미부착(행동형 스텝 유지).
 */
export async function attachCurateProducts(
  domainId: string,
  items: CurateTargetItem[],
  profile: BeautyProfile
): Promise<void> {
  const specs = new Map<string, ProductSpec>();
  for (const item of items) {
    const spec = specForItem(domainId, item);
    if (spec) specs.set(item.id, spec);
  }
  if (specs.size === 0) return;

  const allCategories = [...new Set([...specs.values()].flatMap((s) => s.categories))];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('cosmetic_products')
    .select(
      'id, name, brand, category, subcategory, price_krw, image_url, purchase_url, rating, skin_types, personal_color_seasons, hair_types, scalp_types'
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
    const spec = specs.get(item.id);
    if (!spec) continue;

    let best: CandidateRow | null = null;
    let bestScore = -1;

    for (const row of candidates) {
      if (used.has(row.id)) continue;
      if (!spec.categories.includes(row.category)) continue;
      if (spec.subcategories && !spec.subcategories.includes(row.subcategory ?? '')) continue;

      // 색조인데 시즌 정보가 서로 있고 안 맞으면 제외 — 오매칭 방지
      const rowSeasons = row.personal_color_seasons ?? [];
      if (spec.colorMatched && season && rowSeasons.length > 0 && !rowSeasons.includes(season)) {
        continue;
      }

      // 적합도: 프로필 일치 가산 + 평점 + 가격 접근성 (solution-products와 동일 철학)
      let score = (row.rating ?? 0) * 10;
      if (row.price_krw != null) {
        if (row.price_krw <= 30000) score += 18;
        else if (row.price_krw <= 60000) score += 10;
        else if (row.price_krw > 150000) score -= 10;
      }
      if (skinType && domainId === 'skin' && row.skin_types?.includes(skinType)) score += 30;
      if (spec.colorMatched && season && rowSeasons.includes(season)) score += 30;
      if (domainId === 'hair') {
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
      // 시드 name이 브랜드를 이미 포함하는 경우 중복 제거
      const displayName = best.name.startsWith(best.brand)
        ? best.name.slice(best.brand.length).trim() || best.name
        : best.name;
      item.solutionProduct = {
        id: best.id,
        name: displayName,
        brand: best.brand,
        ...(best.price_krw != null ? { priceKrw: best.price_krw } : {}),
        ...(best.image_url ? { imageUrl: best.image_url } : {}),
        ...(best.purchase_url ? { purchaseUrl: best.purchase_url } : {}),
      };
    }
  }
}
