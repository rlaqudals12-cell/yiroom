/**
 * 클렌저 유형 데이터
 * 피부 상세 솔루션 탭에서 사용
 */

export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal' | 'all';

export interface CleanserType {
  id: string;
  name: string;
  nameKo: string;
  phRange: string | null;
  phMin: number | null;
  phMax: number | null;
  description: string;
  howItWorks: string;
  pros: string[];
  cons: string[];
  recommendedFor: SkinType[];
  notRecommendedFor: SkinType[];
  usage: 'first' | 'second' | 'both';
  frequency: 'daily' | 'weekly' | 'as-needed';
  tips: string[];
}

export const CLEANSER_TYPES: CleanserType[] = [
  {
    id: 'oil',
    name: 'Oil Cleanser',
    nameKo: '오일 클렌저',
    phRange: null,
    phMin: null,
    phMax: null,
    description: '유성 메이크업과 선크림을 효과적으로 제거하는 1차 클렌저입니다.',
    howItWorks:
      '유사한 것끼리 녹이는 원리(like dissolves like)로 피지와 유성 메이크업을 녹여냅니다.',
    pros: ['메이크업 제거력 우수', '피부 건조함 적음', '모공 속 노폐물 제거', '마사지 효과'],
    cons: ['2차 클렌징 필요', '여드름성 피부는 성분 확인 필요', '완벽히 씻어내야 함'],
    recommendedFor: ['all'],
    notRecommendedFor: [],
    usage: 'first',
    frequency: 'daily',
    tips: [
      '마른 손, 마른 얼굴에 사용하세요',
      '1-2분 마사지 후 유화시키세요',
      '미온수로 충분히 헹구세요',
    ],
  },
  {
    id: 'balm',
    name: 'Cleansing Balm',
    nameKo: '클렌징 밤',
    phRange: null,
    phMin: null,
    phMax: null,
    description: '고체 형태의 오일 클렌저로, 체온에 녹아 오일처럼 사용됩니다.',
    howItWorks: '고체 오일이 체온에 녹으면서 메이크업과 노폐물을 부드럽게 녹여냅니다.',
    pros: ['휴대 편리', '풍부한 보습감', '딥클렌징 효과', '마사지하기 좋은 질감'],
    cons: ['오일보다 비싼 편', '완전히 유화시켜야 함', '일부 제품은 끈적임'],
    recommendedFor: ['dry', 'normal', 'combination'],
    notRecommendedFor: ['oily'],
    usage: 'first',
    frequency: 'daily',
    tips: ['손가락 체온으로 녹인 후 사용하세요', '물을 조금씩 추가하며 유화시키세요'],
  },
  {
    id: 'milk',
    name: 'Milk Cleanser',
    nameKo: '밀크 클렌저',
    phRange: '5.5-6.5',
    phMin: 5.5,
    phMax: 6.5,
    description: '크림처럼 부드러운 질감의 순한 클렌저입니다.',
    howItWorks: '순한 계면활성제와 보습 성분이 부드럽게 노폐물을 제거합니다.',
    pros: ['매우 순한 세정', '보습력 유지', '자극 최소화', '건조함 없음'],
    cons: ['진한 메이크업 제거 어려움', '개운함이 덜할 수 있음', '지성 피부에는 부족할 수 있음'],
    recommendedFor: ['dry', 'sensitive', 'normal'],
    notRecommendedFor: ['oily'],
    usage: 'second',
    frequency: 'daily',
    tips: ['아침 클렌저로 적합합니다', '화장솜으로 닦아내도 됩니다', '민감할 때 사용하기 좋습니다'],
  },
  {
    id: 'gel',
    name: 'Gel Cleanser',
    nameKo: '젤 클렌저',
    phRange: '5.0-6.0',
    phMin: 5.0,
    phMax: 6.0,
    description: '투명한 젤 타입으로 깔끔한 세정감을 제공합니다.',
    howItWorks: '순한 계면활성제가 물과 함께 노폐물을 씻어냅니다.',
    pros: ['깔끔한 세정감', '거품 적어 자극 적음', '지성 피부에 적합', '잔여감 없음'],
    cons: ['건성 피부에는 건조할 수 있음', '메이크업 제거력 낮음'],
    recommendedFor: ['oily', 'combination', 'normal'],
    notRecommendedFor: ['dry'],
    usage: 'second',
    frequency: 'daily',
    tips: ['물에 적신 후 거품을 내세요', '2차 클렌저로 사용하세요'],
  },
  {
    id: 'foam-mild',
    name: 'Mild Foam Cleanser',
    nameKo: '약산성 폼 클렌저',
    phRange: '5.5-6.5',
    phMin: 5.5,
    phMax: 6.5,
    description: '피부 pH와 유사한 약산성으로 피부 장벽을 보호하며 세정합니다.',
    howItWorks: '피부와 비슷한 pH로 자극 없이 세정하며 피부 장벽을 유지합니다.',
    pros: ['피부 장벽 보호', '순한 세정', '모든 피부 타입 사용 가능', '매일 사용 적합'],
    cons: ['강력한 세정력 필요 시 부족', '알칼리성보다 거품 적음'],
    recommendedFor: ['sensitive', 'dry', 'normal', 'combination'],
    notRecommendedFor: [],
    usage: 'second',
    frequency: 'daily',
    tips: [
      '거품망을 사용하면 풍성한 거품을 낼 수 있어요',
      '약산성 표기를 확인하세요 (pH 5.5-6.5)',
      '레티놀 사용 중이라면 더욱 추천합니다',
    ],
  },
  {
    id: 'foam-alkaline',
    name: 'Alkaline Foam Cleanser',
    nameKo: '약알칼리성 폼 클렌저',
    phRange: '8.0-10.0',
    phMin: 8.0,
    phMax: 10.0,
    description: '강력한 세정력으로 피지와 노폐물을 깔끔하게 제거합니다.',
    howItWorks: '알칼리성이 피지를 녹여 강력하게 세정하지만, 피부 장벽에 영향을 줄 수 있습니다.',
    pros: ['강력한 세정력', '풍성한 거품', '개운한 사용감', '모공 클렌징'],
    cons: ['피부 장벽 손상 가능', '건조함 유발', '민감성 피부 주의', '장기 사용 비추천'],
    recommendedFor: ['oily'],
    notRecommendedFor: ['sensitive', 'dry'],
    usage: 'second',
    frequency: 'as-needed',
    tips: [
      '주 1-2회 딥클렌징 용도로만 사용하세요',
      '사용 후 보습을 충분히 하세요',
      '피부가 당기면 약산성으로 교체하세요',
    ],
  },
  {
    id: 'water',
    name: 'Cleansing Water',
    nameKo: '클렌징 워터',
    phRange: '5.5-7.0',
    phMin: 5.5,
    phMax: 7.0,
    description: '물처럼 가벼운 타입으로 간편하게 클렌징합니다.',
    howItWorks: '미셀라 기술로 노폐물을 끌어당겨 제거합니다.',
    pros: ['간편한 사용', '물로 씻어내지 않아도 됨', '가벼운 메이크업 제거', '여행 시 편리'],
    cons: ['진한 메이크업 제거 어려움', '화장솜 마찰 자극', '완벽한 클렌징 어려움'],
    recommendedFor: ['all'],
    notRecommendedFor: [],
    usage: 'both',
    frequency: 'as-needed',
    tips: [
      '화장솜에 충분히 적셔 사용하세요',
      '문지르지 말고 꾹꾹 눌러 닦아내세요',
      '아침 클렌저로 좋습니다',
    ],
  },
  {
    id: 'enzyme',
    name: 'Enzyme Cleanser',
    nameKo: '효소 클렌저',
    phRange: '4.5-5.5',
    phMin: 4.5,
    phMax: 5.5,
    description: '파파인, 브로멜라인 등 효소로 각질을 분해하는 클렌저입니다.',
    howItWorks: '천연 효소가 죽은 각질 세포의 단백질을 분해하여 부드럽게 제거합니다.',
    pros: ['화학적 각질 제거', '물리적 스크럽보다 순함', '피부 결 개선', '모공 관리'],
    cons: ['매일 사용 불가', '민감성 피부 주의', '과사용 시 자극'],
    recommendedFor: ['oily', 'combination', 'normal'],
    notRecommendedFor: ['sensitive'],
    usage: 'second',
    frequency: 'weekly',
    tips: [
      '주 1-2회만 사용하세요',
      '파우더 타입은 물과 섞어 사용하세요',
      '레티놀, AHA/BHA 사용일에는 피하세요',
    ],
  },
];

/**
 * 피부 타입별 추천 클렌저 조합
 */
export const SKIN_TYPE_CLEANSER_ROUTINE: Record<
  SkinType,
  {
    morning: string[];
    evening: string[];
    weekly: string[];
    avoid: string[];
    tips: string[];
  }
> = {
  dry: {
    morning: ['milk', 'water'],
    evening: ['balm', 'foam-mild'],
    weekly: [],
    avoid: ['foam-alkaline', 'enzyme'],
    tips: [
      '미온수를 사용하세요 (뜨거운 물 X)',
      '세정 시간을 짧게 하세요',
      '세안 후 3분 이내 보습하세요',
    ],
  },
  oily: {
    morning: ['gel', 'foam-mild'],
    evening: ['oil', 'gel'],
    weekly: ['enzyme', 'foam-alkaline'],
    avoid: [],
    tips: [
      '더블 클렌징을 권장합니다',
      '주 1-2회 딥클렌징 하세요',
      '과도한 세정은 오히려 피지 분비를 늘립니다',
    ],
  },
  combination: {
    morning: ['gel', 'foam-mild'],
    evening: ['oil', 'gel'],
    weekly: ['enzyme'],
    avoid: ['foam-alkaline'],
    tips: ['T존과 U존을 다르게 관리하세요', '계절에 따라 클렌저를 조절하세요'],
  },
  sensitive: {
    morning: ['milk', 'water'],
    evening: ['milk', 'foam-mild'],
    weekly: [],
    avoid: ['foam-alkaline', 'enzyme'],
    tips: [
      '무향료 제품을 선택하세요',
      '새 제품은 팔 안쪽에 테스트하세요',
      '성분 리스트가 짧은 제품을 선택하세요',
    ],
  },
  normal: {
    morning: ['foam-mild', 'gel'],
    evening: ['oil', 'foam-mild'],
    weekly: ['enzyme'],
    avoid: [],
    tips: ['현재 피부 상태를 유지하세요', '계절 변화에 맞춰 조절하세요'],
  },
  all: {
    morning: ['foam-mild'],
    evening: ['oil', 'foam-mild'],
    weekly: [],
    avoid: [],
    tips: [],
  },
};

/**
 * pH 범위별 설명
 */
export const PH_EXPLANATIONS = {
  acidic: {
    range: '4.5-5.5',
    label: '약산성',
    description: '건강한 피부의 pH와 동일한 범위입니다.',
    benefits: ['피부 장벽 보호', '유익균 유지', '자극 최소화'],
    products: ['약산성 폼', '효소 클렌저'],
  },
  neutral: {
    range: '6.0-7.0',
    label: '중성',
    description: '물의 pH와 비슷한 범위입니다.',
    benefits: ['순한 세정', '대부분의 피부에 적합'],
    products: ['젤 클렌저', '클렌징 워터'],
  },
  alkaline: {
    range: '8.0-10.0',
    label: '약알칼리성',
    description: '강력한 세정력을 제공하지만 피부 장벽에 영향을 줄 수 있습니다.',
    benefits: ['강력한 세정력', '피지 제거'],
    risks: ['피부 장벽 손상', '건조함', '민감성 증가'],
    products: ['약알칼리성 폼', '비누'],
  },
};
