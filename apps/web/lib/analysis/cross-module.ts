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

// ============================================
// 3모듈 통합 패션 추천 (PC + C-1 + S-1)
// ============================================

/** 통합 패션 추천 결과 */
export interface IntegratedFashionRecommendation {
  /** 추천 코디 설명 */
  description: string;
  /** 추천 색상 (PC 시즌 기반) */
  colors: string[];
  /** 추천 소재 (S-1 피부 기반) */
  fabrics: string[];
  /** 추천 실루엣 (C-1 체형 기반) */
  silhouettes: string[];
  /** 피해야 할 것 */
  avoid: string[];
  /** 통합 근거 */
  reasoning: string;
}

// 시즌별 추천 색상
const SEASON_COLORS: Record<string, string[]> = {
  spring: ['코랄', '살구', '밝은 오렌지', '아이보리', '카멜'],
  summer: ['라벤더', '민트', '파우더핑크', '스카이블루', '로즈'],
  autumn: ['버건디', '테라코타', '카키', '머스타드', '브라운'],
  winter: ['블랙', '퓨어화이트', '로열블루', '퓨시아', '실버'],
};

// 체형별 추천 실루엣
const BODY_SILHOUETTES: Record<string, { recommend: string[]; avoid: string[] }> = {
  S: {
    recommend: ['I라인', '미니멀 핏', 'V넥 상의', '스트레이트 팬츠', '미디 스커트'],
    avoid: ['오버사이즈', '프릴 장식', '볼륨 소매'],
  },
  W: {
    recommend: ['X라인', '하이웨이스트', 'A라인 스커트', '크롭 자켓', '플레어 팬츠'],
    avoid: ['로우라이즈', '박시 핏', '긴 아우터'],
  },
  N: {
    recommend: ['릴렉스드 핏', '오버핏 셔츠', '와이드 팬츠', '롱 카디건', '레이어드'],
    avoid: ['타이트 핏', '구조적 어깨 패드', '짧은 기장'],
  },
};

// 피부 상태별 추천 소재
const SKIN_FABRICS: Record<string, string[]> = {
  sensitive: ['오가닉 코튼', '대나무 섬유', '실크 (저자극)', '텐셀'],
  dry: ['캐시미어', '벨벳', '플리스', '코튼 플란넬'],
  oily: ['린넨', '면', '쿨맥스', '통풍 좋은 소재'],
  combination: ['면', '린넨 블렌드', '저지'],
  normal: ['면', '린넨', '실크', '울'],
};

/**
 * 3모듈 통합 패션 추천 생성
 *
 * PC-1 퍼스널컬러 + C-1 체형 + S-1 피부 → 통합 코디 추천
 *
 * @param season - PC-1 시즌 (spring/summer/autumn/winter)
 * @param bodyType - C-1 체형 (S/W/N)
 * @param skinType - S-1 피부타입 (dry/oily/combination/sensitive/normal)
 * @returns 통합 패션 추천
 */
export function generateIntegratedFashionRecommendation(
  season?: string,
  bodyType?: string,
  skinType?: string
): IntegratedFashionRecommendation {
  const colors = SEASON_COLORS[season ?? 'spring'] ?? SEASON_COLORS.spring;
  const silhouetteData = BODY_SILHOUETTES[bodyType ?? 'S'] ?? BODY_SILHOUETTES.S;
  const fabrics = SKIN_FABRICS[skinType ?? 'normal'] ?? SKIN_FABRICS.normal;

  const seasonLabel =
    { spring: '봄 웜톤', summer: '여름 쿨톤', autumn: '가을 웜톤', winter: '겨울 쿨톤' }[
      season ?? 'spring'
    ] ?? '봄 웜톤';

  const bodyLabel = { S: '스트레이트', W: '웨이브', N: '내추럴' }[bodyType ?? 'S'] ?? '스트레이트';

  const skinLabel =
    {
      dry: '건성',
      oily: '지성',
      combination: '복합성',
      sensitive: '민감성',
      normal: '중성',
    }[skinType ?? 'normal'] ?? '중성';

  const description = `${seasonLabel} + ${bodyLabel} 체형 + ${skinLabel} 피부에 맞는 코디: ${colors.slice(0, 3).join('·')} 톤의 ${fabrics[0]} 소재, ${silhouetteData.recommend[0]} 실루엣이 베스트`;

  const reasoning = `퍼스널컬러(${seasonLabel})에서 추천 색상을, 체형(${bodyLabel})에서 실루엣을, 피부(${skinLabel})에서 소재를 조합했습니다. 이 세 가지가 모두 맞아야 정말 "나에게 어울리는" 옷이 됩니다.`;

  return {
    description,
    colors,
    fabrics,
    silhouettes: silhouetteData.recommend,
    avoid: silhouetteData.avoid,
    reasoning,
  };
}
