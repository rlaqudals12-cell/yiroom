/**
 * N-1 OH-1 구강건강 연동 인사이트 로직
 *
 * OH-1 → N-1: 구강 건강 상태 → 영양소/식품 추천
 * - 충치 경향 → 칼슘, 비타민D 강화 식품
 * - 잇몸 출혈 → 비타민C, 비타민K 식품
 * - 치아 민감 → 불소 함유 식품, 온도 주의 식품
 * - 구취 → 프로바이오틱스, 녹차
 */

// 구강 건강 지표 키
export type OralMetricKey =
  | 'cavityRisk' // 충치 위험도
  | 'gumHealth' // 잇몸 건강
  | 'sensitivity' // 치아 민감도
  | 'plaque' // 치석/플라크
  | 'badBreath'; // 구취

// 구강 분석 요약 타입
export interface OralAnalysisSummary {
  cavityRisk: 'warning' | 'normal' | 'good';
  gumHealth: 'warning' | 'normal' | 'good';
  sensitivity: 'warning' | 'normal' | 'good';
  plaque: 'warning' | 'normal' | 'good';
  badBreath: 'warning' | 'normal' | 'good';
}

// 구강 건강 음식 추천
export interface OralFoodRecommendation {
  icon: string;
  title: string;
  description: string;
  foods: string[];
  avoidFoods?: string[];
  priority: 'high' | 'medium' | 'low';
  relatedMetric: OralMetricKey;
}

// 구강 건강 영양제 추천
export interface OralSupplementRecommendation {
  name: string;
  reason: string;
  timing: string;
  priority: 'high' | 'medium' | 'low';
}

// 구강 연동 인사이트 결과
export interface OralNutritionInsight {
  hasAnalysis: boolean;
  foodRecommendations: OralFoodRecommendation[];
  supplementRecommendations: OralSupplementRecommendation[];
  summaryMessage: string;
}

// 구강 지표별 음식 추천 데이터
const ORAL_FOOD_RECOMMENDATIONS: Record<
  OralMetricKey,
  Record<'warning' | 'normal' | 'good', OralFoodRecommendation | null>
> = {
  cavityRisk: {
    warning: {
      icon: '🦷',
      title: '치아 강화 식품',
      description: '충치 위험이 높아요. 칼슘과 인이 풍부한 식품으로 치아를 강화해 보세요.',
      foods: ['치즈', '우유', '요거트', '멸치', '두부', '브로콜리'],
      avoidFoods: ['사탕', '탄산음료', '젤리', '카라멜'],
      priority: 'high',
      relatedMetric: 'cavityRisk',
    },
    normal: {
      icon: '🧀',
      title: '치아 건강 유지 식품',
      description: '충치 예방을 위해 칼슘이 풍부한 유제품을 챙겨보세요.',
      foods: ['치즈', '우유', '견과류'],
      priority: 'low',
      relatedMetric: 'cavityRisk',
    },
    good: {
      icon: '✨',
      title: '치아 건강 유지 팁',
      description: '치아가 건강해요! 칼슘 식품을 꾸준히 섭취하면 더 오래 유지할 수 있어요.',
      foods: ['치즈', '요거트', '아몬드'],
      priority: 'low',
      relatedMetric: 'cavityRisk',
    },
  },
  gumHealth: {
    warning: {
      icon: '🍊',
      title: '잇몸 강화 식품',
      description:
        '잇몸 건강이 좋지 않아요. 비타민C와 비타민K가 풍부한 식품이 잇몸 강화에 도움이 됩니다.',
      foods: ['키위', '딸기', '파프리카', '시금치', '케일', '브로콜리'],
      priority: 'high',
      relatedMetric: 'gumHealth',
    },
    normal: null,
    good: {
      icon: '🥬',
      title: '잇몸 건강 유지 식품',
      description: '잇몸이 건강해요! 비타민C가 풍부한 과일과 채소로 유지해 보세요.',
      foods: ['키위', '딸기', '브로콜리'],
      priority: 'low',
      relatedMetric: 'gumHealth',
    },
  },
  sensitivity: {
    warning: {
      icon: '🥛',
      title: '치아 민감도 케어 식품',
      description:
        '치아가 민감해요. 칼슘과 불소가 풍부한 식품을 섭취하고, 극단적인 온도의 음식은 피해주세요.',
      foods: ['우유', '치즈', '녹차', '아몬드', '참깨'],
      avoidFoods: ['매우 차가운 음료', '매우 뜨거운 음료', '산성 과일주스'],
      priority: 'high',
      relatedMetric: 'sensitivity',
    },
    normal: null,
    good: null,
  },
  plaque: {
    warning: {
      icon: '🍏',
      title: '치석 예방 식품',
      description: '치석이 쌓이기 쉬운 상태예요. 섬유질이 풍부한 식품이 자연 세정 효과가 있어요.',
      foods: ['사과', '당근', '셀러리', '오이', '배'],
      avoidFoods: ['끈적한 과자', '마른 과일'],
      priority: 'medium',
      relatedMetric: 'plaque',
    },
    normal: null,
    good: {
      icon: '🍎',
      title: '자연 세정 식품',
      description: '치석 관리가 잘 되고 있어요! 섬유질 식품으로 자연 세정 효과를 유지하세요.',
      foods: ['사과', '당근', '셀러리'],
      priority: 'low',
      relatedMetric: 'plaque',
    },
  },
  badBreath: {
    warning: {
      icon: '🍵',
      title: '구취 개선 식품',
      description: '구취가 있을 수 있어요. 항균 효과가 있는 녹차와 프로바이오틱스가 도움이 됩니다.',
      foods: ['녹차', '요거트', '파슬리', '민트', '사과'],
      priority: 'medium',
      relatedMetric: 'badBreath',
    },
    normal: null,
    good: null,
  },
};

// 구강 지표별 영양제 추천 데이터
const ORAL_SUPPLEMENT_RECOMMENDATIONS: Record<
  OralMetricKey,
  Record<'warning', OralSupplementRecommendation[] | null>
> = {
  cavityRisk: {
    warning: [
      {
        name: '칼슘',
        reason: '치아 법랑질 강화 및 재광화 촉진',
        timing: '식후',
        priority: 'high',
      },
      {
        name: '비타민D',
        reason: '칼슘 흡수 촉진 및 치아 건강 유지',
        timing: '아침 식후',
        priority: 'high',
      },
    ],
  },
  gumHealth: {
    warning: [
      {
        name: '비타민C',
        reason: '잇몸 콜라겐 합성 및 출혈 예방',
        timing: '아침 식후',
        priority: 'high',
      },
      {
        name: '코엔자임Q10',
        reason: '잇몸 조직 에너지 대사 지원',
        timing: '아침 식후',
        priority: 'medium',
      },
    ],
  },
  sensitivity: {
    warning: [
      {
        name: '칼슘 + 비타민D',
        reason: '치아 미네랄 보충 및 민감도 완화',
        timing: '식후',
        priority: 'high',
      },
    ],
  },
  plaque: {
    warning: [
      {
        name: '프로바이오틱스',
        reason: '구강 내 유익균 증가로 플라크 억제',
        timing: '아침 공복',
        priority: 'medium',
      },
    ],
  },
  badBreath: {
    warning: [
      {
        name: '프로바이오틱스',
        reason: '장-구강 연결축 개선으로 구취 완화',
        timing: '아침 공복',
        priority: 'medium',
      },
      {
        name: '아연',
        reason: '구강 내 황화물 생성 억제',
        timing: '식후',
        priority: 'medium',
      },
    ],
  },
};

/**
 * 구강 분석 결과를 기반으로 영양 인사이트 생성
 */
export function getOralNutritionInsight(
  oralAnalysis: OralAnalysisSummary | null
): OralNutritionInsight {
  if (!oralAnalysis) {
    return {
      hasAnalysis: false,
      foodRecommendations: [],
      supplementRecommendations: [],
      summaryMessage: 'OH-1 구강건강 분석을 완료하면 치아 건강에 맞는 영양 추천을 받을 수 있어요!',
    };
  }

  const foodRecommendations: OralFoodRecommendation[] = [];
  const supplementRecommendations: OralSupplementRecommendation[] = [];
  const metricKeys: OralMetricKey[] = [
    'cavityRisk',
    'gumHealth',
    'sensitivity',
    'plaque',
    'badBreath',
  ];

  // 지표별 음식 추천 수집
  for (const key of metricKeys) {
    const status = oralAnalysis[key];
    if (status === 'warning') {
      const foodRec = ORAL_FOOD_RECOMMENDATIONS[key].warning;
      if (foodRec) {
        foodRecommendations.push(foodRec);
      }
      const suppRecs = ORAL_SUPPLEMENT_RECOMMENDATIONS[key].warning;
      if (suppRecs) {
        // 중복 영양제 제거
        for (const supp of suppRecs) {
          if (!supplementRecommendations.some((s) => s.name === supp.name)) {
            supplementRecommendations.push(supp);
          }
        }
      }
    } else if (status === 'normal') {
      const foodRec = ORAL_FOOD_RECOMMENDATIONS[key].normal;
      if (foodRec) {
        foodRecommendations.push(foodRec);
      }
    } else if (status === 'good') {
      const foodRec = ORAL_FOOD_RECOMMENDATIONS[key].good;
      if (foodRec) {
        foodRecommendations.push(foodRec);
      }
    }
  }

  // 우선순위별 정렬 (high > medium > low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  foodRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  supplementRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // 최대 3개까지만 표시
  const topFoods = foodRecommendations.slice(0, 3);
  const topSupplements = supplementRecommendations.slice(0, 3);

  // 요약 메시지 생성
  const warningCount = Object.values(oralAnalysis).filter((s) => s === 'warning').length;
  const goodCount = Object.values(oralAnalysis).filter((s) => s === 'good').length;
  let summaryMessage: string;

  if (warningCount >= 3) {
    summaryMessage =
      '구강 건강에 관심이 필요해요. 치아와 잇몸에 좋은 음식과 영양제를 함께 챙겨보세요.';
  } else if (warningCount >= 1) {
    summaryMessage = '구강 건강을 위한 맞춤 영양 관리를 시작해보세요.';
  } else if (goodCount >= 4) {
    summaryMessage = '구강 건강이 매우 좋아요! 현재 식습관을 유지하면서 추천 식품도 참고해 보세요.';
  } else {
    summaryMessage = '구강 건강이 양호해요. 추천 식품으로 더 건강하게 관리해 보세요.';
  }

  return {
    hasAnalysis: true,
    foodRecommendations: topFoods,
    supplementRecommendations: topSupplements,
    summaryMessage,
  };
}

/**
 * OH-1 분석 결과를 OralAnalysisSummary로 변환
 */
export function convertOralMetricsToSummary(
  oralResult: Record<string, unknown> | null
): OralAnalysisSummary | null {
  if (!oralResult) return null;

  // 점수(0-100) → 상태 변환
  const toStatus = (score: unknown): 'warning' | 'normal' | 'good' => {
    const num = typeof score === 'number' ? score : 50;
    if (num < 40) return 'warning';
    if (num < 70) return 'normal';
    return 'good';
  };

  return {
    cavityRisk: toStatus(oralResult.cavityRisk ?? oralResult.cavity_risk),
    gumHealth: toStatus(oralResult.gumHealth ?? oralResult.gum_health),
    sensitivity: toStatus(oralResult.sensitivity),
    plaque: toStatus(oralResult.plaque ?? oralResult.plaque_level),
    badBreath: toStatus(oralResult.badBreath ?? oralResult.bad_breath),
  };
}

// 상수 내보내기 (테스트용)
export { ORAL_FOOD_RECOMMENDATIONS, ORAL_SUPPLEMENT_RECOMMENDATIONS };
