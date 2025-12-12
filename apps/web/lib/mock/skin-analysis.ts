// S-1 피부 분석 Mock 데이터 및 타입 정의

export type MetricStatus = 'good' | 'normal' | 'warning';

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

export interface SkinAnalysisResult {
  overallScore: number;
  metrics: SkinMetric[];
  insight: string;
  recommendedIngredients: RecommendedIngredient[];
  analyzedAt: Date;
  // Week 6: 성분 분석 + 제품 추천 + PC 연동
  personalColorSeason?: string | null;
  foundationRecommendation?: string | null;
  ingredientWarnings?: IngredientWarning[];
  productRecommendations?: ProductRecommendations | null;
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

// 로딩 화면 팁 목록
export const LOADING_TIPS = [
  '7가지 피부 지표를 분석합니다',
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
  const overallScore = Math.round(
    metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  );

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
