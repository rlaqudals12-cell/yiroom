/**
 * 옷장 아이템 매칭 로직
 *
 * 퍼스널컬러, 체형, 날씨 기반으로 사용자 옷장에서 어울리는 아이템 추천
 *
 * @module lib/inventory/closetMatcher
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 3.0
 */

import type {
  InventoryItem,
  ClothingItem,
  ClothingCategory,
  Season,
  Occasion,
} from '@/types/inventory';
import { toClothingItem } from '@/types/inventory';
import type { PersonalColorSeason } from '@/lib/color-recommendations';
import {
  type StyleCategory,
  STYLE_CATEGORY_KEYWORDS,
  TREND_BONUS_2026,
  isTrendItem2026,
} from '@/lib/fashion';

// 체형 타입
export type BodyType3 = 'S' | 'W' | 'N';

// 퍼스널컬러별 어울리는 색상 키워드
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

// 퍼스널컬러별 피해야 할 색상 키워드
const AVOID_COLOR_KEYWORDS: Record<PersonalColorSeason, string[]> = {
  Spring: ['블랙', '다크', '버건디', '차가운', 'black', 'dark', 'burgundy', 'cool'],
  Summer: ['오렌지', '머스타드', '테라코타', '브라운', 'orange', 'mustard', 'terracotta', 'brown', 'warm'],
  Autumn: ['핑크', '퓨시아', '파스텔', '네온', 'pink', 'fuchsia', 'pastel', 'neon', 'bright'],
  Winter: ['베이지', '머스타드', '살몬', '오렌지', 'beige', 'mustard', 'salmon', 'orange', 'warm', 'muted'],
};

// 체형별 추천 카테고리 서브타입
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

// 계절별 추천 소재 키워드
const SEASON_MATERIAL_KEYWORDS: Record<Season, string[]> = {
  spring: ['면', '린넨', '얇은', 'cotton', 'linen', 'light'],
  summer: ['린넨', '면', '시원한', '통기성', 'linen', 'cotton', 'breathable'],
  autumn: ['울', '니트', '스웨이드', '가죽', 'wool', 'knit', 'suede', 'leather'],
  winter: ['울', '캐시미어', '패딩', '플리스', 'wool', 'cashmere', 'padded', 'fleece'],
};

// 기온별 추천 계절
function getSeasonFromTemp(temp: number): Season {
  if (temp >= 23) return 'summer';
  if (temp >= 15) return 'spring';
  if (temp >= 5) return 'autumn';
  return 'winter';
}

/**
 * 색상 매칭 점수 계산
 */
function calculateColorMatchScore(
  itemColors: string[],
  personalColor: PersonalColorSeason
): number {
  if (!itemColors || itemColors.length === 0) return 50; // 기본 점수

  const goodKeywords = COLOR_KEYWORDS[personalColor];
  const badKeywords = AVOID_COLOR_KEYWORDS[personalColor];

  let score = 50;

  for (const color of itemColors) {
    const lowerColor = color.toLowerCase();

    // 좋은 색상 매칭
    const goodMatch = goodKeywords.some(
      (keyword) =>
        lowerColor.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(lowerColor)
    );
    if (goodMatch) score += 25;

    // 피해야 할 색상 매칭
    const badMatch = badKeywords.some(
      (keyword) =>
        lowerColor.includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(lowerColor)
    );
    if (badMatch) score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * 체형 매칭 점수 계산
 */
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

  // 매칭되는 키워드가 있으면 점수 증가
  return 50 + matchCount * 20;
}

/**
 * 계절 매칭 점수 계산
 */
function calculateSeasonMatchScore(
  item: ClothingItem,
  targetSeason: Season
): number {
  const metadata = item.metadata;

  // 명시적 시즌 태그가 있으면 확인
  if (metadata.season && metadata.season.length > 0) {
    if (metadata.season.includes(targetSeason)) return 100;
    // 인접 계절이면 부분 점수
    const adjacentSeasons: Record<Season, Season[]> = {
      spring: ['summer', 'autumn'],
      summer: ['spring'],
      autumn: ['spring', 'winter'],
      winter: ['autumn'],
    };
    if (metadata.season.some((s) => adjacentSeasons[targetSeason].includes(s))) {
      return 70;
    }
    return 30;
  }

  // 아이템 이름에서 소재 키워드 확인
  const materialKeywords = SEASON_MATERIAL_KEYWORDS[targetSeason];
  const itemName = item.name.toLowerCase();

  const materialMatch = materialKeywords.some((keyword) =>
    itemName.includes(keyword.toLowerCase())
  );

  return materialMatch ? 80 : 50;
}

/**
 * 아이템 종합 매칭 점수 계산
 */
export interface MatchScore {
  total: number;
  colorScore: number;
  bodyTypeScore: number;
  seasonScore: number;
  styleScore?: number;
  trendBonus?: number;
}

/**
 * 스타일 카테고리 매칭 점수 계산
 */
function calculateStyleMatchScore(
  item: ClothingItem,
  targetStyle: StyleCategory
): number {
  const keywords = STYLE_CATEGORY_KEYWORDS[targetStyle];
  if (!keywords) return 50;

  const itemName = item.name.toLowerCase();
  let score = 50;

  // 키워드 매칭
  const matchCount = keywords.filter((keyword) =>
    itemName.includes(keyword.toLowerCase())
  ).length;

  score += matchCount * 15;

  return Math.min(100, score);
}

export function calculateMatchScore(
  item: InventoryItem,
  options: {
    personalColor?: PersonalColorSeason | null;
    bodyType?: BodyType3 | null;
    season?: Season | null;
    temp?: number | null;
    occasion?: Occasion | null;
    style?: StyleCategory | null;
  }
): MatchScore {
  const clothingItem = toClothingItem(item);
  const metadata = clothingItem.metadata;

  // 색상 점수 (퍼스널컬러)
  const colorScore = options.personalColor
    ? calculateColorMatchScore(metadata.color, options.personalColor)
    : 50;

  // 체형 점수
  const bodyTypeScore = options.bodyType
    ? calculateBodyTypeMatchScore(clothingItem, options.bodyType)
    : 50;

  // 계절 점수
  const targetSeason = options.season || (options.temp ? getSeasonFromTemp(options.temp) : null);
  const seasonScore = targetSeason
    ? calculateSeasonMatchScore(clothingItem, targetSeason)
    : 50;

  // 스타일 점수 (K-2 확장)
  const styleScore = options.style
    ? calculateStyleMatchScore(clothingItem, options.style)
    : undefined;

  // 트렌드 보너스 (K-2 확장)
  const trendBonus = isTrendItem2026(clothingItem.name)
    ? Math.round(TREND_BONUS_2026 * 100)
    : 0;

  // 상황(TPO) 점수 보정
  let occasionBonus = 0;
  if (options.occasion && metadata.occasion?.includes(options.occasion)) {
    occasionBonus = 10;
  }

  // 종합 점수 (가중 평균)
  const weights = options.style
    ? { color: 0.3, bodyType: 0.2, season: 0.3, style: 0.2 }
    : { color: 0.35, bodyType: 0.25, season: 0.4, style: 0 };

  const total = Math.round(
    colorScore * weights.color +
      bodyTypeScore * weights.bodyType +
      seasonScore * weights.season +
      (styleScore ?? 0) * weights.style +
      occasionBonus +
      trendBonus
  );

  return {
    total: Math.min(100, total),
    colorScore,
    bodyTypeScore,
    seasonScore,
    styleScore,
    trendBonus: trendBonus > 0 ? trendBonus : undefined,
  };
}

/**
 * 옷장에서 매칭되는 아이템 추천
 */
export interface ClosetRecommendation {
  item: InventoryItem;
  score: MatchScore;
  reasons: string[];
}

export function recommendFromCloset(
  items: InventoryItem[],
  options: {
    personalColor?: PersonalColorSeason | null;
    bodyType?: BodyType3 | null;
    season?: Season | null;
    temp?: number | null;
    occasion?: Occasion | null;
    category?: ClothingCategory | null;
    style?: StyleCategory | null;
    limit?: number;
  }
): ClosetRecommendation[] {
  // 카테고리 필터
  let filtered = items.filter((item) => item.category === 'closet');
  if (options.category) {
    filtered = filtered.filter((item) => item.subCategory === options.category);
  }

  // 점수 계산 및 정렬
  const scored = filtered.map((item) => {
    const score = calculateMatchScore(item, options);
    const reasons: string[] = [];

    // 추천 이유 생성
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
    // K-2 확장: 스타일 매칭 이유
    if (score.styleScore && score.styleScore >= 70 && options.style) {
      const styleNames: Record<StyleCategory, string> = {
        casual: '캐주얼',
        formal: '포멀',
        street: '스트릿',
        minimal: '미니멀',
        sporty: '스포티',
        classic: '클래식',
        preppy: '프레피',
        hiphop: '힙합',
        romantic: '로맨틱',
        workwear: '워크웨어',
      };
      reasons.push(`${styleNames[options.style]} 스타일에 어울려요`);
    }
    // K-2 확장: 트렌드 보너스 이유
    if (score.trendBonus && score.trendBonus > 0) {
      reasons.push('2026 트렌드 아이템이에요');
    }

    if (reasons.length === 0) {
      reasons.push('기본 추천');
    }

    return { item, score, reasons };
  });

  // 점수 내림차순 정렬
  scored.sort((a, b) => b.score.total - a.score.total);

  // 상위 N개 반환
  return scored.slice(0, options.limit || 10);
}

/**
 * 코디 조합 추천
 */
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

export function suggestOutfitFromCloset(
  items: InventoryItem[],
  options: {
    personalColor?: PersonalColorSeason | null;
    bodyType?: BodyType3 | null;
    temp?: number | null;
    occasion?: Occasion | null;
  }
): OutfitSuggestion | null {
  const closetItems = items.filter((item) => item.category === 'closet');

  if (closetItems.length === 0) return null;

  const season = options.temp ? getSeasonFromTemp(options.temp) : null;
  const needsOuter = options.temp != null && options.temp < 15;

  // 각 카테고리별 추천
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

  // 종합 점수
  const scores = [top.score.total, bottom.score.total];
  if (outer) scores.push(outer.score.total);
  if (shoes) scores.push(shoes.score.total);

  const totalScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  // 팁 생성
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

/**
 * 카테고리별 추천 요약
 */
export function getRecommendationSummary(
  items: InventoryItem[],
  options: {
    personalColor?: PersonalColorSeason | null;
    bodyType?: BodyType3 | null;
  }
): {
  wellMatched: number;
  needsImprovement: number;
  suggestions: string[];
} {
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

  // 부족한 카테고리 확인
  const essentialCategories: ClothingCategory[] = ['outer', 'top', 'bottom', 'shoes'];
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
