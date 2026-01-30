/**
 * M-1 메이크업 분석 타입 정의
 *
 * @description 퍼스널컬러 연계 메이크업 추천 시스템
 * @see docs/specs/SDD-MAKEUP-ANALYSIS.md
 */

// =============================================================================
// 기본 타입
// =============================================================================

/**
 * 언더톤 타입
 */
export type UndertoneType = 'warm' | 'cool' | 'neutral';

/**
 * 눈 모양 타입
 */
export type EyeShapeType =
  | 'monolid'      // 무쌍
  | 'double'       // 유쌍
  | 'hooded'       // 속쌍
  | 'round'        // 둥근 눈
  | 'almond'       // 아몬드형
  | 'downturned';  // 처진 눈

/**
 * 입술 모양 타입
 */
export type LipShapeType =
  | 'full'         // 도톰한 입술
  | 'thin'         // 얇은 입술
  | 'wide'         // 넓은 입술
  | 'small'        // 작은 입술
  | 'heart'        // 하트형
  | 'asymmetric';  // 비대칭

/**
 * 얼굴형 (메이크업 컨투어링용)
 */
export type FaceShapeType = 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';

/**
 * 메이크업 스타일
 */
export type MakeupStyleType = 'natural' | 'glam' | 'cute' | 'chic' | 'vintage' | 'edgy';

/**
 * 메이크업 관련 피부 고민
 */
export type MakeupConcernType =
  | 'dark-circles'    // 다크서클
  | 'redness'         // 홍조
  | 'uneven-tone'     // 피부톤 불균일
  | 'large-pores'     // 넓은 모공
  | 'oily-tzone'      // T존 번들거림
  | 'dry-patches'     // 건조 부위
  | 'acne-scars'      // 트러블 흔적
  | 'fine-lines';     // 잔주름

/**
 * 메이크업 카테고리
 */
export type MakeupCategoryType = 'foundation' | 'lip' | 'eyeshadow' | 'blush' | 'contour';

// =============================================================================
// 라벨 상수
// =============================================================================

export const UNDERTONE_LABELS: Record<UndertoneType, string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '뉴트럴',
};

export const EYE_SHAPE_LABELS: Record<EyeShapeType, string> = {
  monolid: '무쌍',
  double: '유쌍',
  hooded: '속쌍',
  round: '둥근 눈',
  almond: '아몬드형',
  downturned: '처진 눈',
};

export const LIP_SHAPE_LABELS: Record<LipShapeType, string> = {
  full: '도톰한 입술',
  thin: '얇은 입술',
  wide: '넓은 입술',
  small: '작은 입술',
  heart: '하트형',
  asymmetric: '비대칭',
};

export const FACE_SHAPE_LABELS: Record<FaceShapeType, string> = {
  oval: '계란형',
  round: '둥근형',
  square: '각진형',
  heart: '하트형',
  oblong: '긴 얼굴',
  diamond: '다이아몬드',
};

export const MAKEUP_STYLE_LABELS: Record<MakeupStyleType, string> = {
  natural: '내추럴',
  glam: '글램',
  cute: '큐트',
  chic: '시크',
  vintage: '빈티지',
  edgy: '엣지',
};

export const MAKEUP_CONCERN_LABELS: Record<MakeupConcernType, string> = {
  'dark-circles': '다크서클',
  redness: '홍조',
  'uneven-tone': '피부톤 불균일',
  'large-pores': '넓은 모공',
  'oily-tzone': 'T존 번들거림',
  'dry-patches': '건조 부위',
  'acne-scars': '트러블 흔적',
  'fine-lines': '잔주름',
};

export const MAKEUP_CATEGORY_LABELS: Record<MakeupCategoryType, string> = {
  foundation: '파운데이션',
  lip: '립',
  eyeshadow: '아이섀도',
  blush: '블러셔',
  contour: '컨투어',
};

// =============================================================================
// 인터페이스
// =============================================================================

/**
 * 메이크업 분석 지표
 */
export interface MakeupMetric {
  id: string;
  label: string;
  value: number;
  status: 'good' | 'normal' | 'warning';
  description: string;
}

/**
 * 색상 추천
 */
export interface ColorRecommendation {
  category: MakeupCategoryType;
  categoryLabel: string;
  colors: {
    name: string;
    hex: string;
    description: string;
  }[];
}

/**
 * 메이크업 팁
 */
export interface MakeupTip {
  category: string;
  tips: string[];
}

/**
 * 퍼스널컬러 연동 정보
 */
export interface PersonalColorConnection {
  season: string;
  compatibility: 'high' | 'medium' | 'low';
  note: string;
}

/**
 * M-1 메이크업 분석 결과
 */
export interface MakeupAnalysisResult {
  id: string;

  // 기본 분석
  undertone: UndertoneType;
  undertoneLabel: string;
  eyeShape: EyeShapeType;
  eyeShapeLabel: string;
  lipShape: LipShapeType;
  lipShapeLabel: string;
  faceShape: FaceShapeType;
  faceShapeLabel: string;

  // 점수
  overallScore: number;
  metrics: MakeupMetric[];

  // 고민 및 인사이트
  concerns: MakeupConcernType[];
  insight: string;

  // 추천
  recommendedStyles: MakeupStyleType[];
  colorRecommendations: ColorRecommendation[];
  makeupTips: MakeupTip[];

  // 퍼스널컬러 연동
  personalColorConnection?: PersonalColorConnection;

  // 메타데이터
  analyzedAt: string;
  analysisReliability: 'high' | 'medium' | 'low';
  usedFallback: boolean;
}

/**
 * M-1 분석 입력
 */
export interface MakeupAnalysisInput {
  imageBase64: string;
  personalColorSeason?: string;
  useMock?: boolean;
}
