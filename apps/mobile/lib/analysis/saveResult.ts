/**
 * 분석 결과 DB 저장 유틸리티
 *
 * 각 분석 result.tsx에서 Gemini 분석 완료 후 호출.
 * Supabase에 결과를 저장하여 useUserAnalyses() 훅이 실제 데이터를 반환하게 함.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  PersonalColorAnalysisResult,
  SkinAnalysisResult,
  BodyAnalysisResult,
  HairAnalysisResult,
  MakeupAnalysisResult,
} from '../gemini/types';
import { analysisLogger } from '../utils/logger';

// 저장 실패 시 분석 화면 자체는 정상 동작해야 함 — 에러를 삼킴
async function safeInsert(
  supabase: SupabaseClient,
  table: string,
  data: Record<string, unknown>
): Promise<string | null> {
  try {
    const { data: row, error } = await supabase
      .from(table)
      .insert(data)
      .select('id')
      .single();

    if (error) {
      analysisLogger.error(`DB save failed (${table}):`, error.message);
      return null;
    }
    analysisLogger.info(`Saved to ${table}:`, row?.id);
    return row?.id ?? null;
  } catch (err) {
    analysisLogger.error(`DB save exception (${table}):`, err);
    return null;
  }
}

/**
 * 퍼스널 컬러 결과 저장
 */
export async function savePersonalColorResult(
  supabase: SupabaseClient,
  clerkUserId: string,
  result: PersonalColorAnalysisResult,
  answers: Record<number, string>,
  imageUri?: string
): Promise<string | null> {
  return safeInsert(supabase, 'personal_color_assessments', {
    clerk_user_id: clerkUserId,
    season: result.season,
    confidence: Math.round(result.confidence * 100),
    best_colors: result.colors,
    questionnaire_answers: answers,
    face_image_url: imageUri || null,
  });
}

/**
 * 피부 분석 결과 저장
 */
export async function saveSkinResult(
  supabase: SupabaseClient,
  clerkUserId: string,
  result: SkinAnalysisResult,
  overallScore: number,
  imageUri?: string
): Promise<string | null> {
  return safeInsert(supabase, 'skin_analyses', {
    clerk_user_id: clerkUserId,
    image_url: imageUri || 'mobile://local',
    skin_type: result.skinType,
    hydration: result.metrics.moisture,
    oil_level: result.metrics.oil,
    pores: result.metrics.pores,
    pigmentation: result.metrics.pigmentation,
    wrinkles: result.metrics.wrinkles,
    sensitivity: result.metrics.sensitivity,
    overall_score: overallScore,
    concerns: result.concerns,
  });
}

/**
 * 체형 분석 결과 저장
 */
export async function saveBodyResult(
  supabase: SupabaseClient,
  clerkUserId: string,
  result: BodyAnalysisResult,
  imageUri?: string
): Promise<string | null> {
  return safeInsert(supabase, 'body_analyses', {
    clerk_user_id: clerkUserId,
    image_url: imageUri || 'mobile://local',
    body_type: result.bodyType,
    bmi: result.bmi,
    // shoulder/waist/hip 비율 점수: proportions에서 파생
    shoulder: Math.round(result.proportions.shoulderHipRatio * 50),
    waist: Math.round(result.proportions.waistHipRatio * 100),
    hip: Math.round((1 - result.proportions.waistHipRatio) * 100),
  });
}

/**
 * 헤어 분석 결과 저장
 */
export async function saveHairResult(
  supabase: SupabaseClient,
  clerkUserId: string,
  result: HairAnalysisResult,
  imageUri?: string
): Promise<string | null> {
  const overallScore = Math.round(
    (result.scores.shine + result.scores.elasticity +
     result.scores.density + result.scores.scalpHealth) / 4
  );

  return safeInsert(supabase, 'hair_analyses', {
    clerk_user_id: clerkUserId,
    image_url: imageUri || null,
    hair_type: result.texture,
    hair_thickness: result.thickness,
    scalp_type: result.scalpCondition,
    hydration: result.scores.shine,
    scalp_health: result.scores.scalpHealth,
    damage_level: result.damageLevel,
    density: result.scores.density,
    elasticity: result.scores.elasticity,
    overall_score: overallScore,
    concerns: result.mainConcerns,
  });
}

/**
 * 메이크업 분석 결과 저장
 */
export async function saveMakeupResult(
  supabase: SupabaseClient,
  clerkUserId: string,
  result: MakeupAnalysisResult
): Promise<string | null> {
  return safeInsert(supabase, 'makeup_analyses', {
    clerk_user_id: clerkUserId,
    makeup_style: `${result.faceShape}_${result.undertone}`,
    color_recommendations: { bestColors: result.bestColors },
    product_recommendations: result.recommendations,
    tips: [
      `얼굴형: ${result.faceShape}`,
      `눈매: ${result.eyeShape}`,
      `입술: ${result.lipShape}`,
    ],
  });
}
