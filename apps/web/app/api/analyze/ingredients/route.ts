import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  analyzeIngredients,
  getWarningIngredientsForSkinType,
  type SkinType,
  type IngredientWarning,
} from "@/lib/ingredients";

/**
 * 성분 분석 API (하이브리드: DB 우선 + AI 폴백)
 *
 * POST /api/analyze/ingredients
 * Body: {
 *   ingredients: string[],    // 분석할 성분 목록 (필수)
 *   skinType?: SkinType       // 피부 타입 (선택, 기본: normal)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   warnings: IngredientWarning[],   // 주의 성분 목록 (위험도 순)
 *   totalIngredients: number,        // 분석된 총 성분 수
 *   warningCount: number             // 주의 성분 수
 * }
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ingredients, skinType = "normal" } = body;

    // 입력 검증
    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: "Ingredients array is required" },
        { status: 400 }
      );
    }

    if (ingredients.length === 0) {
      return NextResponse.json({
        success: true,
        warnings: [],
        totalIngredients: 0,
        warningCount: 0,
      });
    }

    // 피부 타입 검증
    const validSkinTypes: SkinType[] = [
      "dry",
      "oily",
      "sensitive",
      "combination",
      "normal",
    ];
    const validatedSkinType: SkinType = validSkinTypes.includes(skinType)
      ? skinType
      : "normal";

    console.log(
      `[Ingredients] Analyzing ${ingredients.length} ingredients for ${validatedSkinType} skin`
    );

    // 성분 분석 실행
    const warnings: IngredientWarning[] = await analyzeIngredients(
      ingredients,
      validatedSkinType
    );

    console.log(`[Ingredients] Found ${warnings.length} warnings`);

    return NextResponse.json({
      success: true,
      warnings,
      totalIngredients: ingredients.length,
      warningCount: warnings.length,
    });
  } catch (error) {
    console.error("Ingredient analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 특정 피부 타입의 주의 성분 전체 목록 조회
 *
 * GET /api/analyze/ingredients?skinType=dry
 *
 * Returns: {
 *   success: boolean,
 *   ingredients: DBIngredient[],  // 주의 성분 목록
 *   count: number
 * }
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const skinType = searchParams.get("skinType") as SkinType | null;

    // 피부 타입 검증
    const validSkinTypes: SkinType[] = [
      "dry",
      "oily",
      "sensitive",
      "combination",
      "normal",
    ];
    const validatedSkinType: SkinType =
      skinType && validSkinTypes.includes(skinType) ? skinType : "sensitive";

    console.log(
      `[Ingredients] Fetching warning ingredients for ${validatedSkinType} skin`
    );

    const ingredients = await getWarningIngredientsForSkinType(validatedSkinType);

    return NextResponse.json({
      success: true,
      ingredients,
      count: ingredients.length,
      skinType: validatedSkinType,
    });
  } catch (error) {
    console.error("Get warning ingredients error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
