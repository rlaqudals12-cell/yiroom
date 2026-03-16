/**
 * N-1 H-1 헤어 연동 인사이트 로직
 *
 * H-1 → N-1: 모발/두피 상태 → 영양소/식품 추천
 * - 두피 건조 → 오메가3, 비오틴
 * - 모발 손상 → 단백질, 철분
 * - 탈모 경향 → 아연, 비오틴, 철분
 * - 두피 유분 → 비타민B, 아연
 *
 * H-1 ↔ S-1 연동: 두피-피부 상관관계 인사이트
 * - 두피 건조 + 피부 건조 → 전신 수분/오메가3 부족 신호
 * - 두피 유분 + 피부 유분 → 피지 분비 과다 종합 관리
 */

import type { MetricStatus } from '@/lib/mock/skin-analysis';

// 헤어 지표 키
export type HairMetricKey =
  | 'scalpDryness' // 두피 건조도
  | 'scalpOil' // 두피 유분
  | 'hairDamage' // 모발 손상
  | 'hairLoss' // 탈모 경향
  | 'hairDensity'; // 모발 밀도

// 헤어 분석 요약 타입
export interface HairAnalysisSummary {
  scalpDryness: MetricStatus;
  scalpOil: MetricStatus;
  hairDamage: MetricStatus;
  hairLoss: MetricStatus;
  hairDensity: MetricStatus;
}

// 피부 분석 요약 (S-1 참조)
export interface SkinSummaryForHair {
  hydration: MetricStatus;
  oil: MetricStatus;
  trouble: MetricStatus;
}

// 헤어 영양 추천
export interface HairFoodRecommendation {
  icon: string;
  title: string;
  description: string;
  foods: string[];
  priority: 'high' | 'medium' | 'low';
  relatedMetric: HairMetricKey;
}

// 두피-피부 상관 인사이트
export interface ScalpSkinCorrelation {
  icon: string;
  title: string;
  description: string;
  sharedNutrients: string[];
  priority: 'high' | 'medium' | 'low';
}

// 헤어 연동 인사이트 결과
export interface HairNutritionInsight {
  hasAnalysis: boolean;
  foodRecommendations: HairFoodRecommendation[];
  scalpSkinCorrelation: ScalpSkinCorrelation | null;
  summaryMessage: string;
}

// 헤어 지표별 음식 추천 데이터
const HAIR_FOOD_RECOMMENDATIONS: Record<
  HairMetricKey,
  Record<'warning' | 'normal', HairFoodRecommendation | null>
> = {
  scalpDryness: {
    warning: {
      icon: '🐟',
      title: '두피 보습 식품',
      description:
        '두피가 건조해요. 오메가3와 비타민E가 풍부한 식품이 두피 유수분 밸런스에 도움이 됩니다.',
      foods: ['연어', '고등어', '아보카도', '호두', '아마씨', '올리브오일'],
      priority: 'high',
      relatedMetric: 'scalpDryness',
    },
    normal: null,
  },
  scalpOil: {
    warning: {
      icon: '🥬',
      title: '두피 유분 조절 식품',
      description:
        '두피 유분이 많아요. 비타민B군과 아연이 풍부한 식품이 피지 분비 조절에 도움이 됩니다.',
      foods: ['현미', '닭가슴살', '달걀', '시금치', '렌틸콩', '버섯'],
      priority: 'high',
      relatedMetric: 'scalpOil',
    },
    normal: null,
  },
  hairDamage: {
    warning: {
      icon: '🥚',
      title: '모발 복구 식품',
      description:
        '모발이 손상되어 있어요. 케라틴 합성에 필요한 단백질과 비오틴이 풍부한 식품을 섭취해 보세요.',
      foods: ['달걀', '닭가슴살', '연어', '아몬드', '고구마', '시금치'],
      priority: 'high',
      relatedMetric: 'hairDamage',
    },
    normal: {
      icon: '💪',
      title: '모발 건강 유지 식품',
      description: '모발 건강 유지를 위해 단백질을 꾸준히 섭취해 보세요.',
      foods: ['달걀', '견과류', '콩류'],
      priority: 'low',
      relatedMetric: 'hairDamage',
    },
  },
  hairLoss: {
    warning: {
      icon: '🌱',
      title: '탈모 예방 식품',
      description:
        '탈모 경향이 있어요. 철분, 아연, 비오틴이 풍부한 식품이 모발 성장에 도움이 됩니다.',
      foods: ['소고기', '시금치', '렌틸콩', '호박씨', '굴', '브라질너트'],
      priority: 'high',
      relatedMetric: 'hairLoss',
    },
    normal: null,
  },
  hairDensity: {
    warning: {
      icon: '🥜',
      title: '모발 밀도 강화 식품',
      description:
        '모발이 가늘어지고 있어요. 단백질과 미네랄이 풍부한 식품으로 모발을 강화해 보세요.',
      foods: ['견과류', '달걀', '콩류', '미역', '다시마', '새우'],
      priority: 'medium',
      relatedMetric: 'hairDensity',
    },
    normal: null,
  },
};

/**
 * 두피-피부 상관관계 분석 (H-1 + S-1 연동)
 */
function analyzeScalpSkinCorrelation(
  hairAnalysis: HairAnalysisSummary,
  skinSummary: SkinSummaryForHair
): ScalpSkinCorrelation | null {
  // 두피 건조 + 피부 건조 → 전신 수분/오메가3 부족
  if (hairAnalysis.scalpDryness === 'warning' && skinSummary.hydration === 'warning') {
    return {
      icon: '💧',
      title: '전신 수분 부족 신호',
      description:
        '두피와 피부 모두 건조해요. 체내 수분과 오메가3가 부족할 수 있어요. 수분 섭취와 오메가3 식품을 함께 늘려보세요.',
      sharedNutrients: ['오메가3', '비타민E', '수분'],
      priority: 'high',
    };
  }

  // 두피 유분 + 피부 유분 → 피지 분비 과다 종합
  if (hairAnalysis.scalpOil === 'warning' && skinSummary.oil === 'warning') {
    return {
      icon: '⚖️',
      title: '피지 분비 종합 관리',
      description:
        '두피와 피부 모두 유분이 많아요. 비타민B군과 아연으로 피지 분비를 조절해 보세요. 기름진 음식은 줄이는 것이 좋아요.',
      sharedNutrients: ['비타민B군', '아연', '식이섬유'],
      priority: 'high',
    };
  }

  // 탈모 + 트러블 → 염증/영양 부족 복합
  if (hairAnalysis.hairLoss === 'warning' && skinSummary.trouble === 'warning') {
    return {
      icon: '🔬',
      title: '영양 밸런스 점검',
      description:
        '탈모 경향과 피부 트러블이 동시에 나타나고 있어요. 체내 염증 수준이 높거나 영양이 불균형할 수 있어요. 항염 식품과 비타민을 챙겨보세요.',
      sharedNutrients: ['아연', '오메가3', '비타민C', '프로바이오틱스'],
      priority: 'high',
    };
  }

  return null;
}

/**
 * 헤어 분석 결과를 기반으로 영양 인사이트 생성
 */
export function getHairNutritionInsight(
  hairAnalysis: HairAnalysisSummary | null,
  skinSummary?: SkinSummaryForHair | null
): HairNutritionInsight {
  if (!hairAnalysis) {
    return {
      hasAnalysis: false,
      foodRecommendations: [],
      scalpSkinCorrelation: null,
      summaryMessage: 'H-1 헤어 분석을 완료하면 두피와 모발에 맞는 영양 추천을 받을 수 있어요!',
    };
  }

  const foodRecommendations: HairFoodRecommendation[] = [];
  const metricKeys: HairMetricKey[] = [
    'hairLoss',
    'hairDamage',
    'scalpDryness',
    'scalpOil',
    'hairDensity',
  ];

  // 헤어 지표별 음식 추천 수집
  for (const key of metricKeys) {
    const status = hairAnalysis[key];
    if (status === 'warning') {
      const rec = HAIR_FOOD_RECOMMENDATIONS[key].warning;
      if (rec) {
        foodRecommendations.push(rec);
      }
    } else if (status === 'normal') {
      const rec = HAIR_FOOD_RECOMMENDATIONS[key].normal;
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

  // 두피-피부 상관관계 분석 (S-1 데이터가 있을 때만)
  const scalpSkinCorrelation = skinSummary
    ? analyzeScalpSkinCorrelation(hairAnalysis, skinSummary)
    : null;

  // 요약 메시지 생성
  const warningCount = Object.values(hairAnalysis).filter((s) => s === 'warning').length;
  let summaryMessage: string;

  if (warningCount >= 3) {
    summaryMessage =
      '두피와 모발 관리에 신경쓰면 좋아요! 추천 식품과 영양소로 내부부터 케어해 보세요.';
  } else if (warningCount >= 1) {
    summaryMessage = '모발 상태에 맞는 영양 관리를 시작해보세요.';
  } else {
    summaryMessage = '두피와 모발 상태가 좋아요! 현재 식습관을 유지해 주세요.';
  }

  if (scalpSkinCorrelation) {
    summaryMessage += ' 두피와 피부 상태를 함께 개선할 수 있는 영양소도 확인해 보세요.';
  }

  return {
    hasAnalysis: true,
    foodRecommendations: topRecommendations,
    scalpSkinCorrelation,
    summaryMessage,
  };
}

/**
 * H-1 분석 결과를 HairAnalysisSummary로 변환
 */
export function convertHairMetricsToSummary(
  hairResult: Record<string, unknown> | null
): HairAnalysisSummary | null {
  if (!hairResult) return null;

  // 점수(0-100) → 상태 변환
  const toStatus = (score: unknown): MetricStatus => {
    const num = typeof score === 'number' ? score : 50;
    if (num < 40) return 'warning';
    if (num < 70) return 'normal';
    return 'good';
  };

  return {
    scalpDryness: toStatus(hairResult.scalpDryness ?? hairResult.scalp_dryness),
    scalpOil: toStatus(hairResult.scalpOil ?? hairResult.scalp_oil),
    hairDamage: toStatus(hairResult.hairDamage ?? hairResult.damage_level),
    hairLoss: toStatus(hairResult.hairLoss ?? hairResult.hair_loss),
    hairDensity: toStatus(hairResult.hairDensity ?? hairResult.density),
  };
}

// 상수 내보내기 (테스트용)
export { HAIR_FOOD_RECOMMENDATIONS };
