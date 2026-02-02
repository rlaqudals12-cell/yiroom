/**
 * 패션 스타일 카테고리 상수 및 유틸리티
 *
 * @module lib/fashion/style-categories
 * @description K-2 패션 확장 - 스타일 카테고리 정의
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 3.3
 */

import type { PersonalColorSeason } from '@/lib/color-recommendations';

// 스타일 카테고리 타입 (best10-generator.ts와 동일)
export type StyleCategory =
  | 'casual'
  | 'formal'
  | 'street'
  | 'minimal'
  | 'sporty'
  | 'classic'
  | 'preppy'
  | 'hiphop'
  | 'romantic'
  | 'workwear';

// 스타일 카테고리 상세 정보
export interface StyleCategoryDetail {
  id: StyleCategory;
  label: string;
  labelEn: string;
  description: string;
  keywords: string[];
  suitableOccasions: string[];
  recommendedBodyTypes: string[];
  trendLevel2026: 'rising' | 'steady' | 'classic';
}

// 스타일 카테고리별 키워드 (closetMatcher 확장용)
export const STYLE_CATEGORY_KEYWORDS: Record<StyleCategory, string[]> = {
  casual: [
    '데님',
    '티셔츠',
    '스니커즈',
    '후디',
    '맨투맨',
    '청바지',
    '치노',
    '폴로',
    '가디건',
    'denim',
    't-shirt',
    'sneakers',
    'hoodie',
    'sweatshirt',
    'jeans',
    'chino',
    'polo',
    'cardigan',
  ],
  formal: [
    '셔츠',
    '블레이저',
    '슬랙스',
    '구두',
    '수트',
    '넥타이',
    '자켓',
    '드레스셔츠',
    'shirt',
    'blazer',
    'slacks',
    'dress shoes',
    'suit',
    'tie',
    'jacket',
    'dress shirt',
  ],
  street: [
    '오버사이즈',
    '조거팬츠',
    '하이탑',
    '후드티',
    '카고',
    '그래픽',
    '스니커즈',
    '버킷햇',
    'oversized',
    'jogger',
    'high-top',
    'hoodie',
    'cargo',
    'graphic',
    'sneakers',
    'bucket hat',
  ],
  minimal: [
    '모노톤',
    '베이직',
    '클린',
    '심플',
    '무지',
    '블랙',
    '화이트',
    '그레이',
    'monotone',
    'basic',
    'clean',
    'simple',
    'solid',
    'black',
    'white',
    'gray',
  ],
  sporty: [
    '테크웨어',
    '윈드브레이커',
    '트랙',
    '레깅스',
    '러닝',
    '애슬레저',
    '조거',
    'techwear',
    'windbreaker',
    'track',
    'leggings',
    'running',
    'athleisure',
    'jogger',
  ],
  classic: [
    '옥스포드',
    '카멜코트',
    '트렌치',
    '케이블니트',
    '로퍼',
    '피코트',
    'oxford',
    'camel coat',
    'trench',
    'cable knit',
    'loafer',
    'peacoat',
  ],
  preppy: [
    '니트베스트',
    '플리츠',
    '아가일',
    '체크',
    '로퍼',
    '카디건',
    'knit vest',
    'pleats',
    'argyle',
    'check',
    'loafer',
    'cardigan',
  ],
  hiphop: [
    '오버사이즈',
    '와이드팬츠',
    '청키',
    '체인',
    '스냅백',
    '조던',
    'oversized',
    'wide pants',
    'chunky',
    'chain',
    'snapback',
    'jordan',
  ],
  romantic: [
    '플로럴',
    '레이스',
    '프릴',
    '시폰',
    '파스텔',
    '리본',
    '원피스',
    'floral',
    'lace',
    'frill',
    'chiffon',
    'pastel',
    'ribbon',
    'dress',
  ],
  workwear: [
    '카하트',
    '덕',
    '캔버스',
    '워크부츠',
    '데님',
    '카고',
    '밀리터리',
    'carhartt',
    'duck',
    'canvas',
    'work boots',
    'denim',
    'cargo',
    'military',
  ],
};

// 스타일 카테고리 상세 정보
export const STYLE_CATEGORIES_DETAIL: Record<StyleCategory, StyleCategoryDetail> = {
  casual: {
    id: 'casual',
    label: '캐주얼',
    labelEn: 'Casual',
    description: '편안하면서도 스타일리시한 일상 코디',
    keywords: STYLE_CATEGORY_KEYWORDS.casual,
    suitableOccasions: ['일상', '쇼핑', '카페', '친구 만남'],
    recommendedBodyTypes: ['S', 'W', 'N'],
    trendLevel2026: 'steady',
  },
  formal: {
    id: 'formal',
    label: '포멀',
    labelEn: 'Formal',
    description: '비즈니스와 공식 자리를 위한 격식있는 스타일',
    keywords: STYLE_CATEGORY_KEYWORDS.formal,
    suitableOccasions: ['출근', '미팅', '면접', '행사'],
    recommendedBodyTypes: ['S', 'W'],
    trendLevel2026: 'steady',
  },
  street: {
    id: 'street',
    label: '스트릿',
    labelEn: 'Street',
    description: '트렌디하고 개성있는 스트릿 패션',
    keywords: STYLE_CATEGORY_KEYWORDS.street,
    suitableOccasions: ['친구 만남', '콘서트', '페스티벌'],
    recommendedBodyTypes: ['N', 'S'],
    trendLevel2026: 'rising',
  },
  minimal: {
    id: 'minimal',
    label: '미니멀',
    labelEn: 'Minimal',
    description: '군더더기 없는 깔끔하고 세련된 스타일',
    keywords: STYLE_CATEGORY_KEYWORDS.minimal,
    suitableOccasions: ['일상', '출근', '미팅'],
    recommendedBodyTypes: ['S', 'W', 'N'],
    trendLevel2026: 'rising',
  },
  sporty: {
    id: 'sporty',
    label: '스포티',
    labelEn: 'Sporty',
    description: '활동적이고 건강한 이미지의 스포티 룩',
    keywords: STYLE_CATEGORY_KEYWORDS.sporty,
    suitableOccasions: ['운동', '일상', '여행'],
    recommendedBodyTypes: ['S', 'N'],
    trendLevel2026: 'rising',
  },
  classic: {
    id: 'classic',
    label: '클래식',
    labelEn: 'Classic',
    description: '시대를 초월하는 클래식한 스타일',
    keywords: STYLE_CATEGORY_KEYWORDS.classic,
    suitableOccasions: ['출근', '데이트', '모임'],
    recommendedBodyTypes: ['S', 'W'],
    trendLevel2026: 'classic',
  },
  preppy: {
    id: 'preppy',
    label: '프레피',
    labelEn: 'Preppy',
    description: '단정하고 지적인 프레피 스타일',
    keywords: STYLE_CATEGORY_KEYWORDS.preppy,
    suitableOccasions: ['학교', '캠퍼스', '데이트'],
    recommendedBodyTypes: ['S', 'W'],
    trendLevel2026: 'rising',
  },
  hiphop: {
    id: 'hiphop',
    label: '힙합',
    labelEn: 'Hip-hop',
    description: '오버사이즈와 스트릿 감성의 힙합 스타일',
    keywords: STYLE_CATEGORY_KEYWORDS.hiphop,
    suitableOccasions: ['친구 만남', '콘서트', '클럽'],
    recommendedBodyTypes: ['N'],
    trendLevel2026: 'steady',
  },
  romantic: {
    id: 'romantic',
    label: '로맨틱',
    labelEn: 'Romantic',
    description: '여성스럽고 우아한 로맨틱 스타일',
    keywords: STYLE_CATEGORY_KEYWORDS.romantic,
    suitableOccasions: ['데이트', '파티', '브런치'],
    recommendedBodyTypes: ['W'],
    trendLevel2026: 'steady',
  },
  workwear: {
    id: 'workwear',
    label: '워크웨어',
    labelEn: 'Workwear',
    description: '실용적이고 튼튼한 워크웨어 스타일',
    keywords: STYLE_CATEGORY_KEYWORDS.workwear,
    suitableOccasions: ['일상', '아웃도어', '캠핑'],
    recommendedBodyTypes: ['N', 'S'],
    trendLevel2026: 'rising',
  },
};

// 2026 트렌드 아이템
export const STYLE_TREND_ITEMS_2026: Record<StyleCategory, string[]> = {
  casual: ['폴로 셔츠', '버뮤다 팬츠', '스웨트셔츠', '아이스블루 니트'],
  formal: ['니트 재킷', '기능성 슬랙스', '언컨스트럭처드 블레이저'],
  street: ['새깅 팬츠', '그래픽 티', '테크 플리스', '청키 스니커즈'],
  minimal: ['아이스 블루 니트', '화이트 셔츠', '와이드 슬랙스'],
  sporty: ['테크웨어', '윈드러너', '고프코어 아이템'],
  classic: ['옥스포드 셔츠', '카멜 코트', '케이블 니트'],
  preppy: ['니트 베스트', '플리츠 스커트', '럭비 셔츠'],
  hiphop: ['오버사이즈 아우터', '볼드 주얼리', '레트로 조던'],
  romantic: ['시폰 블라우스', '플로럴 드레스', '레이스 디테일'],
  workwear: ['덕 재킷', '카펜터 팬츠', '워크 부츠'],
};

// 트렌드 보너스 점수 (2026)
export const TREND_BONUS_2026 = 0.1; // 트렌드 아이템 10% 가산

// 퍼스널컬러별 추천 스타일
export const STYLE_BY_PERSONAL_COLOR: Record<PersonalColorSeason, StyleCategory[]> = {
  Spring: ['casual', 'preppy', 'romantic'],
  Summer: ['minimal', 'classic', 'romantic', 'preppy'],
  Autumn: ['classic', 'workwear', 'casual', 'street'],
  Winter: ['minimal', 'formal', 'street', 'hiphop'],
};

/**
 * 스타일 카테고리 라벨 조회
 */
export function getStyleLabel(category: StyleCategory): string {
  return STYLE_CATEGORIES_DETAIL[category]?.label || category;
}

/**
 * 스타일 카테고리 상세 정보 조회
 */
export function getStyleDetail(category: StyleCategory): StyleCategoryDetail {
  return STYLE_CATEGORIES_DETAIL[category];
}

/**
 * 퍼스널컬러에 맞는 스타일 추천
 */
export function getRecommendedStyles(personalColor: PersonalColorSeason): StyleCategory[] {
  return STYLE_BY_PERSONAL_COLOR[personalColor] || ['casual', 'minimal'];
}

/**
 * 아이템 이름에서 스타일 카테고리 추론
 */
export function inferStyleCategory(itemName: string): StyleCategory | null {
  const lowerName = itemName.toLowerCase();

  for (const [category, keywords] of Object.entries(STYLE_CATEGORY_KEYWORDS)) {
    const matchCount = keywords.filter(
      (keyword) => lowerName.includes(keyword.toLowerCase())
    ).length;
    if (matchCount >= 2) {
      return category as StyleCategory;
    }
  }

  // 단일 키워드 매칭
  for (const [category, keywords] of Object.entries(STYLE_CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerName.includes(keyword.toLowerCase()))) {
      return category as StyleCategory;
    }
  }

  return null;
}

/**
 * 아이템이 2026 트렌드인지 확인
 */
export function isTrendItem2026(itemName: string): boolean {
  const lowerName = itemName.toLowerCase();

  for (const trendItems of Object.values(STYLE_TREND_ITEMS_2026)) {
    if (trendItems.some((trend) => lowerName.includes(trend.toLowerCase()))) {
      return true;
    }
  }

  return false;
}

/**
 * 트렌드 보너스 점수 계산
 */
export function calculateTrendBonus(itemName: string): number {
  return isTrendItem2026(itemName) ? TREND_BONUS_2026 : 0;
}

/**
 * 스타일 호환성 점수 계산
 */
export function calculateStyleCompatibility(
  itemName: string,
  targetStyle: StyleCategory
): number {
  const keywords = STYLE_CATEGORY_KEYWORDS[targetStyle];
  const lowerName = itemName.toLowerCase();

  let score = 50; // 기본 점수

  // 키워드 매칭
  const matchCount = keywords.filter((keyword) =>
    lowerName.includes(keyword.toLowerCase())
  ).length;

  score += matchCount * 15;

  // 트렌드 보너스
  if (isTrendItem2026(itemName)) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * 모든 스타일 카테고리 목록
 */
export function getAllStyleCategories(): StyleCategory[] {
  return Object.keys(STYLE_CATEGORIES_DETAIL) as StyleCategory[];
}

/**
 * 상승 트렌드 스타일 목록
 */
export function getRisingTrendStyles(): StyleCategory[] {
  return Object.entries(STYLE_CATEGORIES_DETAIL)
    .filter(([, detail]) => detail.trendLevel2026 === 'rising')
    .map(([id]) => id as StyleCategory);
}
