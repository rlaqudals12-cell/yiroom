/**
 * Product Ingredients Analysis API
 * GET: 제품 성분 목록 및 분석 결과
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  getProductIngredients,
  analyzeProductIngredients,
} from '@/lib/products/repositories/ingredients';
import { analyzeIngredientsWithAI } from '@/lib/products/services/ingredient-analysis';

/**
 * GET /api/products/[id]/ingredients
 *
 * Query Parameters:
 * - includeAI: true일 경우 AI 요약 포함 (기본 false)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const includeAI = searchParams.get('includeAI') === 'true';

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    // 성분 목록 조회
    const ingredients = await getProductIngredients(supabase, productId);

    if (ingredients.length === 0) {
      return NextResponse.json(
        {
          success: true,
          ingredients: [],
          analysis: null,
          aiSummary: null,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    }

    // 성분 분석 (EWG 분포, 주의 성분 등)
    const analysis = await analyzeProductIngredients(supabase, productId);

    // AI 요약 (선택적)
    let aiSummary = null;
    if (includeAI) {
      try {
        aiSummary = await analyzeIngredientsWithAI(ingredients);
      } catch (error) {
        console.error('[Product Ingredients API] AI analysis failed:', error);
        // AI 실패해도 기본 분석은 반환
      }
    }

    return NextResponse.json(
      {
        success: true,
        ingredients,
        analysis,
        aiSummary,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[Product Ingredients API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
