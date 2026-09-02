/**
 * 옷장 아이템 매칭 로직
 * 퍼스널컬러, 체형, 날씨 기반으로 사용자 옷장에서 어울리는 아이템 추천
 */

import { resolveClothingCategory } from './clothingCategory';
import { assessOutfitHarmony, type OutfitHarmony } from './color-bridge';
import { OCCASION_LABELS, toClothingItem } from './types';
import type { InventoryItem, ClothingItem, ClothingCategory, Season, Occasion } from './types';
import { seasonKo } from '../integrated/labels';
import { withSubjectParticle, withTopicParticle } from '../utils/korean';

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
    // 쿨톤 여름의 대표색인 블루 계열 부재 수리 — bare '블루' 허용은 Winter의 bare 'blue' 선례와
    // 동일한 조도(파랑 계열 전반을 쿨톤 적합으로 인정). Summer AVOID와 충돌 없음
    '블루',
    '라이트블루',
    '스카이블루',
    '하늘',
    '데님',
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
    'blue',
    'denim',
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
  Spring: ['블랙', '다크', '버건디', '차가운', 'black', 'dark', 'burgundy', 'cool'],
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
  Autumn: ['핑크', '퓨시아', '파스텔', '네온', 'pink', 'fuchsia', 'pastel', 'neon', 'bright'],
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

const BODY_TYPE_RECOMMENDATIONS: Record<BodyType3, Record<ClothingCategory, string[]>> = {
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
  autumn: ['울', '니트', '스웨이드', '가죽', 'wool', 'knit', 'suede', 'leather'],
  winter: ['울', '캐시미어', '패딩', '플리스', 'wool', 'cashmere', 'fleece'],
};

// 인접 계절 — 명시 시즌이 대상과 다르더라도 "그럭저럭 입을 수 있는" 범위
const ADJACENT_SEASONS: Record<Season, Season[]> = {
  spring: ['summer', 'autumn'],
  summer: ['spring'],
  autumn: ['spring', 'winter'],
  winter: ['autumn'],
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
        lowerColor.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(lowerColor)
    );
    if (goodMatch) score += 25;

    const badMatch = badKeywords.some(
      (keyword) =>
        lowerColor.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(lowerColor)
    );
    if (badMatch) score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateBodyTypeMatchScore(
  item: ClothingItem,
  bodyType: BodyType3,
  // sub_category에 한글 세부종류('티셔츠')가 저장된 실데이터가 있어, 호출측에서
  // 원본 아이템(metadata 포함) 기준으로 정규화한 대분류를 받는다.
  // (toClothingItem이 metadata.clothingCategory를 벗겨내므로 여기서 재정규화하면 정보 손실)
  resolvedCategory: ClothingCategory | null
): number {
  if (!resolvedCategory) return 50;
  const recommendations = BODY_TYPE_RECOMMENDATIONS[bodyType][resolvedCategory];

  if (!recommendations) return 50;

  const itemName = item.name.toLowerCase();
  const matchCount = recommendations.filter((rec) => itemName.includes(rec.toLowerCase())).length;

  return Math.min(100, 50 + matchCount * 20);
}

function calculateSeasonMatchScore(item: ClothingItem, targetSeason: Season): number {
  const metadata = item.metadata;

  if (metadata.season && metadata.season.length > 0) {
    if (metadata.season.includes(targetSeason)) return 100;
    if (metadata.season.some((s) => ADJACENT_SEASONS[targetSeason].includes(s))) {
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
  /** 퍼스널컬러·체형 중 실제로 일치한 개인 진단 근거가 있을 때만 true */
  personalMatched: boolean;
}

/** 웹 옷장 매처와 같은 기본 가중치 — 요약 재정규화도 이 값을 함께 쓴다. */
const BASE_WEIGHTS = { color: 0.35, bodyType: 0.25, season: 0.4 } as const;

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
export function calculateMatchScore(item: InventoryItem, options: MatchOptions): MatchScore {
  const clothingItem = toClothingItem(item);
  const metadata = clothingItem.metadata;
  const resolvedCategory = resolveClothingCategory(item);

  const colorScore = options.personalColor
    ? calculateColorMatchScore(metadata.color, options.personalColor)
    : 50;

  // 체형 점수 — 원본 아이템 기준 정규화(한글 sub_category·metadata.clothingCategory 대응)
  const bodyTypeScore = options.bodyType
    ? calculateBodyTypeMatchScore(clothingItem, options.bodyType, resolvedCategory)
    : 50;

  // 계절 점수 (0°C도 유효한 기온이므로 truthy가 아닌 null 검사)
  const targetSeason =
    options.season || (options.temp != null ? getSeasonFromTemp(options.temp) : null);
  const seasonScore = targetSeason ? calculateSeasonMatchScore(clothingItem, targetSeason) : 50;

  let occasionBonus = 0;
  if (options.occasion && metadata.occasion?.includes(options.occasion)) {
    occasionBonus = 10;
  }

  const total = Math.round(
    colorScore * BASE_WEIGHTS.color +
      bodyTypeScore * BASE_WEIGHTS.bodyType +
      seasonScore * BASE_WEIGHTS.season +
      occasionBonus
  );

  // 중립 50은 "모름"의 폴백이다. 실제 개인 축 일치가 있을 때만 적합도 노출을 허용한다.
  const personalMatched =
    (options.personalColor != null && colorScore > 50) ||
    (options.bodyType != null && resolvedCategory != null && bodyTypeScore > 50);

  return {
    total: Math.min(100, total),
    colorScore,
    bodyTypeScore,
    seasonScore,
    personalMatched,
  };
}

export interface ClosetRecommendation {
  item: InventoryItem;
  score: MatchScore;
  reasons: string[];
  /** 계절이 맞는 대체 후보가 없어 계절 가드를 완화하고 고른 아이템 */
  seasonRelaxed?: boolean;
  /** 선택한 상황(TPO) 태그를 가진 아이템이 없어 전체에서 고른 아이템 */
  occasionRelaxed?: boolean;
}

/**
 * 명시된 시즌 태그가 대상 계절과 어긋나는지 판정 (인접 계절은 어긋남으로 보지 않는다)
 *
 * 점수만으로는 한여름에 겨울 패딩이 색 점수로 역전해 뽑히는 일이 생겨,
 * 조립 후보 단계에서 하드하게 거른다. 시즌 태그가 비어 있으면 판단하지 않는다(추측 금지).
 */
function hasExplicitSeasonMismatch(item: InventoryItem, targetSeason: Season): boolean {
  const seasons = toClothingItem(item).metadata.season;
  if (!seasons || seasons.length === 0) return false;
  if (seasons.includes(targetSeason)) return false;
  return !seasons.some((s) => ADJACENT_SEASONS[targetSeason].includes(s));
}

/**
 * 옷장에서 매칭되는 아이템 추천
 */
export function recommendFromCloset(
  items: InventoryItem[],
  options: MatchOptions & { category?: ClothingCategory | null; limit?: number }
): ClosetRecommendation[] {
  // 카테고리 필터 — sub_category에 한글 세부종류('티셔츠')가 저장된 실데이터가 있어
  // 영문 완전일치 대신 정규화(resolveClothingCategory) 후 비교한다 (코디 영구 불발 근본 수리)
  let filtered = items.filter((item) => item.category === 'closet');
  if (options.category) {
    filtered = filtered.filter((item) => resolveClothingCategory(item) === options.category);
  }

  // 계절 하드 가드 — 명시 시즌이 대상 계절과 어긋나는 아이템은 후보에서 제외한다.
  // (기존엔 30점 감점뿐이라 색 점수가 높은 한겨울 패딩이 한여름 추천을 이기는 역전이 생겼다)
  // 단, 대체 후보가 하나도 없으면 완화한다 — 대신 그 사실을 결과에 실어 UI가 정직하게 알린다.
  const targetSeason =
    options.season || (options.temp != null ? getSeasonFromTemp(options.temp) : null);
  let seasonRelaxed = false;
  if (targetSeason && filtered.length > 0) {
    const inSeason = filtered.filter((item) => !hasExplicitSeasonMismatch(item, targetSeason));
    if (inSeason.length > 0) {
      filtered = inSeason;
    } else {
      seasonRelaxed = true;
    }
  }

  // 웹 정본과 동일한 TPO 하드 필터. 태그가 하나라도 있으면 그 안에서만 고르고,
  // 전혀 없을 때만 전체 옷장으로 완화하며 UI가 알 수 있도록 표식을 보존한다.
  const targetOccasion = options.occasion;
  let occasionRelaxed = false;
  if (targetOccasion && filtered.length > 0) {
    const tagged = filtered.filter((item) =>
      toClothingItem(item).metadata.occasion?.includes(targetOccasion)
    );
    if (tagged.length > 0) {
      filtered = tagged;
    } else {
      occasionRelaxed = true;
    }
  }

  const scored = filtered.map((item) => {
    const score = calculateMatchScore(item, options);
    const reasons: string[] = [];

    if (score.colorScore >= 70 && options.personalColor) {
      reasons.push(`${seasonKo(options.personalColor)} 컬러와 잘 어울려요`);
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

    // 완화 사유는 지어내지 않고 있는 그대로 — "이것뿐이라 골랐다"는 사실을 이유에 남긴다
    if (seasonRelaxed) {
      reasons.push('계절이 안 맞지만 지금 가진 옷 중에는 이것뿐이에요');
    }
    if (occasionRelaxed && targetOccasion) {
      reasons.push(`'${OCCASION_LABELS[targetOccasion]}' 태그가 없어 전체에서 골랐어요`);
    }

    if (reasons.length === 0) {
      reasons.push('기본 추천');
    }

    const recommendation: ClosetRecommendation = { item, score, reasons };
    if (seasonRelaxed) recommendation.seasonRelaxed = true;
    if (occasionRelaxed) recommendation.occasionRelaxed = true;
    return recommendation;
  });

  scored.sort((a, b) => b.score.total - a.score.total);

  return scored.slice(0, options.limit || 10);
}

export interface OutfitSuggestion {
  outer?: ClosetRecommendation;
  // 상·하의 조합 또는 원피스 단독 — 둘 중 하나의 경로로 조립된다(둘 다 없으면 조립 불가)
  top?: ClosetRecommendation;
  bottom?: ClosetRecommendation;
  dress?: ClosetRecommendation;
  shoes?: ClosetRecommendation;
  bag?: ClosetRecommendation;
  accessory?: ClosetRecommendation;
  totalScore: number;
  /** 조합 안에 실제 개인 진단 일치 근거가 하나라도 있을 때만 true */
  personalMatched?: boolean;
  /** 퍼스널컬러·체형 진단값이 입력되었는지 여부 */
  hasPersonalProfile?: boolean;
  tips: string[];
  /** 조립 과정에서 조건을 완화한 사실(계절) — UI에 정직하게 노출한다 */
  warnings: string[];
}

/** 웹 정본의 상·하의 색조화 보너스. 기본 점수가 비슷한 후보만 재정렬한다. */
const PAIR_HARMONY_BONUS: Record<OutfitHarmony['kind'], number> = {
  'tone-on-tone': 6,
  analogous: 5,
  complementary: 4,
  'neutral-base': 3,
  accent: 2,
};

const PAIR_CANDIDATE_LIMIT = 5;

interface RankedPair {
  top: ClosetRecommendation;
  bottom: ClosetRecommendation;
  pairScore: number;
}

/** 난수를 쓰지 않고 동점이면 기본 점수 순서에서 먼저 온 쌍을 유지한다. */
function selectBestPair(
  tops: ClosetRecommendation[],
  bottoms: ClosetRecommendation[]
): RankedPair | null {
  let best: RankedPair | null = null;

  for (const top of tops) {
    const topColors = toClothingItem(top.item).metadata.color;
    for (const bottom of bottoms) {
      const bottomColors = toClothingItem(bottom.item).metadata.color;
      const harmony = assessOutfitHarmony(topColors, bottomColors);
      const pairScore =
        (top.score.total + bottom.score.total) / 2 +
        (harmony ? PAIR_HARMONY_BONUS[harmony.kind] : 0);

      if (!best || pairScore > best.pairScore) {
        best = { top, bottom, pairScore };
      }
    }
  }

  return best;
}

/** 코디 슬롯 — [표시 이름, 선택된 추천] */
type OutfitSlot = [string, ClosetRecommendation | null | undefined];

/** 코디 팁 생성 — 진단·날씨가 있을 때만, 없는 근거는 지어내지 않는다 */
function buildOutfitTips(options: MatchOptions, isDressOutfit: boolean): string[] {
  const tips: string[] = [];

  if (isDressOutfit) {
    tips.push('원피스 한 벌로 코디를 완성했어요');
  }

  if (options.personalColor) {
    tips.push(`${seasonKo(options.personalColor)} 색상을 중심으로 코디했어요`);
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

  return tips;
}

/** 완화 고지 — 무엇을(슬롯) 어떻게(계절) 완화했는지 정직하게 남긴다 */
function buildRelaxationWarnings(picked: OutfitSlot[], occasion: Occasion | null): string[] {
  const warnings: string[] = [];

  const seasonRelaxedSlots = picked.filter(([, rec]) => rec?.seasonRelaxed).map(([label]) => label);
  if (seasonRelaxedSlots.length > 0) {
    warnings.push(
      `${seasonRelaxedSlots.join('·')}는 계절이 안 맞지만, 지금 가진 옷 중에는 이것뿐이에요`
    );
  }

  const occasionRelaxedSlots = picked
    .filter(([, rec]) => rec?.occasionRelaxed)
    .map(([label]) => label);
  if (occasionRelaxedSlots.length > 0 && occasion) {
    warnings.push(
      `${occasionRelaxedSlots.join('·')}는 '${OCCASION_LABELS[occasion]}' 상황 태그가 붙은 옷이 없어 전체에서 골랐어요`
    );
  }

  return warnings;
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

  // 0°C도 유효한 기온 — truthy 검사는 한겨울(0도)을 '기온 정보 없음'으로 흘려보낸다
  const season = options.temp != null ? getSeasonFromTemp(options.temp) : null;
  const needsOuter = options.temp != null && options.temp < 15;

  const getRecommendations = (category: ClothingCategory, limit: number) =>
    recommendFromCloset(closetItems, {
      ...options,
      season,
      category,
      limit,
    });

  const getTopRecommendation = (category: ClothingCategory) =>
    getRecommendations(category, 1)[0] || null;

  const topCandidates = getRecommendations('top', PAIR_CANDIDATE_LIMIT);
  const bottomCandidates = getRecommendations('bottom', PAIR_CANDIDATE_LIMIT);
  const bestPair = selectBestPair(topCandidates, bottomCandidates);
  const top = bestPair?.top ?? topCandidates[0] ?? null;
  const bottom = bestPair?.bottom ?? bottomCandidates[0] ?? null;

  // 원피스 경로 — 상·하의 쌍이 성립하지 않을 때만 한 벌로 조립한다.
  // (원피스만 가진 옷장이 "상의와 하의가 필요해요"로 영구 불발되던 결함 수리)
  let dress: ClosetRecommendation | null = null;
  // 코디의 본체(상·하의 두 벌 또는 원피스 한 벌) — 종합 점수의 기준
  let coreScores: number[];

  if (top && bottom) {
    coreScores = [top.score.total, bottom.score.total];
  } else {
    const dressRec = getTopRecommendation('dress');
    if (!dressRec) return null;
    dress = dressRec;
    coreScores = [dressRec.score.total];
  }

  const outer = needsOuter ? getTopRecommendation('outer') : undefined;
  const shoes = getTopRecommendation('shoes');
  const bag = getTopRecommendation('bag');
  const accessory = getTopRecommendation('accessory');

  const scores = [...coreScores];
  if (outer) scores.push(outer.score.total);
  if (shoes) scores.push(shoes.score.total);

  const totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const tips = buildOutfitTips(options, !!dress);

  const picked: OutfitSlot[] = [
    ['아우터', outer],
    ['원피스', dress],
    ['상의', dress ? null : top],
    ['하의', dress ? null : bottom],
    ['신발', shoes],
    ['가방', bag],
    ['액세서리', accessory],
  ];
  const pickedRecommendations = picked.flatMap(([, recommendation]) =>
    recommendation ? [recommendation] : []
  );
  const personalMatched = pickedRecommendations.some(
    (recommendation) => recommendation.score.personalMatched
  );
  const hasPersonalProfile = options.personalColor != null || options.bodyType != null;

  const warnings = buildRelaxationWarnings(picked, options.occasion ?? null);

  return {
    outer: outer || undefined,
    // 원피스 경로에서는 짝이 없는 상의/하의를 끼워넣지 않는다(상의+원피스 같은 억지 조합 방지)
    top: dress ? undefined : top || undefined,
    bottom: dress ? undefined : bottom || undefined,
    dress: dress || undefined,
    shoes: shoes || undefined,
    bag: bag || undefined,
    accessory: accessory || undefined,
    totalScore,
    personalMatched,
    hasPersonalProfile,
    tips,
    warnings,
  };
}

export interface RecommendationSummary {
  /** 옷장 전체 벌 수 — 소비측이 '무난' 밴드(total−양끝)를 계산할 수 있게 함께 반환 */
  total: number;
  wellMatched: number;
  needsImprovement: number;
  suggestions: string[];
}

/**
 * 요약에는 계절 입력이 없어 중립 50점이 상수로 들어가므로 색·체형만 재정규화한다.
 * 왜 필요한가: 계절 상수가 총점을 눌러 실제 적합한 옷까지 모두 '무난'으로 보이던 결함을 막는다.
 */
function profileMatchScore(score: MatchScore): number {
  const weightSum = BASE_WEIGHTS.color + BASE_WEIGHTS.bodyType;
  return Math.round(
    (score.colorScore * BASE_WEIGHTS.color + score.bodyTypeScore * BASE_WEIGHTS.bodyType) /
      weightSum
  );
}

const CATEGORY_NAMES: Record<ClothingCategory, string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

function buildCategorySuggestions(
  categoryCount: Record<string, number>,
  hideAbsentCategoryTip: boolean
): string[] {
  const dressCount = categoryCount['dress'] || 0;
  const essentialCategories: ClothingCategory[] =
    dressCount > 0 ? ['outer', 'shoes'] : ['outer', 'top', 'bottom', 'shoes'];

  const absent: ClothingCategory[] = [];
  const thin: ClothingCategory[] = [];
  for (const category of essentialCategories) {
    const count = categoryCount[category] || 0;
    if (count === 0) absent.push(category);
    else if (count === 1) thin.push(category);
  }

  const label = (categories: ClothingCategory[]): string =>
    categories.map((category) => CATEGORY_NAMES[category]).join(', ');
  const suggestions: string[] = [];

  if (absent.length > 0 && !hideAbsentCategoryTip) {
    // 왜 '없어요'가 아닌가: 사용자가 가진 옷이 미등록·미매핑 상태일 수도 있어 단정하지 않는다.
    suggestions.push(`${withSubjectParticle(label(absent))} 아직 등록 안 됐어요`);
  }
  if (thin.length > 0) {
    suggestions.push(
      `${withTopicParticle(label(thin))} 1벌뿐이에요 — 1벌씩 더 있으면 조합이 다양해져요`
    );
  }

  const hasEmptyPairSlot =
    (categoryCount['top'] || 0) === 0 || (categoryCount['bottom'] || 0) === 0;
  if (dressCount > 0 && hasEmptyPairSlot) {
    suggestions.push(
      `원피스 ${dressCount}벌로 코디를 조립할 수 있어요 — 상의·하의를 더하면 조합이 더 늘어나요`
    );
  }

  return suggestions;
}

/**
 * 카테고리별 추천 요약
 */
export function getRecommendationSummary(
  items: InventoryItem[],
  options: {
    personalColor?: PersonalColorSeason | null;
    bodyType?: BodyType3 | null;
    hideAbsentCategoryTip?: boolean;
  }
): RecommendationSummary {
  const closetItems = items.filter((item) => item.category === 'closet');

  let wellMatched = 0;
  let needsImprovement = 0;

  const categoryCount: Record<string, number> = {};

  for (const item of closetItems) {
    const score = profileMatchScore(calculateMatchScore(item, options));
    if (score >= 70) {
      wellMatched++;
    } else if (score < 50) {
      needsImprovement++;
    }

    // 한글 sub_category('티셔츠')도 대분류('top')로 집계 — 미매핑은 unknown으로 정직 분류
    const resolvedCategory = resolveClothingCategory(item) ?? 'unknown';
    categoryCount[resolvedCategory] = (categoryCount[resolvedCategory] || 0) + 1;
  }

  const suggestions = buildCategorySuggestions(categoryCount, !!options.hideAbsentCategoryTip);

  if (options.personalColor && wellMatched < closetItems.length * 0.3) {
    suggestions.push(`${seasonKo(options.personalColor)}에 어울리는 옷을 추가해보세요`);
  }

  return {
    total: closetItems.length,
    wellMatched,
    needsImprovement,
    suggestions,
  };
}
