/**
 * 바코드 식품 등록 API
 *
 * POST /api/nutrition/foods/barcode
 * - 새로운 바코드 식품 등록 (크라우드소싱)
 *
 * GET /api/nutrition/foods/barcode
 * - 최근 스캔 이력 조회
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { BarcodeFood, BarcodeRegisterRequest, BarcodeHistory } from '@/types/nutrition';

// DB 결과를 BarcodeFood 타입으로 변환
function mapDbToFood(row: Record<string, unknown>): BarcodeFood {
  return {
    id: row.id as string,
    barcode: row.barcode as string,
    name: row.name as string,
    brand: row.brand as string | undefined,
    servingSize: Number(row.serving_size) || 100,
    servingUnit: (row.serving_unit as string) || 'g',
    calories: Number(row.calories) || 0,
    protein: Number(row.protein) || 0,
    carbs: Number(row.carbs) || 0,
    fat: Number(row.fat) || 0,
    fiber: row.fiber ? Number(row.fiber) : undefined,
    sodium: row.sodium ? Number(row.sodium) : undefined,
    sugar: row.sugar ? Number(row.sugar) : undefined,
    allergens: (row.allergens as string[]) || undefined,
    category: row.category as string | undefined,
    imageUrl: row.image_url as string | undefined,
    source: (row.source as 'manual' | 'api' | 'crowdsourced') || 'manual',
    verified: Boolean(row.verified),
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

/**
 * GET: 최근 스캔 이력 조회
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const supabase = createClerkSupabaseClient();
    const { data, error } = await supabase
      .from('user_barcode_history')
      .select(`
        id,
        scanned_at,
        barcode_foods (*)
      `)
      .eq('clerk_user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Barcode History API] Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const history: BarcodeHistory[] = (data || []).map((row) => ({
      id: row.id,
      barcodeFood: mapDbToFood(row.barcode_foods as unknown as Record<string, unknown>),
      scannedAt: row.scanned_at,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('[Barcode History API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: 새 바코드 식품 등록
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BarcodeRegisterRequest = await request.json();

    // 필수 필드 검증
    if (!body.barcode || !body.name || body.calories === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: barcode, name, calories' },
        { status: 400 }
      );
    }

    // 바코드 형식 검증
    if (!/^\d{8,14}$/.test(body.barcode)) {
      return NextResponse.json(
        { error: 'Invalid barcode format' },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 중복 체크
    const { data: existing } = await supabase
      .from('barcode_foods')
      .select('id')
      .eq('barcode', body.barcode)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Barcode already registered', existingId: existing.id },
        { status: 409 }
      );
    }

    // 새 식품 등록
    const { data, error } = await supabase
      .from('barcode_foods')
      .insert({
        barcode: body.barcode,
        name: body.name,
        brand: body.brand,
        serving_size: body.servingSize || 100,
        serving_unit: body.servingUnit || 'g',
        calories: body.calories,
        protein: body.protein || 0,
        carbs: body.carbs || 0,
        fat: body.fat || 0,
        fiber: body.fiber,
        sodium: body.sodium,
        sugar: body.sugar,
        allergens: body.allergens,
        category: body.category,
        image_url: body.imageUrl,
        source: 'crowdsourced',
        verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[Barcode Register API] Error:', error);
      return NextResponse.json({ error: 'Failed to register food' }, { status: 500 });
    }

    // 스캔 이력도 저장
    await supabase
      .from('user_barcode_history')
      .insert({
        clerk_user_id: userId,
        barcode_food_id: data.id,
      });

    return NextResponse.json({
      success: true,
      food: mapDbToFood(data),
    }, { status: 201 });
  } catch (error) {
    console.error('[Barcode Register API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
