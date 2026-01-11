/**
 * Cosmetic Ingredients API
 * GET: 성분 검색 및 필터링
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  searchIngredients,
  getCaution20Ingredients,
  getAllergenIngredients,
  getIngredientsByCategory,
} from '@/lib/products/repositories/ingredients';
import type { IngredientCategory } from '@/types/ingredient';

/**
 * GET /api/ingredients
 *
 * Query Parameters:
 * - q: 검색어 (한글/영문/INCI)
 * - category: 성분 카테고리
 * - caution20: true일 경우 20가지 주의 성분만
 * - allergen: true일 경우 알레르기 유발 성분만
 * - limit: 결과 개수 (기본 20)
 */
export async function GET(request: NextRequest) {
  try {
    // 성분 정보는 공개되어 있으므로 인증 선택적
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category') as IngredientCategory | null;
    const caution20 = searchParams.get('caution20') === 'true';
    const allergen = searchParams.get('allergen') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = createClerkSupabaseClient();

    let ingredients;

    // 특수 필터 우선
    if (caution20) {
      ingredients = await getCaution20Ingredients(supabase);
    } else if (allergen) {
      ingredients = await getAllergenIngredients(supabase);
    } else if (category) {
      ingredients = await getIngredientsByCategory(supabase, category, limit);
    } else if (query) {
      ingredients = await searchIngredients(supabase, query, {
        limit,
        category: category || undefined,
      });
    } else {
      // 기본: 최근 성분 20개 (카테고리 없음)
      ingredients = await searchIngredients(supabase, '', { limit });
    }

    return NextResponse.json(
      {
        success: true,
        ingredients,
        count: ingredients.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[Ingredients API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
