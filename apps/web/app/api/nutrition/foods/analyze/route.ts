import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  analyzeFoodImage,
  type FoodAnalysisInput,
  type GeminiFoodAnalysisResult,
} from '@/lib/gemini';
import { generateMockFoodAnalysis } from '@/lib/mock/food-analysis';

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

// 이미지 크기 제한 (10MB)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * Base64 이미지 검증 및 정규화
 * data:image/...;base64, 형식 또는 순수 base64 모두 지원
 */
function validateAndNormalizeImage(imageBase64: string): {
  isValid: boolean;
  error?: string;
  normalizedBase64: string;
  mimeType?: string;
} {
  // data URL 형식 처리 (data:image/jpeg;base64,...)
  const dataUrlMatch = imageBase64.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);

  let pureBase64: string;
  let mimeType: string | undefined;

  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1];
    pureBase64 = dataUrlMatch[2];
  } else {
    // 순수 base64 (prefix 없음)
    pureBase64 = imageBase64;
  }

  // Base64 유효성 검사 (간단한 형식 체크)
  if (!/^[A-Za-z0-9+/]+=*$/.test(pureBase64.replace(/\s/g, ''))) {
    return { isValid: false, error: 'Invalid base64 format', normalizedBase64: '' };
  }

  // 크기 검사 (base64는 원본 대비 약 1.33배)
  const estimatedSize = (pureBase64.length * 3) / 4;
  if (estimatedSize > MAX_IMAGE_SIZE) {
    return {
      isValid: false,
      error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      normalizedBase64: '',
    };
  }

  return { isValid: true, normalizedBase64: pureBase64, mimeType };
}

/**
 * N-1 음식 사진 분석 API (Task 2.3)
 *
 * POST /api/nutrition/foods/analyze
 * Body: {
 *   imageBase64: string,        // 필수: Base64 인코딩된 이미지
 *   mealType?: string,          // 식사 타입 (breakfast/lunch/dinner/snack)
 *   saveToDb?: boolean,         // DB 저장 여부 (기본: false)
 *   useMock?: boolean           // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   result: GeminiFoodAnalysisResult,
 *   savedRecord?: MealRecord,   // saveToDb=true 시 저장된 레코드
 *   usedMock: boolean
 * }
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // JSON 파싱
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    const {
      imageBase64,
      mealType = 'lunch',
      saveToDb = false,
      useMock = false,
    } = body;

    // 필수 필드 검증
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'imageBase64 is required' },
        { status: 400 }
      );
    }

    // 이미지 검증 및 정규화
    const imageValidation = validateAndNormalizeImage(imageBase64);
    if (!imageValidation.isValid) {
      return NextResponse.json(
        { error: imageValidation.error },
        { status: 400 }
      );
    }

    // mealType 검증
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (mealType && !validMealTypes.includes(mealType)) {
      return NextResponse.json(
        { error: `Invalid mealType. Must be one of: ${validMealTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // AI 분석 입력 데이터 구성 (정규화된 base64 사용)
    const analysisInput: FoodAnalysisInput = {
      imageBase64: imageValidation.normalizedBase64,
      mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    };

    // AI 분석 실행 (Real AI 또는 Mock)
    let result: GeminiFoodAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockFoodAnalysis(analysisInput);
      usedMock = true;
      console.log('[N-1] Using mock food analysis');
    } else {
      // Real AI 분석
      try {
        console.log('[N-1] Starting Gemini food analysis...');
        result = await analyzeFoodImage(analysisInput);
        console.log('[N-1] Gemini food analysis completed:', result.foods.length, 'foods detected');
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[N-1] Gemini error, falling back to mock:', aiError);
        result = generateMockFoodAnalysis(analysisInput);
        usedMock = true;
      }
    }

    // 음식이 인식되지 않은 경우 처리
    if (result.foods.length === 0) {
      return NextResponse.json({
        success: true,
        result,
        usedMock,
        warning: 'No food detected in the image',
      });
    }

    // DB 저장이 요청된 경우
    let savedRecord = null;
    if (saveToDb) {
      const supabase = createServiceRoleClient();

      // 총 영양소 사용 (result에서 제공하거나 계산)
      const totalCalories = result.totalCalories ?? result.foods.reduce((sum, f) => sum + f.calories, 0);
      const totalProtein = result.totalProtein ?? result.foods.reduce((sum, f) => sum + f.protein, 0);
      const totalCarbs = result.totalCarbs ?? result.foods.reduce((sum, f) => sum + f.carbs, 0);
      const totalFat = result.totalFat ?? result.foods.reduce((sum, f) => sum + f.fat, 0);

      // 전체 신뢰도 계산 (평균)
      const avgConfidence = result.foods.length > 0
        ? result.foods.reduce((sum, f) => sum + (f.confidence || 0.8), 0) / result.foods.length
        : 0.8;

      // 신뢰도 레벨 결정
      const confidenceLevel = avgConfidence >= 0.85 ? 'high' : avgConfidence >= 0.7 ? 'medium' : 'low';

      // foods 배열을 DB 형식으로 변환
      const foodsForDb = result.foods.map((food) => ({
        food_name: food.name,
        portion: food.portion,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        traffic_light: food.trafficLight,
        ai_confidence: food.confidence,
      }));

      // meal_records 테이블에 저장
      const { data, error } = await supabase
        .from('meal_records')
        .insert({
          clerk_user_id: userId,
          meal_type: mealType,
          meal_date: new Date().toISOString().split('T')[0],
          record_type: 'photo',
          foods: foodsForDb,
          total_calories: Math.round(totalCalories),
          total_protein: Math.round(totalProtein * 10) / 10,
          total_carbs: Math.round(totalCarbs * 10) / 10,
          total_fat: Math.round(totalFat * 10) / 10,
          ai_recognized_food: result.foods.map((f) => f.name).join(', '),
          ai_confidence: confidenceLevel,
          ai_raw_response: result,
          user_confirmed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('[N-1] Database insert error:', error);
        // DB 저장 실패해도 분석 결과는 반환
        return NextResponse.json({
          success: true,
          result,
          usedMock,
          dbError: 'Failed to save to database',
        });
      }

      savedRecord = data;
    }

    return NextResponse.json({
      success: true,
      result,
      savedRecord,
      usedMock,
    });
  } catch (error) {
    console.error('[N-1] Food analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
