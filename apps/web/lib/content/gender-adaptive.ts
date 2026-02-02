/**
 * 성별 적응형 콘텐츠 유틸리티
 * @description K-1 성별 중립화: 성별에 따라 다른 콘텐츠 제공
 */

import type { SeasonType } from '@/lib/mock/personal-color';

// 성별 및 스타일 선호도 타입
export type GenderPreference = 'male' | 'female' | 'neutral';
export type StylePreference = 'masculine' | 'feminine' | 'unisex';

export interface UserGenderProfile {
  gender: GenderPreference;
  stylePreference: StylePreference;
}

// 악세서리 추천 타입
export interface AccessoryRecommendation {
  name: string;
  colorName: string;
  hex: string;
  brandExample: string;
  easyDescription: string;
  category: 'watch' | 'tie' | 'sunglasses' | 'belt' | 'bag' | 'jewelry' | 'scarf';
}

// 남성용 악세서리 추천 (시즌별)
export const MALE_ACCESSORY_RECOMMENDATIONS: Record<SeasonType, AccessoryRecommendation[]> = {
  spring: [
    {
      name: '골드 프레임 선글라스',
      colorName: '골드 브라운',
      hex: '#D4A574',
      brandExample: 'Ray-Ban Aviator Gold',
      easyDescription: '따뜻한 금색 테 (봄 햇살 느낌)',
      category: 'sunglasses',
    },
    {
      name: '가죽 시계',
      colorName: '카멜 브라운',
      hex: '#C19A6B',
      brandExample: 'Daniel Wellington Classic',
      easyDescription: '낙타색 가죽밴드 (부드러운 느낌)',
      category: 'watch',
    },
    {
      name: '코랄 포인트 넥타이',
      colorName: '코랄 오렌지',
      hex: '#FF7F50',
      brandExample: 'Brooks Brothers',
      easyDescription: '산호색 (화사한 포인트)',
      category: 'tie',
    },
    {
      name: '베이지 가죽 벨트',
      colorName: '샌드 베이지',
      hex: '#C2B280',
      brandExample: 'Montblanc Classic',
      easyDescription: '모래색 (자연스러운 톤)',
      category: 'belt',
    },
  ],
  summer: [
    {
      name: '실버 프레임 선글라스',
      colorName: '쿨 그레이',
      hex: '#A9A9B0',
      brandExample: 'Ray-Ban Round Silver',
      easyDescription: '시원한 은색 테 (세련된 느낌)',
      category: 'sunglasses',
    },
    {
      name: '메탈 시계',
      colorName: '로즈 골드',
      hex: '#B76E79',
      brandExample: 'Tissot Classic',
      easyDescription: '차분한 로즈골드 (부드러운 느낌)',
      category: 'watch',
    },
    {
      name: '라벤더 넥타이',
      colorName: '소프트 라벤더',
      hex: '#E6E6FA',
      brandExample: 'Hugo Boss',
      easyDescription: '연보라색 (우아한 포인트)',
      category: 'tie',
    },
    {
      name: '네이비 가죽 벨트',
      colorName: '딥 네이비',
      hex: '#2C3E50',
      brandExample: 'Salvatore Ferragamo',
      easyDescription: '깊은 남색 (클래식한 톤)',
      category: 'belt',
    },
  ],
  autumn: [
    {
      name: '호피 선글라스',
      colorName: '토터스쉘',
      hex: '#8B4513',
      brandExample: 'Persol Havana',
      easyDescription: '갈색 호피 무늬 (클래식한 느낌)',
      category: 'sunglasses',
    },
    {
      name: '빈티지 가죽 시계',
      colorName: '버건디 브라운',
      hex: '#722F37',
      brandExample: 'Fossil Vintage',
      easyDescription: '와인빛 브라운 (깊은 느낌)',
      category: 'watch',
    },
    {
      name: '머스타드 넥타이',
      colorName: '골드 머스타드',
      hex: '#FFDB58',
      brandExample: 'Ermenegildo Zegna',
      easyDescription: '겨자색 (따뜻한 포인트)',
      category: 'tie',
    },
    {
      name: '초콜릿 벨트',
      colorName: '다크 초콜릿',
      hex: '#3D2B1F',
      brandExample: 'Gucci Classic',
      easyDescription: '진한 초콜릿색 (고급스러운 톤)',
      category: 'belt',
    },
  ],
  winter: [
    {
      name: '블랙 프레임 선글라스',
      colorName: '퓨어 블랙',
      hex: '#000000',
      brandExample: 'Tom Ford FT5178',
      easyDescription: '검정 테 (시크한 느낌)',
      category: 'sunglasses',
    },
    {
      name: '스틸 시계',
      colorName: '실버 스틸',
      hex: '#C0C0C0',
      brandExample: 'Omega Speedmaster',
      easyDescription: '은색 스틸 (모던한 느낌)',
      category: 'watch',
    },
    {
      name: '버건디 넥타이',
      colorName: '와인 레드',
      hex: '#722F37',
      brandExample: 'Burberry Classic',
      easyDescription: '와인색 (강렬한 포인트)',
      category: 'tie',
    },
    {
      name: '블랙 가죽 벨트',
      colorName: '제트 블랙',
      hex: '#0A0A0A',
      brandExample: 'Louis Vuitton Initiales',
      easyDescription: '칠흑색 (세련된 톤)',
      category: 'belt',
    },
  ],
};

// 여성용 악세서리 추천 (기존 립스틱 외 추가)
export const FEMALE_ACCESSORY_RECOMMENDATIONS: Record<SeasonType, AccessoryRecommendation[]> = {
  spring: [
    {
      name: '골드 이어링',
      colorName: '샴페인 골드',
      hex: '#F7E7CE',
      brandExample: 'Pandora Rose Gold',
      easyDescription: '샴페인색 금 (화사한 느낌)',
      category: 'jewelry',
    },
    {
      name: '코랄 스카프',
      colorName: '피치 코랄',
      hex: '#FFB7A5',
      brandExample: 'Hermes Twilly',
      easyDescription: '복숭아색 스카프 (봄 느낌)',
      category: 'scarf',
    },
  ],
  summer: [
    {
      name: '실버 목걸이',
      colorName: '쿨 실버',
      hex: '#C0C0C0',
      brandExample: 'Tiffany & Co.',
      easyDescription: '시원한 은색 (우아한 느낌)',
      category: 'jewelry',
    },
    {
      name: '라벤더 스카프',
      colorName: '소프트 라일락',
      hex: '#DCD0FF',
      brandExample: 'Chanel Silk',
      easyDescription: '연보라 스카프 (부드러운 느낌)',
      category: 'scarf',
    },
  ],
  autumn: [
    {
      name: '앤틱 골드 이어링',
      colorName: '앤틱 골드',
      hex: '#CFB53B',
      brandExample: 'Monica Vinader',
      easyDescription: '빈티지 금색 (따뜻한 느낌)',
      category: 'jewelry',
    },
    {
      name: '테라코타 스카프',
      colorName: '어스 오렌지',
      hex: '#E2725B',
      brandExample: 'Loro Piana',
      easyDescription: '흙빛 오렌지 (가을 느낌)',
      category: 'scarf',
    },
  ],
  winter: [
    {
      name: '화이트 골드 귀걸이',
      colorName: '아이스 화이트',
      hex: '#F0F0F0',
      brandExample: 'Cartier Trinity',
      easyDescription: '차가운 흰금 (세련된 느낌)',
      category: 'jewelry',
    },
    {
      name: '블랙 실크 스카프',
      colorName: '미드나잇',
      hex: '#191970',
      brandExample: 'Dior Silk',
      easyDescription: '검정 스카프 (시크한 느낌)',
      category: 'scarf',
    },
  ],
};

// 성별 중립 악세서리 (공용)
export const UNISEX_ACCESSORY_RECOMMENDATIONS: Record<SeasonType, AccessoryRecommendation[]> = {
  spring: [
    {
      name: '캔버스 토트백',
      colorName: '내추럴 베이지',
      hex: '#F5DEB3',
      brandExample: 'L.L.Bean Boat Tote',
      easyDescription: '자연스러운 베이지 (캐주얼)',
      category: 'bag',
    },
  ],
  summer: [
    {
      name: '린넨 토트백',
      colorName: '스카이 블루',
      hex: '#87CEEB',
      brandExample: 'Muji Linen Tote',
      easyDescription: '하늘색 (시원한 느낌)',
      category: 'bag',
    },
  ],
  autumn: [
    {
      name: '레더 크로스백',
      colorName: '카멜',
      hex: '#C19A6B',
      brandExample: 'Coach Leather',
      easyDescription: '낙타색 가죽 (클래식)',
      category: 'bag',
    },
  ],
  winter: [
    {
      name: '블랙 레더백',
      colorName: '클래식 블랙',
      hex: '#1C1C1C',
      brandExample: 'Celine Trio',
      easyDescription: '검정 가죽 (모던)',
      category: 'bag',
    },
  ],
};

/**
 * 성별에 따른 악세서리 추천 반환
 */
export function getAccessoryRecommendations(
  seasonType: SeasonType,
  genderProfile?: UserGenderProfile
): AccessoryRecommendation[] {
  const gender = genderProfile?.gender || 'neutral';
  const style = genderProfile?.stylePreference || 'unisex';

  // 성별 중립 악세서리는 항상 포함
  const unisex = UNISEX_ACCESSORY_RECOMMENDATIONS[seasonType] || [];

  if (gender === 'male' || style === 'masculine') {
    return [...MALE_ACCESSORY_RECOMMENDATIONS[seasonType], ...unisex];
  }

  if (gender === 'female' || style === 'feminine') {
    return [...FEMALE_ACCESSORY_RECOMMENDATIONS[seasonType], ...unisex];
  }

  // neutral/unisex: 모든 악세서리 반환
  return [
    ...MALE_ACCESSORY_RECOMMENDATIONS[seasonType],
    ...FEMALE_ACCESSORY_RECOMMENDATIONS[seasonType],
    ...unisex,
  ];
}

/**
 * 성별에 따른 스타일 용어 변환
 * 예: "화사한" -> 남성의 경우 "깔끔한"
 */
export function getGenderAdaptiveTerm(term: string, gender: GenderPreference): string {
  if (gender === 'female') return term;

  // 남성/중립용 용어 매핑
  const termMap: Record<string, string> = {
    화사한: '깔끔한',
    화사해요: '깔끔해요',
    여성스러운: '세련된',
    여성스러움: '세련됨',
    귀여운: '캐주얼한',
    청순한: '단정한',
    러블리한: '스마트한',
    우아한: '품격있는',
    발랄한: '활동적인',
    사랑스러운: '매력적인',
    로맨틱한: '감각적인',
    페미닌한: '모던한',
  };

  return termMap[term] || term;
}

/**
 * 성별에 따른 카테고리 필터
 */
export function filterCategoriesByGender(categories: string[], gender: GenderPreference): string[] {
  const maleExclusions = ['립스틱', '메이크업', '네일', '귀걸이'];
  const femaleExclusions = ['넥타이', '면도'];

  if (gender === 'male') {
    return categories.filter((c) => !maleExclusions.includes(c));
  }

  if (gender === 'female') {
    return categories.filter((c) => !femaleExclusions.includes(c));
  }

  return categories;
}

/**
 * 성별에 따른 제품 카테고리 라벨 반환
 * 남성: 그루밍 아이템, 여성: 뷰티 제품
 */
export function getProductCategoryLabel(gender: GenderPreference): string {
  if (gender === 'male') {
    return '그루밍 아이템';
  }
  if (gender === 'female') {
    return '뷰티 제품';
  }
  return '뷰티/그루밍 제품';
}

/**
 * 성별에 따른 스타일 섹션 제목 반환
 */
export function getStyleSectionTitle(gender: GenderPreference): string {
  if (gender === 'male') {
    return '남성 스타일 가이드';
  }
  if (gender === 'female') {
    return '여성 스타일 가이드';
  }
  return '스타일 가이드';
}

/**
 * 성별 프로필 검증
 */
export function isValidGenderProfile(profile: unknown): profile is UserGenderProfile {
  if (typeof profile !== 'object' || profile === null) {
    return false;
  }

  const p = profile as Record<string, unknown>;

  const validGenders: GenderPreference[] = ['male', 'female', 'neutral'];
  const validStyles: StylePreference[] = ['masculine', 'feminine', 'unisex'];

  return (
    typeof p.gender === 'string' &&
    validGenders.includes(p.gender as GenderPreference) &&
    typeof p.stylePreference === 'string' &&
    validStyles.includes(p.stylePreference as StylePreference)
  );
}

/**
 * 기본 성별 프로필 생성
 */
export function createDefaultGenderProfile(gender?: GenderPreference): UserGenderProfile {
  const g = gender || 'neutral';

  let stylePreference: StylePreference = 'unisex';
  if (g === 'male') {
    stylePreference = 'masculine';
  } else if (g === 'female') {
    stylePreference = 'feminine';
  }

  return {
    gender: g,
    stylePreference,
  };
}
