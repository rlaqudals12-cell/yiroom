/**
 * Phase J: AI 스타일링 Mock 데이터
 * 시즌별 색상 조합 및 운동복 추천
 */

import type { SeasonType } from './personal-color';
import type { ColorCombination, WorkoutCombination } from '@/types/styling';

/**
 * 시즌별 일상 색상 조합
 */
export const COLOR_COMBINATIONS: Record<SeasonType, ColorCombination[]> = {
  spring: [
    {
      id: 'spring-daily-1',
      name: '코랄 + 베이지',
      description: '따뜻하고 부드러운 인상',
      colors: {
        top: { name: '코랄 핑크', hex: '#FF7F7F', nameEn: 'Coral Pink' },
        bottom: { name: '웜 베이지', hex: '#F5DEB3', nameEn: 'Warm Beige' },
      },
      style: 'casual',
      occasions: ['daily', 'shopping'],
      seasonTypes: ['spring'],
      tip: '밝은 산호색 상의는 얼굴을 화사하게 밝혀줍니다',
    },
    {
      id: 'spring-daily-2',
      name: '피치 + 아이보리',
      description: '화사하고 생기있는 분위기',
      colors: {
        top: { name: '피치', hex: '#FFDAB9', nameEn: 'Peach' },
        bottom: { name: '아이보리', hex: '#FFFFF0', nameEn: 'Ivory' },
      },
      style: 'romantic',
      occasions: ['date', 'party'],
      seasonTypes: ['spring'],
      tip: '복숭아색은 봄 웜톤의 피부톤과 가장 잘 어울립니다',
    },
    {
      id: 'spring-daily-3',
      name: '민트 + 크림',
      description: '청량하면서 부드러운 조합',
      colors: {
        top: { name: '옐로우 민트', hex: '#98FB98', nameEn: 'Yellow Mint' },
        bottom: { name: '크림', hex: '#FFFDD0', nameEn: 'Cream' },
        accent: { name: '골드', hex: '#FFD700', nameEn: 'Gold' },
      },
      style: 'casual',
      occasions: ['daily', 'work'],
      seasonTypes: ['spring'],
      tip: '노란 기가 있는 민트색을 선택하세요',
    },
  ],

  summer: [
    {
      id: 'summer-daily-1',
      name: '라벤더 + 그레이',
      description: '시원하고 우아한 인상',
      colors: {
        top: { name: '라벤더', hex: '#E6E6FA', nameEn: 'Lavender' },
        bottom: { name: '쿨 그레이', hex: '#A9A9B3', nameEn: 'Cool Gray' },
      },
      style: 'elegant',
      occasions: ['work', 'daily'],
      seasonTypes: ['summer'],
      tip: '연보라색은 여름 쿨톤의 차분한 피부톤을 살려줍니다',
    },
    {
      id: 'summer-daily-2',
      name: '스카이블루 + 화이트',
      description: '청량하고 깨끗한 느낌',
      colors: {
        top: { name: '스카이 블루', hex: '#87CEEB', nameEn: 'Sky Blue' },
        bottom: { name: '오프화이트', hex: '#FAF9F6', nameEn: 'Off White' },
      },
      style: 'casual',
      occasions: ['daily', 'shopping'],
      seasonTypes: ['summer'],
      tip: '회색빛이 도는 하늘색이 여름 쿨톤에 잘 맞습니다',
    },
    {
      id: 'summer-daily-3',
      name: '로즈핑크 + 네이비',
      description: '세련되고 모던한 조합',
      colors: {
        top: { name: '로즈 핑크', hex: '#FF66B2', nameEn: 'Rose Pink' },
        bottom: { name: '네이비', hex: '#000080', nameEn: 'Navy' },
        accent: { name: '실버', hex: '#C0C0C0', nameEn: 'Silver' },
      },
      style: 'formal',
      occasions: ['work', 'date'],
      seasonTypes: ['summer'],
      tip: '실버 악세서리로 포인트를 주세요',
    },
  ],

  autumn: [
    {
      id: 'autumn-daily-1',
      name: '테라코타 + 카키',
      description: '따뜻하고 깊이있는 인상',
      colors: {
        top: { name: '테라코타', hex: '#E2725B', nameEn: 'Terracotta' },
        bottom: { name: '카키', hex: '#8B8970', nameEn: 'Khaki' },
      },
      style: 'casual',
      occasions: ['daily', 'outdoor'],
      seasonTypes: ['autumn'],
      tip: '흙색 계열이 가을 웜톤의 깊이있는 피부톤과 조화롭습니다',
    },
    {
      id: 'autumn-daily-2',
      name: '머스타드 + 브라운',
      description: '고급스럽고 세련된 분위기',
      colors: {
        top: { name: '머스타드', hex: '#FFDB58', nameEn: 'Mustard' },
        bottom: { name: '초콜릿 브라운', hex: '#7B3F00', nameEn: 'Chocolate Brown' },
      },
      style: 'elegant',
      occasions: ['work', 'date'],
      seasonTypes: ['autumn'],
      tip: '겨자색 니트와 브라운 팬츠는 가을 웜톤의 클래식한 조합입니다',
    },
    {
      id: 'autumn-daily-3',
      name: '올리브 + 버건디',
      description: '깊고 풍부한 색감',
      colors: {
        top: { name: '올리브 그린', hex: '#708238', nameEn: 'Olive Green' },
        bottom: { name: '버건디', hex: '#800020', nameEn: 'Burgundy' },
        accent: { name: '앤틱 골드', hex: '#CFB53B', nameEn: 'Antique Gold' },
      },
      style: 'formal',
      occasions: ['work', 'party'],
      seasonTypes: ['autumn'],
      tip: '앤틱 골드 악세서리가 고급스러움을 더해줍니다',
    },
  ],

  winter: [
    {
      id: 'winter-daily-1',
      name: '블랙 + 화이트',
      description: '모던하고 시크한 인상',
      colors: {
        top: { name: '퓨어 화이트', hex: '#FFFFFF', nameEn: 'Pure White' },
        bottom: { name: '트루 블랙', hex: '#000000', nameEn: 'True Black' },
      },
      style: 'formal',
      occasions: ['work', 'party'],
      seasonTypes: ['winter'],
      tip: '선명한 흑백 대비가 겨울 쿨톤의 명확한 피부톤을 강조합니다',
    },
    {
      id: 'winter-daily-2',
      name: '로얄블루 + 그레이',
      description: '세련되고 도시적인 느낌',
      colors: {
        top: { name: '로얄 블루', hex: '#4169E1', nameEn: 'Royal Blue' },
        bottom: { name: '차콜 그레이', hex: '#36454F', nameEn: 'Charcoal Gray' },
      },
      style: 'elegant',
      occasions: ['work', 'date'],
      seasonTypes: ['winter'],
      tip: '선명한 파란색이 겨울 쿨톤의 차가운 피부톤과 조화롭습니다',
    },
    {
      id: 'winter-daily-3',
      name: '핫핑크 + 블랙',
      description: '강렬하고 개성있는 조합',
      colors: {
        top: { name: '핫 핑크', hex: '#FF69B4', nameEn: 'Hot Pink' },
        bottom: { name: '블랙', hex: '#000000', nameEn: 'Black' },
        accent: { name: '실버', hex: '#C0C0C0', nameEn: 'Silver' },
      },
      style: 'casual',
      occasions: ['party', 'date'],
      seasonTypes: ['winter'],
      tip: '선명한 핑크는 겨울 쿨톤만이 소화할 수 있는 색입니다',
    },
  ],
};

/**
 * 시즌별 운동복 색상 조합
 */
export const WORKOUT_COMBINATIONS: Record<SeasonType, WorkoutCombination[]> = {
  spring: [
    {
      id: 'spring-workout-1',
      name: '피치 + 그레이',
      description: '활동적이면서 화사한 느낌',
      colors: {
        top: { name: '피치 핑크', hex: '#FFDAB9', nameEn: 'Peach Pink' },
        bottom: { name: '웜 그레이', hex: '#A8A89D', nameEn: 'Warm Gray' },
      },
      shoes: { name: '코랄', hex: '#FF7F7F', nameEn: 'Coral' },
      style: 'sporty',
      occasions: ['gym', 'yoga'],
      seasonTypes: ['spring'],
      category: 'gym',
      tip: '파스텔 톤 운동복이 봄 웜톤에게 잘 어울립니다',
    },
    {
      id: 'spring-workout-2',
      name: '민트 + 화이트',
      description: '상쾌하고 경쾌한 분위기',
      colors: {
        top: { name: '옐로우 민트', hex: '#98FB98', nameEn: 'Yellow Mint' },
        bottom: { name: '크림 화이트', hex: '#FFFDD0', nameEn: 'Cream White' },
      },
      shoes: { name: '골드 베이지', hex: '#F5F5DC', nameEn: 'Gold Beige' },
      style: 'sporty',
      occasions: ['outdoor', 'running'],
      seasonTypes: ['spring'],
      category: 'outdoor',
      tip: '야외 운동 시 밝은 민트색이 활력을 줍니다',
    },
  ],

  summer: [
    {
      id: 'summer-workout-1',
      name: '라벤더 + 실버그레이',
      description: '시원하고 세련된 느낌',
      colors: {
        top: { name: '라벤더', hex: '#E6E6FA', nameEn: 'Lavender' },
        bottom: { name: '실버 그레이', hex: '#C0C0C0', nameEn: 'Silver Gray' },
      },
      shoes: { name: '쿨 그레이', hex: '#8E8E93', nameEn: 'Cool Gray' },
      style: 'sporty',
      occasions: ['gym', 'yoga'],
      seasonTypes: ['summer'],
      category: 'yoga',
      tip: '요가나 필라테스에 차분한 라벤더 톤 추천',
    },
    {
      id: 'summer-workout-2',
      name: '스카이블루 + 네이비',
      description: '시원하고 깔끔한 조합',
      colors: {
        top: { name: '스카이 블루', hex: '#87CEEB', nameEn: 'Sky Blue' },
        bottom: { name: '네이비', hex: '#000080', nameEn: 'Navy' },
      },
      shoes: { name: '화이트', hex: '#FFFFFF', nameEn: 'White' },
      style: 'sporty',
      occasions: ['outdoor', 'running'],
      seasonTypes: ['summer'],
      category: 'running',
      tip: '러닝 시 시원한 블루 계열이 쾌적함을 줍니다',
    },
  ],

  autumn: [
    {
      id: 'autumn-workout-1',
      name: '테라코타 + 올리브',
      description: '차분하면서 에너지있는 느낌',
      colors: {
        top: { name: '테라코타', hex: '#E2725B', nameEn: 'Terracotta' },
        bottom: { name: '올리브', hex: '#708238', nameEn: 'Olive' },
      },
      shoes: { name: '탄', hex: '#D2B48C', nameEn: 'Tan' },
      style: 'sporty',
      occasions: ['gym', 'outdoor'],
      seasonTypes: ['autumn'],
      category: 'gym',
      tip: '어스 톤 운동복이 가을 웜톤에게 잘 어울립니다',
    },
    {
      id: 'autumn-workout-2',
      name: '머스타드 + 브라운',
      description: '따뜻하고 활동적인 분위기',
      colors: {
        top: { name: '머스타드', hex: '#FFDB58', nameEn: 'Mustard' },
        bottom: { name: '다크 브라운', hex: '#654321', nameEn: 'Dark Brown' },
      },
      shoes: { name: '카멜', hex: '#C19A6B', nameEn: 'Camel' },
      style: 'sporty',
      occasions: ['outdoor', 'running'],
      seasonTypes: ['autumn'],
      category: 'outdoor',
      tip: '가을 야외 운동에 머스타드 포인트 추천',
    },
  ],

  winter: [
    {
      id: 'winter-workout-1',
      name: '블랙 + 화이트',
      description: '시크하고 모던한 느낌',
      colors: {
        top: { name: '퓨어 화이트', hex: '#FFFFFF', nameEn: 'Pure White' },
        bottom: { name: '트루 블랙', hex: '#000000', nameEn: 'True Black' },
      },
      shoes: { name: '블랙', hex: '#000000', nameEn: 'Black' },
      style: 'sporty',
      occasions: ['gym'],
      seasonTypes: ['winter'],
      category: 'gym',
      tip: '선명한 흑백 조합이 겨울 쿨톤에게 가장 잘 어울립니다',
    },
    {
      id: 'winter-workout-2',
      name: '로얄블루 + 블랙',
      description: '강렬하고 세련된 조합',
      colors: {
        top: { name: '로얄 블루', hex: '#4169E1', nameEn: 'Royal Blue' },
        bottom: { name: '블랙', hex: '#000000', nameEn: 'Black' },
      },
      shoes: { name: '네이비', hex: '#000080', nameEn: 'Navy' },
      style: 'sporty',
      occasions: ['outdoor', 'running'],
      seasonTypes: ['winter'],
      category: 'running',
      tip: '선명한 컬러 포인트가 겨울 쿨톤의 매력을 살립니다',
    },
  ],
};

/**
 * 시즌별 색상 조합 가져오기
 */
export function getColorCombinations(seasonType: SeasonType): ColorCombination[] {
  return COLOR_COMBINATIONS[seasonType] || [];
}

/**
 * 시즌별 운동복 조합 가져오기
 */
export function getWorkoutCombinations(seasonType: SeasonType): WorkoutCombination[] {
  return WORKOUT_COMBINATIONS[seasonType] || [];
}

/**
 * 특정 상황에 맞는 조합 필터링
 */
export function filterByOccasion(
  combinations: ColorCombination[],
  occasion: string
): ColorCombination[] {
  return combinations.filter((c) => c.occasions.includes(occasion as never));
}

/**
 * 운동 카테고리별 필터링
 */
export function filterByWorkoutCategory(
  combinations: WorkoutCombination[],
  category: 'gym' | 'outdoor' | 'yoga' | 'running'
): WorkoutCombination[] {
  return combinations.filter((c) => c.category === category);
}

// ============================================
// Phase J P2: 악세서리 & 메이크업 Mock 데이터
// ============================================

import type {
  AccessoryStyling as AccessoryStylingType,
  MakeupStyling as MakeupStylingType,
} from '@/types/styling';

/**
 * 시즌별 악세서리 스타일링
 */
export const ACCESSORY_STYLING: Record<SeasonType, AccessoryStylingType> = {
  spring: {
    seasonType: 'spring',
    metalTones: [
      { metalTone: 'gold', isRecommended: true, description: '옐로우 골드가 가장 잘 어울립니다' },
      {
        metalTone: 'rose_gold',
        isRecommended: true,
        description: '로즈골드도 따뜻한 느낌으로 좋습니다',
      },
      {
        metalTone: 'silver',
        isRecommended: false,
        description: '차가운 실버는 피하는 것이 좋습니다',
      },
      {
        metalTone: 'bronze',
        isRecommended: false,
        description: '브론즈는 가을 웜톤에 더 적합합니다',
      },
    ],
    items: [
      {
        type: 'earring',
        name: '코랄 드롭',
        metalTone: 'gold',
        gemstone: { name: '코랄', hex: '#FF7F7F' },
        tip: '작은 사이즈가 더 화사해 보입니다',
      },
      {
        type: 'necklace',
        name: '피치 펜던트',
        metalTone: 'gold',
        gemstone: { name: '피치 문스톤', hex: '#FFDAB9' },
      },
      {
        type: 'ring',
        name: '골드 밴드',
        metalTone: 'gold',
        tip: '심플한 골드 링이 세련된 느낌',
      },
      {
        type: 'bracelet',
        name: '체인 팔찌',
        metalTone: 'rose_gold',
        gemstone: { name: '로즈쿼츠', hex: '#F7CAC9' },
      },
    ],
    generalTip:
      '봄 웜톤은 옐로우 골드와 따뜻한 색상의 원석이 잘 어울립니다. 피치, 코랄 계열 보석을 추천합니다.',
  },

  summer: {
    seasonType: 'summer',
    metalTones: [
      { metalTone: 'silver', isRecommended: true, description: '쿨한 실버가 가장 잘 어울립니다' },
      {
        metalTone: 'rose_gold',
        isRecommended: true,
        description: '핑크빛 로즈골드도 좋은 선택입니다',
      },
      {
        metalTone: 'gold',
        isRecommended: false,
        description: '옐로우 골드는 피하는 것이 좋습니다',
      },
      { metalTone: 'bronze', isRecommended: false, description: '브론즈는 너무 따뜻한 느낌입니다' },
    ],
    items: [
      {
        type: 'earring',
        name: '라벤더 스터드',
        metalTone: 'silver',
        gemstone: { name: '자수정', hex: '#9966CC' },
        tip: '차분한 보라색이 우아한 분위기를 연출',
      },
      {
        type: 'necklace',
        name: '실버 체인',
        metalTone: 'silver',
        tip: '심플한 실버 체인이 세련됩니다',
      },
      {
        type: 'ring',
        name: '블루 토파즈',
        metalTone: 'silver',
        gemstone: { name: '블루 토파즈', hex: '#87CEEB' },
      },
      {
        type: 'bracelet',
        name: '펄 팔찌',
        metalTone: 'silver',
        gemstone: { name: '담수진주', hex: '#FDEEF4' },
      },
    ],
    generalTip:
      '여름 쿨톤은 실버와 시원한 색상의 보석이 잘 어울립니다. 라벤더, 스카이블루 계열을 추천합니다.',
  },

  autumn: {
    seasonType: 'autumn',
    metalTones: [
      { metalTone: 'gold', isRecommended: true, description: '앤틱 골드가 가장 잘 어울립니다' },
      {
        metalTone: 'bronze',
        isRecommended: true,
        description: '브론즈/황동이 깊이있는 느낌을 줍니다',
      },
      {
        metalTone: 'rose_gold',
        isRecommended: true,
        description: '로즈골드도 따뜻한 느낌으로 좋습니다',
      },
      { metalTone: 'silver', isRecommended: false, description: '차가운 실버는 어울리지 않습니다' },
    ],
    items: [
      {
        type: 'earring',
        name: '앰버 드롭',
        metalTone: 'gold',
        gemstone: { name: '호박(앰버)', hex: '#FFBF00' },
        tip: '호박 원석이 가을 분위기와 잘 맞습니다',
      },
      {
        type: 'necklace',
        name: '앤틱 펜던트',
        metalTone: 'bronze',
        gemstone: { name: '타이거아이', hex: '#B8860B' },
      },
      {
        type: 'ring',
        name: '오닉스 링',
        metalTone: 'gold',
        gemstone: { name: '오닉스', hex: '#353839' },
      },
      {
        type: 'watch',
        name: '가죽 스트랩',
        metalTone: 'bronze',
        tip: '브라운 가죽과 브론즈 조합 추천',
      },
    ],
    generalTip:
      '가을 웜톤은 앤틱 골드, 브론즈와 깊이있는 색상의 원석이 잘 어울립니다. 앰버, 타이거아이를 추천합니다.',
  },

  winter: {
    seasonType: 'winter',
    metalTones: [
      { metalTone: 'silver', isRecommended: true, description: '화이트 실버가 가장 잘 어울립니다' },
      {
        metalTone: 'gold',
        isRecommended: true,
        description: '화이트 골드도 좋은 선택입니다',
      },
      {
        metalTone: 'rose_gold',
        isRecommended: false,
        description: '로즈골드는 너무 따뜻한 느낌입니다',
      },
      { metalTone: 'bronze', isRecommended: false, description: '브론즈는 어울리지 않습니다' },
    ],
    items: [
      {
        type: 'earring',
        name: '다이아몬드 스터드',
        metalTone: 'silver',
        gemstone: { name: '큐빅', hex: '#E6E8E6' },
        tip: '선명한 반짝임이 겨울 쿨톤과 잘 맞습니다',
      },
      {
        type: 'necklace',
        name: '사파이어 펜던트',
        metalTone: 'silver',
        gemstone: { name: '사파이어', hex: '#0F52BA' },
      },
      {
        type: 'ring',
        name: '에메랄드 링',
        metalTone: 'silver',
        gemstone: { name: '에메랄드', hex: '#50C878' },
      },
      {
        type: 'bracelet',
        name: '테니스 팔찌',
        metalTone: 'silver',
        gemstone: { name: '큐빅', hex: '#E6E8E6' },
      },
    ],
    generalTip:
      '겨울 쿨톤은 실버와 선명한 색상의 보석이 잘 어울립니다. 다이아몬드, 사파이어, 에메랄드를 추천합니다.',
  },
};

/**
 * 시즌별 메이크업 스타일링
 */
export const MAKEUP_STYLING: Record<SeasonType, MakeupStylingType> = {
  spring: {
    seasonType: 'spring',
    lipstick: {
      category: 'lipstick',
      colors: [
        { name: '코랄 핑크', hex: '#FF7F7F', finish: 'glossy' },
        { name: '피치', hex: '#FFDAB9', finish: 'satin' },
        { name: '살몬 핑크', hex: '#FA8072', finish: 'matte' },
        { name: '오렌지 레드', hex: '#FF6347', finish: 'glossy' },
        { name: '누드 베이지', hex: '#E8C4A2', finish: 'satin' },
      ],
      tip: '따뜻한 톤의 립이 얼굴을 화사하게 밝혀줍니다',
    },
    eyeshadow: {
      category: 'eyeshadow',
      colors: [
        { name: '베이지', hex: '#F5F5DC', finish: 'matte' },
        { name: '피치', hex: '#FFDAB9', finish: 'shimmer' },
        { name: '골드', hex: '#FFD700', finish: 'shimmer' },
        { name: '웜 브라운', hex: '#8B4513', finish: 'matte' },
      ],
      tip: '따뜻한 브라운 계열로 자연스러운 눈매 연출',
    },
    blusher: {
      category: 'blusher',
      colors: [
        { name: '코랄', hex: '#FF7F7F' },
        { name: '피치', hex: '#FFDAB9' },
        { name: '살몬', hex: '#FA8072' },
      ],
      tip: '자연스러운 혈색 표현을 위해 코랄/피치 계열 추천',
    },
    generalTip:
      '봄 웜톤은 화사하고 밝은 메이크업이 잘 어울립니다. 오렌지, 코랄, 피치 계열을 적극 활용하세요.',
  },

  summer: {
    seasonType: 'summer',
    lipstick: {
      category: 'lipstick',
      colors: [
        { name: '로즈 핑크', hex: '#FF66B2', finish: 'satin' },
        { name: '베리', hex: '#8E4585', finish: 'matte' },
        { name: '말린 장미', hex: '#C08081', finish: 'matte' },
        { name: '체리 레드', hex: '#DE3163', finish: 'glossy' },
        { name: '모브 핑크', hex: '#E0B0FF', finish: 'satin' },
      ],
      tip: '푸른 기가 도는 핑크 계열이 피부를 맑게 보이게 합니다',
    },
    eyeshadow: {
      category: 'eyeshadow',
      colors: [
        { name: '라벤더', hex: '#E6E6FA', finish: 'shimmer' },
        { name: '로즈', hex: '#FF66B2', finish: 'matte' },
        { name: '그레이', hex: '#A9A9B3', finish: 'matte' },
        { name: '쿨 브라운', hex: '#8B7355', finish: 'matte' },
      ],
      tip: '회색빛이 도는 부드러운 톤으로 우아한 눈매 연출',
    },
    blusher: {
      category: 'blusher',
      colors: [
        { name: '로즈', hex: '#FF66B2' },
        { name: '핑크', hex: '#FFB6C1' },
        { name: '라벤더', hex: '#E6E6FA' },
      ],
      tip: '차가운 핑크 계열로 청량한 분위기 연출',
    },
    generalTip:
      '여름 쿨톤은 부드럽고 시원한 메이크업이 잘 어울립니다. 로즈, 라벤더, 베리 계열을 활용하세요.',
  },

  autumn: {
    seasonType: 'autumn',
    lipstick: {
      category: 'lipstick',
      colors: [
        { name: '테라코타', hex: '#E2725B', finish: 'matte' },
        { name: '버건디', hex: '#800020', finish: 'satin' },
        { name: '브릭 레드', hex: '#CB4154', finish: 'matte' },
        { name: '머스타드 오렌지', hex: '#FF8C00', finish: 'matte' },
        { name: '누드 브라운', hex: '#C19A6B', finish: 'satin' },
      ],
      tip: '깊이있는 웜톤 립컬러가 고급스러운 분위기를 연출합니다',
    },
    eyeshadow: {
      category: 'eyeshadow',
      colors: [
        { name: '올리브', hex: '#708238', finish: 'matte' },
        { name: '골드 브라운', hex: '#996515', finish: 'shimmer' },
        { name: '테라코타', hex: '#E2725B', finish: 'matte' },
        { name: '초콜릿', hex: '#7B3F00', finish: 'matte' },
      ],
      tip: '깊이있는 어스 톤으로 풍부한 눈매 연출',
    },
    blusher: {
      category: 'blusher',
      colors: [
        { name: '브릭', hex: '#CB4154' },
        { name: '테라코타', hex: '#E2725B' },
        { name: '피그먼트 브라운', hex: '#C19A6B' },
      ],
      tip: '테라코타, 브릭 계열로 건강한 혈색 표현',
    },
    generalTip:
      '가을 웜톤은 깊이있고 풍부한 메이크업이 잘 어울립니다. 테라코타, 버건디, 올리브 계열을 활용하세요.',
  },

  winter: {
    seasonType: 'winter',
    lipstick: {
      category: 'lipstick',
      colors: [
        { name: '트루 레드', hex: '#FF0000', finish: 'matte' },
        { name: '와인', hex: '#722F37', finish: 'satin' },
        { name: '핫 핑크', hex: '#FF69B4', finish: 'glossy' },
        { name: '푸시아', hex: '#FF00FF', finish: 'matte' },
        { name: '딥 플럼', hex: '#8E4585', finish: 'satin' },
      ],
      tip: '선명하고 강렬한 립컬러가 피부를 더 밝게 보이게 합니다',
    },
    eyeshadow: {
      category: 'eyeshadow',
      colors: [
        { name: '실버', hex: '#C0C0C0', finish: 'shimmer' },
        { name: '네이비', hex: '#000080', finish: 'matte' },
        { name: '딥 퍼플', hex: '#4B0082', finish: 'matte' },
        { name: '블랙', hex: '#000000', finish: 'matte' },
      ],
      tip: '선명한 색상으로 또렷한 눈매 연출',
    },
    blusher: {
      category: 'blusher',
      colors: [
        { name: '핑크', hex: '#FF69B4' },
        { name: '플럼', hex: '#8E4585' },
        { name: '와인', hex: '#722F37' },
      ],
      tip: '선명한 핑크나 플럼 계열로 강렬한 인상 연출',
    },
    generalTip:
      '겨울 쿨톤은 선명하고 대비가 강한 메이크업이 잘 어울립니다. 트루 레드, 핫 핑크, 딥 컬러를 활용하세요.',
  },
};

/**
 * 시즌별 악세서리 스타일링 가져오기
 */
export function getAccessoryStyling(seasonType: SeasonType): AccessoryStylingType {
  return ACCESSORY_STYLING[seasonType];
}

/**
 * 시즌별 메이크업 스타일링 가져오기
 */
export function getMakeupStyling(seasonType: SeasonType): MakeupStylingType {
  return MAKEUP_STYLING[seasonType];
}

// ============================================
// Phase J P3: 전체 코디 프리셋 Mock 데이터
// ============================================

import type { OutfitPreset, OutfitOccasion } from '@/types/styling';

/**
 * 시즌별 전체 코디 프리셋
 */
export const OUTFIT_PRESETS: Record<SeasonType, OutfitPreset[]> = {
  spring: [
    {
      occasion: 'daily',
      name: '화사한 봄 데일리',
      description: '따뜻하고 밝은 일상 스타일',
      outfits: [
        {
          id: 'spring-daily-full-1',
          seasonType: 'spring',
          occasion: 'daily',
          clothing: COLOR_COMBINATIONS.spring[0],
          accessory: {
            metalTone: 'gold',
            items: ACCESSORY_STYLING.spring.items.slice(0, 2),
          },
          makeup: {
            lipstick: MAKEUP_STYLING.spring.lipstick.colors[0],
            eyeshadow: MAKEUP_STYLING.spring.eyeshadow.colors.slice(0, 2),
            blusher: MAKEUP_STYLING.spring.blusher.colors[0],
          },
          tip: '코랄 톤으로 통일감 있게 연출하세요',
        },
      ],
    },
    {
      occasion: 'work',
      name: '밝은 봄 출근룩',
      description: '단정하면서 화사한 오피스 스타일',
      outfits: [
        {
          id: 'spring-work-full-1',
          seasonType: 'spring',
          occasion: 'work',
          clothing: COLOR_COMBINATIONS.spring[2],
          accessory: {
            metalTone: 'gold',
            items: [ACCESSORY_STYLING.spring.items[2]],
          },
          makeup: {
            lipstick: MAKEUP_STYLING.spring.lipstick.colors[4],
            eyeshadow: [MAKEUP_STYLING.spring.eyeshadow.colors[0]],
            blusher: MAKEUP_STYLING.spring.blusher.colors[1],
          },
          tip: '누드 톤으로 자연스럽게, 골드 포인트로 세련되게',
        },
      ],
    },
    {
      occasion: 'date',
      name: '로맨틱 봄 데이트',
      description: '사랑스럽고 여성스러운 데이트룩',
      outfits: [
        {
          id: 'spring-date-full-1',
          seasonType: 'spring',
          occasion: 'date',
          clothing: COLOR_COMBINATIONS.spring[1],
          accessory: {
            metalTone: 'rose_gold',
            items: ACCESSORY_STYLING.spring.items.slice(0, 2),
          },
          makeup: {
            lipstick: MAKEUP_STYLING.spring.lipstick.colors[1],
            eyeshadow: MAKEUP_STYLING.spring.eyeshadow.colors.slice(1, 3),
            blusher: MAKEUP_STYLING.spring.blusher.colors[0],
          },
          tip: '피치 톤으로 사랑스럽게, 로즈골드로 포인트',
        },
      ],
    },
    {
      occasion: 'party',
      name: '화려한 봄 파티',
      description: '밝고 활기찬 파티룩',
      outfits: [
        {
          id: 'spring-party-full-1',
          seasonType: 'spring',
          occasion: 'party',
          clothing: COLOR_COMBINATIONS.spring[1],
          accessory: {
            metalTone: 'gold',
            items: ACCESSORY_STYLING.spring.items,
          },
          makeup: {
            lipstick: MAKEUP_STYLING.spring.lipstick.colors[3],
            eyeshadow: MAKEUP_STYLING.spring.eyeshadow.colors.slice(2, 4),
            blusher: MAKEUP_STYLING.spring.blusher.colors[2],
          },
          tip: '오렌지 레드 립으로 화사하고 활기찬 분위기',
        },
      ],
    },
  ],

  summer: [
    {
      occasion: 'daily',
      name: '시원한 여름 데일리',
      description: '청량하고 우아한 일상 스타일',
      outfits: [
        {
          id: 'summer-daily-full-1',
          seasonType: 'summer',
          occasion: 'daily',
          clothing: COLOR_COMBINATIONS.summer[1],
          accessory: {
            metalTone: 'silver',
            items: ACCESSORY_STYLING.summer.items.slice(0, 2),
          },
          makeup: {
            lipstick: MAKEUP_STYLING.summer.lipstick.colors[2],
            eyeshadow: MAKEUP_STYLING.summer.eyeshadow.colors.slice(0, 2),
            blusher: MAKEUP_STYLING.summer.blusher.colors[1],
          },
          tip: '쿨한 색감으로 시원하고 우아하게',
        },
      ],
    },
    {
      occasion: 'work',
      name: '세련된 여름 출근룩',
      description: '시원하면서 전문적인 오피스 스타일',
      outfits: [
        {
          id: 'summer-work-full-1',
          seasonType: 'summer',
          occasion: 'work',
          clothing: COLOR_COMBINATIONS.summer[0],
          accessory: {
            metalTone: 'silver',
            items: [ACCESSORY_STYLING.summer.items[1]],
          },
          makeup: {
            lipstick: MAKEUP_STYLING.summer.lipstick.colors[4],
            eyeshadow: [MAKEUP_STYLING.summer.eyeshadow.colors[2]],
            blusher: MAKEUP_STYLING.summer.blusher.colors[0],
          },
          tip: '라벤더와 그레이로 지적이고 차분하게',
        },
      ],
    },
    {
      occasion: 'date',
      name: '로맨틱 여름 데이트',
      description: '부드럽고 여성스러운 데이트룩',
      outfits: [
        {
          id: 'summer-date-full-1',
          seasonType: 'summer',
          occasion: 'date',
          clothing: COLOR_COMBINATIONS.summer[2],
          accessory: {
            metalTone: 'rose_gold',
            items: ACCESSORY_STYLING.summer.items.slice(0, 2),
          },
          makeup: {
            lipstick: MAKEUP_STYLING.summer.lipstick.colors[0],
            eyeshadow: MAKEUP_STYLING.summer.eyeshadow.colors.slice(0, 2),
            blusher: MAKEUP_STYLING.summer.blusher.colors[0],
          },
          tip: '로즈 핑크로 사랑스럽고 우아하게',
        },
      ],
    },
    {
      occasion: 'party',
      name: '시크한 여름 파티',
      description: '세련되고 모던한 파티룩',
      outfits: [
        {
          id: 'summer-party-full-1',
          seasonType: 'summer',
          occasion: 'party',
          clothing: COLOR_COMBINATIONS.summer[2],
          accessory: {
            metalTone: 'silver',
            items: ACCESSORY_STYLING.summer.items,
          },
          makeup: {
            lipstick: MAKEUP_STYLING.summer.lipstick.colors[1],
            eyeshadow: MAKEUP_STYLING.summer.eyeshadow.colors.slice(2, 4),
            blusher: MAKEUP_STYLING.summer.blusher.colors[2],
          },
          tip: '베리 립으로 시크하고 세련되게',
        },
      ],
    },
  ],

  autumn: [
    {
      occasion: 'daily',
      name: '따뜻한 가을 데일리',
      description: '깊고 따뜻한 일상 스타일',
      outfits: [
        {
          id: 'autumn-daily-full-1',
          seasonType: 'autumn',
          occasion: 'daily',
          clothing: COLOR_COMBINATIONS.autumn[0],
          accessory: {
            metalTone: 'gold',
            items: ACCESSORY_STYLING.autumn.items.slice(0, 2),
          },
          makeup: {
            lipstick: MAKEUP_STYLING.autumn.lipstick.colors[0],
            eyeshadow: MAKEUP_STYLING.autumn.eyeshadow.colors.slice(0, 2),
            blusher: MAKEUP_STYLING.autumn.blusher.colors[0],
          },
          tip: '테라코타 톤으로 따뜻하고 깊이있게',
        },
      ],
    },
    {
      occasion: 'work',
      name: '고급스러운 가을 출근룩',
      description: '품격있고 세련된 오피스 스타일',
      outfits: [
        {
          id: 'autumn-work-full-1',
          seasonType: 'autumn',
          occasion: 'work',
          clothing: COLOR_COMBINATIONS.autumn[1],
          accessory: {
            metalTone: 'gold',
            items: [ACCESSORY_STYLING.autumn.items[3]],
          },
          makeup: {
            lipstick: MAKEUP_STYLING.autumn.lipstick.colors[4],
            eyeshadow: [MAKEUP_STYLING.autumn.eyeshadow.colors[3]],
            blusher: MAKEUP_STYLING.autumn.blusher.colors[2],
          },
          tip: '머스타드와 브라운으로 고급스럽게',
        },
      ],
    },
    {
      occasion: 'date',
      name: '무드있는 가을 데이트',
      description: '깊고 로맨틱한 데이트룩',
      outfits: [
        {
          id: 'autumn-date-full-1',
          seasonType: 'autumn',
          occasion: 'date',
          clothing: COLOR_COMBINATIONS.autumn[2],
          accessory: {
            metalTone: 'bronze',
            items: ACCESSORY_STYLING.autumn.items.slice(0, 2),
          },
          makeup: {
            lipstick: MAKEUP_STYLING.autumn.lipstick.colors[1],
            eyeshadow: MAKEUP_STYLING.autumn.eyeshadow.colors.slice(0, 2),
            blusher: MAKEUP_STYLING.autumn.blusher.colors[1],
          },
          tip: '버건디 립으로 깊이있는 매력 연출',
        },
      ],
    },
    {
      occasion: 'party',
      name: '화려한 가을 파티',
      description: '풍부하고 드라마틱한 파티룩',
      outfits: [
        {
          id: 'autumn-party-full-1',
          seasonType: 'autumn',
          occasion: 'party',
          clothing: COLOR_COMBINATIONS.autumn[2],
          accessory: {
            metalTone: 'gold',
            items: ACCESSORY_STYLING.autumn.items,
          },
          makeup: {
            lipstick: MAKEUP_STYLING.autumn.lipstick.colors[2],
            eyeshadow: MAKEUP_STYLING.autumn.eyeshadow.colors.slice(1, 3),
            blusher: MAKEUP_STYLING.autumn.blusher.colors[0],
          },
          tip: '브릭 레드와 골드로 화려하게',
        },
      ],
    },
  ],

  winter: [
    {
      occasion: 'daily',
      name: '시크한 겨울 데일리',
      description: '모던하고 선명한 일상 스타일',
      outfits: [
        {
          id: 'winter-daily-full-1',
          seasonType: 'winter',
          occasion: 'daily',
          clothing: COLOR_COMBINATIONS.winter[0],
          accessory: {
            metalTone: 'silver',
            items: ACCESSORY_STYLING.winter.items.slice(0, 2),
          },
          makeup: {
            lipstick: MAKEUP_STYLING.winter.lipstick.colors[0],
            eyeshadow: MAKEUP_STYLING.winter.eyeshadow.colors.slice(0, 2),
            blusher: MAKEUP_STYLING.winter.blusher.colors[0],
          },
          tip: '흑백 대비로 시크하고 모던하게',
        },
      ],
    },
    {
      occasion: 'work',
      name: '프로페셔널 겨울 출근룩',
      description: '전문적이고 카리스마 있는 오피스 스타일',
      outfits: [
        {
          id: 'winter-work-full-1',
          seasonType: 'winter',
          occasion: 'work',
          clothing: COLOR_COMBINATIONS.winter[1],
          accessory: {
            metalTone: 'silver',
            items: [ACCESSORY_STYLING.winter.items[1]],
          },
          makeup: {
            lipstick: MAKEUP_STYLING.winter.lipstick.colors[1],
            eyeshadow: [MAKEUP_STYLING.winter.eyeshadow.colors[1]],
            blusher: MAKEUP_STYLING.winter.blusher.colors[0],
          },
          tip: '로얄블루와 와인 립으로 강렬하게',
        },
      ],
    },
    {
      occasion: 'date',
      name: '드라마틱 겨울 데이트',
      description: '강렬하고 매력적인 데이트룩',
      outfits: [
        {
          id: 'winter-date-full-1',
          seasonType: 'winter',
          occasion: 'date',
          clothing: COLOR_COMBINATIONS.winter[2],
          accessory: {
            metalTone: 'silver',
            items: ACCESSORY_STYLING.winter.items.slice(0, 2),
          },
          makeup: {
            lipstick: MAKEUP_STYLING.winter.lipstick.colors[2],
            eyeshadow: MAKEUP_STYLING.winter.eyeshadow.colors.slice(0, 2),
            blusher: MAKEUP_STYLING.winter.blusher.colors[0],
          },
          tip: '핫핑크 립으로 강렬한 매력 연출',
        },
      ],
    },
    {
      occasion: 'party',
      name: '글래머러스 겨울 파티',
      description: '화려하고 극적인 파티룩',
      outfits: [
        {
          id: 'winter-party-full-1',
          seasonType: 'winter',
          occasion: 'party',
          clothing: COLOR_COMBINATIONS.winter[2],
          accessory: {
            metalTone: 'silver',
            items: ACCESSORY_STYLING.winter.items,
          },
          makeup: {
            lipstick: MAKEUP_STYLING.winter.lipstick.colors[3],
            eyeshadow: MAKEUP_STYLING.winter.eyeshadow.colors.slice(2, 4),
            blusher: MAKEUP_STYLING.winter.blusher.colors[1],
          },
          tip: '푸시아와 딥 퍼플로 화려하게',
        },
      ],
    },
  ],
};

/**
 * 시즌별 코디 프리셋 가져오기
 */
export function getOutfitPresets(seasonType: SeasonType): OutfitPreset[] {
  return OUTFIT_PRESETS[seasonType] || [];
}

/**
 * 상황별 코디 프리셋 가져오기
 */
export function getOutfitPresetByOccasion(
  seasonType: SeasonType,
  occasion: OutfitOccasion
): OutfitPreset | undefined {
  const presets = getOutfitPresets(seasonType);
  return presets.find((p) => p.occasion === occasion);
}
