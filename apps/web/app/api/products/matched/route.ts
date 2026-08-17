/**
 * 분석 결과 기반 맞춤 제품 매칭 API
 *
 * AnalysisMatchedProducts 컴포넌트에서 호출
 * 사용자 프로필 + 분석 결과 → 매칭 점수 순 제품 반환
 *
 * @route GET /api/products/matched
 * @auth optional (비인증 시 기본 추천)
 *
 * 2026-07-07 재작성 (Phase 3-①): 기존 구현은 스키마에 없는 컬럼(price,
 * color_tones)을 select하고 존재하지 않는 카테고리(skincare/haircare)로
 * 필터해 데이터가 있어도 항상 빈 배열이었다. lib/products/matching.ts의
 * 정합 매칭 엔진(calculateMatchScore)으로 교체.
 *
 * 2026-08-17 (매칭 감사 A1·A2·A5·A6): 후보 풀이 전 사용자 동일한 id순 고정 90행이라
 * 시즌 태깅 제품(19%)이 풀에 아예 들어오지 못했다(겨울 쿨톤 = 매칭 0건). 프로필 조건부
 * 1차 패스를 추가하고, 퍼스널컬러 결과에는 색이 있는 색조만 노출한다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { calculateMatchScore, hasPersonalMatch, type UserProfile } from '@/lib/products/matching';
import { diversifyBySubcategory } from '@/lib/products';
import {
  mapSkinMetricsToConcerns,
  expandSkinConcernsToDbValues,
  PERSONAL_COLOR_MAKEUP_SUBCATEGORIES,
} from '@/lib/products/vocabulary';
import {
  toCosmeticProduct,
  type CosmeticProductRow,
  type PersonalColorSeason,
  type SkinType,
  type HairType,
  type ScalpType,
  type Undertone,
} from '@/types/product';

// 분석 타입 → 실제 스키마 카테고리 (20260213 CHECK 제약 기준)
const CATEGORY_MAP: Record<string, string[]> = {
  skin: ['cleanser', 'toner', 'serum', 'essence', 'moisturizer', 'eye_cream', 'sunscreen', 'mask'],
  hair: ['shampoo', 'conditioner', 'hair-treatment', 'scalp-care'],
  // 퍼스널컬러의 실행 레이어 = 색조 (시즌 태깅된 makeup)
  'personal-color': ['makeup'],
  makeup: ['makeup'],
};

/** 1차(프로필 조건부) 패스에서 가져올 최대 행 수 */
const PROFILE_PASS_LIMIT = 60;

/**
 * 쿼리 파라미터 검증.
 *
 * 예전에는 `Math.min(parseInt(limit), 12)`만 있어서 `limit=-1`이 그대로 통과했고,
 * 마지막 정렬 단계의 `slice(0, -1)`이 후보 풀 전체(최대 90행)를 뱉었다. `limit=abc`는
 * NaN이 되어 풀 조회 자체가 깨졌다. 상한(12)·하한(1)을 스키마로 강제한다.
 */
const querySchema = z.object({
  // 'body'는 CATEGORY_MAP에 없어 카테고리 필터 없이 전 품목 풀을 쓴다(체형 결과의 기존 동작 유지)
  analysisType: z.enum(['skin', 'hair', 'personal-color', 'makeup', 'body']).default('skin'),
  limit: z.coerce.number().int().min(1).max(12).default(4),
  personalColorSeason: z.string().nullish(),
  skinType: z.string().nullish(),
  skinConcerns: z.string().nullish(),
  hairType: z.string().nullish(),
  scalpType: z.string().nullish(),
  undertone: z.string().nullish(),
});

// URL 파라미터(lowercase) → DB 시즌 값(Capitalized)
function toSeason(value: string | null): PersonalColorSeason | undefined {
  if (!value) return undefined;
  const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return ['Spring', 'Summer', 'Autumn', 'Winter'].includes(normalized)
    ? (normalized as PersonalColorSeason)
    : undefined;
}

/** 1차 패스에 쓸 오버랩 축 (컬럼 + DB 실값 집합) */
interface ProfileAxis {
  column: string;
  values: string[];
}

/**
 * 활성 화장품 결정적 정렬 쿼리 (두 패스 공통 시작점).
 * 반환 타입은 supabase-js 빌더 제네릭이라 표기하지 않고 추론에 맡긴다.
 */
function baseQuery(supabase: ReturnType<typeof createServiceRoleClient>, max: number) {
  return supabase
    .from('cosmetic_products')
    .select('*')
    .eq('is_active', true)
    .order('review_count', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(max);
}

/**
 * 프로필 축이 실제로 태깅된 제품을 먼저 확보하기 위한 오버랩 조건을 고른다.
 *
 * 배경(2026-08 매칭 감사): 후보 풀이 id순 고정 90행이라 시즌 태깅 제품(makeup 2,444 중 329건,
 * 겨울은 55건)이 풀에 한 건도 들어오지 못했다. 그 결과 겨울 쿨톤 사용자에게 봄 웜 살몬 틴트가
 * "가성비 좋음" 근거로 1등이 됐다. 태깅된 제품을 강제로 풀에 넣어야 매칭이 성립한다.
 *
 * @returns 적용할 축이 없으면 null (그러면 기존 폴백 풀만 사용)
 */
function resolveProfileAxis(analysisType: string, profile: UserProfile): ProfileAxis | null {
  // 색조: 시즌 태깅 오버랩
  if (
    (analysisType === 'personal-color' || analysisType === 'makeup') &&
    profile.personalColorSeason
  ) {
    return { column: 'personal_color_seasons', values: [profile.personalColorSeason] };
  }

  // 스킨케어: 고민 태깅 오버랩 우선, 없으면 피부 타입
  if (analysisType === 'skin') {
    const dbConcerns = expandSkinConcernsToDbValues(profile.skinConcerns ?? []);
    if (dbConcerns.length > 0) {
      return { column: 'concerns', values: dbConcerns };
    }
    if (profile.skinType) {
      return { column: 'skin_types', values: [profile.skinType] };
    }
  }

  // 헤어는 재고 자체가 26건이라 폴백 풀(90행)이 전량을 이미 담는다 → 별도 패스 불필요.
  return null;
}

/** 후보 풀 조회 옵션 */
interface CandidatePoolOptions {
  categories?: string[];
  subcategories?: readonly string[];
  poolLimit: number;
  axis: ProfileAxis | null;
}

/**
 * 후보 풀 조회 — 프로필 1차 패스 + 기존 폴백 패스를 병렬로 돌려 병합한다.
 *
 * ⚠️ rating은 화장품 전 품목이 사실상 null이라 정렬축으로 쓰면 동률이 물리적(삽입) 순서로
 * 붕괴 → personal-color 풀이 100% 립으로 collapse했다(실측). review_count(실재 컬럼)로 정렬하고
 * id 보조정렬을 두어 결정적인 풀을 뽑는다.
 * (review_count도 현재 전건 0/null이라 사실상 id순 — 그래서 프로필 1차 패스가 필요하다.)
 *
 * @returns 폴백 조회가 실패하면 null (호출부가 빈 결과로 응답)
 */
async function fetchCandidatePool(
  supabase: ReturnType<typeof createServiceRoleClient>,
  { categories, subcategories, poolLimit, axis }: CandidatePoolOptions
): Promise<CosmeticProductRow[] | null> {
  const build = (max: number): ReturnType<typeof baseQuery> => {
    let q = baseQuery(supabase, max);
    if (categories) q = q.in('category', categories);
    if (subcategories) q = q.in('subcategory', subcategories as string[]);
    return q;
  };

  const fallbackQuery = build(poolLimit);
  const profileQuery = axis ? build(PROFILE_PASS_LIMIT).overlaps(axis.column, axis.values) : null;

  // 두 패스는 서로 독립이라 병렬 실행(왕복 1회분 지연이 추가되지 않도록)
  const [profileResult, fallbackResult] = await Promise.all([profileQuery, fallbackQuery]);

  if (fallbackResult.error || !fallbackResult.data) {
    console.error('[Products/Matched] query error:', fallbackResult.error?.message);
    return null;
  }
  if (profileResult?.error) {
    // 1차 패스 실패는 치명적이지 않다 — 폴백 풀로 계속 진행하고 로그만 남긴다
    console.error('[Products/Matched] profile pass error:', profileResult.error.message);
  }

  // 프로필 태깅분을 앞에 두고 폴백 풀을 병합(id 중복 제거)
  const merged = new Map<string, CosmeticProductRow>();
  for (const row of [
    ...((profileResult?.data ?? []) as CosmeticProductRow[]),
    ...(fallbackResult.data as CosmeticProductRow[]),
  ]) {
    if (!merged.has(row.id)) merged.set(row.id, row);
  }
  return [...merged.values()];
}

/** 표준 실패 봉투 (성공 응답 형상은 기존 소비자 호환을 위해 그대로 둔다) */
function errorResponse(
  status: number,
  code: string,
  message: string,
  userMessage: string
): NextResponse {
  return NextResponse.json({ success: false, error: { code, message, userMessage } }, { status });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsedQuery.success) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        parsedQuery.error.issues[0]?.message ?? 'Invalid query',
        '요청 정보를 확인해주세요.'
      );
    }

    const { analysisType, limit } = parsedQuery.data;

    const profile: UserProfile = {
      personalColorSeason: toSeason(parsedQuery.data.personalColorSeason ?? null),
      skinType: (parsedQuery.data.skinType as SkinType | undefined) ?? undefined,
      // 결과 지표 id(pores/wrinkles/…)와 정본 SkinConcern 어휘가 달라 교집합이 hydration 하나로
      // 붕괴했던 지점 — 어휘 브리지로 정본화(멱등이라 이미 정본 값이 와도 안전).
      skinConcerns: mapSkinMetricsToConcerns(
        parsedQuery.data.skinConcerns?.split(',').filter(Boolean) ?? []
      ),
      hairType: (parsedQuery.data.hairType as HairType | undefined) ?? undefined,
      scalpType: (parsedQuery.data.scalpType as ScalpType | undefined) ?? undefined,
      undertone: (parsedQuery.data.undertone as Undertone | undefined) ?? undefined,
    };

    const supabase = createServiceRoleClient();
    const categories = CATEGORY_MAP[analysisType];

    // 퍼스널컬러 = "내게 어울리는 색"의 축 → 색 선택이 시즌과 무관하거나 무채인 세분류
    // (프라이머·세팅스프레이·마스카라·브로우·파우더·브러시)는 이 결과에 노출하지 않는다.
    const subcategories: readonly string[] | undefined =
      analysisType === 'personal-color' ? PERSONAL_COLOR_MAKEUP_SUBCATEGORIES : undefined;

    const rows = await fetchCandidatePool(supabase, {
      categories,
      subcategories,
      poolLimit: Math.max(limit * 15, 90),
      axis: resolveProfileAxis(analysisType, profile),
    });

    // 조회 실패를 "매칭 0건"으로 위장하지 않는다 — 빈 결과와 장애는 다른 사실이다
    if (!rows) {
      return errorResponse(
        500,
        'DB_ERROR',
        'candidate pool query failed',
        '제품을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
      );
    }

    const scored = rows
      .map((row) => {
        const product = toCosmeticProduct(row);
        const result = calculateMatchScore(product, profile);
        return {
          product,
          matchScore: result.score,
          matchReasons: result.reasons.filter((r) => r.matched).map((r) => r.label),
          // 개인 축 근거가 하나도 없으면 UI가 "나와의 적합도 N점"을 주장하지 않는다(정직)
          personalMatched: hasPersonalMatch(result.reasons),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    // 메이크업(퍼스널컬러 실행 레이어)은 색조 세분류가 립으로 쏠려 BEST가 립으로 도배되는
    // 문제가 있어 최종 노출을 subcategory당 최대 절반으로 제한(다양성 확보). 스킨케어/헤어는
    // 세분류(category)가 이미 다양해 기존 점수순 상위 노출을 유지한다(불필요한 재정렬 회피).
    const isMakeup = categories?.length === 1 && categories[0] === 'makeup';
    const matched = isMakeup
      ? diversifyBySubcategory(
          scored,
          limit,
          (m) => m.product.subcategory ?? m.product.category ?? 'etc'
        )
      : scored.slice(0, limit);

    return NextResponse.json({
      success: true,
      products: matched,
      analysisType,
      totalMatched: matched.length,
    });
  } catch (error) {
    console.error('[Products/Matched] Error:', error);
    return errorResponse(
      500,
      'UNKNOWN_ERROR',
      'Internal server error',
      '제품을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
    );
  }
}
