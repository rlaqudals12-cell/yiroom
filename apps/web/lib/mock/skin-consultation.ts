/**
 * Phase D: AI 피부 상담 Mock 데이터
 */

import type {
  SkinConcern,
  ConsultationResponse,
  QuickQuestion,
  ProductRecommendation,
} from '@/types/skin-consultation';

/** 빠른 질문 목록 */
export const QUICK_QUESTIONS: QuickQuestion[] = [
  { concern: 'dryness', label: '건조함', question: '피부가 건조해요. 어떻게 관리해야 할까요?' },
  { concern: 'oiliness', label: '유분', question: '피지가 많이 나와요. 어떻게 해야 할까요?' },
  { concern: 'acne', label: '트러블', question: '트러블이 자주 나요. 관리법을 알려주세요.' },
  { concern: 'wrinkles', label: '잔주름', question: '잔주름이 신경 쓰여요. 어떻게 예방할까요?' },
  { concern: 'pores', label: '모공', question: '모공이 넓어요. 관리법을 알려주세요.' },
  {
    concern: 'sensitivity',
    label: '민감성',
    question: '피부가 민감해요. 어떤 제품을 써야 할까요?',
  },
];

/** 고민별 상담 응답 */
export const CONSULTATION_RESPONSES: Record<SkinConcern, ConsultationResponse> = {
  dryness: {
    concern: 'dryness',
    messages: [
      '건조한 피부는 수분과 유분 밸런스가 중요해요!',
      '특히 세안 후 바로 보습제를 바르는 것이 핵심이에요.',
      '히알루론산이나 세라마이드 성분이 들어간 제품을 추천드려요.',
    ],
    tips: [
      '세안 후 3분 이내에 보습제를 바르세요',
      '미스트를 수시로 뿌려주세요',
      '잠들기 전 수분크림을 한 번 더 덧바르세요',
      '실내 습도를 50-60%로 유지하세요',
    ],
    ingredients: ['히알루론산', '세라마이드', '글리세린', '스쿠알란', '시어버터'],
  },
  oiliness: {
    concern: 'oiliness',
    messages: [
      '유분이 많아도 수분은 꼭 필요해요!',
      '과한 세안은 오히려 피지 분비를 늘릴 수 있어요.',
      '가벼운 수분 제형의 제품을 선택해보세요.',
    ],
    tips: [
      '하루 2회 이상 세안하지 마세요',
      '오일프리 제품을 선택하세요',
      '주 1-2회 클레이 마스크를 사용하세요',
      '유분 조절 토너를 T존에 사용하세요',
    ],
    ingredients: ['나이아신아마이드', '살리실산', '티트리', '녹차 추출물', '아연'],
  },
  acne: {
    concern: 'acne',
    messages: [
      '트러블 피부는 자극을 최소화하는 것이 중요해요.',
      '트러블을 직접 짜지 말고, 진정 케어에 집중하세요.',
      '비자극 성분의 순한 제품을 사용해보세요.',
    ],
    tips: [
      '손으로 얼굴을 만지지 마세요',
      '베개 커버를 자주 교체하세요',
      '메이크업 도구를 청결하게 유지하세요',
      '저자극 선크림을 꼭 바르세요',
    ],
    ingredients: ['살리실산(BHA)', '티트리 오일', '센텔라', '아줄렌', '판테놀'],
  },
  wrinkles: {
    concern: 'wrinkles',
    messages: [
      '자외선 차단이 안티에이징의 핵심이에요!',
      '레티놀은 저농도부터 천천히 시작하세요.',
      '충분한 수면과 수분 섭취도 중요해요.',
    ],
    tips: [
      '매일 자외선 차단제를 바르세요',
      '아이크림을 꾸준히 사용하세요',
      '페이스 마사지로 혈액순환을 도와주세요',
      '베개를 높이고 자세를 신경 쓰세요',
    ],
    ingredients: ['레티놀', '펩타이드', '비타민C', '아데노신', '콜라겐'],
  },
  pigmentation: {
    concern: 'pigmentation',
    messages: [
      '잡티/색소침착은 자외선 차단이 가장 중요해요.',
      '비타민C와 나이아신아마이드가 도움이 돼요.',
      '즉각적인 효과보다 꾸준한 관리가 핵심이에요.',
    ],
    tips: [
      '자외선 차단제를 2시간마다 덧바르세요',
      '비타민C 세럼을 아침에 사용하세요',
      '필링은 주 1회 정도로 하세요',
      '트러블 자국을 만지지 마세요',
    ],
    ingredients: ['비타민C', '나이아신아마이드', '알부틴', '감초 추출물', '트라넥삼산'],
  },
  sensitivity: {
    concern: 'sensitivity',
    messages: [
      '민감한 피부는 단순한 루틴이 좋아요.',
      '새 제품은 귀 뒤에서 테스트 후 사용하세요.',
      '향료와 알코올이 없는 제품을 선택하세요.',
    ],
    tips: [
      '성분이 단순한 제품을 선택하세요',
      '한 번에 여러 제품을 바꾸지 마세요',
      '물리적 자외선 차단제를 사용하세요',
      '온도가 너무 높은 물로 세안하지 마세요',
    ],
    ingredients: ['판테놀', '알란토인', '센텔라', '베타글루칸', '마데카소사이드'],
  },
  pores: {
    concern: 'pores',
    messages: [
      '모공 관리는 각질 관리가 핵심이에요!',
      'BHA 성분이 모공 속 피지 제거에 효과적이에요.',
      '수분 밸런스를 유지하는 것도 중요해요.',
    ],
    tips: [
      '주 2-3회 BHA 제품을 사용하세요',
      '모공 팩 사용 후 반드시 진정 케어하세요',
      '메이크업 잔여물을 깨끗이 지우세요',
      '아이스팩으로 모공을 조여주세요',
    ],
    ingredients: ['살리실산(BHA)', '나이아신아마이드', '글리콜산(AHA)', '레티놀', '차콜'],
  },
  general: {
    concern: 'general',
    messages: [
      '피부 관리의 기본은 클렌징-토너-보습-자외선 차단이에요!',
      '본인의 피부 타입을 정확히 알고 관리하는 것이 중요해요.',
      '무엇이든 궁금하신 점이 있으시면 물어보세요!',
    ],
    tips: [
      '매일 충분한 물을 섭취하세요',
      '수면 시간을 일정하게 유지하세요',
      '스트레스 관리도 피부 건강에 도움이 돼요',
      '계절에 따라 스킨케어 루틴을 조정하세요',
    ],
    ingredients: ['히알루론산', '나이아신아마이드', '판테놀', '세라마이드', '비타민E'],
  },
};

/** 피부 타입별 추가 조언 */
export const SKIN_TYPE_ADVICE: Record<string, string> = {
  dry: '건성 피부이시네요. 보습에 특히 신경 써주세요!',
  oily: '지성 피부이시네요. 수분과 유분 밸런스가 중요해요!',
  combination: '복합성 피부이시네요. T존과 U존을 다르게 관리해주세요!',
  sensitive: '민감성 피부이시네요. 자극 없는 순한 제품을 사용하세요!',
  normal: '정상 피부이시네요. 현재 루틴을 잘 유지하시면 돼요!',
};

/** Mock 제품 추천 (고민별) */
export const MOCK_PRODUCT_RECOMMENDATIONS: Record<SkinConcern, ProductRecommendation[]> = {
  dryness: [
    {
      id: 'prod-hya-serum',
      name: '히알루론산 딥 모이스처 세럼',
      brand: '이지듀',
      category: '세럼',
      reason: '3중 히알루론산으로 깊은 보습',
    },
    {
      id: 'prod-ceramide-cream',
      name: '세라마이드 리페어 크림',
      brand: '큐어',
      category: '크림',
      reason: '피부 장벽 강화 및 수분 유지',
    },
  ],
  oiliness: [
    {
      id: 'prod-niacinamide-toner',
      name: '나이아신아마이드 밸런싱 토너',
      brand: '달팽이',
      category: '토너',
      reason: '피지 조절 및 모공 케어',
    },
  ],
  acne: [
    {
      id: 'prod-tea-tree-serum',
      name: '티트리 트러블 세럼',
      brand: '바이타민',
      category: '세럼',
      reason: '트러블 진정 및 피부 회복',
    },
  ],
  wrinkles: [
    {
      id: 'prod-retinol-cream',
      name: '레티놀 안티에이징 크림',
      brand: '에이지',
      category: '크림',
      reason: '주름 개선 및 탄력 강화',
    },
  ],
  pigmentation: [
    {
      id: 'prod-vitamin-c-serum',
      name: '비타민C 브라이트닝 세럼',
      brand: '글로우',
      category: '세럼',
      reason: '잡티 개선 및 피부 톤 균일화',
    },
  ],
  sensitivity: [
    {
      id: 'prod-centella-cream',
      name: '센텔라 수딩 크림',
      brand: '순수',
      category: '크림',
      reason: '피부 진정 및 보호',
    },
  ],
  pores: [
    {
      id: 'prod-bha-serum',
      name: 'BHA 포어 미니마이저 세럼',
      brand: '클리어',
      category: '세럼',
      reason: '모공 속 피지 제거 및 모공 관리',
    },
  ],
  general: [],
};

/** 상담 응답 생성 */
export function generateConsultationResponse(
  concern: SkinConcern,
  skinType?: string
): {
  message: string;
  tips: string[];
  ingredients: string[];
  products: ProductRecommendation[];
} {
  const response = CONSULTATION_RESPONSES[concern];
  const products = MOCK_PRODUCT_RECOMMENDATIONS[concern] || [];

  // 메시지 조합
  let message = response.messages.join(' ');
  if (skinType && SKIN_TYPE_ADVICE[skinType]) {
    message = `${SKIN_TYPE_ADVICE[skinType]} ${message}`;
  }

  return {
    message,
    tips: response.tips,
    ingredients: response.ingredients,
    products,
  };
}

/** 인사 메시지 */
export const GREETING_MESSAGE = `안녕하세요! 저는 이룸 피부 상담 AI예요. 🌸

당신의 피부 분석 결과를 바탕으로 맞춤 상담을 도와드릴게요.
아래 버튼을 누르거나 직접 질문해주세요!`;

/** S-1 분석 없을 때 메시지 */
export const NO_ANALYSIS_MESSAGE = `피부 분석 결과가 없어요. 😢

먼저 피부 분석을 받으시면 맞춤 상담이 가능해요!
분석은 1분이면 완료됩니다.`;
