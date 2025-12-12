/**
 * 스킨케어 루틴 빌더
 * @description 퍼스널 컬러, 피부 타입 기반 스킨케어 루틴 추천
 */

import type { CosmeticCategory, SkinType, SkinConcern } from '@/types/product';

export type RoutineTime = 'morning' | 'evening';
export type RoutineStep = {
  order: number;
  category: CosmeticCategory;
  name: string;
  description: string;
  isOptional: boolean;
  tips?: string;
};

export interface SkincareRoutine {
  time: RoutineTime;
  steps: RoutineStep[];
  tips: string[];
}

export interface UserProfile {
  skinType: SkinType;
  skinConcerns: SkinConcern[];
  age?: number;
  usesMakeup?: boolean;
}

/**
 * 기본 모닝 루틴
 */
const BASE_MORNING_ROUTINE: RoutineStep[] = [
  {
    order: 1,
    category: 'cleanser',
    name: '세안',
    description: '순한 세안제로 밤사이 쌓인 피지와 노폐물을 제거합니다.',
    isOptional: false,
    tips: '미온수로 30초 이상 충분히 헹궈주세요.',
  },
  {
    order: 2,
    category: 'toner',
    name: '토너',
    description: '피부 pH 밸런스를 맞추고 다음 단계 흡수를 도와줍니다.',
    isOptional: false,
  },
  {
    order: 3,
    category: 'serum',
    name: '세럼/에센스',
    description: '고농축 활성 성분으로 피부 고민을 집중 케어합니다.',
    isOptional: true,
    tips: '비타민C 세럼은 아침에 사용하면 자외선 차단 효과를 높여줍니다.',
  },
  {
    order: 4,
    category: 'moisturizer',
    name: '수분크림',
    description: '수분을 공급하고 피부 장벽을 보호합니다.',
    isOptional: false,
  },
  {
    order: 5,
    category: 'sunscreen',
    name: '선크림',
    description: '자외선으로부터 피부를 보호합니다. 가장 중요한 단계!',
    isOptional: false,
    tips: '실내에서도 자외선 A는 유리를 통과하므로 꼭 바르세요.',
  },
];

/**
 * 기본 이브닝 루틴
 */
const BASE_EVENING_ROUTINE: RoutineStep[] = [
  {
    order: 1,
    category: 'cleanser',
    name: '1차 클렌징',
    description: '오일/밤 클렌저로 메이크업과 선크림을 녹여냅니다.',
    isOptional: false,
    tips: '건조한 상태에서 마사지하듯 문지르세요.',
  },
  {
    order: 2,
    category: 'cleanser',
    name: '2차 클렌징',
    description: '폼/젤 클렌저로 남은 잔여물과 피지를 제거합니다.',
    isOptional: false,
  },
  {
    order: 3,
    category: 'toner',
    name: '토너',
    description: '피부결을 정돈하고 다음 단계 흡수를 도와줍니다.',
    isOptional: false,
  },
  {
    order: 4,
    category: 'serum',
    name: '세럼/에센스',
    description: '밤에는 레티놀, 나이아신아마이드 등 활성 성분을 사용합니다.',
    isOptional: true,
    tips: '레티놀은 저녁에만 사용하세요. 자외선에 민감해집니다.',
  },
  {
    order: 5,
    category: 'moisturizer',
    name: '수분크림/나이트크림',
    description: '밤새 수분을 공급하고 피부 재생을 돕습니다.',
    isOptional: false,
  },
  {
    order: 6,
    category: 'mask',
    name: '마스크팩',
    description: '주 2-3회, 집중 영양 공급이나 진정 케어에 사용합니다.',
    isOptional: true,
    tips: '10-15분 사용 후 남은 에센스를 두드려 흡수시키세요.',
  },
];

/**
 * 피부 타입별 팁
 */
const SKIN_TYPE_TIPS: Record<SkinType, string[]> = {
  dry: [
    '세안 후 3분 이내에 토너를 발라주세요.',
    '오일 베이스 세럼이나 페이셜 오일을 추가해보세요.',
    '히알루론산, 세라마이드 성분을 찾아보세요.',
    '주 1-2회 수분 마스크팩으로 집중 케어하세요.',
  ],
  oily: [
    '가벼운 젤 타입 제품을 선택하세요.',
    '토너에 BHA 성분이 들어있으면 모공 관리에 도움됩니다.',
    '수분크림을 건너뛰지 마세요. 수분 부족이 피지를 더 유발할 수 있어요.',
    '나이아신아마이드가 피지 조절에 효과적입니다.',
  ],
  combination: [
    'T존과 U존에 다른 제품을 사용하는 것도 방법입니다.',
    '가벼운 로션이나 젤 크림을 추천합니다.',
    '부위별로 다른 마스크팩을 붙여보세요.',
  ],
  sensitive: [
    '새 제품은 팔 안쪽에서 먼저 테스트하세요.',
    '무향료, 저자극 제품을 선택하세요.',
    '센텔라, 판테놀 성분이 진정에 효과적입니다.',
    '레티놀, AHA/BHA는 천천히 도입하세요.',
  ],
  normal: [
    '현재 피부 상태를 유지하는 데 집중하세요.',
    '자외선 차단을 꾸준히 해주세요.',
    '계절에 따라 수분/유분 밸런스를 조절하세요.',
  ],
};

/**
 * 피부 고민별 추천 성분
 */
const CONCERN_INGREDIENTS: Record<SkinConcern, { name: string; reason: string }[]> = {
  acne: [
    { name: 'BHA (살리실산)', reason: '모공 속 피지와 각질을 녹여줍니다.' },
    { name: '나이아신아마이드', reason: '피지 조절과 모공 축소에 도움됩니다.' },
    { name: '티트리', reason: '항균 효과로 여드름균을 억제합니다.' },
  ],
  aging: [
    { name: '레티놀', reason: '콜라겐 생성을 촉진하고 주름을 개선합니다.' },
    { name: '펩타이드', reason: '피부 탄력을 높여줍니다.' },
    { name: '비타민C', reason: '항산화 효과와 피부 톤 개선에 효과적입니다.' },
  ],
  whitening: [
    { name: '비타민C', reason: '멜라닌 생성을 억제하고 피부 톤을 밝게 합니다.' },
    { name: '아르부틴', reason: '기미, 잡티 개선에 효과적입니다.' },
    { name: '나이아신아마이드', reason: '멜라닌 이동을 억제합니다.' },
  ],
  hydration: [
    { name: '히알루론산', reason: '수분을 끌어당겨 보습력을 높입니다.' },
    { name: '세라마이드', reason: '피부 장벽을 강화하고 수분 손실을 방지합니다.' },
    { name: '글리세린', reason: '수분을 공급하고 유지해줍니다.' },
  ],
  pore: [
    { name: 'BHA', reason: '모공 속 노폐물을 제거합니다.' },
    { name: '나이아신아마이드', reason: '모공 탄력을 높여 축소 효과가 있습니다.' },
    { name: '클레이', reason: '주 1-2회 클레이 마스크로 모공 청소를 해주세요.' },
  ],
  redness: [
    { name: '센텔라 (시카)', reason: '피부 진정과 재생에 효과적입니다.' },
    { name: '판테놀', reason: '피부 장벽을 강화하고 진정시킵니다.' },
    { name: '알로에', reason: '진정, 보습 효과가 있습니다.' },
  ],
};

/**
 * 맞춤 스킨케어 루틴 생성
 */
export function buildSkincareRoutine(profile: UserProfile): {
  morning: SkincareRoutine;
  evening: SkincareRoutine;
  recommendedIngredients: { name: string; reason: string }[];
} {
  // 기본 루틴 복사
  const morningSteps = [...BASE_MORNING_ROUTINE];
  const eveningSteps = [...BASE_EVENING_ROUTINE];

  // 피부 타입별 팁
  const tips = SKIN_TYPE_TIPS[profile.skinType] || [];

  // 피부 타입별 루틴 조정
  if (profile.skinType === 'oily') {
    // 지성은 가벼운 수분크림으로
    const moisturizerStep = morningSteps.find((s) => s.category === 'moisturizer');
    if (moisturizerStep) {
      moisturizerStep.tips = '가벼운 젤 타입이나 로션 타입을 추천합니다.';
    }
  }

  if (profile.skinType === 'dry') {
    // 건성은 1차 클렌징만 해도 OK
    const firstCleanse = eveningSteps.find((s) => s.name === '1차 클렌징');
    if (firstCleanse && !profile.usesMakeup) {
      firstCleanse.isOptional = true;
      firstCleanse.tips = '메이크업을 안 했다면 2차 클렌징만 해도 됩니다.';
    }
  }

  if (profile.skinType === 'sensitive') {
    // 민감성은 마스크팩 주의
    const maskStep = eveningSteps.find((s) => s.category === 'mask');
    if (maskStep) {
      maskStep.tips = '새 마스크팩은 팔 안쪽에서 먼저 테스트하세요. 시트보다 크림 마스크가 더 순할 수 있어요.';
    }
  }

  // 피부 고민별 추천 성분
  const recommendedIngredients: { name: string; reason: string }[] = [];
  for (const concern of profile.skinConcerns) {
    const ingredients = CONCERN_INGREDIENTS[concern];
    if (ingredients) {
      for (const ing of ingredients) {
        if (!recommendedIngredients.find((r) => r.name === ing.name)) {
          recommendedIngredients.push(ing);
        }
      }
    }
  }

  return {
    morning: {
      time: 'morning',
      steps: morningSteps,
      tips: ['아침에는 순한 세안 + 보습 + 선크림이 핵심이에요.', ...tips.slice(0, 2)],
    },
    evening: {
      time: 'evening',
      steps: eveningSteps,
      tips: ['저녁에는 깨끗한 세안 + 활성 성분 + 영양 공급이 핵심이에요.', ...tips.slice(2)],
    },
    recommendedIngredients: recommendedIngredients.slice(0, 6),
  };
}

/**
 * 간단한 루틴 (미니멀리스트용)
 */
export function buildMinimalRoutine(): {
  morning: RoutineStep[];
  evening: RoutineStep[];
} {
  return {
    morning: [
      { order: 1, category: 'cleanser', name: '세안', description: '물 세안 또는 순한 세안제', isOptional: false },
      { order: 2, category: 'moisturizer', name: '수분크림', description: '보습', isOptional: false },
      { order: 3, category: 'sunscreen', name: '선크림', description: '자외선 차단', isOptional: false },
    ],
    evening: [
      { order: 1, category: 'cleanser', name: '클렌징', description: '더블 클렌징', isOptional: false },
      { order: 2, category: 'moisturizer', name: '수분크림', description: '보습', isOptional: false },
    ],
  };
}
