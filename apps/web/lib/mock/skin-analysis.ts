// S-1 피부 분석 Mock 데이터 및 타입 정의

import type {
  DetailedZoneId,
  DetailedZoneStatus,
  DetailedZoneMap,
  DetailedStatusLevel,
} from '@/types/skin-zones';

export type MetricStatus = 'good' | 'normal' | 'warning';

// 피부 타입 정의
export type SkinTypeId = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';

export interface SkinTypeInfo {
  id: SkinTypeId;
  label: string;
  emoji: string;
  description: string;
  characteristics: string[];
}

// 피부 타입 상세 정보
export const SKIN_TYPES: SkinTypeInfo[] = [
  {
    id: 'dry',
    label: '건성',
    emoji: '🏜️',
    description: '피부가 건조하고 당기는 느낌이 있어요',
    characteristics: ['세안 후 피부 당김', '각질이 자주 일어남', '피부가 거칠거칠함'],
  },
  {
    id: 'oily',
    label: '지성',
    emoji: '✨',
    description: '유분이 많고 번들거리는 느낌이 있어요',
    characteristics: ['피지 분비가 많음', 'T존에 유분이 많음', '모공이 눈에 띔'],
  },
  {
    id: 'combination',
    label: '복합성',
    emoji: '⚖️',
    description: 'T존은 기름지고 볼은 건조해요',
    characteristics: ['T존만 번들거림', '볼은 건조함', '부위별 케어 필요'],
  },
  {
    id: 'normal',
    label: '중성',
    emoji: '😊',
    description: '수분과 유분의 밸런스가 좋아요',
    characteristics: ['피부 트러블이 적음', '수분/유분 균형', '전반적으로 건강함'],
  },
  {
    id: 'sensitive',
    label: '민감성',
    emoji: '🌸',
    description: '자극에 쉽게 반응하고 트러블이 생겨요',
    characteristics: ['쉽게 붉어짐', '자극에 민감', '트러블이 자주 발생'],
  },
];

// 피부 고민 정의
export type SkinConcernId =
  | 'acne'
  | 'wrinkles'
  | 'pigmentation'
  | 'pores'
  | 'dryness'
  | 'redness'
  | 'dullness'
  // 스킨케어 루틴 고도화용 확장 (2026-01-11)
  | 'dehydration' // 일시적 수분 부족 (건성 피부 타입과 구분)
  | 'sensitivity' // 민감함 (홍조와 구분)
  | 'fine_lines' // 잔주름 (주름과 구분)
  | 'texture' // 피부결
  | 'excess_oil'; // 과잉 피지

export interface SkinConcernInfo {
  id: SkinConcernId;
  label: string;
  emoji: string;
  description: string;
}

// 피부 고민 상세 정보
export const SKIN_CONCERNS: SkinConcernInfo[] = [
  {
    id: 'acne',
    label: '여드름/트러블',
    emoji: '😣',
    description: '여드름, 뾰루지가 자주 생겨요',
  },
  {
    id: 'wrinkles',
    label: '주름/탄력',
    emoji: '📉',
    description: '잔주름이나 탄력 저하가 고민이에요',
  },
  {
    id: 'pigmentation',
    label: '색소침착',
    emoji: '🔵',
    description: '기미, 잡티, 다크스팟이 있어요',
  },
  {
    id: 'pores',
    label: '모공',
    emoji: '🔍',
    description: '모공이 눈에 띄고 넓어 보여요',
  },
  {
    id: 'dryness',
    label: '건조함',
    emoji: '💧',
    description: '피부가 건조하고 각질이 일어나요',
  },
  {
    id: 'redness',
    label: '홍조/붉음',
    emoji: '🔴',
    description: '피부가 쉽게 붉어지고 열감이 있어요',
  },
  {
    id: 'dullness',
    label: '칙칙함',
    emoji: '☁️',
    description: '피부 톤이 어둡고 생기가 없어요',
  },
  // 스킨케어 루틴 고도화용 확장 (2026-01-11)
  {
    id: 'dehydration',
    label: '수분 부족',
    emoji: '🏜️',
    description: '일시적으로 피부에 수분이 부족해요',
  },
  {
    id: 'sensitivity',
    label: '민감함',
    emoji: '🌸',
    description: '외부 자극에 쉽게 반응해요',
  },
  {
    id: 'fine_lines',
    label: '잔주름',
    emoji: '📏',
    description: '눈가, 입가에 가는 주름이 생겼어요',
  },
  {
    id: 'texture',
    label: '피부결',
    emoji: '🪨',
    description: '피부결이 고르지 않고 거칠어요',
  },
  {
    id: 'excess_oil',
    label: '과잉 피지',
    emoji: '✨',
    description: '피지 분비가 과다해요',
  },
];

// 피부 촬영 가이드 팁
export const SKIN_PHOTO_GUIDE_TIPS = [
  {
    icon: 'sun',
    title: '밝은 실내',
    description: '조명이 얼굴을 고르게 비추는 밝은 곳에서 촬영해주세요',
  },
  {
    icon: 'face',
    title: '맨 얼굴 권장',
    description: '메이크업 없이 본연의 피부가 보이면 더 정확해요',
  },
  {
    icon: 'shadow',
    title: '플래시 OFF',
    description: '플래시는 피부 상태를 왜곡시켜요. 꺼주세요',
  },
  {
    icon: 'position',
    title: '정면 촬영',
    description: '얼굴 전체가 잘 보이도록 정면을 바라봐주세요',
  },
];

export interface SkinMetric {
  id: string;
  name: string;
  value: number;
  status: MetricStatus;
  description: string;
}

export interface RecommendedIngredient {
  name: string;
  reason: string;
}

/**
 * 성분 경고 정보 (Week 6)
 */
export interface IngredientWarning {
  ingredient: string;
  ingredientEn?: string | null;
  level: 'high' | 'medium' | 'low';
  ewgGrade: number | null;
  reason: string;
  alternatives?: string[] | null;
  category?: string | null;
}

/**
 * 제품 추천 정보 (Week 6)
 */
export interface ProductRecommendations {
  routine: Array<{
    step: number;
    category: string;
    categoryLabel?: string;
    products: string[];
    tip: string;
  }>;
  specialCare: Array<{
    concern: string;
    products: string[];
  }>;
  makeup?: {
    foundation?: string;
    lipColors?: string[];
    blushColors?: string[];
  };
  skincareRoutine: {
    morning: string;
    evening: string;
  };
  careTips: {
    weeklyCare: string[];
    lifestyleTips: string[];
  };
}

/**
 * 파운데이션 제형 추천 (피부 타입 기반)
 * PC-1과 역할 분리: PC-1은 색상/쉐이드, S-1은 제형/텍스처
 */
export interface FoundationFormula {
  finish: 'matte' | 'satin' | 'glow' | 'dewy';
  finishLabel: string; // "매트", "새틴", "글로우", "듀이"
  coverage: 'light' | 'medium' | 'full';
  coverageLabel: string; // "라이트", "미디엄", "풀"
  texture: 'liquid' | 'cushion' | 'powder' | 'stick';
  textureLabel: string; // "리퀴드", "쿠션", "파우더", "스틱"
  tip: string; // 피부 타입별 맞춤 팁
  avoidTip?: string; // 피해야 할 제형
}

export interface SkinAnalysisResult {
  overallScore: number;
  metrics: SkinMetric[];
  insight: string;
  recommendedIngredients: RecommendedIngredient[];
  analyzedAt: Date;
  // Week 6: 성분 분석 + 제품 추천 + PC 연동
  personalColorSeason?: string | null;
  /** @deprecated PC-1에서 색상 추천, S-1은 foundationFormula로 제형 추천 */
  foundationRecommendation?: string | null;
  /** 피부 타입 기반 파운데이션 제형 추천 (S-1 전용) */
  foundationFormula?: FoundationFormula | null;
  ingredientWarnings?: IngredientWarning[];
  productRecommendations?: ProductRecommendations | null;
  // Hybrid 데이터용 초보자 친화 필드 (선택적, 하위 호환)
  easySkinTip?: EasySkinTip;
}

// 점수에 따른 상태 결정
const getStatus = (value: number): MetricStatus => {
  if (value >= 71) return 'good';
  if (value >= 41) return 'normal';
  return 'warning';
};

// 가변 보상: AI 인사이트 목록
const INSIGHTS = [
  '수분 보충이 필요해요! 히알루론산 성분을 추천드려요.',
  '피부 장벽이 약해졌어요. 세라마이드로 보호해주세요.',
  '모공 케어가 필요한 시점이에요. BHA 성분을 활용해보세요.',
  '전반적으로 건강한 피부예요! 현재 루틴을 유지해주세요.',
  '유분 조절이 필요해요. 가벼운 수분크림을 권장해요.',
  '색소 침착 개선을 위해 비타민C 세럼을 추천드려요.',
  '탄력 관리가 잘 되고 있어요. 레티놀로 더 강화해보세요.',
];

// 가변 보상: 추천 성분 풀
const INGREDIENT_POOL: RecommendedIngredient[] = [
  { name: '히알루론산', reason: '수분 보충 및 촉촉한 피부 유지' },
  { name: '나이아신아마이드', reason: '모공 개선 및 피부 톤 정돈' },
  { name: '세라마이드', reason: '피부 장벽 강화 및 보호' },
  { name: '비타민C', reason: '색소 침착 개선 및 항산화' },
  { name: '레티놀', reason: '주름 개선 및 탄력 강화' },
  { name: 'BHA', reason: '모공 속 노폐물 제거' },
  { name: '펩타이드', reason: '콜라겐 생성 촉진' },
  { name: '알로에베라', reason: '진정 및 수분 공급' },
];

// 초보자 친화 피부 관리 팁 (Hybrid 데이터용)
export interface EasySkinTip {
  summary: string; // "건성 피부는 수분 크림이 필수예요!"
  easyExplanation: string; // 쉬운 설명
  morningRoutine: string[]; // 아침 루틴
  eveningRoutine: string[]; // 저녁 루틴
  productTip: string; // 제품 팁
  avoidTip: string; // 피해야 할 것
}

export const EASY_SKIN_TIPS: Record<SkinTypeId, EasySkinTip> = {
  dry: {
    summary: '건성 피부는 수분 크림이 필수예요!',
    easyExplanation:
      '피부가 건조하고 당기는 느낌이 자주 들어요. 수분을 꾸준히 보충해주면 촉촉하고 건강한 피부를 유지할 수 있어요.',
    morningRoutine: ['순한 클렌저로 세안', '토너로 수분 충전', '에센스', '수분 크림 듬뿍'],
    eveningRoutine: ['오일 클렌징', '폼 클렌징', '토너', '세럼', '나이트 크림 or 수면팩'],
    productTip: '히알루론산, 세라마이드 성분을 찾아보세요. 크림 제형이 좋아요!',
    avoidTip: '알코올이 들어간 토너, 너무 뜨거운 물로 세안하기',
  },
  oily: {
    summary: '지성 피부도 보습은 필수! 가벼운 수분 케어가 답이에요',
    easyExplanation:
      '피지 분비가 많아서 번들거리지만, 수분이 부족하면 피지가 더 나와요. 가벼운 수분 케어로 밸런스를 맞춰보세요.',
    morningRoutine: ['폼 클렌저로 깔끔 세안', '가벼운 토너', '수분 세럼', '가벼운 로션 or 젤 크림'],
    eveningRoutine: [
      '오일 클렌징',
      '폼 클렌징',
      'BHA 토너 (주 2-3회)',
      '수분 세럼',
      '가벼운 젤 크림',
    ],
    productTip: '나이아신아마이드, BHA 성분이 도움돼요. 젤 타입 제품을 선택하세요!',
    avoidTip: '무거운 오일 제품, 과도한 세안 (하루 2회 이상)',
  },
  combination: {
    summary: 'T존과 U존을 다르게 관리하면 완벽해요!',
    easyExplanation:
      'T존(이마, 코)은 기름지고 U존(볼, 턱)은 건조한 복합성 피부예요. 부위별로 다르게 케어해주면 밸런스가 좋아져요.',
    morningRoutine: ['순한 클렌저', '전체 토너', 'T존엔 세럼, U존엔 크림'],
    eveningRoutine: ['오일 클렌징', '폼 클렌징', 'T존에 BHA 토너 (주 2회)', 'U존에 수분 크림'],
    productTip: 'T존용 매트 제품과 U존용 수분 제품을 분리해서 사용해보세요!',
    avoidTip: '전체에 같은 제품 두껍게 바르기',
  },
  normal: {
    summary: '균형 잡힌 피부! 현재 상태를 유지하는 게 포인트예요',
    easyExplanation:
      '수분과 유분의 밸런스가 좋은 건강한 피부예요. 지금 상태를 유지하면서 노화 예방에 신경 써주세요.',
    morningRoutine: ['순한 클렌저', '토너', '에센스', '가벼운 크림', '선크림'],
    eveningRoutine: ['클렌징', '토너', '세럼 (비타민C 추천)', '크림'],
    productTip: '지금 잘 맞는 제품을 꾸준히 사용하세요. 항산화 성분이 노화 예방에 좋아요!',
    avoidTip: '제품을 너무 자주 바꾸기, 과도한 각질 제거',
  },
  sensitive: {
    summary: '민감 피부는 진정이 먼저! 순하게 케어해주세요',
    easyExplanation:
      '피부가 자극에 쉽게 반응하고 붉어지거나 트러블이 생겨요. 저자극 제품으로 진정 케어하는 게 중요해요.',
    morningRoutine: [
      '미온수로 가볍게 세안',
      '진정 토너',
      '진정 세럼',
      '순한 크림',
      '물리적 선크림',
    ],
    eveningRoutine: ['마일드 클렌저', '진정 토너', '센텔라 or 판테놀 세럼', '순한 크림'],
    productTip: '센텔라, 판테놀, 마데카소사이드 성분이 진정에 좋아요. 무향료 제품 선택!',
    avoidTip: '새 제품 바로 얼굴에 바르기, 알코올/향료 제품, 강한 각질 제거',
  },
};

// 피부 타입별 파운데이션 제형 추천 (Hybrid 데이터용)
export const FOUNDATION_FORMULAS: Record<SkinTypeId, FoundationFormula> = {
  oily: {
    finish: 'matte',
    finishLabel: '매트',
    coverage: 'medium',
    coverageLabel: '미디엄',
    texture: 'powder',
    textureLabel: '파우더',
    tip: '지성 피부는 매트 피니쉬가 번들거림을 잡아줘요. 오일 컨트롤 성분이 들어간 파우더나 쿠션을 추천해요!',
    avoidTip: '글로우/듀이 타입은 번들거림이 심해질 수 있어요',
  },
  dry: {
    finish: 'dewy',
    finishLabel: '듀이',
    coverage: 'light',
    coverageLabel: '라이트',
    texture: 'cushion',
    textureLabel: '쿠션',
    tip: '건성 피부는 촉촉한 듀이 피니쉬가 잘 어울려요. 보습 성분이 들어간 쿠션이나 리퀴드를 선택하세요!',
    avoidTip: '파우더 타입은 건조함을 악화시킬 수 있어요',
  },
  combination: {
    finish: 'satin',
    finishLabel: '새틴',
    coverage: 'medium',
    coverageLabel: '미디엄',
    texture: 'liquid',
    textureLabel: '리퀴드',
    tip: '복합성 피부는 새틴 피니쉬가 자연스러워요. T존에는 파우더로 가볍게 마무리하면 완벽!',
    avoidTip: 'T존에 글로우 제품은 피하세요',
  },
  normal: {
    finish: 'satin',
    finishLabel: '새틴',
    coverage: 'light',
    coverageLabel: '라이트',
    texture: 'cushion',
    textureLabel: '쿠션',
    tip: '중성 피부는 대부분의 제형이 잘 맞아요. 자연스러운 새틴 피니쉬로 건강한 피부결을 살려보세요!',
  },
  sensitive: {
    finish: 'satin',
    finishLabel: '새틴',
    coverage: 'light',
    coverageLabel: '라이트',
    texture: 'cushion',
    textureLabel: '쿠션',
    tip: '민감 피부는 무향료, 저자극 제품을 선택하세요. 가벼운 커버력의 쿠션이 피부 부담을 줄여줘요!',
    avoidTip: '알코올, 향료가 들어간 제품은 자극이 될 수 있어요',
  },
};

// 로딩 화면 팁 목록
export const LOADING_TIPS = [
  '7가지 피부 지표를 분석해요',
  '수분도, 유분도, 모공 상태를 측정 중',
  'AI가 맞춤 솔루션을 준비하고 있어요',
  '거의 완료되었어요!',
];

// Mock 분석 결과 생성
export const generateMockAnalysisResult = (): SkinAnalysisResult => {
  // 랜덤 값 생성 헬퍼
  const randomValue = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // 7가지 지표 생성
  const metrics: SkinMetric[] = [
    {
      id: 'hydration',
      name: '수분도',
      value: randomValue(40, 85),
      status: 'normal',
      description: '피부 수분 함량',
    },
    {
      id: 'oil',
      name: '유분도',
      value: randomValue(30, 70),
      status: 'normal',
      description: '피지 분비량',
    },
    {
      id: 'pores',
      name: '모공',
      value: randomValue(50, 90),
      status: 'normal',
      description: '모공 상태 및 크기',
    },
    {
      id: 'wrinkles',
      name: '주름',
      value: randomValue(60, 95),
      status: 'normal',
      description: '주름 및 잔주름',
    },
    {
      id: 'elasticity',
      name: '탄력',
      value: randomValue(55, 90),
      status: 'normal',
      description: '피부 탄력도',
    },
    {
      id: 'pigmentation',
      name: '색소침착',
      value: randomValue(45, 85),
      status: 'normal',
      description: '기미, 잡티 상태',
    },
    {
      id: 'trouble',
      name: '트러블',
      value: randomValue(35, 80),
      status: 'normal',
      description: '여드름, 염증 상태',
    },
  ];

  // 각 지표의 상태 업데이트
  metrics.forEach((metric) => {
    metric.status = getStatus(metric.value);
  });

  // 전체 점수 계산 (평균)
  const overallScore = Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length);

  // 가변 보상: 랜덤 인사이트 선택
  const insight = INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)];

  // 가변 보상: 랜덤 추천 성분 2-3개 선택
  const shuffled = [...INGREDIENT_POOL].sort(() => Math.random() - 0.5);
  const recommendedIngredients = shuffled.slice(0, randomValue(2, 3));

  return {
    overallScore,
    metrics,
    insight,
    recommendedIngredients,
    analyzedAt: new Date(),
  };
};

// ============================================
// 12존 세부 분석 Mock 데이터 (Phase 3)
// ============================================

/** 12존 ID 목록 */
export const ALL_DETAILED_ZONE_IDS: DetailedZoneId[] = [
  'forehead_center',
  'forehead_left',
  'forehead_right',
  'eye_left',
  'eye_right',
  'cheek_left',
  'cheek_right',
  'nose_bridge',
  'nose_tip',
  'chin_center',
  'chin_left',
  'chin_right',
];

/** 12존별 주요 관심사 풀 */
const ZONE_CONCERN_POOLS: Record<DetailedZoneId, string[]> = {
  forehead_center: ['T존 피지 과다', '번들거림', '여드름', '블랙헤드'],
  forehead_left: ['헤어라인 트러블', '각질', '건조함'],
  forehead_right: ['헤어라인 트러블', '각질', '건조함'],
  eye_left: ['다크서클', '잔주름', '건조함', '부기'],
  eye_right: ['다크서클', '잔주름', '건조함', '부기'],
  cheek_left: ['홍조', '모공 확대', '색소침착', '건조함'],
  cheek_right: ['홍조', '모공 확대', '색소침착', '건조함'],
  nose_bridge: ['블랙헤드', '모공', '피지', '각질'],
  nose_tip: ['피지 과다', '넓은 모공', '블랙헤드'],
  chin_center: ['여드름', '트러블', '피지'],
  chin_left: ['턱선 탄력 저하', '건조함'],
  chin_right: ['턱선 탄력 저하', '건조함'],
};

/** 12존별 추천 관리법 풀 */
const ZONE_RECOMMENDATION_POOLS: Record<DetailedZoneId, string[]> = {
  forehead_center: ['가벼운 수분 케어', 'BHA 토너 사용', '피지 조절 세럼'],
  forehead_left: ['헤어라인 세안 주의', '가벼운 보습', '두피 관리 연계'],
  forehead_right: ['헤어라인 세안 주의', '가벼운 보습', '두피 관리 연계'],
  eye_left: ['아이크림 사용', '냉찜질', '충분한 수면', '비타민K 함유 제품'],
  eye_right: ['아이크림 사용', '냉찜질', '충분한 수면', '비타민K 함유 제품'],
  cheek_left: ['진정 케어', '보습 강화', '선크림 필수', '센텔라 성분'],
  cheek_right: ['진정 케어', '보습 강화', '선크림 필수', '센텔라 성분'],
  nose_bridge: ['클레이 마스크 주 1회', 'BHA 각질 케어', '딥 클렌징'],
  nose_tip: ['피지 조절 토너', '논코메도제닉 제품', '모공 수렴 팩'],
  chin_center: ['스팟 트리트먼트', '저자극 세안', '유분 조절'],
  chin_left: ['리프팅 마사지', '탄력 세럼', '콜라겐 부스팅'],
  chin_right: ['리프팅 마사지', '탄력 세럼', '콜라겐 부스팅'],
};

/** 점수 → 5단계 상태 변환 */
function getDetailedStatus(score: number): DetailedStatusLevel {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'normal';
  if (score >= 30) return 'warning';
  return 'critical';
}

/** 랜덤 값 생성 헬퍼 */
function randomValue(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 배열에서 랜덤 N개 선택 */
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 12존 Mock 분석 데이터 생성
 * @description 각 존별 점수, 상태, 우려사항, 추천 관리법 생성
 */
export function generateMockDetailedZoneAnalysis(): DetailedZoneMap {
  const result: Partial<DetailedZoneMap> = {};

  for (const zoneId of ALL_DETAILED_ZONE_IDS) {
    // T존/코 영역은 점수가 상대적으로 낮은 경향
    const isTZone =
      zoneId === 'forehead_center' || zoneId === 'nose_bridge' || zoneId === 'nose_tip';
    const baseScore = isTZone ? randomValue(45, 75) : randomValue(55, 90);

    const status = getDetailedStatus(baseScore);
    const concernCount = status === 'excellent' || status === 'good' ? 1 : randomValue(2, 3);
    const recommendationCount = concernCount + 1;

    const zone: DetailedZoneStatus = {
      zoneId,
      score: baseScore,
      status,
      concerns: pickRandom(ZONE_CONCERN_POOLS[zoneId], concernCount),
      recommendations: pickRandom(ZONE_RECOMMENDATION_POOLS[zoneId], recommendationCount),
    };

    // 20% 확률로 이전 분석 대비 변화 정보 추가
    if (Math.random() < 0.2) {
      const changeTypes: Array<'improved' | 'same' | 'declined'> = ['improved', 'same', 'declined'];
      const change = changeTypes[Math.floor(Math.random() * 3)];
      const scoreDiff =
        change === 'same' ? 0 : change === 'improved' ? randomValue(3, 10) : -randomValue(3, 10);

      zone.comparedToPrevious = { change, scoreDiff };
    }

    result[zoneId] = zone;
  }

  return result as DetailedZoneMap;
}

/**
 * 특정 피부 타입에 맞는 12존 Mock 분석 데이터 생성
 * @param skinTypeId 피부 타입
 */
export function generateMockDetailedZoneAnalysisBySkinType(
  skinTypeId: SkinTypeId
): DetailedZoneMap {
  const result: Partial<DetailedZoneMap> = {};

  for (const zoneId of ALL_DETAILED_ZONE_IDS) {
    let baseScore: number;

    // 피부 타입별 영역 점수 조정
    switch (skinTypeId) {
      case 'oily':
        // 지성: T존 점수 낮음, 볼은 괜찮음
        baseScore =
          zoneId.includes('nose') || zoneId.includes('forehead')
            ? randomValue(35, 60)
            : randomValue(60, 85);
        break;
      case 'dry':
        // 건성: 볼, 턱 영역 점수 낮음
        baseScore =
          zoneId.includes('cheek') || zoneId.includes('chin')
            ? randomValue(40, 65)
            : randomValue(55, 80);
        break;
      case 'combination':
        // 복합성: T존 낮음, U존 괜찮음
        baseScore =
          zoneId.includes('nose') || zoneId === 'forehead_center'
            ? randomValue(40, 60)
            : randomValue(55, 80);
        break;
      case 'sensitive':
        // 민감성: 볼 영역 점수 낮음 (홍조)
        baseScore = zoneId.includes('cheek') ? randomValue(35, 60) : randomValue(50, 75);
        break;
      default:
        // 중성: 전체적으로 균일하고 높음
        baseScore = randomValue(65, 90);
    }

    const status = getDetailedStatus(baseScore);
    const concernCount = status === 'excellent' || status === 'good' ? 1 : randomValue(2, 3);
    const recommendationCount = concernCount + 1;

    result[zoneId] = {
      zoneId,
      score: baseScore,
      status,
      concerns: pickRandom(ZONE_CONCERN_POOLS[zoneId], concernCount),
      recommendations: pickRandom(ZONE_RECOMMENDATION_POOLS[zoneId], recommendationCount),
    };
  }

  return result as DetailedZoneMap;
}

/** 12존 분석 결과에서 전체 평균 점수 계산 */
export function calculateDetailedZoneAverageScore(zones: DetailedZoneMap): number {
  const scores = Object.values(zones).map((z) => z.score);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** 12존 분석 결과에서 최악의 존 찾기 */
export function findWorstDetailedZone(
  zones: DetailedZoneMap
): { zoneId: DetailedZoneId; zone: DetailedZoneStatus } | null {
  let worst: { zoneId: DetailedZoneId; zone: DetailedZoneStatus } | null = null;

  for (const [zoneId, zone] of Object.entries(zones)) {
    if (!worst || zone.score < worst.zone.score) {
      worst = { zoneId: zoneId as DetailedZoneId, zone };
    }
  }

  return worst;
}

/** 12존 분석 결과에서 최상의 존 찾기 */
export function findBestDetailedZone(
  zones: DetailedZoneMap
): { zoneId: DetailedZoneId; zone: DetailedZoneStatus } | null {
  let best: { zoneId: DetailedZoneId; zone: DetailedZoneStatus } | null = null;

  for (const [zoneId, zone] of Object.entries(zones)) {
    if (!best || zone.score > best.zone.score) {
      best = { zoneId: zoneId as DetailedZoneId, zone };
    }
  }

  return best;
}

// 점수 색상 유틸리티
export const getScoreColor = (score: number): string => {
  if (score >= 71) return 'text-green-500';
  if (score >= 41) return 'text-yellow-500';
  return 'text-red-500';
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 71) return 'bg-green-500';
  if (score >= 41) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const getStatusLabel = (status: MetricStatus): string => {
  switch (status) {
    case 'good':
      return '좋음';
    case 'normal':
      return '보통';
    case 'warning':
      return '주의';
  }
};
