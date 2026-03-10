/**
 * 운동복/소품 쇼핑 연동 로직
 *
 * 스펙 참조: docs/phase2/docs/W-1-feature-spec-template-v1.1-final.md (3.1절)
 * - 무신사, 에이블리, 쿠팡 파트너스 연동
 * - PC 타입별 색상 필터링
 * - 체형별 핏 필터링
 * - 쇼핑 전환율 목표: 20%
 */

import type { PersonalColorSeason, BodyType } from '@/types/workout';

// 지원 쇼핑 플랫폼
export type ShoppingPlatform = 'musinsa' | 'ably' | 'coupang';

// 쇼핑 카테고리
export type ShoppingCategory = 'workout-top' | 'workout-bottom' | 'accessory';

// 쇼핑 링크 인터페이스
export interface ShoppingLink {
  platform: ShoppingPlatform;
  platformName: string;
  url: string;
  category: ShoppingCategory;
  categoryName: string;
  icon: string;
  description: string;
}

// 플랫폼 정보
export const PLATFORM_INFO: Record<ShoppingPlatform, {
  name: string;
  icon: string;
  baseUrl: string;
  searchPath: string;
}> = {
  musinsa: {
    name: '무신사',
    icon: '🛍️',
    baseUrl: 'https://www.musinsa.com',
    searchPath: '/search/musinsa/goods',
  },
  ably: {
    name: '에이블리',
    icon: '👗',
    baseUrl: 'https://m.a-bly.com',
    searchPath: '/search',
  },
  coupang: {
    name: '쿠팡',
    icon: '📦',
    baseUrl: 'https://www.coupang.com',
    searchPath: '/np/search',
  },
};

// 카테고리 정보
export const CATEGORY_INFO: Record<ShoppingCategory, {
  name: string;
  keywords: string[];
}> = {
  'workout-top': {
    name: '운동 상의',
    keywords: ['운동복 상의', '스포츠 브라', '요가 탑', '트레이닝 티셔츠'],
  },
  'workout-bottom': {
    name: '운동 하의',
    keywords: ['레깅스', '운동 반바지', '요가 팬츠', '트레이닝 팬츠'],
  },
  accessory: {
    name: '운동 소품',
    keywords: ['요가 매트', '운동 밴드', '폼롤러', '물병', '운동 가방'],
  },
};

// PC 타입별 색상 검색 키워드
const PC_COLOR_KEYWORDS: Record<PersonalColorSeason, string[]> = {
  Spring: ['코랄', '피치', '연노랑', '밝은 주황'],
  Summer: ['라벤더', '민트', '스카이블루', '연보라'],
  Autumn: ['테라코타', '올리브', '머스타드', '카키'],
  Winter: ['블랙', '화이트', '버건디', '네이비'],
};

// 체형별 핏 검색 키워드
const BODY_FIT_KEYWORDS: Record<BodyType, string[]> = {
  X: ['핏한', '크롭', '슬림핏'],
  A: ['하이웨이스트', 'A라인', '루즈핏 상의'],
  V: ['A라인 하의', '넓은 힙', '페플럼'],
  H: ['허리 강조', '컬러블록', '벨트'],
  O: ['루즈핏', '오버사이즈', '롱 기장'],
  I: ['볼륨', '러플', '레이어드'],
  Y: ['넓은 어깨', '하이웨이스트', 'A라인 하의'],
  '8': ['핏한', '허리 강조', '바디컨'],
};

/**
 * 플랫폼별 검색 URL 생성
 */
export function generateSearchUrl(
  platform: ShoppingPlatform,
  query: string
): string {
  const info = PLATFORM_INFO[platform];
  const encodedQuery = encodeURIComponent(query);

  switch (platform) {
    case 'musinsa':
      return `${info.baseUrl}${info.searchPath}?q=${encodedQuery}`;
    case 'ably':
      return `${info.baseUrl}${info.searchPath}?keyword=${encodedQuery}`;
    case 'coupang':
      return `${info.baseUrl}${info.searchPath}?q=${encodedQuery}`;
    default:
      return `${info.baseUrl}${info.searchPath}?q=${encodedQuery}`;
  }
}

/**
 * PC 타입 기반 색상 키워드 반환
 */
export function getColorKeywordsForPC(
  personalColor: PersonalColorSeason
): string[] {
  return PC_COLOR_KEYWORDS[personalColor];
}

/**
 * 체형 기반 핏 키워드 반환
 */
export function getFitKeywordsForBodyType(
  bodyType: BodyType
): string[] {
  return BODY_FIT_KEYWORDS[bodyType];
}

/**
 * 최적 검색어 생성
 * PC + 체형 + 카테고리 조합
 */
export function buildOptimizedQuery(
  category: ShoppingCategory,
  personalColor: PersonalColorSeason,
  bodyType?: BodyType | null
): string {
  const categoryKeyword = CATEGORY_INFO[category].keywords[0];
  const colorKeyword = PC_COLOR_KEYWORDS[personalColor][0];

  if (bodyType) {
    const fitKeyword = BODY_FIT_KEYWORDS[bodyType][0];
    return `${colorKeyword} ${fitKeyword} ${categoryKeyword}`;
  }

  return `${colorKeyword} ${categoryKeyword}`;
}

/**
 * 모든 플랫폼에 대한 쇼핑 링크 생성
 */
export function generateShoppingLinks(
  category: ShoppingCategory,
  personalColor: PersonalColorSeason,
  bodyType?: BodyType | null
): ShoppingLink[] {
  const query = buildOptimizedQuery(category, personalColor, bodyType);

  return (['musinsa', 'ably', 'coupang'] as ShoppingPlatform[]).map((platform) => {
    const platformInfo = PLATFORM_INFO[platform];
    const categoryInfo = CATEGORY_INFO[category];

    return {
      platform,
      platformName: platformInfo.name,
      url: generateSearchUrl(platform, query),
      category,
      categoryName: categoryInfo.name,
      icon: platformInfo.icon,
      description: `${platformInfo.name}에서 ${personalColor} 타입에 어울리는 ${categoryInfo.name} 찾기`,
    };
  });
}

/**
 * 운동복 전체 쇼핑 링크 생성 (상의 + 하의 + 소품)
 */
export function generateAllWorkoutShoppingLinks(
  personalColor: PersonalColorSeason,
  bodyType?: BodyType | null
): {
  top: ShoppingLink[];
  bottom: ShoppingLink[];
  accessory: ShoppingLink[];
} {
  return {
    top: generateShoppingLinks('workout-top', personalColor, bodyType),
    bottom: generateShoppingLinks('workout-bottom', personalColor, bodyType),
    accessory: generateShoppingLinks('accessory', personalColor, bodyType),
  };
}

/**
 * 단일 플랫폼 빠른 링크 생성
 * - 메인 CTA용 (무신사 우선)
 */
export function generateQuickShoppingLink(
  personalColor: PersonalColorSeason,
  bodyType?: BodyType | null,
  platform: ShoppingPlatform = 'musinsa'
): ShoppingLink {
  const query = buildOptimizedQuery('workout-top', personalColor, bodyType);
  const platformInfo = PLATFORM_INFO[platform];

  return {
    platform,
    platformName: platformInfo.name,
    url: generateSearchUrl(platform, query),
    category: 'workout-top',
    categoryName: '운동복',
    icon: platformInfo.icon,
    description: `${platformInfo.name}에서 ${personalColor} 타입 운동복 찾기`,
  };
}

/**
 * PC 타입별 추천 검색어 목록
 */
export function getRecommendedSearchTerms(
  personalColor: PersonalColorSeason,
  bodyType?: BodyType | null
): string[] {
  const colorKeywords = PC_COLOR_KEYWORDS[personalColor];
  const baseTerms = ['운동복', '레깅스', '요가복', '트레이닝복'];

  const terms: string[] = [];

  colorKeywords.forEach((color) => {
    baseTerms.slice(0, 2).forEach((base) => {
      terms.push(`${color} ${base}`);
    });
  });

  if (bodyType) {
    const fitKeywords = BODY_FIT_KEYWORDS[bodyType];
    fitKeywords.slice(0, 2).forEach((fit) => {
      terms.push(`${fit} 운동복`);
    });
  }

  return terms.slice(0, 6); // 최대 6개
}

// 상수 내보내기 (테스트용)
export {
  PC_COLOR_KEYWORDS,
  BODY_FIT_KEYWORDS,
};
