/**
 * PC-1 연동 운동복 스타일 추천 로직
 *
 * 스펙 참조: docs/phase2/docs/W-1-feature-spec-template-v1.1-final.md (3.1절)
 * - 2순위: 운동복 스타일 가이드 (PC + C-1 연동)
 * - 3순위: 운동 소품 색상 추천
 * - 4순위: 운동 분위기 매칭
 */

import type { PersonalColorSeason, BodyType } from '@/types/workout';

// 색상 정보
export interface ColorInfo {
  hex: string;
  name: string;
  nameEn?: string;
}

// 운동복 핏 추천
export interface FitRecommendation {
  top: string;
  bottom: string;
  avoid: string[];
}

// 운동 소품 추천
export interface AccessoryRecommendation {
  item: string;
  colorName: string;
  hex: string;
}

// 운동 분위기 추천
export interface AmbientRecommendation {
  environment: string;
  activities: string[];
  mood: string;
}

// 전체 스타일 추천 결과
export interface WorkoutStyleRecommendation {
  personalColor: PersonalColorSeason;
  bodyType: BodyType | null;

  // 색상 추천
  recommendedColors: ColorInfo[];
  avoidColors: ColorInfo[];

  // 핏 추천 (체형 기반)
  fitRecommendation: FitRecommendation | null;

  // 소품 추천
  accessories: AccessoryRecommendation[];

  // 분위기 추천
  ambient: AmbientRecommendation;

  // 스타일 팁
  styleTip: string;
}

// PC 타입별 추천 색상
const PC_COLORS: Record<PersonalColorSeason, ColorInfo[]> = {
  Spring: [
    { hex: '#F88379', name: '코랄', nameEn: 'Coral' },
    { hex: '#FFDAB9', name: '피치', nameEn: 'Peach' },
    { hex: '#F0E68C', name: '웜 옐로우', nameEn: 'Warm Yellow' },
    { hex: '#FFA07A', name: '라이트 살몬', nameEn: 'Light Salmon' },
    { hex: '#FFB6C1', name: '라이트 핑크', nameEn: 'Light Pink' },
  ],
  Summer: [
    { hex: '#98D8C8', name: '민트', nameEn: 'Mint' },
    { hex: '#E6E6FA', name: '라벤더', nameEn: 'Lavender' },
    { hex: '#87CEEB', name: '스카이블루', nameEn: 'Sky Blue' },
    { hex: '#DDA0DD', name: '소프트 플럼', nameEn: 'Soft Plum' },
    { hex: '#FFB6C1', name: '로즈 핑크', nameEn: 'Rose Pink' },
  ],
  Autumn: [
    { hex: '#E2725B', name: '테라코타', nameEn: 'Terracotta' },
    { hex: '#808000', name: '올리브', nameEn: 'Olive' },
    { hex: '#DAA520', name: '머스타드', nameEn: 'Mustard' },
    { hex: '#8B4513', name: '브라운', nameEn: 'Brown' },
    { hex: '#CD853F', name: '카멜', nameEn: 'Camel' },
  ],
  Winter: [
    { hex: '#000000', name: '블랙', nameEn: 'Black' },
    { hex: '#FFFFFF', name: '화이트', nameEn: 'White' },
    { hex: '#800020', name: '버건디', nameEn: 'Burgundy' },
    { hex: '#0000CD', name: '로얄 블루', nameEn: 'Royal Blue' },
    { hex: '#800080', name: '퍼플', nameEn: 'Purple' },
  ],
};

// PC 타입별 피해야 할 색상
const PC_AVOID_COLORS: Record<PersonalColorSeason, ColorInfo[]> = {
  Spring: [
    { hex: '#000000', name: '블랙', nameEn: 'Black' },
    { hex: '#808080', name: '그레이', nameEn: 'Gray' },
    { hex: '#4B0082', name: '인디고', nameEn: 'Indigo' },
  ],
  Summer: [
    { hex: '#FF4500', name: '오렌지', nameEn: 'Orange' },
    { hex: '#FFD700', name: '골드', nameEn: 'Gold' },
    { hex: '#000000', name: '블랙', nameEn: 'Black' },
  ],
  Autumn: [
    { hex: '#FF00FF', name: '매젠타', nameEn: 'Magenta' },
    { hex: '#FF69B4', name: '핫 핑크', nameEn: 'Hot Pink' },
    { hex: '#87CEEB', name: '스카이 블루', nameEn: 'Sky Blue' },
  ],
  Winter: [
    { hex: '#FFDAB9', name: '피치', nameEn: 'Peach' },
    { hex: '#D2B48C', name: '탄', nameEn: 'Tan' },
    { hex: '#F0E68C', name: '카키', nameEn: 'Khaki' },
  ],
};

// 체형별 핏 추천
const BODY_TYPE_FITS: Record<BodyType, FitRecommendation> = {
  X: {
    top: '핏한 크롭탑 또는 허리 라인이 드러나는 상의',
    bottom: '하이웨이스트 레깅스',
    avoid: ['루즈핏 상의', '로우라이즈 하의'],
  },
  A: {
    top: '눈에 띄는 상의 (밝은 색상, 디테일)',
    bottom: '무릎 기장 또는 루즈핏 하의',
    avoid: ['타이트한 레깅스', '밝은 색 하의'],
  },
  V: {
    top: '심플한 민소매 또는 레이서백',
    bottom: '와이드 밴드 레깅스, 플레어 레깅스',
    avoid: ['퍼프 소매', '과한 어깨 패드'],
  },
  H: {
    top: '허리 컷아웃 디자인, 크롭탑',
    bottom: '하이웨이스트 스타일',
    avoid: ['일자 실루엣', '박시한 운동복'],
  },
  O: {
    top: '긴 기장 상의, 오버사이즈 티',
    bottom: '하이웨이스트 레깅스 (복부 서포트)',
    avoid: ['짧은 크롭탑', '타이트한 브라탑'],
  },
  I: {
    top: '레이어드 스타일, 디테일 있는 상의',
    bottom: '포켓 디테일이 있는 하의',
    avoid: ['너무 단순한 디자인'],
  },
  Y: {
    top: 'V넥 또는 스쿱넥 상의',
    bottom: '와이드 밴드 하의',
    avoid: ['보트넥', '넓은 어깨 디자인'],
  },
  '8': {
    top: '핏한 스포츠 브라 + 크롭탑',
    bottom: '하이웨이스트 레깅스',
    avoid: ['오버사이즈', '루즈핏'],
  },
};

// PC 타입별 운동 소품 추천
const PC_ACCESSORIES: Record<PersonalColorSeason, AccessoryRecommendation[]> = {
  Spring: [
    { item: '요가 매트', colorName: '코랄 핑크', hex: '#F88379' },
    { item: '물병', colorName: '피치', hex: '#FFDAB9' },
    { item: '운동 밴드', colorName: '민트 그린', hex: '#98FB98' },
    { item: '폼롤러', colorName: '라이트 핑크', hex: '#FFB6C1' },
  ],
  Summer: [
    { item: '요가 매트', colorName: '라벤더', hex: '#E6E6FA' },
    { item: '물병', colorName: '스카이블루', hex: '#87CEEB' },
    { item: '운동 밴드', colorName: '민트', hex: '#98D8C8' },
    { item: '폼롤러', colorName: '소프트 그레이', hex: '#C0C0C0' },
  ],
  Autumn: [
    { item: '요가 매트', colorName: '테라코타', hex: '#E2725B' },
    { item: '물병', colorName: '올리브', hex: '#808000' },
    { item: '운동 밴드', colorName: '머스타드', hex: '#DAA520' },
    { item: '폼롤러', colorName: '브라운', hex: '#8B4513' },
  ],
  Winter: [
    { item: '요가 매트', colorName: '블랙', hex: '#000000' },
    { item: '물병', colorName: '화이트', hex: '#FFFFFF' },
    { item: '운동 밴드', colorName: '버건디', hex: '#800020' },
    { item: '폼롤러', colorName: '딥 네이비', hex: '#000080' },
  ],
};

// PC 타입별 운동 분위기 추천
const PC_AMBIENT: Record<PersonalColorSeason, AmbientRecommendation> = {
  Spring: {
    environment: '밝은 자연광이 들어오는 공간',
    activities: ['야외 운동', '댄스', '에어로빅'],
    mood: '밝고 에너지 넘치는',
  },
  Summer: {
    environment: '차분하고 시원한 실내',
    activities: ['요가', '필라테스', '수영'],
    mood: '우아하고 차분한',
  },
  Autumn: {
    environment: '따뜻하고 포근한 분위기',
    activities: ['러닝', '하이킹', '산책'],
    mood: '자연스럽고 편안한',
  },
  Winter: {
    environment: '모던하고 세련된 피트니스 센터',
    activities: ['웨이트 트레이닝', 'HIIT', '크로스핏'],
    mood: '강렬하고 시크한',
  },
};

// PC 타입별 스타일 팁
const STYLE_TIPS: Record<PersonalColorSeason, string[]> = {
  Spring: [
    '밝고 화사한 컬러로 운동할 때도 생기 있는 모습을 유지하세요!',
    '코랄, 피치 계열의 운동복은 운동 중에도 건강한 피부톤을 돋보이게 해요.',
    '골드 디테일이 있는 액세서리가 잘 어울려요.',
  ],
  Summer: [
    '파스텔 톤의 운동복으로 우아한 운동 스타일을 완성하세요.',
    '실버 액세서리와 함께하면 더욱 세련된 느낌이에요.',
    '과하지 않은 소프트한 컬러가 당신의 매력을 극대화해요.',
  ],
  Autumn: [
    '어스톤 계열의 운동복으로 자연스러운 스타일을 연출하세요.',
    '테라코타, 올리브 컬러는 운동 중에도 세련된 느낌을 줘요.',
    '골드나 브론즈 톤의 액세서리가 잘 어울려요.',
  ],
  Winter: [
    '선명하고 강렬한 컬러로 파워풀한 운동 스타일을 완성하세요.',
    '블랙 & 화이트 모노톤은 언제나 시크한 선택이에요.',
    '실버나 메탈릭 액세서리로 포인트를 주세요.',
  ],
};

/**
 * PC와 체형을 기반으로 운동복 스타일 추천 생성
 */
export function getWorkoutStyleRecommendation(
  personalColor: PersonalColorSeason,
  bodyType: BodyType | null
): WorkoutStyleRecommendation {
  const tips = STYLE_TIPS[personalColor];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return {
    personalColor,
    bodyType,
    recommendedColors: PC_COLORS[personalColor],
    avoidColors: PC_AVOID_COLORS[personalColor],
    fitRecommendation: bodyType ? BODY_TYPE_FITS[bodyType] : null,
    accessories: PC_ACCESSORIES[personalColor],
    ambient: PC_AMBIENT[personalColor],
    styleTip: randomTip,
  };
}

/**
 * PC 타입의 한국어 라벨 반환
 */
export function getPersonalColorLabel(pc: PersonalColorSeason): string {
  const labels: Record<PersonalColorSeason, string> = {
    Spring: '봄 웜톤',
    Summer: '여름 쿨톤',
    Autumn: '가을 웜톤',
    Winter: '겨울 쿨톤',
  };
  return labels[pc];
}

/**
 * PC 타입의 이모지 반환
 */
export function getPersonalColorEmoji(pc: PersonalColorSeason): string {
  const emojis: Record<PersonalColorSeason, string> = {
    Spring: '🌸',
    Summer: '🌊',
    Autumn: '🍂',
    Winter: '❄️',
  };
  return emojis[pc];
}

/**
 * PC 타입의 테마 색상 반환 (Tailwind 클래스)
 */
export function getPersonalColorTheme(pc: PersonalColorSeason): {
  bg: string;
  bgLight: string;
  text: string;
  border: string;
} {
  const themes: Record<PersonalColorSeason, {
    bg: string;
    bgLight: string;
    text: string;
    border: string;
  }> = {
    Spring: {
      bg: 'bg-pink-500',
      bgLight: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-200',
    },
    Summer: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    Autumn: {
      bg: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
    },
    Winter: {
      bg: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
  };
  return themes[pc];
}

// 상수 내보내기 (테스트 및 외부 사용)
export {
  PC_COLORS,
  PC_AVOID_COLORS,
  BODY_TYPE_FITS,
  PC_ACCESSORIES,
  PC_AMBIENT,
  STYLE_TIPS,
};
