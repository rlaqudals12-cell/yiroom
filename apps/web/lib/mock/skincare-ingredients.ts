/**
 * 스킨케어 성분 데이터
 * 피부 상세 솔루션 탭에서 사용
 */

export type IngredientRating = 'good' | 'neutral' | 'caution';
export type IngredientCategory =
  | 'surfactant'
  | 'moisturizer'
  | 'active'
  | 'preservative'
  | 'fragrance';

export interface Ingredient {
  id: string;
  name: string;
  nameKo: string;
  aliases: string[];
  category: IngredientCategory;
  rating: IngredientRating;
  description: string;
  benefits: string[];
  concerns: string[];
  suitableFor: string[];
  avoidFor: string[];
  commonIn: string[];
}

/**
 * 클렌저 주요 성분
 */
export const CLEANSER_INGREDIENTS: Ingredient[] = [
  // 계면활성제
  {
    id: 'sls',
    name: 'Sodium Lauryl Sulfate',
    nameKo: '소듐라우릴설페이트',
    aliases: ['SLS'],
    category: 'surfactant',
    rating: 'caution',
    description: '강력한 거품과 세정력을 제공하는 음이온 계면활성제입니다.',
    benefits: ['강력한 세정력', '풍부한 거품', '저렴한 가격'],
    concerns: ['피부 자극 가능', '피부 장벽 손상', '건조함 유발'],
    suitableFor: ['oily'],
    avoidFor: ['sensitive', 'dry'],
    commonIn: ['foam-alkaline'],
  },
  {
    id: 'sles',
    name: 'Sodium Laureth Sulfate',
    nameKo: '소듐라우레스설페이트',
    aliases: ['SLES'],
    category: 'surfactant',
    rating: 'neutral',
    description: 'SLS보다 순한 계면활성제로, 여전히 좋은 세정력을 제공합니다.',
    benefits: ['좋은 세정력', 'SLS보다 순함', '거품 좋음'],
    concerns: ['민감성 피부 자극 가능', '건조함 유발 가능'],
    suitableFor: ['oily', 'combination', 'normal'],
    avoidFor: ['sensitive'],
    commonIn: ['foam-alkaline', 'gel'],
  },
  {
    id: 'cocamidopropyl-betaine',
    name: 'Cocamidopropyl Betaine',
    nameKo: '코카미도프로필베타인',
    aliases: ['코코베타인'],
    category: 'surfactant',
    rating: 'good',
    description: '코코넛 유래 순한 양쪽성 계면활성제입니다.',
    benefits: ['순한 세정', '좋은 거품', '피부 자극 적음', '보습 효과'],
    concerns: ['드물게 알레르기 반응'],
    suitableFor: ['all'],
    avoidFor: [],
    commonIn: ['foam-mild', 'gel', 'milk'],
  },
  {
    id: 'decyl-glucoside',
    name: 'Decyl Glucoside',
    nameKo: '데실글루코사이드',
    aliases: [],
    category: 'surfactant',
    rating: 'good',
    description: '옥수수와 코코넛 유래 매우 순한 비이온 계면활성제입니다.',
    benefits: ['매우 순함', '천연 유래', '생분해성', '민감성 피부 적합'],
    concerns: ['세정력이 약할 수 있음', '거품 적음'],
    suitableFor: ['sensitive', 'dry', 'all'],
    avoidFor: [],
    commonIn: ['foam-mild', 'milk'],
  },
  {
    id: 'sodium-cocoyl-isethionate',
    name: 'Sodium Cocoyl Isethionate',
    nameKo: '소듐코코일이세티오네이트',
    aliases: ['SCI', '베이비 폼'],
    category: 'surfactant',
    rating: 'good',
    description: '코코넛 유래의 순한 계면활성제로, "베이비 폼"이라고도 불립니다.',
    benefits: ['매우 순함', '풍부한 거품', '피부 장벽 보호', '보습 효과'],
    concerns: ['가격이 높음'],
    suitableFor: ['all'],
    avoidFor: [],
    commonIn: ['foam-mild'],
  },

  // 오일 성분
  {
    id: 'squalane',
    name: 'Squalane',
    nameKo: '스쿠알란',
    aliases: [],
    category: 'moisturizer',
    rating: 'good',
    description: '피부 친화적인 오일로, 클렌징 오일에 많이 사용됩니다.',
    benefits: ['피부 친화적', '비코메도제닉', '가벼운 질감', '보습 효과'],
    concerns: [],
    suitableFor: ['all'],
    avoidFor: [],
    commonIn: ['oil', 'balm'],
  },
  {
    id: 'mineral-oil',
    name: 'Mineral Oil',
    nameKo: '미네랄 오일',
    aliases: ['파라핀 오일'],
    category: 'moisturizer',
    rating: 'neutral',
    description: '정제된 석유 유래 오일로, 클렌징력이 좋습니다.',
    benefits: ['강력한 클렌징력', '저렴한 가격', '안정적'],
    concerns: ['여드름 유발 가능성', '피부 호흡 방해 논란'],
    suitableFor: ['normal', 'combination'],
    avoidFor: ['sensitive', 'oily'],
    commonIn: ['oil'],
  },
  {
    id: 'jojoba-oil',
    name: 'Jojoba Oil',
    nameKo: '호호바 오일',
    aliases: [],
    category: 'moisturizer',
    rating: 'good',
    description: '피부 피지와 유사한 구조의 식물성 왁스 에스터입니다.',
    benefits: ['피지와 유사', '비코메도제닉', '피부 밸런스 조절'],
    concerns: [],
    suitableFor: ['all'],
    avoidFor: [],
    commonIn: ['oil', 'balm'],
  },

  // 효소
  {
    id: 'papain',
    name: 'Papain',
    nameKo: '파파인',
    aliases: ['파파야 효소'],
    category: 'active',
    rating: 'neutral',
    description: '파파야에서 추출한 단백질 분해 효소입니다.',
    benefits: ['각질 제거', '모공 관리', '피부 결 개선'],
    concerns: ['과사용 시 자극', '민감성 피부 주의'],
    suitableFor: ['oily', 'combination', 'normal'],
    avoidFor: ['sensitive'],
    commonIn: ['enzyme'],
  },
  {
    id: 'bromelain',
    name: 'Bromelain',
    nameKo: '브로멜라인',
    aliases: ['파인애플 효소'],
    category: 'active',
    rating: 'neutral',
    description: '파인애플에서 추출한 단백질 분해 효소입니다.',
    benefits: ['각질 제거', '항염 효과', '피부 결 개선'],
    concerns: ['과사용 시 자극'],
    suitableFor: ['oily', 'combination', 'normal'],
    avoidFor: ['sensitive'],
    commonIn: ['enzyme'],
  },
];

/**
 * 성분 조합 가이드
 */
export const INGREDIENT_COMBINATIONS = {
  bad: [
    {
      combination: ['SLS', '약알칼리성 pH'],
      reason: '과도한 피부 자극 및 장벽 손상',
      alternative: '약산성 폼 클렌저 사용',
    },
    {
      combination: ['레티놀', '강한 클렌저'],
      reason: '피부 장벽 이중 손상',
      alternative: '약산성 순한 클렌저 사용',
    },
    {
      combination: ['AHA/BHA 직후', '알칼리성 클렌저'],
      reason: '산성 성분 중화로 효과 감소',
      alternative: '미온수만으로 세안 또는 약산성 클렌저',
    },
  ],
  good: [
    {
      combination: ['오일 클렌저', '약산성 폼'],
      reason: '효과적인 더블 클렌징으로 메이크업 완벽 제거',
    },
    {
      combination: ['순한 클렌저', '진정 토너'],
      reason: '세안 후 즉각적인 피부 진정',
    },
    {
      combination: ['밀크 클렌저', '건성 피부'],
      reason: '수분 손실 최소화하며 클렌징',
    },
  ],
};

/**
 * 카테고리별 라벨
 */
export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  surfactant: '계면활성제',
  moisturizer: '보습제',
  active: '활성 성분',
  preservative: '보존제',
  fragrance: '향료',
};

/**
 * 레이팅별 라벨 및 색상
 */
export const RATING_INFO: Record<
  IngredientRating,
  { label: string; color: string; bgColor: string }
> = {
  good: {
    label: '추천',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  neutral: {
    label: '보통',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  caution: {
    label: '주의',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};
