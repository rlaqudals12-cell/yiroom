/**
 * 스캔 판정 조립 (ADR-112) — 온디바이스 버전
 *
 * @module lib/scan/verdict
 * @description
 *   웹은 `/api/scan/analyze` 라우트가 4레이어를 조립하지만, 모바일 스캔은 온디바이스
 *   흐름이므로 동일 조립을 클라이언트에서 수행한다(새 AI 호출 없음, 규칙/DB 조회만).
 *
 *   레이어:
 *   - L1 규제 사실   : cosmetic_ingredients DB 조인 (supabase 필요, 실패해도 판정 진행)
 *   - L2 개인 적합도 : analyzeCompatibility(내 피부 프로필과 성분 매칭)
 *   - L3 궁합        : 성분 상호작용(analyzeCompatibility 내부)
 *   - L4 효과 타임라인: matchTimelines(문헌 인용형, 순수 함수)
 *
 *   정직성: 피부 프로필이 없으면 점수를 지어내지 않는다 — analyzeCompatibility가
 *   hasUserAnalysis.skinAnalysis=false를 반환하고, UI가 이를 CTA로 게이팅한다.
 *
 * @see docs/adr/ADR-112-product-fit-scan.md
 * @see apps/web/app/api/scan/analyze/route.ts (웹 정본)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { ProductIngredient } from '@/types/scan';

import {
  analyzeCompatibility,
  type CompatibilityResult,
  type UserAnalysisData,
} from './compatibility';
import {
  matchIngredientsToDb,
  buildRegulatoryFlags,
  type RegulatoryFlag,
} from './ingredient-db-match';
import { matchTimelines, type IngredientTimeline } from './ingredient-timeline';
import type { SkinType } from './skin-ingredient-match';

/** 판정 데이터 = 호환성 결과 + 규제 사실(L1) + 효과 타임라인(L4) */
export type ScanVerdictData = CompatibilityResult & {
  regulatory: RegulatoryFlag[];
  timelines: IngredientTimeline[];
};

export interface BuildScanVerdictParams {
  /** 분석 대상 성분 목록 (OCR/DB 조회 결과) */
  ingredients: ProductIngredient[];
  /** 제품 카테고리 (색조 매칭용, 기본 skincare) */
  category?: string;
  /** 제품 색상 (색조 제품 컬러 매칭용) */
  color?: string;
  /** 미리 조회한 사용자 프로필 (없으면 빈 객체 → 프로필 없음 판정) */
  userAnalysis?: UserAnalysisData;
  /** L1 규제 DB 조인용 (없으면 규제 레이어 생략) */
  supabase?: SupabaseClient | null;
}

/** 성분 매칭용 이름(INCI + 국문 모두)을 뽑는다 — 커버리지 확보 */
function namesForMatch(ingredients: ProductIngredient[]): string[] {
  return ingredients.flatMap((i) => [i.inciName, i.nameKo].filter((v): v is string => Boolean(v)));
}

/**
 * 스캔 판정 4레이어 조립.
 * - L4 타임라인: 순수 함수(항상 실행)
 * - L1 규제: supabase 있을 때만, 실패해도 판정 진행
 * - L2/L3: analyzeCompatibility (프로필 없으면 hasUserAnalysis=false → UI가 CTA 게이팅)
 */
export async function buildScanVerdict(params: BuildScanVerdictParams): Promise<ScanVerdictData> {
  const { ingredients, category, color, userAnalysis, supabase } = params;
  const names = namesForMatch(ingredients);

  // L4 효과 타임라인 — 순수 함수(프로필/네트워크 무관, 결정론)
  const timelines = matchTimelines(names);

  // L1 규제 사실 — 성분 DB 조인 (실패해도 판정은 진행)
  let regulatory: RegulatoryFlag[] = [];
  if (supabase) {
    try {
      const matches = await matchIngredientsToDb(names, supabase);
      regulatory = buildRegulatoryFlags(matches);
    } catch (e) {
      console.error('[scan/verdict] 규제 정보 매칭 실패:', e);
    }
  }

  // L2/L3 개인 적합도 + 궁합 — 순수 규칙 기반(AI 미사용)
  const result = await analyzeCompatibility(
    ingredients,
    category ?? 'skincare',
    color,
    userAnalysis ?? {}
  );

  return { ...result, regulatory, timelines };
}

/** DB 피부 타입을 코드용 타입으로 변환 */
function mapSkinType(dbType: string | null): SkinType {
  if (!dbType) return 'normal';
  const typeMap: Record<string, SkinType> = {
    건성: 'dry',
    지성: 'oily',
    민감성: 'sensitive',
    복합성: 'combination',
    중성: 'normal',
    dry: 'dry',
    oily: 'oily',
    sensitive: 'sensitive',
    combination: 'combination',
    normal: 'normal',
  };
  return typeMap[dbType.toLowerCase()] ?? 'normal';
}

/** DB 민감도를 코드용 타입으로 변환 (숫자 점수/문자 라벨 모두 허용) */
function mapSensitivity(dbSensitivity: string | number | null): 'low' | 'medium' | 'high' {
  if (dbSensitivity === null || dbSensitivity === undefined || dbSensitivity === '') return 'low';

  if (typeof dbSensitivity === 'number') {
    if (dbSensitivity >= 70) return 'high';
    if (dbSensitivity >= 40) return 'medium';
    return 'low';
  }

  const sensMap: Record<string, 'low' | 'medium' | 'high'> = {
    높음: 'high',
    중간: 'medium',
    낮음: 'low',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };
  return sensMap[dbSensitivity.toLowerCase()] ?? 'low';
}

/** 시즌 → 웜/쿨 톤 (색채학 결정론: 봄·가을=웜, 여름·겨울=쿨). 모바일 PC는 tone 미저장 → 파생. */
function deriveTone(season: string | null): 'warm' | 'cool' | null {
  if (!season) return null;
  const s = season.toLowerCase();
  if (
    s.includes('spring') ||
    s.includes('autumn') ||
    s.includes('fall') ||
    s.includes('봄') ||
    s.includes('가을')
  ) {
    return 'warm';
  }
  if (s.includes('summer') || s.includes('winter') || s.includes('여름') || s.includes('겨울')) {
    return 'cool';
  }
  return null;
}

/** 시즌 문자열을 season 타입으로 정규화 (지어내지 않음 — 미상이면 null) */
function normalizeSeason(season: string | null): 'spring' | 'summer' | 'autumn' | 'winter' | null {
  if (!season) return null;
  const s = season.toLowerCase();
  if (s.includes('spring') || s.includes('봄')) return 'spring';
  if (s.includes('summer') || s.includes('여름')) return 'summer';
  if (s.includes('autumn') || s.includes('fall') || s.includes('가을')) return 'autumn';
  if (s.includes('winter') || s.includes('겨울')) return 'winter';
  return null;
}

/**
 * 사용자 5축 프로필 조회 (스캔 판정용).
 * 최신 피부 분석(skin_analyses) + 퍼스널컬러(personal_color_assessments)를 읽는다.
 * 데이터가 없으면 해당 축을 비운다 — 판정은 "프로필 없음"으로 정직하게 게이팅된다.
 */
export async function fetchScanUserAnalysis(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<UserAnalysisData> {
  const userAnalysis: UserAnalysisData = {};
  if (!clerkUserId) return userAnalysis;

  const [skinResult, colorResult] = await Promise.all([
    supabase
      .from('skin_analyses')
      .select('skin_type, concerns, sensitivity')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('personal_color_assessments')
      .select('season')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const skin = skinResult.data as
    | { skin_type: string | null; concerns: string[] | null; sensitivity: string | number | null }
    | null
    | undefined;
  if (skin) {
    userAnalysis.skinAnalysis = {
      skinType: mapSkinType(skin.skin_type),
      concerns: skin.concerns ?? [],
      sensitivity: mapSensitivity(skin.sensitivity),
    };
  }

  const color = colorResult.data as { season: string | null } | null | undefined;
  const seasonType = normalizeSeason(color?.season ?? null);
  const tone = deriveTone(color?.season ?? null);
  if (seasonType && tone) {
    userAnalysis.personalColor = { seasonType, tone };
  }

  return userAnalysis;
}
