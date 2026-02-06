/**
 * 크로스 모듈 연동 인터페이스 (Cross-Module Integration Types)
 *
 * P8 원칙: 모듈 간 명시적 인터페이스 정의
 * - 각 모듈은 공개 API만 노출하고 내부 구현은 숨긴다
 * - 모듈 간 데이터 전달은 이 파일의 인터페이스를 통해서만 진행
 *
 * @module lib/shared/integration-types
 * @version 2.0
 * @created 2026-01-23
 * @updated 2026-01-24
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md
 */

// =============================================================================
// 공통 타입 정의
// =============================================================================

/** Lab 색공간 좌표 */
export interface LabColor {
  L: number; // 0-100 (명도)
  a: number; // -128 to +127 (적-녹)
  b: number; // -128 to +127 (황-청)
}

/** RGB 색상 (0-255) */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/** XYZ 색공간 (중간 변환용, D65 정규화) */
export interface XYZColor {
  X: number;
  Y: number;
  Z: number;
}

/** 퍼스널컬러 시즌 */
export type PersonalColorSeason = 'spring' | 'summer' | 'autumn' | 'winter';

/** 시즌 서브타입 */
export type SeasonSubType = 'light' | 'true' | 'dark' | 'bright' | 'muted';

/** 피부 고민 유형 */
export type SkinConcern =
  | 'acne'
  | 'wrinkles'
  | 'pigmentation'
  | 'redness'
  | 'pores'
  | 'dullness'
  | 'dryness'
  | 'oiliness'
  | 'sensitivity';

/** 자세 유형 */
export type PostureType =
  | 'normal'
  | 'forward_head'
  | 'rounded_shoulders'
  | 'lordosis'
  | 'kyphosis'
  | 'scoliosis'
  | 'anterior_pelvic_tilt'
  | 'posterior_pelvic_tilt';

/** Janda 증후군 유형 */
export interface JandaSyndrome {
  type: 'UCS' | 'LCS' | 'mixed' | 'none';
  severity: 'mild' | 'moderate' | 'severe';
}

/** 불균형 부위 */
export interface ImbalanceArea {
  region: 'neck' | 'shoulder' | 'upper_back' | 'lower_back' | 'hip' | 'knee' | 'ankle';
  type: 'tight' | 'weak' | 'asymmetric';
  side?: 'left' | 'right' | 'both';
  severity: number; // 0-100
}

/** 잇몸 건강 상태 */
export interface GumHealth {
  status: 'healthy' | 'mild_gingivitis' | 'moderate_gingivitis' | 'severe_inflammation';
  inflammationScore: number; // 0-100
  aStarAverage: number; // Lab a* 평균
}

// =============================================================================
// S-2 → SK-1 연동 (피부분석 → 시술추천)
// =============================================================================

/**
 * S-2(피부분석)에서 SK-1(시술추천)으로 전달되는 데이터
 *
 * @description 피부 상태 분석 결과를 기반으로 적합한 시술 추천
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 * @see docs/specs/SDD-SK-1-PROCEDURE-RECOMMENDATION.md
 */
export interface S2ToSK1IntegrationData {
  /** 피츠패트릭 피부 타입 (1-6) */
  fitzpatrickType: 1 | 2 | 3 | 4 | 5 | 6;

  /** 피부 고민 목록 (우선순위순) */
  skinConcerns: SkinConcern[];

  /** 민감도 수준 */
  sensitivityLevel: 'low' | 'medium' | 'high';

  /** 추정 피부 나이 (선택) */
  estimatedSkinAge?: number;

  /** T존 유분도 (0-100) */
  tZoneOiliness?: number;

  /** U존 수분도 (0-100) */
  uZoneHydration?: number;

  /** 피부 장벽 상태 점수 (0-100) */
  barrierScore?: number;

  /** 모공 크기 점수 (0-100, 높을수록 큼) */
  poreScore?: number;

  /** 색소침착 점수 (0-100) */
  pigmentationScore?: number;

  /** 분석 신뢰도 */
  confidence: number;
}

/**
 * SK-1에서 반환하는 시술 추천 결과
 */
export interface SK1ProcedureRecommendation {
  procedureId: string;
  nameKo: string;
  nameEn: string;
  category: 'laser' | 'injection' | 'rf_hifu' | 'skincare';
  matchScore: number; // 0-100
  targetConcerns: SkinConcern[];
  contraindications: string[];
  estimatedSessions: number;
  recoveryDays: number;
  priceRange: { min: number; max: number };
}

// =============================================================================
// C-2 → W-2 연동 (체형분석 → 스트레칭)
// =============================================================================

/**
 * C-2(체형분석)에서 W-2(스트레칭)로 전달되는 데이터
 *
 * @description 자세 불균형 분석 결과를 기반으로 맞춤 스트레칭 추천
 * @see docs/specs/SDD-BODY-ANALYSIS-v2.md
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 */
export interface C2ToW2IntegrationData {
  /** 주요 자세 유형 */
  postureType: PostureType;

  /** 불균형 부위 목록 */
  imbalanceAreas: ImbalanceArea[];

  /** Janda 증후군 판정 */
  jandaSyndrome: JandaSyndrome;

  /** 좌우 비대칭 점수 (0-100, 높을수록 비대칭) */
  asymmetryScore: number;

  /** 유연성 제한 부위 */
  flexibilityLimitations?: string[];

  /** 분석 신뢰도 */
  confidence: number;
}

/**
 * W-2에서 반환하는 스트레칭 추천 결과
 */
export interface W2StretchingRecommendation {
  stretchId: string;
  nameKo: string;
  nameEn: string;
  targetMuscles: string[];
  targetPosture: PostureType[];
  duration: number; // seconds
  repetitions: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  priority: number; // 1-10 (높을수록 중요)
}

// =============================================================================
// PC-2 → M-1 연동 (퍼스널컬러 → 메이크업)
// =============================================================================

/**
 * PC-2(퍼스널컬러)에서 M-1(메이크업)으로 전달되는 데이터
 *
 * @description 퍼스널컬러 분석 결과를 기반으로 메이크업 색상 추천
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 * @see docs/specs/SDD-MAKEUP-ANALYSIS.md
 */
export interface PC2ToM1IntegrationData {
  /** 메인 시즌 */
  season: PersonalColorSeason;

  /** 서브 타입 */
  subType: SeasonSubType;

  /** 추천 색상 팔레트 (Lab) */
  recommendedColors: LabColor[];

  /** 피해야 할 색상 (Lab) */
  avoidColors: LabColor[];

  /** 피부 톤 */
  skinTone: 'warm' | 'cool' | 'neutral';

  /** 대비 수준 */
  contrastLevel: 'low' | 'medium' | 'high';

  /** 베스트 립 컬러 (Lab) */
  bestLipColors?: LabColor[];

  /** 베스트 아이섀도 (Lab) */
  bestEyeshadowColors?: LabColor[];

  /** 분석 신뢰도 */
  confidence: number;
}

/**
 * M-1에서 반환하는 메이크업 추천 결과
 */
export interface M1MakeupRecommendation {
  productId: string;
  category: 'lip' | 'eyeshadow' | 'blush' | 'foundation';
  colorLab: LabColor;
  colorHex: string;
  matchScore: number; // 0-100
  seasonHarmony: string;
}

// =============================================================================
// PC-2 → H-1 연동 (퍼스널컬러 → 헤어)
// =============================================================================

/**
 * PC-2(퍼스널컬러)에서 H-1(헤어)으로 전달되는 데이터
 *
 * @description 퍼스널컬러를 기반으로 헤어 컬러 추천
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */
export interface PC2ToH1IntegrationData {
  /** 메인 시즌 */
  season: PersonalColorSeason;

  /** 서브 타입 */
  subType: SeasonSubType;

  /** 피부 톤 */
  skinTone: 'warm' | 'cool' | 'neutral';

  /** 추천 헤어 컬러 레벨 범위 */
  recommendedLevelRange: { min: number; max: number }; // 1-10 레벨

  /** 추천 언더톤 */
  recommendedUndertone: 'warm' | 'cool' | 'neutral';

  /** 분석 신뢰도 */
  confidence: number;
}

/**
 * H-1에서 반환하는 헤어 컬러 추천 결과
 */
export interface H1HairColorRecommendation {
  colorId: string;
  nameKo: string;
  level: number; // 1-10
  undertone: 'warm' | 'cool' | 'neutral';
  labColor: LabColor;
  matchScore: number;
  seasonHarmony: string;
}

// =============================================================================
// OH-1 → N-1 연동 (구강건강 → 영양)
// =============================================================================

/**
 * OH-1(구강건강)에서 N-1(영양)으로 전달되는 데이터
 *
 * @description 구강 건강 상태를 기반으로 영양 보충 추천
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 * @see docs/specs/SDD-N1-NUTRITION.md
 */
export interface OH1ToN1IntegrationData {
  /** 잇몸 건강 상태 */
  gumHealth: GumHealth;

  /** 염증 점수 (0-100) */
  inflammationScore: number;

  /** 치아 착색 수준 */
  toothStaining: 'none' | 'mild' | 'moderate' | 'severe';

  /** 충치 위험도 */
  cavityRisk: 'low' | 'medium' | 'high';

  /** 치주 상태 */
  periodontalStatus?: 'healthy' | 'gingivitis' | 'periodontitis';

  /** 분석 신뢰도 */
  confidence: number;
}

/**
 * N-1에서 반환하는 구강 건강 관련 영양 추천
 */
export interface N1OralNutritionRecommendation {
  nutrientId: string;
  nameKo: string;
  nameEn: string;
  category: 'vitamin' | 'mineral' | 'antioxidant' | 'probiotic';
  dailyDose: string;
  benefits: string[];
  targetCondition: string;
  foodSources: string[];
  priority: number; // 1-10
}

// =============================================================================
// S-2 → M-1 연동 (피부분석 → 메이크업)
// =============================================================================

/**
 * S-2(피부분석)에서 M-1(메이크업)으로 전달되는 데이터
 *
 * @description 피부 상태를 기반으로 파운데이션/베이스 추천
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 * @see docs/specs/SDD-MAKEUP-ANALYSIS.md
 */
export interface S2ToM1IntegrationData {
  /** 피부 타입 */
  skinType: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';

  /** T존 유분도 (0-100) */
  tZoneOiliness: number;

  /** 모공 가시성 점수 (0-100) */
  poreVisibility: number;

  /** 민감도 수준 */
  sensitivityLevel: 'low' | 'medium' | 'high';

  /** 피부 톤 (Lab) */
  skinToneLab: LabColor;

  /** 분석 신뢰도 */
  confidence: number;
}

// =============================================================================
// 공통 응답 래퍼
// =============================================================================

/**
 * 크로스 모듈 연동 응답 래퍼
 */
export interface CrossModuleResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    sourceModule: string;
    targetModule: string;
    processedAt: string;
    latencyMs: number;
  };
}

// =============================================================================
// 연동 매핑 규칙
// =============================================================================

/**
 * 모듈 간 연동 방향 정의
 *
 * 단방향 의존성 규칙 (P8):
 * - 상위 모듈 → 하위 모듈 방향만 허용
 * - 역방향 호출 금지
 */
export const MODULE_DEPENDENCIES = {
  'S-2': ['SK-1', 'M-1'], // 피부분석 → 시술추천, 메이크업
  'C-2': ['W-2'], // 체형분석 → 스트레칭
  'PC-2': ['M-1', 'H-1'], // 퍼스널컬러 → 메이크업, 헤어
  'OH-1': ['N-1'], // 구강건강 → 영양
} as const;

/**
 * 연동 데이터 타입 매핑
 */
export type IntegrationDataMap = {
  'S-2→SK-1': S2ToSK1IntegrationData;
  'S-2→M-1': S2ToM1IntegrationData;
  'C-2→W-2': C2ToW2IntegrationData;
  'PC-2→M-1': PC2ToM1IntegrationData;
  'PC-2→H-1': PC2ToH1IntegrationData;
  'OH-1→N-1': OH1ToN1IntegrationData;
  'CIE-3→Analysis': CIE3ToAnalysisData;
  'CIE-4→Analysis': CIE4ToAnalysisData;
};

// =============================================================================
// 연동 메타데이터 (Integration Metadata)
// =============================================================================

/**
 * 연동 데이터 메타정보
 *
 * @description 모든 연동 데이터에 포함되는 버전/시간 정보
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md Section 4
 */
export interface IntegrationMetadata {
  /** 연동 스키마 버전 (semver) */
  schemaVersion: string;

  /** 소스 모듈 버전 (예: "PC-2@1.1") */
  sourceModuleVersion: string;

  /** 데이터 생성 시각 (ISO 8601) */
  generatedAt: string;

  /** 데이터 만료 시각 (선택, ISO 8601) */
  expiresAt?: string;
}

// =============================================================================
// CIE-3 → 분석 모듈 연동 (AWB 보정 → Analysis)
// =============================================================================

/**
 * CIE-3(AWB 보정)에서 분석 모듈로 전달되는 데이터
 *
 * @description 자동 화이트 밸런스 보정 결과를 분석 모듈에 전달
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 */
export interface CIE3ToAnalysisData {
  /** 보정된 이미지 (Base64) */
  correctedImageBase64: string;

  /** 원본 색온도 (Kelvin) */
  originalColorTemp: number;

  /** 보정 후 색온도 (Kelvin, 목표: 5500K D55) */
  correctedColorTemp: number;

  /** 보정 적용 여부 */
  correctionApplied: boolean;

  /** 사용된 AWB 방법 */
  awbMethod: 'gray_world' | 'von_kries' | 'retinex' | 'combined' | 'none';

  /** 보정 강도 (0-100) */
  correctionStrength?: number;
}

// =============================================================================
// CIE-4 → 분석 모듈 연동 (조명 분석 → Analysis)
// =============================================================================

/**
 * CIE-4(조명 분석)에서 분석 모듈로 전달되는 데이터
 *
 * @description 조명 환경 분석 결과와 신뢰도 보정 계수 전달
 * @see docs/specs/SDD-CIE-4-LIGHTING-ANALYSIS.md
 */
export interface CIE4ToAnalysisData {
  /** 조명 품질 등급 */
  lightingQuality: 'excellent' | 'good' | 'acceptable' | 'poor';

  /** 조명 균일도 점수 (0-100, 높을수록 균일) */
  uniformityScore: number;

  /** 그림자 비율 (0-100, 낮을수록 좋음) */
  shadowRatio: number;

  /** 측정된 색온도 (Kelvin) */
  colorTemperature: number;

  /** 신뢰도 보정 계수 (0.5-1.0, 분석 신뢰도에 곱함) */
  confidenceModifier: number;

  /** 권장 액션 */
  recommendAction: 'proceed' | 'warn' | 'reject';

  /** 조명 문제점 (있는 경우) */
  lightingIssues?: LightingIssue[];
}

/** 조명 문제 유형 */
export interface LightingIssue {
  type: 'uneven' | 'too_dark' | 'too_bright' | 'color_cast' | 'harsh_shadow';
  severity: 'low' | 'medium' | 'high';
  region?: string;
  suggestion?: string;
}

// =============================================================================
// CIE-1 → 분석 모듈 연동 (품질 검증 → Analysis)
// =============================================================================

/**
 * CIE-1(이미지 품질 검증)에서 분석 모듈로 전달되는 데이터
 *
 * @description 이미지 품질 검증 결과
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 */
export interface CIE1ToAnalysisData {
  /** 품질 검증 통과 여부 */
  isValid: boolean;

  /** 선명도 점수 (Laplacian variance, 0-100) */
  sharpness: number;

  /** 해상도 */
  resolution: {
    width: number;
    height: number;
  };

  /** 품질 문제점 목록 */
  qualityIssues: QualityIssue[];

  /** 전체 품질 점수 (0-100) */
  overallScore: number;
}

/** 품질 문제 유형 */
export interface QualityIssue {
  type: 'blur' | 'low_resolution' | 'overexposed' | 'underexposed' | 'noise';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// =============================================================================
// CIE-2 → 분석 모듈 연동 (얼굴 감지 → Analysis)
// =============================================================================

/**
 * CIE-2(얼굴 감지)에서 분석 모듈로 전달되는 데이터
 *
 * @description 얼굴 랜드마크 및 영역 정보
 * @see docs/specs/SDD-CIE-2-FACE-DETECTION.md
 */
export interface CIE2ToAnalysisData {
  /** 얼굴 감지 여부 */
  detected: boolean;

  /** 얼굴 랜드마크 (468점 MediaPipe 또는 68점 dlib) */
  landmarks: FaceLandmark[];

  /** 얼굴 바운딩 박스 */
  faceBox: BoundingBox;

  /** 얼굴 각도 (roll, pitch, yaw) */
  faceAngle: {
    roll: number; // 좌우 기울기 (도)
    pitch: number; // 상하 기울기 (도)
    yaw: number; // 좌우 회전 (도)
  };

  /** 감지 신뢰도 (0-100) */
  confidence: number;

  /** 감지된 얼굴 수 */
  faceCount: number;
}

/** 얼굴 랜드마크 포인트 */
export interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** 바운딩 박스 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// 연동 이벤트 (Integration Events)
// =============================================================================

/**
 * 연동 이벤트 타입
 *
 * @description 모듈 간 상태 변경 알림을 위한 이벤트 타입
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md Section 3.1
 */
export type IntegrationEventType =
  | 'PC2_RESULT_SAVED'
  | 'S2_RESULT_SAVED'
  | 'C2_RESULT_SAVED'
  | 'OH1_RESULT_SAVED'
  | 'CIE1_VALIDATION_COMPLETE'
  | 'CIE2_DETECTION_COMPLETE'
  | 'CIE3_CORRECTION_COMPLETE'
  | 'CIE4_ANALYSIS_COMPLETE'
  | 'M1_RECOMMENDATION_GENERATED'
  | 'SK1_RECOMMENDATION_GENERATED'
  | 'H1_RECOMMENDATION_GENERATED'
  | 'W2_PLAN_GENERATED'
  | 'N1_RECOMMENDATION_GENERATED';

/**
 * 연동 이벤트 페이로드
 *
 * @description Push 방식 연동에서 사용되는 이벤트 구조
 */
export interface IntegrationEvent<T = unknown> {
  /** 이벤트 타입 */
  type: IntegrationEventType;

  /** 사용자 ID (clerk_user_id) */
  userId: string;

  /** 이벤트 발생 시각 (ISO 8601) */
  timestamp: string;

  /** 이벤트 데이터 */
  data: T;

  /** 메타데이터 */
  metadata: IntegrationMetadata;
}

// =============================================================================
// 연동 결과 래퍼 (Integration Result Wrapper)
// =============================================================================

/**
 * 연동 데이터 조회 결과
 *
 * @description Pull 방식 연동에서 반환되는 결과 구조
 */
export interface IntegrationResult<T> {
  /** 연동 데이터 */
  data: T;

  /** 캐시에서 조회 여부 */
  fromCache?: boolean;

  /** 기본값 사용 여부 */
  usedDefault?: boolean;

  /** 분석 필요 여부 (데이터 없음) */
  requiresAnalysis?: boolean;

  /** 재분석 권장 여부 (데이터 오래됨) */
  suggestReanalysis?: boolean;

  /** 일시적 실패 여부 */
  temporaryFailure?: boolean;
}

// =============================================================================
// 연동 에러 (Integration Errors)
// =============================================================================

/**
 * 연동 에러 코드
 */
export type IntegrationErrorCode =
  | 'INTEGRATION_DATA_NOT_FOUND'
  | 'INTEGRATION_DATA_EXPIRED'
  | 'INTEGRATION_SCHEMA_MISMATCH'
  | 'INTEGRATION_TIMEOUT'
  | 'INTEGRATION_VALIDATION_ERROR'
  | 'INTEGRATION_UNAUTHORIZED'
  | 'INTEGRATION_RATE_LIMITED';

/**
 * 연동 에러 인터페이스
 */
export interface IntegrationErrorInfo {
  code: IntegrationErrorCode;
  message: string;
  sourceModule?: string;
  targetModule?: string;
  context?: Record<string, unknown>;
}

// =============================================================================
// 기본값 정의 (Default Values)
// =============================================================================

/**
 * 연동 기본값 맵
 *
 * @description 소스 데이터 없을 때 사용하는 Fallback 값
 */
export const DEFAULT_INTEGRATION_DATA: Partial<IntegrationDataMap> = {
  'S-2→SK-1': {
    fitzpatrickType: 3,
    skinConcerns: [],
    sensitivityLevel: 'medium',
    confidence: 50,
  } as S2ToSK1IntegrationData,

  'S-2→M-1': {
    skinType: 'combination',
    tZoneOiliness: 50,
    poreVisibility: 50,
    sensitivityLevel: 'medium',
    skinToneLab: { L: 70, a: 8, b: 18 },
    confidence: 50,
  } as S2ToM1IntegrationData,

  'PC-2→M-1': {
    season: 'summer',
    subType: 'muted',
    recommendedColors: [],
    avoidColors: [],
    skinTone: 'neutral',
    contrastLevel: 'medium',
    confidence: 50,
  } as PC2ToM1IntegrationData,

  'PC-2→H-1': {
    season: 'summer',
    subType: 'muted',
    skinTone: 'neutral',
    recommendedLevelRange: { min: 4, max: 7 },
    recommendedUndertone: 'neutral',
    confidence: 50,
  } as PC2ToH1IntegrationData,

  'C-2→W-2': {
    postureType: 'normal',
    imbalanceAreas: [],
    jandaSyndrome: { type: 'none', severity: 'mild' },
    asymmetryScore: 0,
    confidence: 50,
  } as C2ToW2IntegrationData,

  'OH-1→N-1': {
    gumHealth: {
      status: 'healthy',
      inflammationScore: 0,
      aStarAverage: 5,
    },
    inflammationScore: 0,
    toothStaining: 'none',
    cavityRisk: 'low',
    confidence: 50,
  } as OH1ToN1IntegrationData,
};

// =============================================================================
// 소스 모듈 정의 (Source Module Definition)
// =============================================================================

/**
 * 소스 모듈 식별자
 */
export type SourceModule =
  | 'PC-1'
  | 'PC-2'
  | 'S-1'
  | 'S-2'
  | 'C-1'
  | 'C-2'
  | 'OH-1'
  | 'CIE-1'
  | 'CIE-2'
  | 'CIE-3'
  | 'CIE-4';

/**
 * 타겟 모듈 식별자
 */
export type TargetModule = 'M-1' | 'H-1' | 'SK-1' | 'W-2' | 'N-1' | 'Report';

/**
 * 모듈 의존성 정의
 */
export const MODULE_INTEGRATION_MAP: Record<SourceModule, TargetModule[]> = {
  'PC-1': ['M-1', 'H-1'],
  'PC-2': ['M-1', 'H-1'],
  'S-1': ['SK-1', 'M-1'],
  'S-2': ['SK-1', 'M-1', 'Report'],
  'C-1': ['W-2'],
  'C-2': ['W-2', 'Report'],
  'OH-1': ['N-1', 'Report'],
  'CIE-1': [],
  'CIE-2': [],
  'CIE-3': [],
  'CIE-4': [],
};
