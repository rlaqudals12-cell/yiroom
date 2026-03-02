/**
 * N-1 S-1 피부 연동 인사이트 로직 (Task 3.7)
 *
 * 스펙 참조: docs/phase2/docs/N-1-feature-spec-template-v1.0.3.md
 * - S-1 → N-1: 피부 고민 → 피부 친화 음식 추천
 * - 피부 수분↓ → 수분 많은 과일, 물 섭취 추천
 * - 피부 트러블 → 저당, 항염 식품 추천
 * - 콜라겐↓ → 비타민C, 단백질 식품 추천
 */

import type { MetricStatus } from '@/lib/mock/skin-analysis';
import { selectByKey } from '@/lib/utils/conditional-helpers';

// 피부 지표 키 (S-1과 동일)
export type SkinMetricKey =
  | 'hydration'
  | 'oil'
  | 'pores'
  | 'wrinkles'
  | 'elasticity'
  | 'pigmentation'
  | 'trouble';

// 피부 분석 요약 타입
export interface SkinAnalysisSummary {
  hydration: MetricStatus;
  oil: MetricStatus;
  pores: MetricStatus;
  wrinkles: MetricStatus;
  elasticity: MetricStatus;
  pigmentation: MetricStatus;
  trouble: MetricStatus;
}

// 피부 친화 음식 추천
export interface SkinFoodRecommendation {
  icon: string;
  title: string;
  description: string;
  foods: string[];
  priority: 'high' | 'medium' | 'low';
  relatedMetric: SkinMetricKey;
}

// 수분 연동 인사이트
export interface HydrationInsight {
  icon: string;
  message: string;
  targetMl: number;
  currentMl?: number;
  priority: 'high' | 'medium' | 'low';
}

// 피부 연동 인사이트 결과
export interface SkinNutritionInsight {
  /** 피부 분석 완료 여부 */
  hasAnalysis: boolean;
  /** 음식 추천 목록 */
  foodRecommendations: SkinFoodRecommendation[];
  /** 수분 섭취 인사이트 */
  hydrationInsight: HydrationInsight | null;
  /** 전체 요약 메시지 */
  summaryMessage: string;
}

// 피부 지표별 음식 추천 데이터
const SKIN_FOOD_RECOMMENDATIONS: Record<
  SkinMetricKey,
  Record<'warning' | 'normal', SkinFoodRecommendation | null>
> = {
  hydration: {
    warning: {
      icon: '💧',
      title: '수분 보충 식품',
      description:
        '피부 수분이 부족해요! 수분 함량이 높은 음식으로 내부부터 촉촉하게 관리해 보세요.',
      foods: ['수박', '오이', '토마토', '딸기', '셀러리', '양상추'],
      priority: 'high',
      relatedMetric: 'hydration',
    },
    normal: {
      icon: '🥒',
      title: '수분 유지 식품',
      description: '피부 수분 유지를 위해 수분이 풍부한 과일과 채소를 섭취해 보세요.',
      foods: ['오이', '포도', '멜론', '파인애플'],
      priority: 'medium',
      relatedMetric: 'hydration',
    },
  },
  oil: {
    warning: {
      icon: '🥗',
      title: '피지 조절 식품',
      description:
        '유분이 많은 피부예요. 저지방 식품과 비타민A가 풍부한 음식이 도움이 됩니다.',
      foods: ['당근', '시금치', '고구마', '브로콜리', '녹차'],
      priority: 'high',
      relatedMetric: 'oil',
    },
    normal: null,
  },
  pores: {
    warning: {
      icon: '🍵',
      title: '모공 관리 식품',
      description: '모공 관리를 위해 항산화 성분이 풍부한 음식을 추천해요.',
      foods: ['녹차', '블루베리', '석류', '아몬드', '아보카도'],
      priority: 'medium',
      relatedMetric: 'pores',
    },
    normal: null,
  },
  wrinkles: {
    warning: {
      icon: '🥚',
      title: '콜라겐 생성 식품',
      description:
        '주름 개선을 위해 콜라겐 생성을 돕는 비타민C와 단백질 식품을 섭취해 보세요.',
      foods: ['달걀', '연어', '닭가슴살', '레몬', '키위', '파프리카'],
      priority: 'high',
      relatedMetric: 'wrinkles',
    },
    normal: null,
  },
  elasticity: {
    warning: {
      icon: '🐟',
      title: '탄력 강화 식품',
      description: '피부 탄력을 위해 오메가3와 콜라겐이 풍부한 음식을 추천해요.',
      foods: ['연어', '고등어', '아몬드', '호두', '아보카도', '블루베리'],
      priority: 'high',
      relatedMetric: 'elasticity',
    },
    normal: {
      icon: '🥜',
      title: '탄력 유지 식품',
      description: '탄력 유지를 위해 건강한 지방과 단백질을 챙겨보세요.',
      foods: ['견과류', '올리브오일', '닭가슴살'],
      priority: 'low',
      relatedMetric: 'elasticity',
    },
  },
  pigmentation: {
    warning: {
      icon: '🍋',
      title: '미백 도움 식품',
      description: '색소 침착 개선을 위해 비타민C가 풍부한 음식을 섭취해 보세요.',
      foods: ['레몬', '오렌지', '키위', '파프리카', '브로콜리', '딸기'],
      priority: 'high',
      relatedMetric: 'pigmentation',
    },
    normal: null,
  },
  trouble: {
    warning: {
      icon: '🥦',
      title: '트러블 진정 식품',
      description:
        '트러블 완화를 위해 저당 식품과 항염 효과가 있는 음식을 추천해요.',
      foods: ['브로콜리', '양배추', '강황', '생강', '녹색 채소', '요거트'],
      priority: 'high',
      relatedMetric: 'trouble',
    },
    normal: {
      icon: '🥬',
      title: '피부 진정 식품',
      description: '피부 건강 유지를 위해 항염 식품을 챙겨보세요.',
      foods: ['녹색 채소', '베리류', '견과류'],
      priority: 'low',
      relatedMetric: 'trouble',
    },
  },
};

// 수분 섭취 목표 조정 (피부 수분 상태에 따라)
const HYDRATION_TARGETS: Record<MetricStatus, { targetMl: number; message: string }> = {
  warning: {
    targetMl: 2500,
    message:
      '피부 수분이 부족해요! 오늘은 물을 2.5L 이상 마시는 것을 목표로 해보세요. 💧',
  },
  normal: {
    targetMl: 2000,
    message: '피부 수분 유지를 위해 하루 2L의 물을 마셔보세요.',
  },
  good: {
    targetMl: 2000,
    message: '피부 수분 상태가 좋아요! 현재 수분 섭취 패턴을 유지해 주세요. ✨',
  },
};

// 피부 목표별 추가 메시지
const SKIN_GOAL_MESSAGES: Record<string, string> = {
  skin_improvement: '피부 개선 목표를 선택하셨네요! 피부 친화 식품으로 관리해 보세요.',
  weight_loss: '',
  weight_maintain: '',
  muscle_gain: '',
  health: '',
};

/**
 * 피부 분석 결과를 기반으로 영양 인사이트 생성
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- complex business logic
export function getSkinNutritionInsight(
  skinAnalysis: SkinAnalysisSummary | null,
  currentWaterMl?: number,
  nutritionGoal?: string
): SkinNutritionInsight {
  // 피부 분석이 없는 경우
  if (!skinAnalysis) {
    return {
      hasAnalysis: false,
      foodRecommendations: [],
      hydrationInsight: null,
      summaryMessage: 'S-1 피부 분석을 완료하면 맞춤 영양 추천을 받을 수 있어요!',
    };
  }

  const foodRecommendations: SkinFoodRecommendation[] = [];
  const metricKeys: SkinMetricKey[] = [
    'hydration',
    'trouble',
    'elasticity',
    'wrinkles',
    'pigmentation',
    'oil',
    'pores',
  ];

  // 피부 지표별 음식 추천 수집
  for (const key of metricKeys) {
    const status = skinAnalysis[key];
    if (status === 'warning') {
      const rec = SKIN_FOOD_RECOMMENDATIONS[key].warning;
      if (rec) {
        foodRecommendations.push(rec);
      }
    } else if (status === 'normal') {
      const rec = SKIN_FOOD_RECOMMENDATIONS[key].normal;
      if (rec) {
        foodRecommendations.push(rec);
      }
    }
  }

  // 우선순위별 정렬 (high > medium > low)
  foodRecommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // 최대 3개까지만 표시
  const topRecommendations = foodRecommendations.slice(0, 3);

  // 수분 인사이트 생성
  const hydrationStatus = skinAnalysis.hydration;
  const hydrationTarget = HYDRATION_TARGETS[hydrationStatus];
  const hydrationInsight: HydrationInsight = {
    icon: selectByKey(hydrationStatus, { warning: '🚨', good: '✨' }, '💧')!,
    message: hydrationTarget.message,
    targetMl: hydrationTarget.targetMl,
    currentMl: currentWaterMl,
    priority: selectByKey(hydrationStatus, { warning: 'high' as const, good: 'low' as const }, 'medium' as const)!,
  };

  // 요약 메시지 생성
  let summaryMessage = '';
  const warningCount = Object.values(skinAnalysis).filter((s) => s === 'warning').length;

  if (warningCount >= 3) {
    summaryMessage =
      '피부 관리가 필요해요! 추천 식품으로 내부부터 건강하게 케어해 보세요.';
  } else if (warningCount >= 1) {
    summaryMessage = '피부 상태에 맞는 음식으로 더 건강한 피부를 만들어 보세요.';
  } else {
    summaryMessage = '피부 상태가 좋아요! 현재 식습관을 유지해 주세요. ✨';
  }

  // 피부 개선 목표인 경우 추가 메시지
  if (nutritionGoal && SKIN_GOAL_MESSAGES[nutritionGoal]) {
    summaryMessage = SKIN_GOAL_MESSAGES[nutritionGoal] + ' ' + summaryMessage;
  }

  return {
    hasAnalysis: true,
    foodRecommendations: topRecommendations,
    hydrationInsight,
    summaryMessage,
  };
}

/**
 * 피부 수분 상태에 따른 수분 섭취 목표 계산
 */
export function getHydrationTargetFromSkin(
  skinAnalysis: SkinAnalysisSummary | null
): number {
  if (!skinAnalysis) {
    return 2000; // 기본값
  }

  return HYDRATION_TARGETS[skinAnalysis.hydration].targetMl;
}

/**
 * 피부 상태와 수분 섭취량을 연동한 메시지 생성
 */
export function getSkinHydrationMessage(
  skinAnalysis: SkinAnalysisSummary | null,
  currentWaterMl: number,
  targetMl: number
): string {
  if (!skinAnalysis) {
    return '';
  }

  const percentage = Math.round((currentWaterMl / targetMl) * 100);
  const hydrationStatus = skinAnalysis.hydration;

  if (hydrationStatus === 'warning') {
    if (percentage < 50) {
      return '피부 수분이 부족해요! 물 마시기 챌린지를 시작해볼까요? 💧';
    }
    if (percentage < 80) {
      return '조금만 더! 피부 수분을 위해 물을 더 마셔주세요.';
    }
    return '오늘 수분 섭취 잘하고 있어요! 피부도 촉촉해질 거예요. ✨';
  }

  if (percentage >= 100) {
    return '오늘 수분 섭취 목표 달성! 피부가 좋아할 거예요. 🎉';
  }

  return '';
}

/**
 * S-1 피부 분석 결과를 SkinAnalysisSummary로 변환
 */
export function convertSkinMetricsToSummary(
  metrics: Array<{ id: string; status: MetricStatus }>
): SkinAnalysisSummary {
  const metricsById = metrics.reduce(
    (acc, metric) => {
      acc[metric.id] = metric.status;
      return acc;
    },
    {} as Record<string, MetricStatus>
  );

  return {
    hydration: metricsById.hydration ?? 'normal',
    oil: metricsById.oil ?? 'normal',
    pores: metricsById.pores ?? 'normal',
    wrinkles: metricsById.wrinkles ?? 'normal',
    elasticity: metricsById.elasticity ?? 'normal',
    pigmentation: metricsById.pigmentation ?? 'normal',
    trouble: metricsById.trouble ?? 'normal',
  };
}

// 상수 내보내기 (테스트용)
export { SKIN_FOOD_RECOMMENDATIONS, HYDRATION_TARGETS };
