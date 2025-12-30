/**
 * 바코드 식품 조회 API
 *
 * GET /api/nutrition/foods/barcode/[code]
 * - 바코드로 식품 정보 조회
 * - 1. 로컬 DB 조회
 * - 2. Open Food Facts API 조회 (fallback)
 * - 3. 없으면 미등록 응답
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { lookupOpenFoodFacts } from '@/lib/nutrition/openfoodfacts';
import type { BarcodeFood, BarcodeSearchResponse } from '@/types/nutrition';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { code } = await params;

    // 바코드 유효성 검사 (EAN-13, EAN-8, UPC-A)
    if (!code || !/^\d{8,14}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid barcode format' },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 1. 로컬 DB에서 바코드 조회
    const { data, error } = await supabase
      .from('barcode_foods')
      .select('*')
      .eq('barcode', code)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116: 결과 없음 (정상)
      console.error('[Barcode API] DB error:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // 로컬 DB에서 찾은 경우
    if (data) {
      // 스캔 이력 저장 (비동기, 실패해도 무시)
      void supabase
        .from('user_barcode_history')
        .insert({
          clerk_user_id: userId,
          barcode_food_id: data.id,
        });

      const response: BarcodeSearchResponse = {
        found: true,
        food: mapDbToFood(data),
        source: 'local',
      };

      return NextResponse.json(response);
    }

    // 2. Open Food Facts API에서 조회 (fallback)
    console.log('[Barcode API] Local DB miss, trying Open Food Facts:', code);
    const offResult = await lookupOpenFoodFacts(code);

    if (offResult.found && offResult.food) {
      // API에서 찾은 데이터를 로컬 DB에 캐싱 (비동기, 실패해도 무시)
      supabase
        .from('barcode_foods')
        .insert({
          barcode: offResult.food.barcode,
          name: offResult.food.name,
          brand: offResult.food.brand,
          serving_size: offResult.food.servingSize,
          serving_unit: offResult.food.servingUnit,
          calories: offResult.food.calories,
          protein: offResult.food.protein,
          carbs: offResult.food.carbs,
          fat: offResult.food.fat,
          sugar: offResult.food.sugar,
          fiber: offResult.food.fiber,
          sodium: offResult.food.sodium,
          image_url: offResult.food.imageUrl,
          category: offResult.food.category,
          allergens: offResult.food.allergens,
          source: 'api',
          verified: false,
        })
        .select()
        .single()
        .then(({ data: insertedData, error: insertError }) => {
          if (insertError) {
            console.warn('[Barcode API] Cache insert failed:', insertError);
            return;
          }
          // 스캔 이력 저장
          if (insertedData) {
            supabase.from('user_barcode_history').insert({
              clerk_user_id: userId,
              barcode_food_id: insertedData.id,
            });
          }
        });

      const response: BarcodeSearchResponse = {
        found: true,
        food: offResult.food,
        source: 'openfoodfacts',
      };

      return NextResponse.json(response);
    }

    // 3. 미등록 바코드
    const response: BarcodeSearchResponse = {
      found: false,
      barcode: code,
      message: '등록되지 않은 바코드입니다. 직접 등록하시겠어요?',
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Barcode API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
