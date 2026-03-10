/**
 * Skin Analysis V2 타입 정의
 * 6존 고도화 피부 분석
 *
 * @description S-2 피부분석 v2
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 * @see docs/principles/skin-physiology.md
 */

/** 피부 존 타입 (7개 영역) */
export type SkinZoneType =
  | 'forehead'    // 이마
  | 'nose'        // 코
  | 'leftCheek'   // 왼쪽 볼
  | 'rightCheek'  // 오른쪽 볼
  | 'chin'        // 턱
  | 'eyeArea'     // 눈가
  | 'lipArea';    // 입술 주변

/** 존 그룹 (분석 단위) */
export type ZoneGroup = 'tZone' | 'uZone' | 'eyeZone' | 'lipZone';

/** 존 그룹 매핑 */
export const ZONE_GROUP_MAPPING: Record<SkinZoneType, ZoneGroup> = {
  forehead: 'tZone',
  nose: 'tZone',
  leftCheek: 'uZone',
  rightCheek: 'uZone',
  chin: 'uZone',
  eyeArea: 'eyeZone',
  lipArea: 'lipZone',
};

/** 존 한국어 라벨 */
export const ZONE_LABELS: Record<SkinZoneType, string> = {
  forehead: '이마',
  nose: '코',
  leftCheek: '왼쪽 볼',
  rightCheek: '오른쪽 볼',
  chin: '턱',
  eyeArea: '눈가',
  lipArea: '입술 주변',
};

/** GLCM (Gray Level Co-occurrence Matrix) 결과 */
export interface GLCMResult {
  /** 대비 (contrast) - 인접 픽셀 간 강도 차이 */
  contrast: number;
  /** 동질성 (homogeneity) - 텍스처 균일성 */
  homogeneity: number;
  /** 에너지 - 텍스처 균일성의 제곱합 */
  energy: number;
  /** 상관관계 - 픽셀 값 간 선형 의존성 */
  correlation: number;
  /** 엔트로피 - 텍스처 복잡도 */
  entropy: number;
}

/** LBP (Local Binary Pattern) 결과 */
export interface LBPResult {
  /** LBP 히스토그램 (256 bins) */
  histogram: number[];
  /** 균일 패턴 비율 */
  uniformPatternRatio: number;
  /** 텍스처 거칠기 점수 */
  roughnessScore: number;
}

/** 텍스처 분석 결과 */
export interface TextureAnalysis {
  /** GLCM 결과 */
  glcm: GLCMResult;
  /** LBP 결과 */
  lbp: LBPResult;
  /** 모공 점수 (0-100, 높을수록 좋음) */
  poreScore: number;
  /** 주름 점수 (0-100, 높을수록 좋음) */
  wrinkleScore: number;
  /** 결 점수 (0-100, 높을수록 좋음) */
  textureScore: number;
}

/** 존별 메트릭스 */
export interface ZoneMetricsV2 {
  /** 수분도 (0-100) */
  hydration: number;
  /** 유분도 (0-100) */
  oiliness: number;
  /** 모공 상태 (0-100, 높을수록 좋음) */
  pores: number;
  /** 피부결 (0-100, 높을수록 좋음) */
  texture: number;
  /** 색소침착 (0-100, 높을수록 좋음) */
  pigmentation: number;
  /** 민감도 (0-100, 낮을수록 좋음) */
  sensitivity: number;
  /** 탄력 (0-100) */
  elasticity: number;
}

/** 존별 상세 분석 */
export interface ZoneAnalysisV2 {
  /** 존 타입 */
  zone: SkinZoneType;
  /** 존 그룹 */
  group: ZoneGroup;
  /** 종합 점수 (0-100) */
  score: number;
  /** 이전 점수 (비교용) */
  previousScore?: number;
  /** 상세 메트릭스 */
  metrics: ZoneMetricsV2;
  /** 텍스처 분석 */
  textureAnalysis: TextureAnalysis;
  /** 감지된 문제점 */
  concerns: string[];
  /** 케어 추천 */
  recommendations: string[];
}

/** 6존 분석 결과 */
export interface SixZoneAnalysisV2 {
  /** 전체 존 분석 */
  zones: Record<SkinZoneType, ZoneAnalysisV2>;
  /** 존 그룹별 평균 */
  groupAverages: Record<ZoneGroup, number>;
  /** T존-U존 유분 차이 */
  tUzoneDifference: {
    oilinessDiff: number;
    hydrationDiff: number;
    isCombiSkin: boolean;
  };
}

/** 피부 타입 */
export type SkinTypeV2 =
  | 'dry'          // 건성
  | 'oily'         // 지성
  | 'combination'  // 복합성
  | 'normal'       // 정상
  | 'sensitive';   // 민감성

/** 피부 타입 라벨 */
export const SKIN_TYPE_LABELS: Record<SkinTypeV2, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  normal: '정상',
  sensitive: '민감성',
};

/** 스킨케어 루틴 추천 */
export interface SkinCareRoutineRecommendation {
  /** 루틴 단계 */
  step: number;
  /** 카테고리 */
  category: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'mask' | 'treatment';
  /** 추천 사유 */
  reason: string;
  /** 추천 성분 */
  ingredients: string[];
  /** 피해야 할 성분 */
  avoidIngredients: string[];
  /** 타겟 존 */
  targetZones?: SkinZoneType[];
}

/** S-2 분석 입력 */
export interface SkinAnalysisV2Input {
  /** Base64 인코딩 이미지 */
  imageBase64: string;
  /** 분석 옵션 */
  options?: {
    /** 텍스처 분석 포함 */
    includeTextureAnalysis?: boolean;
    /** 루틴 추천 포함 */
    includeRoutineRecommendation?: boolean;
    /** 비교할 이전 분석 ID */
    previousAnalysisId?: string;
  };
}

/** S-2 분석 결과 */
export interface SkinAnalysisV2Result {
  /** 결과 ID */
  id: string;
  /** 피부 타입 */
  skinType: SkinTypeV2;
  /** 종합 바이탈리티 점수 (0-100) */
  vitalityScore: number;
  /** 바이탈리티 등급 */
  vitalityGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  /** 6존 분석 */
  zoneAnalysis: SixZoneAnalysisV2;
  /** 점수 구성 요소 */
  scoreBreakdown: {
    hydration: number;
    elasticity: number;
    clarity: number;
    tone: number;
  };
  /** 주요 피부 고민 */
  primaryConcerns: string[];
  /** 스킨케어 루틴 추천 */
  routineRecommendations?: SkinCareRoutineRecommendation[];
  /** 이전 분석 대비 변화 */
  changeFromPrevious?: {
    vitalityScoreChange: number;
    improvedZones: SkinZoneType[];
    worsenedZones: SkinZoneType[];
  };
  /** 분석 시간 */
  analyzedAt: string;
  /** Mock fallback 사용 여부 */
  usedFallback: boolean;
}

/** 바이탈리티 등급 기준 */
export const VITALITY_GRADE_THRESHOLDS = {
  S: 90,  // 90+ → S
  A: 75,  // 75-89 → A
  B: 60,  // 60-74 → B
  C: 40,  // 40-59 → C
  D: 0,   // 0-39 → D
} as const;

/** 피부 상태별 추천 성분 */
export const RECOMMENDED_INGREDIENTS: Record<string, string[]> = {
  dryness: ['히알루론산', '세라마이드', '스쿠알란', '글리세린'],
  oiliness: ['나이아신아마이드', '살리실산', '티트리오일', '아연'],
  wrinkles: ['레티놀', '펩타이드', '비타민C', '아데노신'],
  pigmentation: ['비타민C', '알부틴', '나이아신아마이드', '감초추출물'],
  sensitivity: ['판테놀', '알란토인', '마데카소사이드', '녹차추출물'],
  pores: ['BHA', 'PHA', '클레이', '나이아신아마이드'],
};

/** 피해야 할 성분 */
export const AVOID_INGREDIENTS: Record<string, string[]> = {
  sensitive: ['알코올', '향료', 'SLS', '레티놀(고농도)'],
  dry: ['알코올', '강한 계면활성제', '아스트린젠트'],
  oily: ['미네랄오일', '실리콘(과다)', '코코넛오일'],
};
