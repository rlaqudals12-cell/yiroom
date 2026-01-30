/**
 * Personal Color V2 타입 정의
 * Lab 12톤 분류 시스템
 *
 * @description PC-2 퍼스널컬러 분석 v2
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 * @see docs/principles/color-science.md
 */

/** Lab 색공간 좌표 */
export interface LabColor {
  /** 밝기 (0-100) */
  L: number;
  /** 녹색-빨강 축 (-128 ~ 127) */
  a: number;
  /** 파랑-노랑 축 (-128 ~ 127) */
  b: number;
}

/** RGB 색상 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/** XYZ 색공간 (중간 변환용) */
export interface XYZColor {
  X: number;
  Y: number;
  Z: number;
}

/** 시즌 타입 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** 서브타입 (깊이/채도 변형) */
export type Subtype = 'light' | 'true' | 'bright' | 'muted' | 'deep';

/** 12톤 타입 */
export type TwelveTone =
  | 'light-spring'
  | 'true-spring'
  | 'bright-spring'
  | 'light-summer'
  | 'true-summer'
  | 'muted-summer'
  | 'muted-autumn'
  | 'true-autumn'
  | 'deep-autumn'
  | 'deep-winter'
  | 'true-winter'
  | 'bright-winter';

/** 웜톤/쿨톤 분류 */
export type Undertone = 'warm' | 'cool' | 'neutral';

/** 색상 조화 타입 */
export type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary';

/** 12톤 분류 결과 */
export interface TwelveToneClassificationResult {
  /** 분류된 12톤 */
  tone: TwelveTone;
  /** 시즌 */
  season: Season;
  /** 서브타입 */
  subtype: Subtype;
  /** 언더톤 */
  undertone: Undertone;
  /** 분류 신뢰도 (0-100) */
  confidence: number;
  /** 각 12톤별 거리/점수 */
  toneScores: Record<TwelveTone, number>;
  /** Lab 측정값 */
  measuredLab: LabColor;
}

/** 톤별 추천 팔레트 */
export interface TonePalette {
  /** 톤 ID */
  tone: TwelveTone;
  /** 메인 컬러 (6개) */
  mainColors: string[];
  /** 포인트 컬러 (4개) */
  accentColors: string[];
  /** 피해야 할 색상 (4개) */
  avoidColors: string[];
  /** 립 컬러 추천 */
  lipColors: string[];
  /** 아이섀도 추천 */
  eyeshadowColors: string[];
  /** 블러쉬 추천 */
  blushColors: string[];
}

/** PC-2 분석 입력 */
export interface PersonalColorV2Input {
  /** Base64 인코딩 이미지 */
  imageBase64: string;
  /** 분석 옵션 */
  options?: {
    /** 상세 분석 포함 여부 */
    includeDetailedAnalysis?: boolean;
    /** 팔레트 추천 포함 여부 */
    includePaletteRecommendations?: boolean;
  };
}

/** PC-2 분석 결과 */
export interface PersonalColorV2Result {
  /** 결과 ID */
  id: string;
  /** 12톤 분류 결과 */
  classification: TwelveToneClassificationResult;
  /** 추천 팔레트 */
  palette: TonePalette;
  /** 상세 분석 (선택적) */
  detailedAnalysis?: {
    /** 피부톤 Lab */
    skinToneLab: LabColor;
    /** 머리카락 색상 Lab */
    hairColorLab?: LabColor;
    /** 눈 색상 Lab */
    eyeColorLab?: LabColor;
    /** 색상 대비 레벨 */
    contrastLevel: 'low' | 'medium' | 'high';
    /** 채도 특성 */
    saturationLevel: 'muted' | 'medium' | 'bright';
    /** 명도 특성 */
    valueLevel: 'light' | 'medium' | 'deep';
  };
  /** 스타일링 추천 */
  stylingRecommendations: {
    /** 의류 색상 추천 */
    clothing: string[];
    /** 액세서리 금속 추천 */
    metals: ('gold' | 'silver' | 'rose-gold')[];
    /** 주얼리 컬러 추천 */
    jewelry: string[];
  };
  /** 분석 시간 */
  analyzedAt: string;
  /** Mock fallback 사용 여부 */
  usedFallback: boolean;
}

/** 한국인 피부톤 조정 파라미터 */
export const KOREAN_ADJUSTMENTS = {
  /** 웜/쿨 경계 b값 (한국인 기준) */
  warmCoolThresholdB: 19,
  /** 웜/쿨 경계 Hue 각도 */
  warmCoolThresholdHue: 60,
  /** 밝기 조정 (한국인 평균 피부톤 기준) */
  lightnessOffset: 2,
  /** 채도 가중치 */
  chromaWeight: 1.1,
} as const;

/** 12톤 기준 Lab 값 */
export const TWELVE_TONE_REFERENCE_LAB: Record<TwelveTone, LabColor> = {
  'light-spring': { L: 75, a: 8, b: 22 },
  'true-spring': { L: 68, a: 12, b: 28 },
  'bright-spring': { L: 70, a: 15, b: 32 },
  'light-summer': { L: 72, a: 5, b: 12 },
  'true-summer': { L: 65, a: 8, b: 10 },
  'muted-summer': { L: 60, a: 6, b: 8 },
  'muted-autumn': { L: 55, a: 10, b: 18 },
  'true-autumn': { L: 52, a: 14, b: 24 },
  'deep-autumn': { L: 45, a: 12, b: 20 },
  'deep-winter': { L: 40, a: 6, b: 4 },
  'true-winter': { L: 50, a: 4, b: 2 },
  'bright-winter': { L: 55, a: 8, b: 6 },
};

/** 시즌별 특성 설명 */
export const SEASON_DESCRIPTIONS: Record<Season, string> = {
  spring: '따뜻하고 밝은 색상이 어울리는 웜톤',
  summer: '부드럽고 차분한 색상이 어울리는 쿨톤',
  autumn: '깊고 풍부한 색상이 어울리는 웜톤',
  winter: '선명하고 대비가 강한 색상이 어울리는 쿨톤',
};

/** 12톤별 한국어 라벨 */
export const TWELVE_TONE_LABELS: Record<TwelveTone, string> = {
  'light-spring': '라이트 스프링',
  'true-spring': '트루 스프링',
  'bright-spring': '브라이트 스프링',
  'light-summer': '라이트 서머',
  'true-summer': '트루 서머',
  'muted-summer': '뮤티드 서머',
  'muted-autumn': '뮤티드 오텀',
  'true-autumn': '트루 오텀',
  'deep-autumn': '딥 오텀',
  'deep-winter': '딥 윈터',
  'true-winter': '트루 윈터',
  'bright-winter': '브라이트 윈터',
};
