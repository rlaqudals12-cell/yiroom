/**
 * 옷장 아이템 매칭 로직
 * 퍼스널컬러, 체형, 날씨 기반으로 사용자 옷장에서 어울리는 아이템 추천
 */

import type {
  InventoryItem,
  ClothingItem,
  ClothingCategory,
  Season,
  Occasion,
} from './index';
import { toClothingItem } from './index';

// 체형 타입 (3-type 시스템)
export type BodyType3 = 'S' | 'W' | 'N';

// 퍼스널컬러 타입
export type PersonalColorSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

// ============================================================
// 퍼스널컬러 색상 매핑
// ============================================================

const COLOR_KEYWORDS: Record<PersonalColorSeason, string[]> = {
  Spring: [
    '코랄',
    '피치',
    '살몬',
    '아이보리',
    '오렌지',
    '민트',
    '베이지',
    '카키',
    '브라운',
    '크림',
    '화이트',
    '골드',
    'coral',
    'peach',
    'ivory',
    'orange',
    'mint',
    'beige',
    'khaki',
    'brown',
    'cream',
    'white',
    'gold',
    'warm',
  ],
  Summer: [
    '라벤더',
    '로즈',
    '핑크',
    '스카이',
    '민트',
    '그레이',
    '네이비',
    '화이트',
    '실버',
    '파스텔',
    'lavender',
    'rose',
    'pink',
    'sky',
    'mint',
    'gray',
    'grey',
    'navy',
    'white',
    'silver',
    'pastel',
    'cool',
    'soft',
  ],
  Autumn: [
    '테라코타',
    '머스타드',
    '올리브',
    '버건디',
    '캐멀',
    '브릭',
    '브라운',
    '카키',
    '네이비',
    '골드',
    'terracotta',
    'mustard',
    'olive',
    'burgundy',
    'camel',
    'brick',
    'brown',
    'khaki',
    'navy',
    'gold',
    'warm',
    'deep',
  ],
  Winter: [
    '화이트',
    '블랙',
    '로얄',
    '블루',
    '에메랄드',
    '핫핑크',
    '버건디',
    '네이비',
    '차콜',
    '실버',
    'white',
    'black',
    'royal',
    'blue',
    'emerald',
    'pink',
    'burgundy',
    'navy',
    'charcoal',
    'silver',
    'vivid',
    'cool',
  ],
};

const AVOID_COLOR_KEYWORDS: Record<PersonalColorSeason, string[]> = {
  Spring: [
    '블랙',
    '다크',
    '버건디',
    '차가운',
    'black',
    'dark',
    'burgundy',
    'cool',
  ],
  Summer: [
    '오렌지',
    '머스타드',
    '테라코타',
    '브라운',
    'orange',
    'mustard',
    'terracotta',
    'brown',
    'warm',
  ],
  Autumn: [
    '핑크',
    '퓨시아',
    '파스텔',
    '네온',
    'pink',
    'fuchsia',
    'pastel',
    'neon',
    'bright',
  ],
  Winter: [
    '베이지',
    '머스타드',
    '살몬',
    '오렌지',
    'beige',
    'mustard',
    'salmon',
    'orange',
    'warm',
    'muted',
  ],
};

// ============================================================
// 체형별 추천
// ============================================================

const BODY_TYPE_RECOMMENDATIONS: Record<
  BodyType3,
  Record<ClothingCategory, string[]>
> = {
  // Straight (I라인 실루엣)
  S: {
    outer: ['트렌치코트', '싱글 코트', '블레이저', '자켓'],
    top: ['셔츠', '니트', '맨투맨', '블라우스'],
    bottom: ['슬랙스', '청바지', '면바지'],
    dress: ['원피스', '점프수트'],
    shoes: ['로퍼', '스니커즈', '부츠'],
    bag: ['토트백', '크로스백', '숄더백'],
    accessory: ['시계', '벨트', '선글라스'],
  },
  // Wave (X라인 실루엣)
  W: {
    outer: ['핏티드', 'A라인', '벨티드', '가디건'],
    top: ['크롭', '페플럼', '블라우스', '니트'],
    bottom: ['하이웨이스트', 'A라인', '플레어', '스커트'],
    dress: ['원피스', '투피스'],
    shoes: ['힐', '로퍼', '스니커즈'],
    bag: ['숄더백', '클러치', '크로스백'],
    accessory: ['주얼리', '스카프', '벨트'],
  },
  // Natural (루즈핏 실루엣)
  N: {
    outer: ['오버핏', '봄버', '가디건', '패딩'],
    top: ['오버사이즈', '루즈핏', '드롭숄더', '맨투맨'],
    bottom: ['조거', '와이드', '루즈핏', '청바지'],
    dress: ['원피스', '점프수트'],
    shoes: ['스니커즈', '부츠', '샌들'],
    bag: ['백팩', '토트백', '에코백'],
    accessory: ['모자', '선글라스', '시계'],
  },
};

// ============================================================
// 계절별 소재
// ============================================================

const SEASON_MATERIAL_KEYWORDS: Record<Season, string[]> = {
  spring: ['면', '린넨', '얇은', 'cotton', 'linen', 'light'],
  summer: ['린넨', '면', '시원한', '통기성', 'linen', 'cotton', 'breathable'],
  autumn: [
    '울',
    '니트',
    '스웨이드',
    '가죽',
    'wool',
    'knit',
    'suede',
    'leather',
  ],
  winter: ['울', '캐시미어', '패딩', '플리스', 'wool', 'cashmere', 'fleece'],
};

// ============================================================
// 유틸리티 함수
// ============================================================

function getSeasonFromTemp(temp: number): Season {
  if (temp >= 23) return 'summer';
  if (temp >= 15) return 'spring';
  if (temp >= 5) return 'autumn';
  return 'winter';
}

// ============================================================
// 점수 계산 함수
// ============================================================

function calculateColorMatchScore(
  itemColors: string[],
  personalColor: PersonalColorSeason
): number {
  if (!itemColors || itemColors.length === 0) return 50;

  const goodKeywords = COLOR_KEYWORDS[personalColor];
  const badKeywords = AVOID_COLOR_KEYWORDS[personalColor];

  let score = 50;

  for (const color of itemColors) {
    const lowerColor = color.toLowerCase();

    const goodMatch = goodKeywords.some(
      (keyword) =>
        lowerColor.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(lowerColor)
    );
    if (goodMatch) score += 25;

    const badMatch = badKeywords.some(
      (keyword) =>
        lowerColor.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(lowerColor)
    );
    if (badMatch) score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateBodyTypeMatchScore(
  item: ClothingItem,
  bodyType: BodyType3
): number {
  const category = item.subCategory;
  const recommendations = BODY_TYPE_RECOMMENDATIONS[bodyType][category];

  if (!recommendations) return 50;

  const itemName = item.name.toLowerCase();
  const matchCount = recommendations.filter((rec) =>
    itemName.includes(rec.toLowerCase())
  ).length;

  return Math.min(100, 50 + matchCount * 20);
}

function calculateSeasonMatchScore(
  item: ClothingItem,
  targetSeason: Season
): number {
  const metadata = item.metadata;

  if (metadata.season && metadata.season.length > 0) {
    if (metadata.season.includes(targetSeason)) return 100;
    const adjacentSeasons: Record<Season, Season[]> = {
      spring: ['summer', 'autumn'],
      summer: ['spring'],
      autumn: ['spring', 'winter'],
      winter: ['autumn'],
    };
    if (
      metadata.season.some((s) => adjacentSeasons[targetSeason].includes(s))
    ) {
      return 70;
    }
    return 30;
  }

  const materialKeywords = SEASON_MATERIAL_KEYWORDS[targetSeason];
  const itemName = item.name.toLowerCase();

  const materialMatch = materialKeywords.some((keyword) =>
    itemName.includes(keyword.toLowerCase())
  );

  return materialMatch ? 80 : 50;
}

// ============================================================
// 공개 API
// ============================================================

export interface MatchScore {
  total: number;
  colorScore: number;
  bodyTypeScore: number;
  seasonScore: number;
}

export interface MatchOptions {
  personalColor?: PersonalColorSeason | null;
  bodyType?: BodyType3 | null;
  season?: Season | null;
  temp?: number | null;
  occasion?: Occasion | null;
}

/**
 * 아이템 종합 매칭 점수 계산
 */
export function calculateMatchScore(
  item: InventoryItem,
  options: MatchOptions
): MatchScore {
  const clothingItem = toClothingItem(item);
  const metadata = clothingItem.metadata;

  const colorScore = options.personalColor
    ? calculateColorMatchScore(metadata.color, options.personalColor)
    : 50;

  const bodyTypeScore = options.bodyType
    ? calculateBodyTypeMatchScore(clothingItem, options.bodyType)
    : 50;

  const targetSeason =
    options.season || (options.temp ? getSeasonFromTemp(options.temp) : null);
  const seasonScore = targetSeason
    ? calculateSeasonMatchScore(clothingItem, targetSeason)
    : 50;

  let occasionBonus = 0;
  if (options.occasion && metadata.occasion?.includes(options.occasion)) {
    occasionBonus = 10;
  }

  const weights = {
    color: 0.35,
    bodyType: 0.25,
    season: 0.4,
  };

  const total = Math.round(
    colorScore * weights.color +
      bodyTypeScore * weights.bodyType +
      seasonScore * weights.season +
      occasionBonus
  );

  return {
    total: Math.min(100, total),
    colorScore,
    bodyTypeScore,
    seasonScore,
  };
}

export interface ClosetRecommendation {
  item: InventoryItem;
  score: MatchScore;
  reasons: string[];
}

/**
 * 옷장에서 매칭되는 아이템 추천
 */
export function recommendFromCloset(
  items: InventoryItem[],
  options: MatchOptions & { category?: ClothingCategory | null; limit?: number }
): ClosetRecommendation[] {
  let filtered = items.filter((item) => item.category === 'closet');
  if (options.category) {
    filtered = filtered.filter((item) => item.subCategory === options.category);
  }

  const scored = filtered.map((item) => {
    const score = calculateMatchScore(item, options);
    const reasons: string[] = [];

    if (score.colorScore >= 70 && options.personalColor) {
      reasons.push(`${options.personalColor} 컬러와 잘 어울려요`);
    }
    if (score.bodyTypeScore >= 70 && options.bodyType) {
      const bodyTypeNames: Record<BodyType3, string> = {
        S: '스트레이트',
        W: '웨이브',
        N: '내추럴',
      };
      reasons.push(`${bodyTypeNames[options.bodyType]} 체형에 추천`);
    }
    if (score.seasonScore >= 80) {
      reasons.push('현재 계절에 적합해요');
    }

    if (reasons.length === 0) {
      reasons.push('기본 추천');
    }

    return { item, score, reasons };
  });

  scored.sort((a, b) => b.score.total - a.score.total);

  return scored.slice(0, options.limit || 10);
}

export interface OutfitSuggestion {
  outer?: ClosetRecommendation;
  top: ClosetRecommendation;
  bottom: ClosetRecommendation;
  shoes?: ClosetRecommendation;
  bag?: ClosetRecommendation;
  accessory?: ClosetRecommendation;
  totalScore: number;
  tips: string[];
}

/**
 * 코디 조합 추천
 */
export function suggestOutfitFromCloset(
  items: InventoryItem[],
  options: MatchOptions
): OutfitSuggestion | null {
  const closetItems = items.filter((item) => item.category === 'closet');

  if (closetItems.length === 0) return null;

  const season = options.temp ? getSeasonFromTemp(options.temp) : null;
  const needsOuter = options.temp != null && options.temp < 15;

  const getTopRecommendation = (category: ClothingCategory) => {
    const recs = recommendFromCloset(closetItems, {
      ...options,
      season,
      category,
      limit: 1,
    });
    return recs[0] || null;
  };

  const top = getTopRecommendation('top');
  const bottom = getTopRecommendation('bottom');

  if (!top || !bottom) return null;

  const outer = needsOuter ? getTopRecommendation('outer') : undefined;
  const shoes = getTopRecommendation('shoes');
  const bag = getTopRecommendation('bag');
  const accessory = getTopRecommendation('accessory');

  const scores = [top.score.total, bottom.score.total];
  if (outer) scores.push(outer.score.total);
  if (shoes) scores.push(shoes.score.total);

  const totalScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  const tips: string[] = [];

  if (options.personalColor) {
    tips.push(`${options.personalColor} 톤의 색상을 중심으로 코디했어요`);
  }

  if (options.bodyType) {
    const tipsByBodyType: Record<BodyType3, string> = {
      S: 'I라인 실루엣으로 깔끔하게 연출해요',
      W: '허리 라인을 강조해 여성스럽게',
      N: '루즈한 핏으로 편안하면서 세련되게',
    };
    tips.push(tipsByBodyType[options.bodyType]);
  }

  if (options.temp != null) {
    if (options.temp < 5) {
      tips.push('추운 날씨에요. 레이어드를 추천해요');
    } else if (options.temp > 28) {
      tips.push('더운 날씨에요. 통기성 좋은 소재로');
    }
  }

  return {
    outer: outer || undefined,
    top,
    bottom,
    shoes: shoes || undefined,
    bag: bag || undefined,
    accessory: accessory || undefined,
    totalScore,
    tips,
  };
}

export interface RecommendationSummary {
  wellMatched: number;
  needsImprovement: number;
  suggestions: string[];
}

/**
 * 카테고리별 추천 요약
 */
export function getRecommendationSummary(
  items: InventoryItem[],
  options: {
    personalColor?: PersonalColorSeason | null;
    bodyType?: BodyType3 | null;
  }
): RecommendationSummary {
  const closetItems = items.filter((item) => item.category === 'closet');

  let wellMatched = 0;
  let needsImprovement = 0;
  const missingCategories: ClothingCategory[] = [];

  const categoryCount: Record<string, number> = {};

  for (const item of closetItems) {
    const score = calculateMatchScore(item, options);
    if (score.total >= 70) {
      wellMatched++;
    } else if (score.total < 50) {
      needsImprovement++;
    }

    categoryCount[item.subCategory || 'unknown'] =
      (categoryCount[item.subCategory || 'unknown'] || 0) + 1;
  }

  const essentialCategories: ClothingCategory[] = [
    'outer',
    'top',
    'bottom',
    'shoes',
  ];
  for (const cat of essentialCategories) {
    if (!categoryCount[cat] || categoryCount[cat] < 2) {
      missingCategories.push(cat);
    }
  }

  const suggestions: string[] = [];
  if (missingCategories.length > 0) {
    const categoryNames: Record<ClothingCategory, string> = {
      outer: '아우터',
      top: '상의',
      bottom: '하의',
      dress: '원피스',
      shoes: '신발',
      bag: '가방',
      accessory: '액세서리',
    };
    suggestions.push(
      `${missingCategories.map((c) => categoryNames[c]).join(', ')}이 부족해요`
    );
  }

  if (options.personalColor && wellMatched < closetItems.length * 0.3) {
    suggestions.push(
      `${options.personalColor} 톤에 어울리는 옷을 추가해보세요`
    );
  }

  return {
    wellMatched,
    needsImprovement,
    suggestions,
  };
}
