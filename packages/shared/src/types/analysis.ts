/**
 * 분석 모듈 공통 타입 정의
 *
 * @module @yiroom/shared/types/analysis
 * @description 모든 분석 모듈(PC-1, S-1, C-1, S-2, SK-1, OH-1, H-1, M-1, W-1, W-2)이 공유하는 타입
 *
 * @example
 * import { BaseAnalysisResult, SkinAnalysisResult, AnalysisType } from '@yiroom/shared';
 */

// ============================================================
// 1. 공통 열거형 타입
// ============================================================

/**
 * 분석 상태
 * - pending: 분석 대기 중
 * - processing: 분석 진행 중
 * - completed: 분석 완료
 * - failed: 분석 실패
 */
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 피츠패트릭 피부 타입 (I~VI)
 * 자외선 민감도 및 피부색 분류에 사용
 * @see https://en.wikipedia.org/wiki/Fitzpatrick_scale
 */
export type FitzpatrickType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

/**
 * 퍼스널컬러 시즌 타입
 * 4계절 색상 분류 시스템
 */
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * 퍼스널컬러 서브타입
 * 각 시즌의 세부 톤 분류
 */
export type SeasonSubType = 'light' | 'true' | 'dark' | 'bright' | 'muted' | 'warm' | 'clear' | 'deep';

/**
 * 피부 타입 (5분류)
 */
export type SkinTypeClassification = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';

/**
 * 체형 타입 (8분류)
 */
export type BodyTypeClassification =
  | 'rectangle'      // 일자형
  | 'triangle'       // 삼각형 (역삼각형)
  | 'inverted_triangle' // 역삼각형
  | 'hourglass'      // 모래시계형
  | 'oval'           // 타원형
  | 'diamond'        // 다이아몬드형
  | 'pear'           // 배형
  | 'athletic';      // 운동선수형

/**
 * 모발 타입 (질감/굵기)
 */
export type HairTextureType = 'straight' | 'wavy' | 'curly' | 'coily';
export type HairThicknessType = 'fine' | 'medium' | 'thick';

/**
 * 운동 5타입 분류
 */
export type WorkoutTypeClassification = 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';

/**
 * 분석 모듈 식별자
 */
export type AnalysisModuleId =
  | 'pc-1'   // 퍼스널컬러 분석
  | 'pc-2'   // 퍼스널컬러 상세 분석
  | 's-1'    // 피부 분석
  | 's-2'    // 피부 상세 분석
  | 'c-1'    // 체형 분석
  | 'c-2'    // 체형 상세 분석
  | 'h-1'    // 헤어 분석
  | 'm-1'    // 메이크업 분석
  | 'oh-1'   // 구강건강 분석
  | 'sk-1'   // 피부시술 추천
  | 'w-1'    // 운동 추천
  | 'w-2';   // 스트레칭 추천

// ============================================================
// 2. 기본 분석 결과 인터페이스
// ============================================================

/**
 * 모든 분석 결과의 기본 인터페이스
 * 모든 분석 모듈 결과 타입은 이 인터페이스를 확장해야 함
 */
export interface BaseAnalysisResult {
  /** 분석 결과 고유 ID (UUID) */
  id: string;

  /** 분석 생성 시각 (ISO 8601) */
  createdAt: string;

  /** AI 분석 신뢰도 (0-100) */
  confidence: number;

  /** Mock Fallback 사용 여부 (AI 실패 시 true) */
  usedFallback: boolean;
}

/**
 * 분석 결과 확장 인터페이스 (사용자 정보 포함)
 */
export interface AnalysisResultWithUser extends BaseAnalysisResult {
  /** 사용자 ID (Clerk) */
  userId: string;

  /** 분석 모듈 ID */
  moduleId: AnalysisModuleId;

  /** 분석 상태 */
  status: AnalysisStatus;

  /** 업데이트 시각 (ISO 8601) */
  updatedAt: string;
}

// ============================================================
// 3. 모듈별 분석 결과 타입
// ============================================================

/**
 * 퍼스널컬러 분석 결과 (PC-1, PC-2)
 */
export interface PersonalColorResult extends BaseAnalysisResult {
  /** 분석 타입 식별자 */
  type: 'personal-color';

  /** 4계절 시즌 타입 */
  season: SeasonType;

  /** 세부 톤 타입 */
  subType: SeasonSubType;

  /** 추천 컬러 팔레트 (HEX 코드 배열) */
  colorPalette: string[];

  /** 피해야 할 컬러 (HEX 코드 배열) */
  avoidColors: string[];

  /** 웜톤/쿨톤 점수 (-100 ~ 100, 양수=웜톤) */
  warmCoolScore: number;

  /** 청탁 점수 (-100 ~ 100, 양수=청색) */
  clearMutedScore: number;

  /** 명암 점수 (-100 ~ 100, 양수=밝음) */
  lightDarkScore: number;

  /** 분석 근거 (상세 증거 리포트용) */
  evidence?: {
    skinTone: string;
    eyeColor: string;
    hairColor: string;
    veinColor: 'blue' | 'green' | 'mixed';
  };
}

/**
 * 피부 분석 결과 (S-1, S-2)
 */
export interface SkinAnalysisResult extends BaseAnalysisResult {
  /** 분석 타입 식별자 */
  type: 'skin';

  /** 피부 타입 */
  skinType: SkinTypeClassification;

  /** 피츠패트릭 타입 */
  fitzpatrickType: FitzpatrickType;

  /** 피부 점수 (각 항목 0-100) */
  scores: {
    /** 수분 점수 */
    hydration: number;
    /** 유분 점수 */
    oiliness: number;
    /** 민감도 점수 */
    sensitivity: number;
    /** 주름 점수 (낮을수록 좋음) */
    wrinkles: number;
    /** 모공 점수 (낮을수록 좋음) */
    pores: number;
    /** 색소침착 점수 (낮을수록 좋음) */
    pigmentation: number;
    /** 탄력 점수 */
    elasticity: number;
    /** 균일도 점수 */
    uniformity: number;
  };

  /** 전체 피부 점수 (가중 평균) */
  overallScore: number;

  /** 주요 피부 고민 (최대 3개) */
  mainConcerns: string[];

  /** 존별 분석 결과 */
  zoneAnalysis?: {
    tZone: Partial<SkinAnalysisResult['scores']>;
    uZone: Partial<SkinAnalysisResult['scores']>;
    cheeks: Partial<SkinAnalysisResult['scores']>;
  };

  /** 추천 성분 */
  recommendedIngredients?: string[];

  /** 피해야 할 성분 */
  avoidIngredients?: string[];
}

/**
 * 체형 분석 결과 (C-1, C-2)
 */
export interface BodyAnalysisResult extends BaseAnalysisResult {
  /** 분석 타입 식별자 */
  type: 'body';

  /** 체형 타입 */
  bodyType: BodyTypeClassification;

  /** 신체 비율 */
  proportions: {
    /** 어깨 너비 (cm) */
    shoulderWidth: number;
    /** 허리 너비 (cm) */
    waistWidth: number;
    /** 엉덩이 너비 (cm) */
    hipWidth: number;
    /** 상체/하체 비율 */
    upperLowerRatio: number;
  };

  /** 체형 점수 (각 항목 0-100) */
  scores: {
    /** 균형 점수 */
    balance: number;
    /** 자세 점수 */
    posture: number;
    /** 대칭 점수 */
    symmetry: number;
  };

  /** 스타일링 추천 */
  stylingTips?: string[];

  /** 강조할 부위 */
  accentuate?: string[];

  /** 보완할 부위 */
  minimize?: string[];
}

/**
 * 헤어 분석 결과 (H-1)
 */
export interface HairAnalysisResult extends BaseAnalysisResult {
  /** 분석 타입 식별자 */
  type: 'hair';

  /** 모발 질감 */
  texture: HairTextureType;

  /** 모발 굵기 */
  thickness: HairThicknessType;

  /** 두피 상태 */
  scalpCondition: 'dry' | 'oily' | 'normal' | 'sensitive';

  /** 모발 손상도 (0-100, 높을수록 손상) */
  damageLevel: number;

  /** 모발 점수 */
  scores: {
    /** 윤기 점수 */
    shine: number;
    /** 탄력 점수 */
    elasticity: number;
    /** 밀도 점수 */
    density: number;
    /** 두피 건강 점수 */
    scalpHealth: number;
  };

  /** 주요 모발 고민 */
  mainConcerns: string[];

  /** 추천 케어 루틴 */
  careRoutine?: string[];
}

/**
 * 메이크업 분석 결과 (M-1)
 */
export interface MakeupAnalysisResult extends BaseAnalysisResult {
  /** 분석 타입 식별자 */
  type: 'makeup';

  /** 얼굴형 */
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';

  /** 눈 모양 */
  eyeShape: 'almond' | 'round' | 'monolid' | 'hooded' | 'downturned' | 'upturned';

  /** 입술 모양 */
  lipShape: 'full' | 'thin' | 'wide' | 'small' | 'heart' | 'round';

  /** 얼굴 비율 */
  facialProportions: {
    /** 이마 비율 */
    foreheadRatio: number;
    /** 중안부 비율 */
    midFaceRatio: number;
    /** 하안부 비율 */
    lowerFaceRatio: number;
  };

  /** 메이크업 추천 */
  recommendations: {
    /** 눈썹 스타일 */
    eyebrowStyle: string;
    /** 아이 메이크업 스타일 */
    eyeMakeupStyle: string;
    /** 컨투어링 포인트 */
    contouringPoints: string[];
    /** 립 컬러 추천 */
    lipColorRecommendations: string[];
  };
}

/**
 * 구강건강 분석 결과 (OH-1)
 */
export interface OralHealthResult extends BaseAnalysisResult {
  /** 분석 타입 식별자 */
  type: 'oral-health';

  /** 구강 건강 점수 */
  scores: {
    /** 전체 점수 */
    overall: number;
    /** 치아 상태 */
    teethCondition: number;
    /** 잇몸 건강 */
    gumHealth: number;
    /** 치아 색상/미백 */
    whiteness: number;
    /** 교합 상태 */
    alignment: number;
  };

  /** 주요 관심 영역 */
  concerns: string[];

  /** 추천 관리법 */
  recommendations: string[];

  /** 전문가 상담 필요 여부 */
  needsProfessionalConsultation: boolean;
}

/**
 * 피부시술 추천 결과 (SK-1)
 */
export interface ProcedureRecommendationResult extends BaseAnalysisResult {
  /** 분석 타입 식별자 */
  type: 'procedure';

  /** 연관된 피부 분석 ID */
  relatedSkinAnalysisId?: string;

  /** 추천 시술 목록 */
  recommendations: Array<{
    /** 시술명 */
    name: string;
    /** 시술 카테고리 */
    category: 'laser' | 'injection' | 'rf' | 'ultrasound' | 'chemical' | 'other';
    /** 매칭 점수 (0-100) */
    matchScore: number;
    /** 예상 효과 */
    expectedBenefits: string[];
    /** 주의사항 */
    precautions: string[];
    /** 예상 비용 범위 (원) */
    estimatedCostRange: {
      min: number;
      max: number;
    };
    /** 회복 기간 (일) */
    recoveryDays: number;
  }>;

  /** 피해야 할 시술 */
  contraindications: string[];
}

/**
 * 운동 추천 결과 (W-1)
 */
export interface WorkoutResult extends BaseAnalysisResult {
  /** 분석 타입 식별자 */
  type: 'workout';

  /** 추천 운동 타입 */
  recommendedType: WorkoutTypeClassification;

  /** 현재 피트니스 레벨 */
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';

  /** 주간 운동 플랜 */
  weeklyPlan: Array<{
    /** 요일 (0=일요일) */
    dayOfWeek: number;
    /** 운동 타입 */
    workoutType: WorkoutTypeClassification;
    /** 예상 시간 (분) */
    durationMinutes: number;
    /** 예상 칼로리 소모 */
    estimatedCalories: number;
    /** 추천 운동 목록 */
    exercises: Array<{
      name: string;
      sets: number;
      reps: number;
      restSeconds: number;
    }>;
  }>;

  /** 목표 기반 추천 */
  goalBasedRecommendations: string[];
}

/**
 * 스트레칭 추천 결과 (W-2)
 */
export interface StretchingResult extends BaseAnalysisResult {
  /** 분석 타입 식별자 */
  type: 'stretching';

  /** 유연성 점수 */
  flexibilityScore: number;

  /** 문제 부위 */
  problemAreas: string[];

  /** 추천 스트레칭 루틴 */
  routine: Array<{
    /** 스트레칭 이름 */
    name: string;
    /** 대상 부위 */
    targetArea: string;
    /** 유지 시간 (초) */
    holdSeconds: number;
    /** 반복 횟수 */
    repetitions: number;
    /** 설명 */
    description: string;
    /** 주의사항 */
    caution?: string;
  }>;

  /** 총 예상 시간 (분) */
  totalDurationMinutes: number;
}

// ============================================================
// 4. 유니온 타입 및 타입 가드
// ============================================================

/**
 * 모든 분석 결과 유니온 타입
 */
export type AnalysisResult =
  | PersonalColorResult
  | SkinAnalysisResult
  | BodyAnalysisResult
  | HairAnalysisResult
  | MakeupAnalysisResult
  | OralHealthResult
  | ProcedureRecommendationResult
  | WorkoutResult
  | StretchingResult;

/**
 * 분석 타입 식별자 유니온
 */
export type AnalysisType = AnalysisResult['type'];

// ============================================================
// 5. API 응답 타입
// ============================================================

/**
 * API 성공 응답
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * API 에러 응답
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    /** 에러 코드 */
    code: string;
    /** 에러 메시지 (개발자용) */
    message: string;
    /** 사용자 메시지 (UI 표시용) */
    userMessage?: string;
    /** 추가 상세 정보 */
    details?: Record<string, unknown>;
  };
}

/**
 * API 응답 타입 (성공 또는 에러)
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 분석 API 응답 타입
 */
export type AnalysisApiResponse<T extends AnalysisResult> = ApiResponse<T>;

// ============================================================
// 6. 타입 가드 함수
// ============================================================

/**
 * API 성공 응답 타입 가드
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * API 에러 응답 타입 가드
 */
export function isApiError<T>(
  response: ApiResponse<T>
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * 피부 분석 결과 타입 가드
 */
export function isSkinAnalysis(
  result: AnalysisResult
): result is SkinAnalysisResult {
  return result.type === 'skin';
}

/**
 * 퍼스널컬러 분석 결과 타입 가드
 */
export function isPersonalColorAnalysis(
  result: AnalysisResult
): result is PersonalColorResult {
  return result.type === 'personal-color';
}

/**
 * 체형 분석 결과 타입 가드
 */
export function isBodyAnalysis(
  result: AnalysisResult
): result is BodyAnalysisResult {
  return result.type === 'body';
}

/**
 * 헤어 분석 결과 타입 가드
 */
export function isHairAnalysis(
  result: AnalysisResult
): result is HairAnalysisResult {
  return result.type === 'hair';
}

/**
 * 메이크업 분석 결과 타입 가드
 */
export function isMakeupAnalysis(
  result: AnalysisResult
): result is MakeupAnalysisResult {
  return result.type === 'makeup';
}

/**
 * 구강건강 분석 결과 타입 가드
 */
export function isOralHealthAnalysis(
  result: AnalysisResult
): result is OralHealthResult {
  return result.type === 'oral-health';
}

/**
 * 시술 추천 결과 타입 가드
 */
export function isProcedureRecommendation(
  result: AnalysisResult
): result is ProcedureRecommendationResult {
  return result.type === 'procedure';
}

/**
 * 운동 결과 타입 가드
 */
export function isWorkoutResult(
  result: AnalysisResult
): result is WorkoutResult {
  return result.type === 'workout';
}

/**
 * 스트레칭 결과 타입 가드
 */
export function isStretchingResult(
  result: AnalysisResult
): result is StretchingResult {
  return result.type === 'stretching';
}

// ============================================================
// 7. 분석 입력 타입
// ============================================================

/**
 * 기본 분석 입력 인터페이스
 */
export interface BaseAnalysisInput {
  /** Base64 인코딩된 이미지 (data:image/... 형식) */
  imageBase64: string;

  /** 분석 옵션 */
  options?: {
    /** Mock Fallback 허용 여부 */
    allowFallback?: boolean;
    /** 상세 분석 포함 여부 */
    includeDetails?: boolean;
    /** 추천 포함 여부 */
    includeRecommendations?: boolean;
  };
}

/**
 * 피부 분석 입력
 */
export interface SkinAnalysisInput extends BaseAnalysisInput {
  /** 존별 분석 포함 여부 */
  includeZoneAnalysis?: boolean;
}

/**
 * 퍼스널컬러 분석 입력
 */
export interface PersonalColorInput extends BaseAnalysisInput {
  /** 상세 증거 리포트 포함 여부 */
  includeEvidence?: boolean;
}

/**
 * 체형 분석 입력
 */
export interface BodyAnalysisInput extends BaseAnalysisInput {
  /** 사용자 키 (cm) - 정확한 비율 계산용 */
  heightCm?: number;
  /** 사용자 체중 (kg) */
  weightKg?: number;
}

/**
 * 운동 분석 입력
 */
export interface WorkoutAnalysisInput {
  /** 현재 피트니스 레벨 */
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  /** 운동 목표 */
  goals?: string[];
  /** 가용 시간 (분/일) */
  availableMinutesPerDay?: number;
  /** 운동 가능 요일 (0=일요일) */
  availableDays?: number[];
  /** 이용 가능한 장비 */
  availableEquipment?: string[];
  /** 부상/제한 사항 */
  limitations?: string[];
}
