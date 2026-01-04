/**
 * 광학적 드레이프 팔레트 모듈
 * @description PC-1+ 퍼스널컬러 진단용 드레이프 색상 - 광학적 속성 기반
 *
 * 단순 RGB가 아닌 광학적 수치로 피부톤과의 상호작용을 계산합니다:
 * - 반사율(Reflectance): 피부에서 반사되는 빛의 비율
 * - 흡수 계수(Absorption): 피부가 흡수하는 파장별 비율
 * - 산란 계수(Scattering): 피부 내부에서 산란되는 빛의 정도
 */

import type { DrapeColor, MetalType } from '@/types/visual-analysis';

// ============================================
// 광학 속성 타입 정의
// ============================================

/** 드레이프의 광학 속성 */
export interface DrapeOpticalProperties {
  /** RGB 색상값 */
  rgb: { r: number; g: number; b: number };
  /** HEX 색상 코드 */
  hex: string;
  /** 색상 이름 (한국어) */
  name: string;
  /** 소속 시즌 */
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  /**
   * 반사율 (0.0 ~ 1.0)
   * - 높을수록 피부에서 많이 반사됨 → 피부가 밝아보임
   * - 낮을수록 피부에 흡수됨 → 피부가 어두워보임
   */
  reflectance: number;
  /**
   * 웜톤 계수 (-1.0 ~ 1.0)
   * - 양수: 웜톤 (옐로 언더톤 강조)
   * - 음수: 쿨톤 (핑크/블루 언더톤 강조)
   */
  warmth: number;
  /**
   * 채도 부스트 (-0.5 ~ 0.5)
   * - 양수: 피부 채도 증가 (생기있게)
   * - 음수: 피부 채도 감소 (창백하게)
   */
  saturationBoost: number;
  /**
   * 뮤트 계수 (0.0 ~ 1.0)
   * - 높을수록 차분한/뮤트 톤
   * - 낮을수록 선명한/비비드 톤
   */
  muteness: number;
}

/** 피부톤 특성 (드레이프 매칭용) */
export interface SkinToneCharacteristics {
  /** 피부 밝기 (0.0 ~ 1.0) */
  brightness: number;
  /** 피부 웜톤 정도 (-1.0 ~ 1.0) */
  warmth: number;
  /** 피부 채도 (0.0 ~ 1.0) */
  saturation: number;
  /** 홍조 정도 (0.0 ~ 1.0) */
  redness: number;
  /** 멜라닌 농도 (0.0 ~ 1.0) */
  melanin: number;
}

/** 드레이프-피부 상호작용 결과 */
export interface DrapeInteractionResult {
  /** 드레이프 색상 */
  drape: DrapeOpticalProperties;
  /** 전체 조화 점수 (0-100) */
  harmonyScore: number;
  /** 밝기 효과 (-50 ~ +50) */
  brightnessEffect: number;
  /** 생기 효과 (-50 ~ +50) */
  vitalityEffect: number;
  /** 추천 여부 */
  recommended: boolean;
  /** 설명 */
  description: string;
}

// ============================================
// 시즌별 드레이프 팔레트 (광학 속성 포함)
// ============================================

/**
 * 봄 웜 팔레트 (Spring Warm)
 * - 높은 반사율 + 웜톤 + 높은 채도 부스트
 * - 밝고 화사한 색상
 */
export const SPRING_PALETTE: DrapeOpticalProperties[] = [
  {
    rgb: { r: 255, g: 224, b: 178 },
    hex: '#FFE0B2',
    name: '피치',
    season: 'spring',
    reflectance: 0.85,
    warmth: 0.7,
    saturationBoost: 0.3,
    muteness: 0.1,
  },
  {
    rgb: { r: 255, g: 183, b: 77 },
    hex: '#FFB74D',
    name: '아프리콧',
    season: 'spring',
    reflectance: 0.75,
    warmth: 0.8,
    saturationBoost: 0.4,
    muteness: 0.15,
  },
  {
    rgb: { r: 255, g: 213, b: 79 },
    hex: '#FFD54F',
    name: '선플라워',
    season: 'spring',
    reflectance: 0.88,
    warmth: 0.85,
    saturationBoost: 0.35,
    muteness: 0.1,
  },
  {
    rgb: { r: 129, g: 199, b: 132 },
    hex: '#81C784',
    name: '스프링 그린',
    season: 'spring',
    reflectance: 0.72,
    warmth: 0.3,
    saturationBoost: 0.25,
    muteness: 0.2,
  },
  {
    rgb: { r: 255, g: 138, b: 101 },
    hex: '#FF8A65',
    name: '코랄',
    season: 'spring',
    reflectance: 0.7,
    warmth: 0.75,
    saturationBoost: 0.45,
    muteness: 0.1,
  },
  {
    rgb: { r: 100, g: 181, b: 246 },
    hex: '#64B5F6',
    name: '스카이 블루',
    season: 'spring',
    reflectance: 0.78,
    warmth: -0.1,
    saturationBoost: 0.2,
    muteness: 0.15,
  },
  {
    rgb: { r: 255, g: 167, b: 38 },
    hex: '#FFA726',
    name: '망고',
    season: 'spring',
    reflectance: 0.73,
    warmth: 0.9,
    saturationBoost: 0.5,
    muteness: 0.05,
  },
  {
    rgb: { r: 240, g: 98, b: 146 },
    hex: '#F06292',
    name: '로즈 핑크',
    season: 'spring',
    reflectance: 0.68,
    warmth: 0.2,
    saturationBoost: 0.35,
    muteness: 0.1,
  },
];

/**
 * 여름 쿨 팔레트 (Summer Cool)
 * - 중간 반사율 + 쿨톤 + 낮은 뮤트
 * - 부드럽고 파스텔한 색상
 */
export const SUMMER_PALETTE: DrapeOpticalProperties[] = [
  {
    rgb: { r: 206, g: 147, b: 216 },
    hex: '#CE93D8',
    name: '라벤더',
    season: 'summer',
    reflectance: 0.72,
    warmth: -0.4,
    saturationBoost: 0.15,
    muteness: 0.45,
  },
  {
    rgb: { r: 144, g: 202, b: 249 },
    hex: '#90CAF9',
    name: '스카이 블루',
    season: 'summer',
    reflectance: 0.8,
    warmth: -0.35,
    saturationBoost: 0.1,
    muteness: 0.4,
  },
  {
    rgb: { r: 178, g: 223, b: 219 },
    hex: '#B2DFDB',
    name: '민트',
    season: 'summer',
    reflectance: 0.82,
    warmth: -0.2,
    saturationBoost: 0.1,
    muteness: 0.5,
  },
  {
    rgb: { r: 248, g: 187, b: 208 },
    hex: '#F8BBD0',
    name: '로즈 쿼츠',
    season: 'summer',
    reflectance: 0.85,
    warmth: -0.1,
    saturationBoost: 0.2,
    muteness: 0.55,
  },
  {
    rgb: { r: 197, g: 202, b: 233 },
    hex: '#C5CAE9',
    name: '퍼플 그레이',
    season: 'summer',
    reflectance: 0.78,
    warmth: -0.5,
    saturationBoost: 0.05,
    muteness: 0.6,
  },
  {
    rgb: { r: 176, g: 190, b: 197 },
    hex: '#B0BEC5',
    name: '블루 그레이',
    season: 'summer',
    reflectance: 0.7,
    warmth: -0.3,
    saturationBoost: -0.1,
    muteness: 0.65,
  },
  {
    rgb: { r: 255, g: 205, b: 210 },
    hex: '#FFCDD2',
    name: '블러쉬',
    season: 'summer',
    reflectance: 0.88,
    warmth: 0.1,
    saturationBoost: 0.15,
    muteness: 0.5,
  },
  {
    rgb: { r: 129, g: 212, b: 250 },
    hex: '#81D4FA',
    name: '아쿠아',
    season: 'summer',
    reflectance: 0.83,
    warmth: -0.25,
    saturationBoost: 0.2,
    muteness: 0.35,
  },
];

/**
 * 가을 웜 팔레트 (Autumn Warm)
 * - 낮은 반사율 + 웜톤 + 높은 뮤트
 * - 깊고 차분한 색상
 */
export const AUTUMN_PALETTE: DrapeOpticalProperties[] = [
  {
    rgb: { r: 188, g: 143, b: 143 },
    hex: '#BC8F8F',
    name: '로지 브라운',
    season: 'autumn',
    reflectance: 0.55,
    warmth: 0.5,
    saturationBoost: 0.1,
    muteness: 0.7,
  },
  {
    rgb: { r: 205, g: 133, b: 63 },
    hex: '#CD853F',
    name: '테라코타',
    season: 'autumn',
    reflectance: 0.52,
    warmth: 0.85,
    saturationBoost: 0.2,
    muteness: 0.55,
  },
  {
    rgb: { r: 143, g: 188, b: 143 },
    hex: '#8FBC8F',
    name: '세이지',
    season: 'autumn',
    reflectance: 0.6,
    warmth: 0.2,
    saturationBoost: 0.05,
    muteness: 0.65,
  },
  {
    rgb: { r: 184, g: 134, b: 11 },
    hex: '#B8860B',
    name: '머스타드',
    season: 'autumn',
    reflectance: 0.5,
    warmth: 0.9,
    saturationBoost: 0.25,
    muteness: 0.5,
  },
  {
    rgb: { r: 165, g: 42, b: 42 },
    hex: '#A52A2A',
    name: '버건디',
    season: 'autumn',
    reflectance: 0.35,
    warmth: 0.6,
    saturationBoost: 0.15,
    muteness: 0.45,
  },
  {
    rgb: { r: 139, g: 90, b: 43 },
    hex: '#8B5A2B',
    name: '카멜',
    season: 'autumn',
    reflectance: 0.45,
    warmth: 0.8,
    saturationBoost: 0.1,
    muteness: 0.6,
  },
  {
    rgb: { r: 128, g: 128, b: 0 },
    hex: '#808000',
    name: '올리브',
    season: 'autumn',
    reflectance: 0.42,
    warmth: 0.4,
    saturationBoost: 0.0,
    muteness: 0.75,
  },
  {
    rgb: { r: 210, g: 105, b: 30 },
    hex: '#D2691E',
    name: '시나몬',
    season: 'autumn',
    reflectance: 0.48,
    warmth: 0.85,
    saturationBoost: 0.3,
    muteness: 0.4,
  },
];

/**
 * 겨울 쿨 팔레트 (Winter Cool)
 * - 높은 대비 + 쿨톤 + 낮은 뮤트
 * - 선명하고 강렬한 색상
 */
export const WINTER_PALETTE: DrapeOpticalProperties[] = [
  {
    rgb: { r: 0, g: 0, b: 0 },
    hex: '#000000',
    name: '트루 블랙',
    season: 'winter',
    reflectance: 0.05,
    warmth: 0.0,
    saturationBoost: 0.0,
    muteness: 0.0,
  },
  {
    rgb: { r: 255, g: 255, b: 255 },
    hex: '#FFFFFF',
    name: '퓨어 화이트',
    season: 'winter',
    reflectance: 0.98,
    warmth: 0.0,
    saturationBoost: 0.0,
    muteness: 0.0,
  },
  {
    rgb: { r: 220, g: 20, b: 60 },
    hex: '#DC143C',
    name: '크림슨',
    season: 'winter',
    reflectance: 0.4,
    warmth: 0.3,
    saturationBoost: 0.5,
    muteness: 0.05,
  },
  {
    rgb: { r: 0, g: 0, b: 139 },
    hex: '#00008B',
    name: '네이비',
    season: 'winter',
    reflectance: 0.15,
    warmth: -0.7,
    saturationBoost: 0.2,
    muteness: 0.1,
  },
  {
    rgb: { r: 0, g: 128, b: 0 },
    hex: '#008000',
    name: '포레스트 그린',
    season: 'winter',
    reflectance: 0.25,
    warmth: -0.2,
    saturationBoost: 0.15,
    muteness: 0.2,
  },
  {
    rgb: { r: 138, g: 43, b: 226 },
    hex: '#8A2BE2',
    name: '로얄 퍼플',
    season: 'winter',
    reflectance: 0.3,
    warmth: -0.5,
    saturationBoost: 0.4,
    muteness: 0.1,
  },
  {
    rgb: { r: 255, g: 0, b: 255 },
    hex: '#FF00FF',
    name: '매젠타',
    season: 'winter',
    reflectance: 0.55,
    warmth: -0.3,
    saturationBoost: 0.6,
    muteness: 0.0,
  },
  {
    rgb: { r: 0, g: 255, b: 255 },
    hex: '#00FFFF',
    name: '시안',
    season: 'winter',
    reflectance: 0.75,
    warmth: -0.4,
    saturationBoost: 0.45,
    muteness: 0.0,
  },
];

/** 전체 드레이프 팔레트 */
export const FULL_DRAPE_PALETTE: DrapeOpticalProperties[] = [
  ...SPRING_PALETTE,
  ...SUMMER_PALETTE,
  ...AUTUMN_PALETTE,
  ...WINTER_PALETTE,
];

// ============================================
// 피부톤-드레이프 상호작용 계산
// ============================================

/**
 * 피부톤과 드레이프 간의 광학적 상호작용 계산
 *
 * 물리적 원리:
 * 1. 드레이프의 반사광이 피부에 미치는 밝기 효과
 * 2. 웜/쿨톤 매칭에 따른 조화도
 * 3. 채도 부스트에 따른 생기 효과
 * 4. 뮤트/비비드 매칭
 */
export function calculateDrapeInteraction(
  skin: SkinToneCharacteristics,
  drape: DrapeOpticalProperties
): DrapeInteractionResult {
  // 1. 밝기 효과 계산 (드레이프 반사율 × 피부 밝기 상호작용)
  // 밝은 피부는 반사율 높은 드레이프와 잘 맞음
  const brightnessMatch = 1 - Math.abs(skin.brightness - drape.reflectance) * 0.5;
  const brightnessEffect = (drape.reflectance - 0.5) * 50 * brightnessMatch;

  // 2. 웜/쿨톤 매칭 (가장 중요한 요소)
  // 피부 웜톤 = 드레이프 웜톤이면 조화
  const warmthDiff = Math.abs(skin.warmth - drape.warmth);
  const warmthScore = Math.max(0, 100 - warmthDiff * 80);

  // 3. 생기 효과 (채도 부스트 + 홍조 상호작용)
  // 홍조가 높으면 채도 부스트 낮은 색이 좋음
  const vitalityPenalty = skin.redness > 0.5 ? drape.saturationBoost * -30 : 0;
  const vitalityEffect = drape.saturationBoost * 40 + vitalityPenalty;

  // 4. 뮤트/비비드 매칭
  // 멜라닌이 높으면 뮤트 톤이 더 잘 어울림
  const mutePreference = skin.melanin * 0.5;
  const muteMatch = 1 - Math.abs(mutePreference - drape.muteness);
  const muteScore = muteMatch * 30;

  // 5. 채도 매칭
  // 피부 채도와 드레이프 채도 부스트 방향 일치
  const saturationMatch =
    skin.saturation > 0.5 ? drape.saturationBoost > 0 : drape.saturationBoost <= 0;
  const saturationScore = saturationMatch ? 20 : 0;

  // 전체 조화 점수 (가중 평균)
  const harmonyScore = Math.round(
    warmthScore * 0.4 + // 웜/쿨톤 매칭 40%
      brightnessMatch * 100 * 0.2 + // 밝기 매칭 20%
      muteScore * 0.25 + // 뮤트 매칭 25%
      saturationScore * 0.15 // 채도 매칭 15%
  );

  // 추천 여부 (70점 이상이면 추천)
  const recommended = harmonyScore >= 70;

  // 설명 생성
  const description = generateDescription(drape, harmonyScore, brightnessEffect, vitalityEffect);

  return {
    drape,
    harmonyScore: Math.min(100, Math.max(0, harmonyScore)),
    brightnessEffect: Math.round(brightnessEffect),
    vitalityEffect: Math.round(vitalityEffect),
    recommended,
    description,
  };
}

/**
 * 설명 텍스트 생성
 */
function generateDescription(
  drape: DrapeOpticalProperties,
  score: number,
  brightness: number,
  vitality: number
): string {
  const effects: string[] = [];

  if (brightness > 15) {
    effects.push('피부를 밝게');
  } else if (brightness < -15) {
    effects.push('피부를 차분하게');
  }

  if (vitality > 15) {
    effects.push('생기있게');
  } else if (vitality < -15) {
    effects.push('부드럽게');
  }

  const effectText =
    effects.length > 0 ? effects.join(', ') + ' 보이게 해요' : '자연스러운 조화를 이뤄요';

  if (score >= 85) {
    return `${drape.name}는 당신에게 최고의 선택! ${effectText}.`;
  } else if (score >= 70) {
    return `${drape.name}가 잘 어울려요. ${effectText}.`;
  } else if (score >= 50) {
    return `${drape.name}는 무난한 선택이에요.`;
  } else {
    return `${drape.name}는 피해보세요.`;
  }
}

// ============================================
// 시즌별 팔레트 분석
// ============================================

/**
 * 특정 시즌 팔레트로 피부톤 분석
 */
export function analyzeWithSeason(
  skin: SkinToneCharacteristics,
  season: 'spring' | 'summer' | 'autumn' | 'winter'
): DrapeInteractionResult[] {
  const palette = getSeasonPalette(season);
  return palette
    .map((drape) => calculateDrapeInteraction(skin, drape))
    .sort((a, b) => b.harmonyScore - a.harmonyScore);
}

/**
 * 전체 팔레트로 피부톤 분석 후 시즌 추천
 * (광학적 분석 - drape-reflectance의 analyzeFullPalette와 구분)
 */
export function analyzeFullPaletteOptical(skin: SkinToneCharacteristics): {
  recommendedSeason: 'spring' | 'summer' | 'autumn' | 'winter';
  seasonScores: Record<string, number>;
  topColors: DrapeInteractionResult[];
  avoidColors: DrapeInteractionResult[];
} {
  // 모든 드레이프 분석
  const allResults = FULL_DRAPE_PALETTE.map((drape) => calculateDrapeInteraction(skin, drape));

  // 시즌별 평균 점수 계산
  const seasonScores: Record<string, number> = {
    spring: calculateSeasonAverage(allResults, 'spring'),
    summer: calculateSeasonAverage(allResults, 'summer'),
    autumn: calculateSeasonAverage(allResults, 'autumn'),
    winter: calculateSeasonAverage(allResults, 'winter'),
  };

  // 최고 점수 시즌
  const recommendedSeason =
    (Object.entries(seasonScores).sort(([, a], [, b]) => b - a)[0][0] as
      | 'spring'
      | 'summer'
      | 'autumn'
      | 'winter') || 'spring';

  // 점수순 정렬
  const sorted = allResults.sort((a, b) => b.harmonyScore - a.harmonyScore);

  return {
    recommendedSeason,
    seasonScores,
    topColors: sorted.slice(0, 8), // 베스트 8
    avoidColors: sorted.slice(-4), // 피해야 할 4
  };
}

function calculateSeasonAverage(results: DrapeInteractionResult[], season: string): number {
  const seasonResults = results.filter((r) => r.drape.season === season);
  if (seasonResults.length === 0) return 0;
  return Math.round(
    seasonResults.reduce((sum, r) => sum + r.harmonyScore, 0) / seasonResults.length
  );
}

/**
 * 시즌별 팔레트 반환
 */
export function getSeasonPalette(
  season: 'spring' | 'summer' | 'autumn' | 'winter'
): DrapeOpticalProperties[] {
  switch (season) {
    case 'spring':
      return SPRING_PALETTE;
    case 'summer':
      return SUMMER_PALETTE;
    case 'autumn':
      return AUTUMN_PALETTE;
    case 'winter':
      return WINTER_PALETTE;
    default:
      return SPRING_PALETTE;
  }
}

// ============================================
// 금속(골드/실버) 테스트 광학 분석
// ============================================

/** 금속 광학 속성 */
export const METAL_OPTICAL_PROPERTIES: Record<
  MetalType,
  {
    reflectance: number;
    warmth: number;
    description: string;
  }
> = {
  gold: {
    reflectance: 0.65,
    warmth: 0.85,
    description: '따뜻한 황금빛 반사로 웜톤 피부를 화사하게',
  },
  silver: {
    reflectance: 0.75,
    warmth: -0.7,
    description: '차가운 은빛 반사로 쿨톤 피부를 맑게',
  },
};

/**
 * 금속 테스트 점수 계산
 */
export function calculateMetalScore(skin: SkinToneCharacteristics, metal: MetalType): number {
  const metalProps = METAL_OPTICAL_PROPERTIES[metal];

  // 웜/쿨톤 매칭이 핵심
  const warmthMatch = 1 - Math.abs(skin.warmth - metalProps.warmth);
  const brightnessMatch = 1 - Math.abs(skin.brightness - metalProps.reflectance) * 0.3;

  return Math.round(warmthMatch * 70 + brightnessMatch * 30);
}

/**
 * 골드 vs 실버 추천
 */
export function recommendMetal(skin: SkinToneCharacteristics): {
  recommended: MetalType;
  goldScore: number;
  silverScore: number;
  explanation: string;
} {
  const goldScore = calculateMetalScore(skin, 'gold');
  const silverScore = calculateMetalScore(skin, 'silver');

  const recommended = goldScore > silverScore ? 'gold' : 'silver';
  const diff = Math.abs(goldScore - silverScore);

  let explanation: string;
  if (diff < 10) {
    explanation = '골드와 실버 모두 잘 어울려요! 상황에 맞게 선택하세요.';
  } else if (recommended === 'gold') {
    explanation = '따뜻한 피부톤에 골드 주얼리가 화사함을 더해줘요.';
  } else {
    explanation = '차가운 피부톤에 실버 주얼리가 맑고 세련된 느낌을 줘요.';
  }

  return {
    recommended,
    goldScore,
    silverScore,
    explanation,
  };
}

// ============================================
// 이미지에서 피부톤 특성 추출 (Canvas 기반)
// ============================================

/**
 * 이미지 데이터에서 피부톤 특성 추출
 * @param imageData - 이미지 데이터
 * @param faceMask - 얼굴 마스크 (피부 영역만)
 * @param melaninAvg - 멜라닌 평균 (skin-heatmap에서 계산된 값)
 * @param hemoglobinAvg - 헤모글로빈 평균 (skin-heatmap에서 계산된 값)
 */
export function extractSkinToneFromImage(
  imageData: ImageData,
  faceMask: Uint8Array,
  melaninAvg: number = 0.5,
  hemoglobinAvg: number = 0.5
): SkinToneCharacteristics {
  const { data } = imageData;
  let rSum = 0,
    gSum = 0,
    bSum = 0;
  let count = 0;

  // 피부 영역의 평균 RGB 계산
  for (let i = 0; i < faceMask.length; i++) {
    if (faceMask[i] === 0) continue;

    const idx = i * 4;
    rSum += data[idx];
    gSum += data[idx + 1];
    bSum += data[idx + 2];
    count++;
  }

  if (count === 0) {
    // Fallback: 기본값 반환
    return {
      brightness: 0.5,
      warmth: 0.0,
      saturation: 0.3,
      redness: hemoglobinAvg,
      melanin: melaninAvg,
    };
  }

  const rAvg = rSum / count / 255;
  const gAvg = gSum / count / 255;
  const bAvg = bSum / count / 255;

  // 밝기 (Luminance)
  const brightness = 0.299 * rAvg + 0.587 * gAvg + 0.114 * bAvg;

  // 웜톤 계수 (R-B 차이 기반)
  // 양수면 웜톤 (빨강이 많음), 음수면 쿨톤 (파랑이 많음)
  const warmth = Math.max(-1, Math.min(1, (rAvg - bAvg) * 2));

  // 채도 (간이 계산)
  const max = Math.max(rAvg, gAvg, bAvg);
  const min = Math.min(rAvg, gAvg, bAvg);
  const saturation = max === 0 ? 0 : (max - min) / max;

  return {
    brightness,
    warmth,
    saturation,
    redness: hemoglobinAvg,
    melanin: melaninAvg,
  };
}

// ============================================
// DrapeColor 타입 호환 변환
// ============================================

/**
 * DrapeOpticalProperties를 DrapeColor로 변환 (기존 코드 호환용)
 */
export function toSimpleDrapeColor(drape: DrapeOpticalProperties): DrapeColor {
  return {
    hex: drape.hex,
    name: drape.name,
    season: drape.season,
  };
}

/**
 * 팔레트를 HEX 배열로 변환 (기존 analyzeFullPalette 호환용)
 */
export function paletteToHexArray(palette: DrapeOpticalProperties[]): string[] {
  return palette.map((d) => d.hex);
}
