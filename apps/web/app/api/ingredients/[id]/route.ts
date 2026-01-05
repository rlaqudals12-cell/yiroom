/**
 * Cosmetic Ingredient Detail API
 * GET: 특정 성분 상세 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getIngredientById } from '@/lib/products/repositories/ingredients';

/**
 * GET /api/ingredients/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Ingredient ID is required' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();
    const ingredient = await getIngredientById(supabase, id);

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ingredient,
    });
  } catch (error) {
    console.error('[Ingredient Detail API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
