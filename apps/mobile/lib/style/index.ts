/**
 * 스타일 프로필 매칭 모듈
 *
 * 색상 조합, 온도별 레이어링, 체형별 추천
 *
 * @module lib/style
 */

// ─── 타입 ────────────────────────────────────────────

export type TempLayer = 'extreme_cold' | 'very_cold' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
export type BodyTypeCode = 'S' | 'W' | 'N';

export interface TempLayerInfo {
  key: TempLayer;
  label: string;
  range: string;
  layers: string[];
  materials: string[];
}

export interface ColorCombination {
  primary: string;
  secondary: string;
  accent: string;
  label: string;
  harmony: 'complementary' | 'analogous' | 'triadic' | 'monochromatic';
}

export interface StyleRecommendation {
  outer: string[];
  top: string[];
  bottom: string[];
  accessory: string[];
  colors: string[];
  tip: string;
}

// ─── 온도별 레이어링 ──────────────────────────────────

export const TEMP_LAYERS: Record<TempLayer, TempLayerInfo> = {
  extreme_cold: {
    key: 'extreme_cold',
    label: '한파',
    range: '-10°C 이하',
    layers: ['패딩', '기모 니트', '히트텍', '목도리'],
    materials: ['구스다운', '양모', '기모 안감'],
  },
  very_cold: {
    key: 'very_cold',
    label: '매우 추움',
    range: '-5 ~ 0°C',
    layers: ['코트/패딩', '니트', '기모 이너'],
    materials: ['울', '캐시미어', '퍼'],
  },
  cold: {
    key: 'cold',
    label: '추움',
    range: '0 ~ 8°C',
    layers: ['코트', '니트', '셔츠'],
    materials: ['울', '코듀로이', '트위드'],
  },
  cool: {
    key: 'cool',
    label: '쌀쌀함',
    range: '8 ~ 15°C',
    layers: ['자켓/가디건', '긴팔', '얇은 레이어'],
    materials: ['면', '린넨 블렌드', '나일론'],
  },
  mild: {
    key: 'mild',
    label: '따뜻함',
    range: '15 ~ 22°C',
    layers: ['가디건/얇은 자켓', '긴팔/반팔'],
    materials: ['면', '저지', '린넨'],
  },
  warm: {
    key: 'warm',
    label: '더움',
    range: '22 ~ 28°C',
    layers: ['반팔', '반바지/치마'],
    materials: ['면', '린넨', '시어서커'],
  },
  hot: {
    key: 'hot',
    label: '무더위',
    range: '28°C 이상',
    layers: ['민소매/반팔', '숏팬츠/린넨 팬츠'],
    materials: ['린넨', '쿨맥스', '메쉬'],
  },
};

/**
 * 체감 온도로 레이어 결정
 */
export function determineLayer(feelsLike: number): TempLayerInfo {
  if (feelsLike < -10) return TEMP_LAYERS.extreme_cold;
  if (feelsLike < 0) return TEMP_LAYERS.very_cold;
  if (feelsLike < 8) return TEMP_LAYERS.cold;
  if (feelsLike < 15) return TEMP_LAYERS.cool;
  if (feelsLike < 22) return TEMP_LAYERS.mild;
  if (feelsLike < 28) return TEMP_LAYERS.warm;
  return TEMP_LAYERS.hot;
}

// ─── 체형별 추천 ──────────────────────────────────────

export const OUTER_BY_BODY_TYPE: Record<BodyTypeCode, string[]> = {
  S: ['A라인 코트', '크롭 자켓', '페플럼 자켓'],
  W: ['스트레이트 코트', 'H라인 코트', '트렌치코트'],
  N: ['오버핏 코트', '박시 자켓', '바머 자켓'],
};

export const TOP_BY_BODY_TYPE: Record<BodyTypeCode, string[]> = {
  S: ['퍼프 소매', '프릴 블라우스', '크롭 탑'],
  W: ['V넥', '랩 탑', '스트레이트 실루엣'],
  N: ['오버사이즈 티', '루즈핏 니트', '드롭 숄더'],
};

export const BOTTOM_BY_BODY_TYPE: Record<BodyTypeCode, string[]> = {
  S: ['하이웨이스트', 'A라인 스커트', '와이드 팬츠'],
  W: ['스트레이트 팬츠', '미디 스커트', '부츠컷'],
  N: ['슬림핏 팬츠', '테이퍼드 팬츠', '미니 스커트'],
};

/**
 * 체형별 스타일 추천
 */
export function getBodyTypeRecommendation(bodyType: BodyTypeCode): StyleRecommendation {
  return {
    outer: OUTER_BY_BODY_TYPE[bodyType],
    top: TOP_BY_BODY_TYPE[bodyType],
    bottom: BOTTOM_BY_BODY_TYPE[bodyType],
    accessory: getAccessoryRecommendation(bodyType),
    colors: [],
    tip: getBodyTypeTip(bodyType),
  };
}

// ─── 퍼스널컬러 팔레트 ───────────────────────────────

export const COLOR_PALETTES: Record<string, string[]> = {
  spring_warm: ['#FF6B6B', '#FFA07A', '#FFD700', '#98FB98', '#87CEEB'],
  spring_light: ['#FFB6C1', '#FFDAB9', '#FFFACD', '#E0FFE0', '#B0E0E6'],
  summer_cool: ['#6B8E9F', '#8E8E9F', '#B0C4DE', '#D8BFD8', '#C8A2C8'],
  summer_mute: ['#9FB6CD', '#B0B0B0', '#D8CAD8', '#C0D8C0', '#B5B5DC'],
  autumn_warm: ['#8B4513', '#CD853F', '#DAA520', '#556B2F', '#8B6914'],
  autumn_deep: ['#800000', '#8B4513', '#2F4F4F', '#4B0082', '#191970'],
  winter_cool: ['#000000', '#FFFFFF', '#0000CD', '#DC143C', '#008000'],
  winter_bright: ['#FF0000', '#0000FF', '#FFD700', '#00FF00', '#FF00FF'],
};

/**
 * 퍼스널컬러에 맞는 코디 색상
 */
export function getColorPaletteForSeason(
  season: string,
  subType?: string
): string[] {
  const key = subType ? `${season}_${subType}` : `${season}_warm`;
  return COLOR_PALETTES[key] ?? COLOR_PALETTES[`${season}_cool`] ?? [];
}

// ─── 색상 조합 ────────────────────────────────────────

/**
 * 색상 조합 추천
 */
export function getColorCombinations(baseColor: string): ColorCombination[] {
  // 기본 조합 패턴 (hex 기반 간단 로직)
  return [
    {
      primary: baseColor,
      secondary: '#FFFFFF',
      accent: '#000000',
      label: '모노크롬',
      harmony: 'monochromatic',
    },
    {
      primary: baseColor,
      secondary: '#F5F5DC',
      accent: '#2C3E50',
      label: '내추럴',
      harmony: 'analogous',
    },
    {
      primary: baseColor,
      secondary: '#333333',
      accent: '#FFD700',
      label: '모던 포인트',
      harmony: 'complementary',
    },
  ];
}

// ─── 내부 유틸리티 ────────────────────────────────────

function getAccessoryRecommendation(bodyType: BodyTypeCode): string[] {
  switch (bodyType) {
    case 'S': return ['체인 벨트', '스카프', '미디엄 토트백'];
    case 'W': return ['롱 목걸이', '구조적 가방', '와이드 벨트'];
    case 'N': return ['레이어드 목걸이', '오버사이즈 클러치', '볼드 이어링'];
  }
}

function getBodyTypeTip(bodyType: BodyTypeCode): string {
  switch (bodyType) {
    case 'S': return '허리 라인을 강조하면 S라인이 더 돋보여요';
    case 'W': return '세로 라인과 모노톤으로 슬림한 실루엣을 연출해보세요';
    case 'N': return '어깨와 힙 라인을 활용한 오버핏이 잘 어울려요';
  }
}
