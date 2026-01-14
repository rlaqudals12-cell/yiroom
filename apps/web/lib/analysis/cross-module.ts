/**
 * 크로스 모듈 분석 유틸리티
 *
 * PC-1 ↔ S-1 ↔ C-1 ↔ F-1 간 데이터 공유 및 연동을 위한 함수들
 *
 * @see docs/specs/SDD-MASTER-REFACTORING-PLAN.md Section 4.3
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// 타입 정의
// ============================================

export type AnalysisModule = 'personal_color' | 'face' | 'skin' | 'body';

export interface PersonalColorAssessment {
  id: string;
  clerk_user_id: string;
  season: string;
  undertone: string;
  confidence: number;
  face_image_url: string;
  left_image_url?: string;
  right_image_url?: string;
  wrist_image_url?: string;
  images_count?: number;
  analysis_reliability?: 'high' | 'medium' | 'low';
  created_at: string;
}

export interface AnalysisProgress {
  personalColor: boolean;
  face: boolean;
  skin: boolean;
  body: boolean;
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export interface CrossModuleLink {
  sourceType: AnalysisModule;
  sourceId: string;
  targetType: AnalysisModule;
  targetId: string;
  linkType: 'image_reuse' | 'draping_source' | 'recommendation';
}

// ============================================
// PC-1 결과 조회
// ============================================

/**
 * 사용자의 최신 PC-1 (퍼스널컬러) 결과 조회
 *
 * S-1, C-1, F-1에서 드레이핑 기능 및 이미지 재사용에 사용
 *
 * @example
 * ```tsx
 * const pcResult = await getLatestPersonalColorResult(supabase, userId);
 * if (pcResult) {
 *   // 드레이핑 탭 표시
 * }
 * ```
 */
export async function getLatestPersonalColorResult(
  supabase: SupabaseClient,
  userId: string
): Promise<PersonalColorAssessment | null> {
  const { data, error } = await supabase
    .from('personal_color_assessments')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // PGRST116: 결과 없음 (정상)
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[CrossModule] PC-1 조회 오류:', error);
    return null;
  }

  return data;
}

/**
 * PC-1 이미지 재사용 가능 여부 확인
 */
export async function canReusePersonalColorImage(
  supabase: SupabaseClient,
  userId: string
): Promise<{ canReuse: boolean; imageUrl?: string; pcId?: string }> {
  const pcResult = await getLatestPersonalColorResult(supabase, userId);

  if (!pcResult || !pcResult.face_image_url) {
    return { canReuse: false };
  }

  // 7일 이내 분석만 재사용 허용
  const analysisDate = new Date(pcResult.created_at);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 7) {
    return { canReuse: false };
  }

  return {
    canReuse: true,
    imageUrl: pcResult.face_image_url,
    pcId: pcResult.id,
  };
}

// ============================================
// 분석 진행률
// ============================================

/**
 * 통합 분석 진행률 계산
 *
 * 분석 허브에서 사용자의 전체 분석 완료 상태 표시에 사용
 *
 * @example
 * ```tsx
 * const progress = await getAnalysisProgress(supabase, userId);
 * // progress.percentage = 50 (2/4 완료)
 * ```
 */
export async function getAnalysisProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<AnalysisProgress> {
  const [pc, face, skin, body] = await Promise.all([
    supabase.from('personal_color_assessments').select('id').eq('clerk_user_id', userId).limit(1),
    supabase.from('face_analyses').select('id').eq('clerk_user_id', userId).limit(1),
    supabase.from('skin_analyses').select('id').eq('clerk_user_id', userId).limit(1),
    supabase.from('body_analyses').select('id').eq('clerk_user_id', userId).limit(1),
  ]);

  const results = [
    { key: 'personalColor', data: pc.data },
    { key: 'face', data: face.data },
    { key: 'skin', data: skin.data },
    { key: 'body', data: body.data },
  ];

  const completedCount = results.filter((r) => r.data && r.data.length > 0).length;
  const totalCount = 4;

  return {
    personalColor: !!(pc.data && pc.data.length > 0),
    face: !!(face.data && face.data.length > 0),
    skin: !!(skin.data && skin.data.length > 0),
    body: !!(body.data && body.data.length > 0),
    completedCount,
    totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
  };
}

// ============================================
// 분석 순서 추천
// ============================================

/**
 * 권장 분석 순서 반환
 *
 * PC-1 → F-1 → S-1 → C-1 순서로 진행 시 이미지 재사용 가능
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

  // 4순위: C-1 (별도 전신 사진 필요)
  if (!progress.body) {
    order.push({
      module: 'body',
      reason: '체형에 맞는 스타일을 추천받을 수 있어요 (전신 사진 필요)',
    });
  }

  return order;
}

// ============================================
// 크로스 인사이트
// ============================================

export interface CrossInsight {
  type: 'color_match' | 'skin_care' | 'style_tip' | 'product_recommendation';
  title: string;
  description: string;
  modules: AnalysisModule[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * 모듈간 크로스 인사이트 생성
 *
 * 여러 분석 결과를 조합하여 통합 인사이트 제공
 */
export function generateCrossInsights(
  pcResult: PersonalColorAssessment | null,
  skinResult: { skinType?: string } | null,
  bodyResult: { bodyType?: string } | null
): CrossInsight[] {
  const insights: CrossInsight[] = [];

  // PC + Skin 조합 인사이트
  if (pcResult && skinResult) {
    insights.push({
      type: 'color_match',
      title: '퍼스널컬러 + 피부 타입 맞춤 추천',
      description: `${pcResult.season} 시즌의 ${skinResult.skinType || '복합성'} 피부에 맞는 베이스 메이크업을 추천해요`,
      modules: ['personal_color', 'skin'],
      priority: 'high',
    });
  }

  // PC + Body 조합 인사이트
  if (pcResult && bodyResult) {
    insights.push({
      type: 'style_tip',
      title: '컬러 + 체형 스타일링 가이드',
      description: `${pcResult.season} 톤의 ${bodyResult.bodyType || '표준'} 체형에 어울리는 스타일을 확인해보세요`,
      modules: ['personal_color', 'body'],
      priority: 'medium',
    });
  }

  return insights;
}

// ============================================
// 모듈별 테이블 매핑
// ============================================

export const ANALYSIS_TABLES: Record<AnalysisModule, string> = {
  personal_color: 'personal_color_assessments',
  face: 'face_analyses',
  skin: 'skin_analyses',
  body: 'body_analyses',
};

export const ANALYSIS_ROUTES: Record<AnalysisModule, string> = {
  personal_color: '/analysis/personal-color',
  face: '/analysis/face',
  skin: '/analysis/skin',
  body: '/analysis/body',
};

export const ANALYSIS_LABELS: Record<AnalysisModule, { ko: string; en: string }> = {
  personal_color: { ko: '퍼스널 컬러', en: 'Personal Color' },
  face: { ko: '얼굴형', en: 'Face Shape' },
  skin: { ko: '피부', en: 'Skin' },
  body: { ko: '체형', en: 'Body Type' },
};
