/**
 * 바코드 서비스 (모바일)
 * 로컬 DB + Open Food Facts 통합 조회
 * 바코드 유효성 검사, 식품 조회, 식사 기록 저장
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { nutritionLogger } from '../utils/logger';

import { lookupOpenFoodFacts, type BarcodeFood, type LookupResult } from './openFoodFactsClient';

export type { BarcodeFood };

/**
 * 바코드 유효성 검사 (EAN-13, EAN-8, UPC-A)
 */
export function isValidBarcode(barcode: string): boolean {
  return /^\d{8,14}$/.test(barcode);
}

/**
 * 바코드로 식품 정보 조회
 * 1. 로컬 DB (barcode_foods 테이블)
 * 2. Open Food Facts API
 */
export async function lookupBarcode(
  barcode: string,
  supabase: SupabaseClient
): Promise<LookupResult> {
  if (!isValidBarcode(barcode)) {
    return { found: false, error: '유효하지 않은 바코드 형식이에요' };
  }

  try {
    // 1. 로컬 DB 조회
    const { data: localFood } = await supabase
      .from('barcode_foods')
      .select('id, barcode, name, brand, serving_size, calories, protein, carbs, fat, sugar, fiber, sodium, image_url, category, source, verified')
      .eq('barcode', barcode)
      .single();

    if (localFood) {
      nutritionLogger.info('바코드 로컬 DB 히트', { barcode });
      return {
        found: true,
        food: {
          id: localFood.id,
          barcode: localFood.barcode,
          name: localFood.name,
          brand: localFood.brand || undefined,
          servingSize: localFood.serving_size || 100,
          servingUnit: 'g',
          calories: localFood.calories || 0,
          protein: localFood.protein || 0,
          carbs: localFood.carbs || 0,
          fat: localFood.fat || 0,
          sugar: localFood.sugar || undefined,
          fiber: localFood.fiber || undefined,
          sodium: localFood.sodium || undefined,
          imageUrl: localFood.image_url || undefined,
          category: localFood.category || undefined,
          source: localFood.source || 'local',
          verified: localFood.verified ?? true,
        },
      };
    }

    // 2. Open Food Facts API 조회
    nutritionLogger.info('바코드 OpenFoodFacts 조회', { barcode });
    const apiResult = await lookupOpenFoodFacts(barcode);

    // API에서 찾았으면 로컬 DB에 캐시 저장
    if (apiResult.found && apiResult.food) {
      saveBarcodeToLocal(supabase, apiResult.food).catch((err) => {
        nutritionLogger.error('바코드 캐시 저장 실패', err);
      });
    }

    return apiResult;
  } catch (error) {
    nutritionLogger.error('바코드 조회 실패', error);
    return { found: false, error: '조회 중 오류가 발생했어요' };
  }
}

/**
 * 바코드 식품을 로컬 DB에 캐시 저장
 */
async function saveBarcodeToLocal(
  supabase: SupabaseClient,
  food: BarcodeFood
): Promise<void> {
  await supabase.from('barcode_foods').upsert(
    {
      barcode: food.barcode,
      name: food.name,
      brand: food.brand || null,
      serving_size: food.servingSize,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      sugar: food.sugar || null,
      fiber: food.fiber || null,
      sodium: food.sodium || null,
      image_url: food.imageUrl || null,
      category: food.category || null,
      source: food.source,
      verified: food.verified,
    },
    { onConflict: 'barcode' }
  );
}

/**
 * 바코드 스캔 결과를 식사 기록으로 저장
 */
export async function recordBarcodeFood(
  supabase: SupabaseClient,
  food: BarcodeFood,
  servings: number,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('meal_records').insert({
      meal_type: mealType,
      record_type: 'barcode',
      meal_date: new Date().toISOString().split('T')[0],
      recorded_at: new Date().toISOString(),
      foods: [
        {
          name: food.name,
          barcode: food.barcode,
          brand: food.brand,
          servings,
          calories: Math.round(food.calories * servings),
          protein: Math.round(food.protein * servings),
          carbs: Math.round(food.carbs * servings),
          fat: Math.round(food.fat * servings),
          fiber: food.fiber ? Math.round(food.fiber * servings) : undefined,
          sodium: food.sodium ? Math.round(food.sodium * servings) : undefined,
          sugar: food.sugar ? Math.round(food.sugar * servings) : undefined,
        },
      ],
      total_calories: Math.round(food.calories * servings),
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    nutritionLogger.error('바코드 식사 기록 저장 실패', error);
    return { success: false, error: '기록 저장에 실패했어요' };
  }
}

/**
 * 영양 정보 계산 (섭취량 배수 적용)
 */
export function calculateNutrition(
  food: BarcodeFood,
  servings: number
): { calories: number; protein: number; carbs: number; fat: number } {
  return {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings),
    carbs: Math.round(food.carbs * servings),
    fat: Math.round(food.fat * servings),
  };
}

/**
 * 데이터 소스 라벨
 */
export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    local: '로컬 DB',
    api: 'Open Food Facts',
    crowdsourced: '사용자 등록',
  };
  return labels[source] || source;
}
