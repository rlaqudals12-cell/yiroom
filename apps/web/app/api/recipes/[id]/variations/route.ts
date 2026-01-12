/**
 * 레시피 변형 API
 * @description M-2-2+ - 레시피 변형 조회 (다이어트/린매스/벌크업)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_RECIPES } from '@/lib/nutrition/recipe-matcher';
import { generateRecipeVariations, VariationGoal } from '@/lib/nutrition/ingredient-substitutes';

export const runtime = 'edge';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/recipes/[id]/variations
 * 레시피 변형 목록 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const goalParam = searchParams.get('goal');

    // 레시피 찾기
    const recipe = SAMPLE_RECIPES.find((r) => r.id === id);

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: '레시피를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 목표 유효성 검사
    let goal: VariationGoal | undefined;
    if (goalParam) {
      if (!['diet', 'lean', 'bulk', 'allergen_free'].includes(goalParam)) {
        return NextResponse.json(
          { success: false, error: '유효하지 않은 목표입니다.' },
          { status: 400 }
        );
      }
      goal = goalParam as VariationGoal;
    }

    // 변형 생성
    const variations = generateRecipeVariations(recipe, goal);

    return NextResponse.json({
      success: true,
      data: {
        recipeId: id,
        recipeName: recipe.name,
        variations,
      },
    });
  } catch (error) {
    console.error('[API] Recipe variations error:', error);
    return NextResponse.json(
      { success: false, error: '레시피 변형을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
