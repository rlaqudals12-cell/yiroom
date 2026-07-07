/**
 * BeautyProfile 필드 매퍼
 * 각 분석 모듈의 DB 데이터 → BeautyProfile 요약 필드 변환
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 *
 * 매퍼는 분석 결과의 핵심 정보만 추출하여 JSONB ~5KB 이하로 유지.
 * 원본 데이터는 각 분석 테이블에 보존됨 (매퍼는 요약만).
 */

import type {
  PCProfileData,
  SkinProfileData,
  BodyProfileData,
  WorkoutProfileData,
  NutritionProfileData,
  HairProfileData,
  MakeupProfileData,
  OralProfileData,
  FashionProfileData,
} from '@/types/capsule';

// =============================================================================
// PC: 퍼스널컬러 매퍼
// personal_color_assessments → PCProfileData
// =============================================================================

/**
 * 팔레트 정규화 — hex 문자열 배열로 통일
 *
 * DB best_colors는 실제로 `[{hex, name}]` 객체 배열로 저장되는데(레거시는 문자열 가능),
 * PCProfileData.palette 계약은 string[]이라 소비처(fashion 엔진 등)에서
 * `.toLowerCase()` 호출 시 TypeError로 캡슐 생성 전체가 500 나던 근본 원인.
 * 읽기 경계에서 두 형태 모두 hex 문자열로 정규화한다.
 */
export function normalizePalette(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => {
      if (typeof c === 'string') return c;
      if (c && typeof c === 'object' && typeof (c as { hex?: unknown }).hex === 'string') {
        return (c as { hex: string }).hex;
      }
      return '';
    })
    .filter(Boolean);
}

/**
 * 팔레트 색 이름 추출 — [{hex,name}]에서 name만 (솔루션 문구용)
 * hex가 있는 항목만 포함해 palette(hex 배열)와 인덱스 짝을 유지한다
 * (코디 솔루션에서 names[i] ↔ palette[i]가 같은 색이어야 함).
 */
export function extractPaletteNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => {
      if (!c || typeof c !== 'object') return '';
      const item = c as { hex?: unknown; name?: unknown };
      return typeof item.hex === 'string' && typeof item.name === 'string' ? item.name : '';
    })
    .filter(Boolean);
}

/** 퍼스널컬러 분석 결과에서 프로필 요약 추출 */
export function mapPCAssessment(row: Record<string, unknown>): PCProfileData {
  const imageAnalysis = row.image_analysis as Record<string, unknown> | null;

  return {
    season: (row.season as string) ?? '',
    subType: (imageAnalysis?.tone as string) ?? (row.undertone as string) ?? '',
    palette: normalizePalette(row.best_colors),
    paletteNames: extractPaletteNames(row.best_colors),
  };
}

// =============================================================================
// S: 피부 분석 매퍼
// skin_analyses → SkinProfileData
// =============================================================================

/** 피부 분석 결과에서 프로필 요약 추출 */
export function mapSkinAssessment(row: Record<string, unknown>): SkinProfileData {
  const scores = row.scores as Record<string, unknown> | null;
  const scoreBreakdown = scores?.scoreBreakdown as Record<string, number> | null;
  const concerns = row.concerns as string[] | null;

  // skin_analyses는 지표가 top-level 숫자 컬럼 — 상태 기반 루틴 조정(conditional-routine)의
  // 입력이므로 scores에 병합해 프로필로 승격 (2026-07-06, 데일리 루틴 지표 배선)
  const metricColumns = [
    'hydration',
    'oil_level',
    'sensitivity',
    'overall_score',
    'pores',
    'pigmentation',
    'wrinkles',
  ] as const;
  const metrics: Record<string, number> = {};
  for (const key of metricColumns) {
    const value = row[key];
    if (typeof value === 'number') metrics[key] = value;
  }

  // 솔루션 문구용: 추천 성분 이름 + 파운데이션 진단 (recommendations JSONB / 컬럼)
  const recs = row.recommendations as Record<string, unknown> | null;
  const rawIngredients = recs?.ingredients;
  const recommendedIngredients = Array.isArray(rawIngredients)
    ? rawIngredients
        .map((i) =>
          i && typeof i === 'object' && typeof (i as { name?: unknown }).name === 'string'
            ? (i as { name: string }).name
            : ''
        )
        .filter(Boolean)
    : [];

  return {
    type: (row.skin_type as string) ?? '',
    concerns: concerns ?? [],
    scores: { ...metrics, ...(scoreBreakdown ?? {}) },
    recommendedIngredients,
    foundation:
      typeof row.foundation_recommendation === 'string' ? row.foundation_recommendation : undefined,
  };
}

// =============================================================================
// C: 체형 분석 매퍼
// body_assessments → BodyProfileData
// =============================================================================

/** 체형 분석 결과에서 프로필 요약 추출 */
export function mapBodyAssessment(row: Record<string, unknown>): BodyProfileData {
  const analysisData = row.analysis_data as Record<string, unknown> | null;
  const ratios = analysisData?.ratios as Record<string, number> | null;

  // 핵심 비율만 추출
  const measurements: Record<string, number> = {};
  if (ratios) {
    if (ratios.shoulderToWaistRatio != null)
      measurements.shoulderToWaistRatio = ratios.shoulderToWaistRatio;
    if (ratios.waistToHipRatio != null) measurements.waistToHipRatio = ratios.waistToHipRatio;
    if (ratios.upperToLowerRatio != null) measurements.upperToLowerRatio = ratios.upperToLowerRatio;
  }

  // 솔루션 문구용: 체형 스타일 추천 (style_recommendations JSONB {tops,bottoms,outerwear,avoid})
  const styleRecs = row.style_recommendations as Record<string, unknown> | null;
  const pickStrings = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : undefined;
  const styleTips = styleRecs
    ? {
        tops: pickStrings(styleRecs.tops),
        bottoms: pickStrings(styleRecs.bottoms),
        outerwear: pickStrings(styleRecs.outerwear),
        avoid: pickStrings(styleRecs.avoid),
      }
    : undefined;

  return {
    shape: (row.body_shape as string) ?? (row.body_type as string) ?? '',
    measurements,
    styleTips,
  };
}

// =============================================================================
// W: 운동 프로필 매퍼
// posture_analyses + 운동 이력 → WorkoutProfileData
// =============================================================================

/**
 * 자세 분석 + 운동 이력에서 프로필 요약 추출
 * posture_analyses 테이블 기반, 향후 exercise_logs 연동
 */
export function mapPostureToWorkout(
  postureRow: Record<string, unknown> | null,
  exerciseLogs?: Record<string, unknown>[]
): WorkoutProfileData {
  const concerns = (postureRow?.concerns as string[]) ?? [];
  const postureType = (postureRow?.posture_type as string) ?? '';

  // 자세 문제에서 운동 목표 도출
  const goals: string[] = [];
  if (postureType) goals.push(`자세 교정: ${postureType}`);
  if (concerns.length > 0) goals.push(...concerns.slice(0, 3));

  // 운동 이력에서 피트니스 레벨 추정
  const logCount = exerciseLogs?.length ?? 0;
  let fitnessLevel = 'beginner';
  if (logCount >= 30) fitnessLevel = 'advanced';
  else if (logCount >= 10) fitnessLevel = 'intermediate';

  return {
    fitnessLevel,
    goals,
    history: [],
  };
}

// =============================================================================
// N: 영양 프로필 매퍼
// nutrition_settings → NutritionProfileData
// =============================================================================

/** 영양 설정에서 프로필 요약 추출 */
export function mapNutritionSettings(row: Record<string, unknown>): NutritionProfileData {
  const allergies = row.allergies as string[] | null;
  const goal = (row.goal as string) ?? '';
  const mealStyle = (row.meal_style as string) ?? '';

  return {
    deficiencies: [],
    dietType: mealStyle || goal,
    allergies: allergies ?? [],
  };
}

// =============================================================================
// H: 헤어 분석 매퍼
// hair_assessments → HairProfileData
// =============================================================================

/** 헤어 분석 결과에서 프로필 요약 추출 */
export function mapHairAssessment(row: Record<string, unknown>): HairProfileData {
  const analysisData = row.analysis_data as Record<string, unknown> | null;
  const currentHairInfo = analysisData?.currentHairInfo as Record<string, string> | null;

  const concerns: string[] = [];
  const careTips = row.care_tips as Array<Record<string, string>> | null;
  if (careTips) {
    concerns.push(
      ...careTips
        .map((tip) => tip.category)
        .filter(Boolean)
        .slice(0, 5)
    );
  }

  return {
    type: currentHairInfo?.texture ?? currentHairInfo?.length ?? '',
    scalp: currentHairInfo?.scalpCondition ?? '',
    concerns,
  };
}

// =============================================================================
// M: 메이크업 분석 매퍼
// makeup_analyses → MakeupProfileData
// =============================================================================

/** 메이크업 분석 결과에서 프로필 요약 추출 */
export function mapMakeupAnalysis(row: Record<string, unknown>): MakeupProfileData {
  const recommendations = row.recommendations as Record<string, unknown> | null;
  const styles = (recommendations?.styles as string[]) ?? [];

  const preferences: Record<string, string> = {};
  if (row.undertone) preferences.undertone = row.undertone as string;
  if (row.face_shape) preferences.faceShape = row.face_shape as string;
  if (row.eye_shape) preferences.eyeShape = row.eye_shape as string;
  if (row.lip_shape) preferences.lipShape = row.lip_shape as string;
  if (styles.length > 0) preferences.preferredStyle = styles[0];

  // analysisReliability 또는 overall_score 기반 skillLevel 추정
  const overallScore = (row.overall_score as number) ?? 50;
  let skillLevel = 'beginner';
  if (overallScore >= 80) skillLevel = 'advanced';
  else if (overallScore >= 60) skillLevel = 'intermediate';

  return {
    preferences,
    skillLevel,
  };
}

// =============================================================================
// OH: 구강건강 매퍼
// oral_health_assessments → OralProfileData
// =============================================================================

/** 구강건강 분석 결과에서 프로필 요약 추출 */
export function mapOralHealthAssessment(row: Record<string, unknown>): OralProfileData {
  const gumHealth = row.gum_health as Record<string, unknown> | null;
  const whiteningGoal = row.whitening_goal as Record<string, unknown> | null;
  const recommendations = (row.recommendations as string[]) ?? [];

  const conditions: string[] = [];
  if (gumHealth?.healthStatus) {
    conditions.push(gumHealth.healthStatus as string);
  }
  if (gumHealth?.needsDentalVisit) {
    conditions.push('치과 방문 권장');
  }

  const goals: string[] = [];
  if (whiteningGoal?.targetShade) {
    goals.push(`미백 목표: ${whiteningGoal.targetShade}`);
  }
  if (recommendations.length > 0) {
    goals.push(...recommendations.slice(0, 3));
  }

  return {
    conditions,
    goals,
  };
}

// =============================================================================
// Fashion: 패션 프로필 매퍼
// body_assessments + user_inventory → FashionProfileData
// =============================================================================

/**
 * 체형 분석 + 인벤토리에서 패션 프로필 추출
 * body_assessments의 styling_recommendations + user_inventory 기반
 */
export function mapFashionFromBodyAndInventory(
  bodyRow: Record<string, unknown> | null,
  inventoryCategories?: string[]
): FashionProfileData {
  const stylingRecs = bodyRow?.styling_recommendations as Record<string, string[]> | null;

  // 체형 분석의 스타일링 추천에서 style 도출
  const silhouettes = stylingRecs?.silhouettes ?? [];
  const style = silhouettes.length > 0 ? silhouettes[0] : '';

  // 체형에서 사이즈 프로필 도출
  const sizeProfile: Record<string, string> = {};
  const bodyShape = (bodyRow?.body_shape as string) ?? '';
  if (bodyShape) sizeProfile.bodyShape = bodyShape;

  return {
    style,
    sizeProfile,
    wardrobe: inventoryCategories ?? [],
  };
}
