/**
 * 통합 큐레이션용 실제 제품 매처 (Server 전용)
 *
 * @module lib/analysis/integrated/internal/product-matcher
 * @description
 *   통합 분석 결과(피부/PC/톤 + 성별)로 cosmetic_products에서 상위 3개 실제 제품을 매칭.
 *   "링크로 보내기" 대신 결과 안에서 지갑이 열리는 "너를 위한 이 3개"를 만든다.
 *   DB 데이터가 없으면 빈 배열 → 결과 페이지는 기존 링크 카드로 폴백.
 *
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1 체크리스트 #5
 * @internal — 외부 import 금지 (result page 전용)
 */

import { getCosmeticProducts, addMatchInfoToProducts } from '@/lib/products';
import type { UserProfile } from '@/lib/products';
import type { CosmeticProduct, SkinType, PersonalColorSeason, Undertone } from '@/types/product';
import type { RecommendationGender } from '../types';

/** 결과 카드에 인라인으로 노출할 실제 제품 (지갑 여는 3개) */
export interface CurationProduct {
  id: string;
  name: string;
  brand: string;
  /** 원(₩). null이면 가격 미표시 */
  priceKrw: number | null;
  /** 왜 어울리는지 한 줄 */
  reason: string;
  /** 매칭 점수(0-100) */
  matchScore: number;
  imageUrl: string | null;
}

export interface FetchCurationProductsInput {
  /** 피부 타입 원시값 (dry/oily/combination/normal/sensitive 등) */
  skinType?: string;
  /** PC 시즌 소문자 (spring/summer/autumn/winter) */
  personalColorSeason?: string;
  /** 언더톤 (warm/cool/neutral) */
  undertone?: string;
  /** 성별 (male이면 메이크업 제외, 스킨케어만) */
  gender: RecommendationGender;
  /** 최대 개수 (기본 3) */
  limit?: number;
}

// 스킨케어 계열 카테고리 (성별 무관 = 지갑 여는 안전한 기본 세트)
const SKINCARE_CATEGORIES = new Set([
  'cleanser',
  'toner',
  'serum',
  'essence',
  'moisturizer',
  'eye_cream',
  'sunscreen',
  'mask',
  'lip_care',
  'body_care',
]);

const SKIN_TYPE_VALUES: SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];

function normalizeSkinType(raw?: string): SkinType | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  return SKIN_TYPE_VALUES.find((t) => lower.includes(t));
}

function normalizeSeason(raw?: string): PersonalColorSeason | undefined {
  if (!raw) return undefined;
  const map: Record<string, PersonalColorSeason> = {
    spring: 'Spring',
    summer: 'Summer',
    autumn: 'Autumn',
    fall: 'Autumn',
    winter: 'Winter',
  };
  return map[raw.toLowerCase()];
}

function normalizeUndertone(raw?: string): Undertone | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower === 'warm' || lower === 'cool' || lower === 'neutral') return lower;
  return undefined;
}

/** 매칭 이유 한 줄 도출 — 매칭된 첫 사유 라벨, 없으면 피부/톤 기반 기본 */
function buildReason(reasons: { label: string; matched: boolean }[], skinType?: SkinType): string {
  const matched = reasons.find((r) => r.matched);
  if (matched) return `${matched.label} — 내 프로필에 잘 맞아요`;
  if (skinType) return '내 피부 타입에 무난하게 어울려요';
  return '리뷰가 많은 인기 제품이에요';
}

/**
 * 통합 프로필로 상위 N개 실제 화장품을 매칭.
 * 실패/데이터 없음이면 빈 배열 (결과 페이지가 링크 카드로 폴백).
 */
export async function fetchCurationProducts(
  input: FetchCurationProductsInput
): Promise<CurationProduct[]> {
  const limit = input.limit ?? 3;
  const skinType = normalizeSkinType(input.skinType);
  const profile: UserProfile = {
    skinType,
    personalColorSeason: normalizeSeason(input.personalColorSeason),
    undertone: normalizeUndertone(input.undertone),
  };

  try {
    // 1. 후보 풀: 피부 타입 매칭 우선, 부족하면 인기순 보강
    let pool: CosmeticProduct[] = skinType
      ? await getCosmeticProducts({ skinTypes: [skinType] }, 40)
      : [];
    if (pool.length < limit) {
      const extra = await getCosmeticProducts(undefined, 40);
      const seen = new Set(pool.map((p) => p.id));
      pool = [...pool, ...extra.filter((p) => !seen.has(p.id))];
    }

    // 2. 카테고리 필터: 스킨케어는 항상, 메이크업은 남성 제외
    const eligible = pool.filter(
      (p) =>
        SKINCARE_CATEGORIES.has(p.category) || (p.category === 'makeup' && input.gender !== 'male')
    );

    if (eligible.length === 0) return [];

    // 3. 매칭 점수 정렬 후 상위 N개
    const matched = addMatchInfoToProducts(eligible, profile).slice(0, limit);

    return matched.map((m) => ({
      id: m.product.id,
      name: m.product.name,
      brand: m.product.brand,
      priceKrw: m.product.priceKrw ?? null,
      reason: buildReason(m.matchReasons, skinType),
      matchScore: m.matchScore,
      imageUrl: m.product.imageUrl ?? null,
    }));
  } catch (error) {
    // 왜: 제품 매칭 실패가 결과 페이지 전체를 깨면 안 됨 — 링크 카드 폴백
    console.error('[ProductMatcher] fetchCurationProducts failed:', error);
    return [];
  }
}
