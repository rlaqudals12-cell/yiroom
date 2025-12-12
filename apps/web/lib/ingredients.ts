/**
 * 성분 분석 시스템 (하이브리드 방식)
 *
 * Week 6: 성분 DB + AI 분석 통합
 * - DB 우선 조회 (빠름, 일관성)
 * - DB에 없는 성분은 AI 분석
 * - 결과 통합하여 반환
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 피부 타입 정의
 */
export type SkinType = "dry" | "oily" | "sensitive" | "combination" | "normal";

/**
 * 성분 경고 레벨
 */
export type WarningLevel = "high" | "medium" | "low";

/**
 * 성분 경고 정보
 */
export interface IngredientWarning {
  ingredient: string;
  ingredientEn?: string;
  level: WarningLevel;
  ewgGrade: number;
  reason: string;
  alternatives?: string[];
  source: "db" | "ai";
}

/**
 * DB에서 조회된 성분 정보
 */
export interface DBIngredient {
  id: string;
  name_ko: string;
  name_en: string | null;
  aliases: string[] | null;
  ewg_grade: number | null;
  warning_dry: number;
  warning_oily: number;
  warning_sensitive: number;
  warning_combination: number;
  category: string | null;
  description: string | null;
  side_effects: string | null;
  alternatives: string[] | null;
}

/**
 * 피부 타입에 따른 경고 레벨 계산
 */
function getWarningLevel(ingredient: DBIngredient, skinType: SkinType): number {
  switch (skinType) {
    case "dry":
      return ingredient.warning_dry;
    case "oily":
      return ingredient.warning_oily;
    case "sensitive":
      return ingredient.warning_sensitive;
    case "combination":
      return ingredient.warning_combination;
    default:
      // normal: 모든 경고 레벨의 평균
      return Math.round(
        (ingredient.warning_dry +
          ingredient.warning_oily +
          ingredient.warning_sensitive +
          ingredient.warning_combination) /
          4
      );
  }
}

/**
 * 숫자 레벨을 문자열 레벨로 변환
 */
function numToWarningLevel(num: number): WarningLevel {
  if (num >= 4) return "high";
  if (num >= 3) return "medium";
  return "low";
}

/**
 * DB에서 성분 검색
 * 한글명, 영문명, 별칭(aliases) 모두 검색
 * 검색 우선순위: 정확매칭 > 별칭매칭 > 부분매칭
 */
async function searchIngredientInDB(
  ingredientName: string
): Promise<DBIngredient | null> {
  const supabase = createServiceRoleClient();
  const searchTerm = ingredientName.toLowerCase().trim();

  // 1. 정확한 매칭 먼저 시도 (name_ko, name_en)
  const { data: exactMatch } = await supabase
    .from("ingredients")
    .select("*")
    .or(`name_ko.ilike.${searchTerm},name_en.ilike.${searchTerm}`)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (exactMatch) {
    return exactMatch as DBIngredient;
  }

  // 2. 모든 활성 성분 조회 후 별칭에서 검색
  // PostgreSQL 배열 검색의 한계로 클라이언트 측 필터링 수행
  const { data: allIngredients } = await supabase
    .from("ingredients")
    .select("*")
    .eq("is_active", true)
    .not("aliases", "is", null);

  if (allIngredients && allIngredients.length > 0) {
    // 별칭 정확 매칭
    const aliasExactMatch = allIngredients.find((ing) =>
      ing.aliases?.some(
        (alias: string) => alias.toLowerCase() === searchTerm
      )
    );
    if (aliasExactMatch) {
      return aliasExactMatch as DBIngredient;
    }

    // 별칭 부분 매칭
    const aliasPartialMatch = allIngredients.find((ing) =>
      ing.aliases?.some(
        (alias: string) =>
          alias.toLowerCase().includes(searchTerm) ||
          searchTerm.includes(alias.toLowerCase())
      )
    );
    if (aliasPartialMatch) {
      return aliasPartialMatch as DBIngredient;
    }
  }

  // 3. 이름 부분 매칭 시도 (name_ko, name_en)
  const { data: partialMatch } = await supabase
    .from("ingredients")
    .select("*")
    .or(
      `name_ko.ilike.%${searchTerm}%,name_en.ilike.%${searchTerm}%`
    )
    .eq("is_active", true)
    .limit(1)
    .single();

  if (partialMatch) {
    return partialMatch as DBIngredient;
  }

  return null;
}

/**
 * AI로 성분 분석 (Gemini)
 * DB에 없는 성분에 대해 호출
 * TODO: Week 6 후반 또는 Week 7에서 Gemini 연동 구현 예정
 */
// async function analyzeIngredientWithAI(
//   ingredientName: string,
//   skinType: SkinType
// ): Promise<IngredientWarning | null> {
//   // 추후 Gemini 연동 구현
//   // 현재는 null 반환 (DB에 없는 성분은 경고 없음으로 처리)
//   return null;
// }

/**
 * 성분 목록 분석 (하이브리드)
 *
 * @param ingredients - 분석할 성분 목록 (한글 또는 영문)
 * @param skinType - 사용자 피부 타입
 * @returns 경고 성분 목록 (위험도 높은 순 정렬)
 */
export async function analyzeIngredients(
  ingredients: string[],
  skinType: SkinType = "normal"
): Promise<IngredientWarning[]> {
  const warnings: IngredientWarning[] = [];
  const unknownIngredients: string[] = [];

  // 1. DB에서 각 성분 검색
  for (const ingredientName of ingredients) {
    // 빈 문자열 스킵
    if (!ingredientName.trim()) continue;

    const dbResult = await searchIngredientInDB(ingredientName.trim());

    if (dbResult) {
      // DB에서 찾음
      const warningNum = getWarningLevel(dbResult, skinType);

      // 경고 레벨이 2 이상인 경우만 추가
      if (warningNum >= 2) {
        warnings.push({
          ingredient: dbResult.name_ko,
          ingredientEn: dbResult.name_en || undefined,
          level: numToWarningLevel(warningNum),
          ewgGrade: dbResult.ewg_grade || 5,
          reason: dbResult.side_effects || "주의가 필요한 성분입니다.",
          alternatives: dbResult.alternatives || undefined,
          source: "db",
        });
      }
    } else {
      // DB에 없음 → AI 분석 대상
      unknownIngredients.push(ingredientName);
    }
  }

  // 2. DB에 없는 성분 AI 분석 (현재 비활성)
  // 추후 Gemini 연동 시 활성화
  /*
  if (unknownIngredients.length > 0) {
    for (const ingredientName of unknownIngredients) {
      const aiResult = await analyzeIngredientWithAI(ingredientName, skinType);
      if (aiResult) {
        warnings.push(aiResult);
      }
    }
  }
  */

  // 3. 위험도 높은 순으로 정렬
  return warnings.sort((a, b) => {
    const levelOrder = { high: 3, medium: 2, low: 1 };
    return levelOrder[b.level] - levelOrder[a.level];
  });
}

/**
 * 피부 타입별 주의 성분 조회
 * 특정 피부 타입에 대한 모든 주의 성분 반환
 */
export async function getWarningIngredientsForSkinType(
  skinType: SkinType
): Promise<DBIngredient[]> {
  const supabase = createServiceRoleClient();

  // 피부 타입에 따른 컬럼 선택
  let warningColumn: string;
  switch (skinType) {
    case "dry":
      warningColumn = "warning_dry";
      break;
    case "oily":
      warningColumn = "warning_oily";
      break;
    case "sensitive":
      warningColumn = "warning_sensitive";
      break;
    case "combination":
      warningColumn = "warning_combination";
      break;
    default:
      warningColumn = "warning_sensitive"; // normal은 민감성 기준
  }

  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .gte(warningColumn, 3) // 주의 레벨 3 이상
    .eq("is_active", true)
    .order(warningColumn, { ascending: false });

  if (error) {
    console.error("Failed to fetch warning ingredients:", error);
    return [];
  }

  return (data as DBIngredient[]) || [];
}

/**
 * EWG 등급별 성분 조회
 */
export async function getIngredientsByEWGGrade(
  minGrade: number = 7
): Promise<DBIngredient[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .gte("ewg_grade", minGrade)
    .eq("is_active", true)
    .order("ewg_grade", { ascending: false });

  if (error) {
    console.error("Failed to fetch ingredients by EWG grade:", error);
    return [];
  }

  return (data as DBIngredient[]) || [];
}

/**
 * 모든 활성 성분 조회
 */
export async function getAllIngredients(): Promise<DBIngredient[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .eq("is_active", true)
    .order("name_ko");

  if (error) {
    console.error("Failed to fetch all ingredients:", error);
    return [];
  }

  return (data as DBIngredient[]) || [];
}
