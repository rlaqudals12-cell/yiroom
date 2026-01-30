/**
 * 크로스 모듈 인사이트 통합
 *
 * @module lib/insights/cross-module-insights
 * @description PC-1 + S-1 + C-1 + 기타 모듈 데이터 통합 및 인사이트 생성
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  AnalysisDataBundle,
  PersonalColorData,
  SkinData,
  BodyData,
  FaceData,
  HairData,
  OralHealthData,
  InsightGeneratorOptions,
  InsightGenerationResult,
  AnalysisModule,
} from './types';
import { generateInsights } from './generator';

// ============================================
// 데이터 조회 함수
// ============================================

/**
 * 최신 퍼스널컬러 결과 조회
 */
async function fetchPersonalColorData(
  supabase: SupabaseClient,
  userId: string
): Promise<PersonalColorData | null> {
  const { data, error } = await supabase
    .from('personal_color_assessments')
    .select('season, undertone, confidence, sub_type, color_palette')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    season: data.season,
    undertone: data.undertone,
    confidence: data.confidence ?? 70,
    subType: data.sub_type,
    colorPalette: data.color_palette,
  };
}

/**
 * 최신 피부 분석 결과 조회
 */
async function fetchSkinData(
  supabase: SupabaseClient,
  userId: string
): Promise<SkinData | null> {
  const { data, error } = await supabase
    .from('skin_analyses')
    .select('skin_type, concerns, hydration_level, oil_level, sensitivity_level')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    skinType: data.skin_type,
    concerns: data.concerns,
    hydrationLevel: data.hydration_level,
    oilLevel: data.oil_level,
    sensitivityLevel: data.sensitivity_level,
  };
}

/**
 * 최신 체형 분석 결과 조회
 */
async function fetchBodyData(
  supabase: SupabaseClient,
  userId: string
): Promise<BodyData | null> {
  const { data, error } = await supabase
    .from('body_analyses')
    .select('body_type, shoulder_type, proportions')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    bodyType: data.body_type,
    shoulderType: data.shoulder_type,
    proportions: data.proportions,
  };
}

/**
 * 최신 얼굴형 분석 결과 조회
 */
async function fetchFaceData(
  supabase: SupabaseClient,
  userId: string
): Promise<FaceData | null> {
  const { data, error } = await supabase
    .from('face_analyses')
    .select('face_shape, facial_features')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    faceShape: data.face_shape,
    facialFeatures: data.facial_features,
  };
}

/**
 * 최신 모발 분석 결과 조회
 */
async function fetchHairData(
  supabase: SupabaseClient,
  userId: string
): Promise<HairData | null> {
  const { data, error } = await supabase
    .from('hair_analyses')
    .select('hair_type, hair_condition, scalp_condition')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    hairType: data.hair_type,
    hairCondition: data.hair_condition,
    scalpCondition: data.scalp_condition,
  };
}

/**
 * 최신 구강 건강 분석 결과 조회
 */
async function fetchOralHealthData(
  supabase: SupabaseClient,
  userId: string
): Promise<OralHealthData | null> {
  const { data, error } = await supabase
    .from('oral_health_assessments')
    .select('gum_health_status, tooth_shade, inflammation_score')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    gumHealthStatus: data.gum_health_status,
    toothShade: data.tooth_shade,
    inflammationScore: data.inflammation_score,
  };
}

// ============================================
// 통합 조회 함수
// ============================================

/**
 * 모든 분석 데이터 번들 조회
 *
 * @param supabase - Supabase 클라이언트
 * @param userId - 사용자 ID (clerk_user_id)
 * @param modules - 조회할 모듈 (지정하지 않으면 전체)
 * @returns 분석 데이터 번들
 */
export async function fetchAnalysisDataBundle(
  supabase: SupabaseClient,
  userId: string,
  modules?: AnalysisModule[]
): Promise<AnalysisDataBundle> {
  const shouldFetch = (module: AnalysisModule): boolean => {
    return !modules || modules.includes(module);
  };

  const [personalColor, skin, body, face, hair, oralHealth] = await Promise.all([
    shouldFetch('personal_color') ? fetchPersonalColorData(supabase, userId) : null,
    shouldFetch('skin') ? fetchSkinData(supabase, userId) : null,
    shouldFetch('body') ? fetchBodyData(supabase, userId) : null,
    shouldFetch('face') ? fetchFaceData(supabase, userId) : null,
    shouldFetch('hair') ? fetchHairData(supabase, userId) : null,
    shouldFetch('oral_health') ? fetchOralHealthData(supabase, userId) : null,
  ]);

  return {
    personalColor,
    skin,
    body,
    face,
    hair,
    oralHealth,
  };
}

/**
 * 분석 진행률 계산
 */
export interface AnalysisProgress {
  personalColor: boolean;
  face: boolean;
  skin: boolean;
  body: boolean;
  hair: boolean;
  oralHealth: boolean;
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export async function getAnalysisProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<AnalysisProgress> {
  const dataBundle = await fetchAnalysisDataBundle(supabase, userId);

  const completed = {
    personalColor: dataBundle.personalColor !== null,
    face: dataBundle.face !== null,
    skin: dataBundle.skin !== null,
    body: dataBundle.body !== null,
    hair: dataBundle.hair !== null,
    oralHealth: dataBundle.oralHealth !== null,
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const totalCount = 6;

  return {
    ...completed,
    completedCount,
    totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
  };
}

// ============================================
// 인사이트 생성 래퍼 함수
// ============================================

/**
 * 사용자의 크로스 모듈 인사이트 생성
 *
 * DB에서 데이터를 조회하고 인사이트를 생성하는 통합 함수
 *
 * @example
 * ```typescript
 * const result = await generateUserInsights(supabase, userId, {
 *   maxInsights: 5,
 *   minPriorityScore: 30,
 * });
 * ```
 */
export async function generateUserInsights(
  supabase: SupabaseClient,
  userId: string,
  options?: InsightGeneratorOptions
): Promise<InsightGenerationResult> {
  const dataBundle = await fetchAnalysisDataBundle(supabase, userId);
  return generateInsights(dataBundle, options);
}

/**
 * 특정 모듈 관련 인사이트만 생성
 */
export async function generateModuleInsights(
  supabase: SupabaseClient,
  userId: string,
  module: AnalysisModule,
  options?: InsightGeneratorOptions
): Promise<InsightGenerationResult> {
  // 해당 모듈과 관련 가능한 모듈만 조회
  const relatedModules = getRelatedModules(module);
  const dataBundle = await fetchAnalysisDataBundle(supabase, userId, relatedModules);

  const result = generateInsights(dataBundle, options);

  // 해당 모듈이 포함된 인사이트만 필터링
  const filteredInsights = result.insights.filter((insight) =>
    insight.relatedModules.includes(module)
  );

  return {
    ...result,
    insights: filteredInsights,
    returnedCount: filteredInsights.length,
  };
}

/**
 * 모듈과 관련된 다른 모듈 목록 반환
 */
function getRelatedModules(module: AnalysisModule): AnalysisModule[] {
  const relations: Record<AnalysisModule, AnalysisModule[]> = {
    personal_color: ['personal_color', 'skin', 'body', 'hair', 'face'],
    skin: ['skin', 'personal_color'],
    body: ['body', 'personal_color'],
    face: ['face', 'personal_color'],
    hair: ['hair', 'personal_color'],
    oral_health: ['oral_health'],
  };

  return relations[module] || [module];
}

// ============================================
// 분석 순서 추천
// ============================================

/**
 * 권장 분석 순서 반환
 *
 * PC-1 → F-1 → S-1 → C-1 → H-1 → OH-1 순서로 진행 시 이미지 재사용 가능
 */
export function getRecommendedAnalysisOrder(
  progress: AnalysisProgress
): { module: AnalysisModule; reason: string }[] {
  const order: { module: AnalysisModule; reason: string }[] = [];

  // 1순위: PC-1 (모든 분석의 기반)
  if (!progress.personalColor) {
    order.push({
      module: 'personal_color',
      reason: '퍼스널컬러를 먼저 분석하면 다른 분석에서 같은 사진을 사용할 수 있어요',
    });
  }

  // 2순위: F-1 (PC-1 이미지 재사용)
  if (!progress.face) {
    order.push({
      module: 'face',
      reason: progress.personalColor
        ? '퍼스널컬러 사진으로 바로 분석할 수 있어요'
        : '얼굴형에 맞는 스타일을 추천받을 수 있어요',
    });
  }

  // 3순위: S-1 (PC-1 이미지 재사용)
  if (!progress.skin) {
    order.push({
      module: 'skin',
      reason: progress.personalColor
        ? '퍼스널컬러 사진으로 피부도 분석할 수 있어요'
        : '피부 상태에 맞는 제품을 추천받을 수 있어요',
    });
  }

  // 4순위: H-1 (모발)
  if (!progress.hair) {
    order.push({
      module: 'hair',
      reason: progress.personalColor
        ? '퍼스널컬러에 어울리는 헤어컬러를 추천받을 수 있어요'
        : '모발 상태에 맞는 케어를 추천받을 수 있어요',
    });
  }

  // 5순위: C-1 (별도 전신 사진 필요)
  if (!progress.body) {
    order.push({
      module: 'body',
      reason: '체형에 맞는 스타일을 추천받을 수 있어요 (전신 사진 필요)',
    });
  }

  // 6순위: OH-1 (구강 건강)
  if (!progress.oralHealth) {
    order.push({
      module: 'oral_health',
      reason: '잇몸 건강과 치아 색상을 확인할 수 있어요',
    });
  }

  return order;
}

// ============================================
// PC-1 이미지 재사용
// ============================================

/**
 * PC-1 이미지 재사용 가능 여부 확인
 */
export async function canReusePersonalColorImage(
  supabase: SupabaseClient,
  userId: string
): Promise<{ canReuse: boolean; imageUrl?: string; pcId?: string }> {
  const { data, error } = await supabase
    .from('personal_color_assessments')
    .select('id, face_image_url, created_at')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data || !data.face_image_url) {
    return { canReuse: false };
  }

  // 7일 이내 분석만 재사용 허용
  const analysisDate = new Date(data.created_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 7) {
    return { canReuse: false };
  }

  return {
    canReuse: true,
    imageUrl: data.face_image_url,
    pcId: data.id,
  };
}
