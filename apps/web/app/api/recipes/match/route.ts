/**
 * 레시피 매칭 API
 * POST /api/recipes/match
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { recommendRecipes, type NutritionGoal } from '@/lib/nutrition/recipe-matcher';

export const runtime = 'edge';

interface RecipeMatchRequest {
  pantryItems: string[];
  nutritionGoal?: NutritionGoal;
  limit?: number;
  minMatchScore?: number;
  maxMissingIngredients?: number;
  maxCookTime?: number;
  expiringItems?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as RecipeMatchRequest;
    const {
      pantryItems,
      nutritionGoal,
      limit = 10,
      minMatchScore = 30,
      maxMissingIngredients = 3,
      maxCookTime,
      expiringItems,
    } = body;

    // 입력 검증
    if (!pantryItems || !Array.isArray(pantryItems)) {
      return NextResponse.json(
        { error: 'pantryItems must be an array of strings' },
        { status: 400 }
      );
    }

    // 레시피 매칭 실행
    const results = recommendRecipes(pantryItems, {
      goal: nutritionGoal,
      minMatchScore,
      maxMissingIngredients,
      maxCookTime,
      expiringItems,
    });

    // limit 적용
    const limitedResults = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      results: limitedResults,
      total: results.length,
      metadata: {
        pantryItemCount: pantryItems.length,
        expiringItemCount: expiringItems?.length || 0,
        appliedFilters: {
          nutritionGoal,
          minMatchScore,
          maxMissingIngredients,
          maxCookTime,
        },
      },
    });
  } catch (error) {
    console.error('[API] Recipe match error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
