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
