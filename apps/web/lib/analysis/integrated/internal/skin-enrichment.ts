/**
 * 통합 분석 skin 저장 풍부화 (ADR-109 무손실 — Phase 2C)
 *
 * 통합(5축) 플로우의 피부 저장을 단독 skin 분석과 동일한 깊이로 채운다.
 * 단독 라우트(app/api/analyze/skin/route.ts)가 `skin_analyses`에 넣는 필드들
 * (성분경고·루틴·추천성분·insight·파운데이션)은 대부분 **skinType + 지표에서
 * 결정론적으로 파생**되므로 동일 헬퍼로 재현한다 (AI 재호출 불필요, V1 라우트 미변경).
 *
 * problem_areas는 결과 페이지가 DB 부재 시 Mock으로 graceful fallback하므로
 * 여기서 일반 Mock을 "분석된 것처럼" 저장하지 않는다(정직성).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { getWarningIngredientsForSkinType, type SkinType } from '@/lib/ingredients';
import { generateProductRecommendations, formatProductsForDB } from '@/lib/product-recommendations';
import { INGREDIENT_POOL } from '@/lib/mock/skin-analysis';

const VALID_SKIN_TYPES: SkinType[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];

// PC 시즌 기반 파운데이션 기본 추천 (단독 라우트와 동일)
const SEASON_FOUNDATION_MAP: Record<string, string> = {
  Spring: '웜톤 베이지 계열 (피치 베이지, 골드 베이지)',
  Summer: '쿨톤 베이지 계열 (핑크 베이지, 로즈 베이지)',
  Autumn: '웜톤 베이지 계열 (옐로우 베이지, 카멜 베이지)',
  Winter: '쿨톤 베이지 계열 (뉴트럴 베이지, 아이보리)',
};

export interface SkinMetricsForEnrichment {
  hydration: number;
  oil_level: number;
  pores: number;
  pigmentation: number;
  wrinkles: number;
  sensitivity: number;
}

export interface SkinEnrichment {
  products: Record<string, string[]>;
  ingredient_warnings: Array<{
    ingredient: string;
    ingredientEn: string | null;
    level: 'high' | 'medium' | 'low';
    ewgGrade: number | null;
    reason: string;
    alternatives: string[] | null;
    category: string | null;
  }>;
  personal_color_season: string | null;
  foundation_recommendation: string | null;
  /** skin_analyses.recommendations JSONB에 병합할 추가 필드 */
  recommendationExtras: {
    insight: string;
    ingredients: Array<{ name: string; reason: string }>;
    morning_routine: string[];
    evening_routine: string[];
    weekly_care: string[];
    lifestyle_tips: string[];
  };
}

function normalizeSkinType(skinType: string): SkinType {
  const lower = skinType?.toLowerCase();
  return VALID_SKIN_TYPES.includes(lower as SkinType) ? (lower as SkinType) : 'normal';
}

// 피부 타입별 warning 레벨 (단독 라우트와 동일 로직)
function warningLevel(
  ing: Awaited<ReturnType<typeof getWarningIngredientsForSkinType>>[number],
  type: SkinType
): 'high' | 'medium' | 'low' {
  let value: number;
  switch (type) {
    case 'sensitive':
      value = ing.warning_sensitive;
      break;
    case 'dry':
      value = ing.warning_dry;
      break;
    case 'oily':
      value = ing.warning_oily;
      break;
    case 'combination':
      value = ing.warning_combination;
      break;
    default:
      value = Math.round(
        (ing.warning_sensitive + ing.warning_dry + ing.warning_oily + ing.warning_combination) / 4
      );
  }
  if (value >= 4) return 'high';
  if (value >= 3) return 'medium';
  return 'low';
}

/**
 * 통합 피부 저장 풍부화 필드 생성.
 * 어떤 단계가 실패해도(성분 DB 부재 등) 전체가 죽지 않도록 방어적으로 처리 —
 * 통합 저장은 이미 기본 지표를 넣었으므로 풍부화는 "있으면 좋은" 보강.
 */
export async function buildSkinEnrichment(
  supabase: SupabaseClient,
  clerkUserId: string,
  skinType: string,
  metrics: SkinMetricsForEnrichment,
  primaryConcerns: string[]
): Promise<SkinEnrichment> {
  const st = normalizeSkinType(skinType);

  // 1. 최신 퍼스널컬러 → 시즌 + 파운데이션 (단독 라우트와 동일)
  let personalColorSeason: string | null = null;
  let foundationRecommendation: string | null = null;
  try {
    const { data: pcData } = await supabase
      .from('personal_color_assessments')
      .select('season, makeup_recommendations')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    personalColorSeason = pcData?.season ?? null;
    if (pcData?.makeup_recommendations?.foundation) {
      foundationRecommendation = pcData.makeup_recommendations.foundation;
    } else if (personalColorSeason) {
      foundationRecommendation = SEASON_FOUNDATION_MAP[personalColorSeason] ?? null;
    }
  } catch {
    // PC 없음 — 시즌/파운데이션 없이 진행
  }

  // 2. 성분 경고 (피부 타입별 주의 성분)
  let ingredientWarnings: SkinEnrichment['ingredient_warnings'] = [];
  try {
    const warningIngredients = await getWarningIngredientsForSkinType(st);
    ingredientWarnings = warningIngredients.map((ing) => ({
      ingredient: ing.name_ko,
      ingredientEn: ing.name_en ?? null,
      level: warningLevel(ing, st),
      ewgGrade: ing.ewg_grade ?? null,
      reason: ing.side_effects || '주의가 필요한 성분입니다.',
      alternatives: ing.alternatives ?? null,
      category: ing.category ?? null,
    }));
  } catch {
    // 성분 DB 부재 — 경고 없이 진행
  }

  // 3. 제품 추천 + 루틴 (skinType + 지표 결정론적 파생)
  const productRecommendations = generateProductRecommendations(
    st,
    {
      hydration: metrics.hydration,
      oil_level: metrics.oil_level,
      pores: metrics.pores,
      pigmentation: metrics.pigmentation,
      wrinkles: metrics.wrinkles,
      sensitivity: metrics.sensitivity,
    },
    personalColorSeason
  );
  const products = formatProductsForDB(productRecommendations);

  // 4. insight + 추천 성분 (주요 고민 기반, 결정론적)
  const insight =
    primaryConcerns.length > 0
      ? `주요 고민은 ${primaryConcerns.slice(0, 3).join(', ')}이에요. 맞춤 루틴으로 꾸준히 관리해보세요.`
      : '피부 상태에 맞춘 루틴으로 관리해보세요.';
  const ingredients = INGREDIENT_POOL.slice(0, 3);

  return {
    products,
    ingredient_warnings: ingredientWarnings,
    personal_color_season: personalColorSeason,
    foundation_recommendation: foundationRecommendation,
    recommendationExtras: {
      insight,
      ingredients,
      morning_routine: [productRecommendations.skincareRoutine.morning],
      evening_routine: [productRecommendations.skincareRoutine.evening],
      weekly_care: productRecommendations.careTips.weeklyCare,
      lifestyle_tips: productRecommendations.careTips.lifestyleTips,
    },
  };
}
