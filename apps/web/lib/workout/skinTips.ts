/**
 * S-1 연동 운동 후 피부 관리 팁 로직
 *
 * 스펙 참조: docs/phase2/docs/W-1-feature-spec-template-v1.1-final.md (5.2절)
 * - W-1 → S-1 연동: 운동 완료 후 피부 관리 팁 표시
 */

import type { MetricStatus } from '@/lib/mock/skin-analysis';

// S-1 피부 지표 키 (skin-analysis.ts의 metric.id와 일치)
export type SkinMetricKey = 'hydration' | 'oil' | 'pores' | 'wrinkles' | 'elasticity' | 'pigmentation' | 'trouble';

// 운동 유형 (땀 배출량 기준)
export type WorkoutIntensity = 'low' | 'medium' | 'high';

// 운동 카테고리
export type WorkoutCategory = 'cardio' | 'strength' | 'flexibility' | 'hiit' | 'recovery';

// 피부 관리 팁
export interface SkinCareTip {
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// 운동 후 피부 관리 추천
export interface PostWorkoutSkinCare {
  immediateActions: SkinCareTip[];
  skinMetricTips: SkinCareTip[];
  generalTips: SkinCareTip[];
}

// 피부 분석 결과 요약 (S-1에서 가져올 데이터)
export interface SkinAnalysisSummary {
  hydration: MetricStatus;
  oil: MetricStatus;
  pores: MetricStatus;
  wrinkles: MetricStatus;
  elasticity: MetricStatus;
  pigmentation: MetricStatus;
  trouble: MetricStatus;
}

// 운동 유형별 기본 팁
const WORKOUT_CATEGORY_TIPS: Record<WorkoutCategory, SkinCareTip[]> = {
  cardio: [
    {
      icon: '💧',
      title: '수분 보충 필수',
      description: '유산소 운동으로 많은 땀을 흘렸어요. 운동 직후 물을 충분히 마시고, 미스트로 피부에도 수분을 공급해 주세요.',
      priority: 'high',
    },
    {
      icon: '🧴',
      title: '즉시 세안하기',
      description: '땀과 피지가 섞여 모공을 막을 수 있어요. 30분 이내에 순한 클렌저로 세안해 주세요.',
      priority: 'high',
    },
  ],
  strength: [
    {
      icon: '💪',
      title: '혈액순환 활성화',
      description: '근력 운동으로 혈액순환이 좋아졌어요. 세안 후 가벼운 마사지로 효과를 높여보세요.',
      priority: 'medium',
    },
    {
      icon: '🧊',
      title: '쿨링 케어',
      description: '운동 후 열감이 있다면 쿨링 제품이나 시트 마스크로 진정시켜 주세요.',
      priority: 'medium',
    },
  ],
  flexibility: [
    {
      icon: '🧘',
      title: '릴렉싱 케어',
      description: '스트레칭과 요가는 스트레스 해소에 좋아요. 아로마 오일로 마무리하면 피부 진정에도 도움이 됩니다.',
      priority: 'low',
    },
    {
      icon: '✨',
      title: '가벼운 보습',
      description: '격렬한 운동이 아니었다면 간단한 보습만으로도 충분해요.',
      priority: 'low',
    },
  ],
  hiit: [
    {
      icon: '🔥',
      title: '즉각적인 쿨다운',
      description: 'HIIT로 체온이 많이 올랐어요. 미온수로 세안하고 쿨링 젤로 열기를 빼주세요.',
      priority: 'high',
    },
    {
      icon: '💦',
      title: '집중 수분 케어',
      description: '고강도 운동 후에는 수분 에센스와 크림으로 레이어링 보습을 해주세요.',
      priority: 'high',
    },
  ],
  recovery: [
    {
      icon: '🌿',
      title: '진정 케어',
      description: '회복 운동 후에는 센텔라, 알로에 성분의 진정 제품이 좋아요.',
      priority: 'low',
    },
    {
      icon: '😴',
      title: '수면 전 케어',
      description: '가벼운 스트레칭 후 나이트 크림으로 마무리하면 피부 재생에 도움이 됩니다.',
      priority: 'low',
    },
  ],
};

// 운동 강도별 추가 팁
const INTENSITY_TIPS: Record<WorkoutIntensity, SkinCareTip | null> = {
  low: null,
  medium: {
    icon: '⏰',
    title: '30분 이내 세안',
    description: '적당히 땀을 흘렸다면 30분 이내에 세안하는 것이 좋아요.',
    priority: 'medium',
  },
  high: {
    icon: '🚿',
    title: '즉시 샤워 권장',
    description: '고강도 운동 후에는 바로 샤워하고 전신 보습을 해주세요.',
    priority: 'high',
  },
};

// 피부 상태별 맞춤 팁
const SKIN_METRIC_TIPS: Record<SkinMetricKey, Record<MetricStatus, SkinCareTip | null>> = {
  hydration: {
    good: null,
    normal: {
      icon: '💧',
      title: '수분 유지하기',
      description: '운동 후 히알루론산 세럼으로 수분을 보충해 주세요.',
      priority: 'medium',
    },
    warning: {
      icon: '🚨',
      title: '수분 집중 케어',
      description: '피부 수분이 부족해요! 운동 후 반드시 수분 크림과 미스트로 집중 보습해 주세요.',
      priority: 'high',
    },
  },
  oil: {
    good: null,
    normal: null,
    warning: {
      icon: '🧼',
      title: '오일 컨트롤',
      description: '유분이 많은 피부예요. 운동 후 이중 세안으로 깨끗하게 클렌징해 주세요.',
      priority: 'high',
    },
  },
  pores: {
    good: null,
    normal: {
      icon: '🔍',
      title: '모공 관리',
      description: '운동 후 땀으로 모공이 열려있어요. 토너로 모공을 정돈해 주세요.',
      priority: 'medium',
    },
    warning: {
      icon: '⚠️',
      title: '모공 케어 필수',
      description: '모공이 커져있어요. 운동 후 클레이 마스크나 모공 수렴 토너 사용을 추천해요.',
      priority: 'high',
    },
  },
  wrinkles: {
    good: null,
    normal: null,
    warning: {
      icon: '✨',
      title: '안티에이징 케어',
      description: '운동 후 콜라겐 생성을 돕는 비타민C 세럼으로 관리해 주세요.',
      priority: 'medium',
    },
  },
  elasticity: {
    good: {
      icon: '💪',
      title: '탄력 유지 중',
      description: '운동으로 혈액순환이 좋아져 탄력 유지에 도움이 돼요. 계속 운동해 주세요!',
      priority: 'low',
    },
    normal: null,
    warning: {
      icon: '🌟',
      title: '탄력 케어',
      description: '운동 후 페이셜 마사지로 혈액순환을 더 촉진해 보세요.',
      priority: 'medium',
    },
  },
  pigmentation: {
    good: null,
    normal: null,
    warning: {
      icon: '☀️',
      title: '자외선 차단',
      description: '색소침착이 있으시네요. 실외 운동 시 자외선 차단제를 꼭 발라주세요.',
      priority: 'high',
    },
  },
  trouble: {
    good: null,
    normal: {
      icon: '🧴',
      title: '트러블 예방',
      description: '운동 후 빠른 세안으로 트러블을 예방하세요.',
      priority: 'medium',
    },
    warning: {
      icon: '🆘',
      title: '트러블 케어',
      description: '트러블이 있으시네요. 운동 후 즉시 세안하고 살리실산 성분 제품으로 케어해 주세요.',
      priority: 'high',
    },
  },
};

// 일반 운동 후 케어 팁
const GENERAL_TIPS: SkinCareTip[] = [
  {
    icon: '🥤',
    title: '물 마시기',
    description: '운동 후 체내 수분 보충이 피부 수분에도 도움이 됩니다.',
    priority: 'medium',
  },
  {
    icon: '🍎',
    title: '항산화 식품 섭취',
    description: '운동 후 비타민C가 풍부한 과일을 먹으면 피부 건강에 좋아요.',
    priority: 'low',
  },
  {
    icon: '😊',
    title: '스트레스 해소',
    description: '규칙적인 운동은 스트레스성 피부 트러블 예방에 효과적이에요.',
    priority: 'low',
  },
];

/**
 * 운동 카테고리 추론 (운동 타입 기반)
 */
export function inferWorkoutCategory(
  workoutType: string
): WorkoutCategory {
  const type = workoutType.toLowerCase();

  if (type.includes('cardio') || type.includes('running') || type.includes('cycling') || type === 'burner') {
    return 'cardio';
  }
  if (type.includes('hiit') || type.includes('crossfit') || type.includes('circuit')) {
    return 'hiit';
  }
  if (type.includes('yoga') || type.includes('pilates') || type.includes('stretch') || type === 'flexer') {
    return 'flexibility';
  }
  if (type.includes('recovery') || type.includes('foam') || type.includes('rest')) {
    return 'recovery';
  }
  // 기본값: strength (toner, builder, mover 등)
  return 'strength';
}

/**
 * 운동 시간으로 강도 추론 (분 단위)
 */
export function inferWorkoutIntensity(
  durationMinutes: number,
  category: WorkoutCategory
): WorkoutIntensity {
  // 유연성/회복 운동은 시간과 관계없이 낮은 강도
  if (category === 'flexibility' || category === 'recovery') {
    return 'low';
  }

  // HIIT는 짧아도 고강도
  if (category === 'hiit') {
    return durationMinutes >= 15 ? 'high' : 'medium';
  }

  // 유산소/근력 운동
  if (durationMinutes < 20) {
    return 'low';
  }
  if (durationMinutes < 45) {
    return 'medium';
  }
  return 'high';
}

/**
 * 운동 후 피부 관리 팁 생성
 */
export function getPostWorkoutSkinCareTips(
  workoutType: string,
  durationMinutes: number,
  skinAnalysis: SkinAnalysisSummary | null
): PostWorkoutSkinCare {
  const category = inferWorkoutCategory(workoutType);
  const intensity = inferWorkoutIntensity(durationMinutes, category);

  // 1. 즉각적인 운동 후 케어 (카테고리 + 강도 기반)
  const immediateActions: SkinCareTip[] = [...WORKOUT_CATEGORY_TIPS[category]];

  const intensityTip = INTENSITY_TIPS[intensity];
  if (intensityTip) {
    immediateActions.push(intensityTip);
  }

  // 2. 피부 상태별 맞춤 팁 (S-1 분석 결과 기반)
  const skinMetricTips: SkinCareTip[] = [];

  if (skinAnalysis) {
    const metricKeys: SkinMetricKey[] = [
      'hydration', 'oil', 'pores', 'wrinkles',
      'elasticity', 'pigmentation', 'trouble'
    ];

    for (const key of metricKeys) {
      const status = skinAnalysis[key];
      const tip = SKIN_METRIC_TIPS[key][status];
      if (tip) {
        skinMetricTips.push(tip);
      }
    }
  }

  // 3. 일반 팁 (랜덤 1~2개)
  const shuffledGeneral = [...GENERAL_TIPS].sort(() => Math.random() - 0.5);
  const generalTips = shuffledGeneral.slice(0, 2);

  return {
    immediateActions,
    skinMetricTips,
    generalTips,
  };
}

/**
 * 간단한 운동 후 메시지 생성 (결과 페이지용)
 */
export function getQuickPostWorkoutMessage(
  workoutType: string,
  durationMinutes: number
): { icon: string; title: string; message: string } {
  const category = inferWorkoutCategory(workoutType);
  const intensity = inferWorkoutIntensity(durationMinutes, category);

  if (intensity === 'high') {
    return {
      icon: '💧',
      title: '운동 후 피부 관리',
      message: `${durationMinutes}분 고강도 운동 완료! 땀을 많이 흘렸으니 즉시 세안하고 수분 보충을 해주세요.`,
    };
  }

  if (intensity === 'medium') {
    return {
      icon: '✨',
      title: '운동 후 피부 관리',
      message: `${durationMinutes}분 운동 완료! 30분 이내에 세안하고 보습해 주세요.`,
    };
  }

  return {
    icon: '🌿',
    title: '운동 후 피부 관리',
    message: '가벼운 운동 후에도 수분 보충은 잊지 마세요!',
  };
}

/**
 * 피부 분석 결과를 요약 형태로 변환
 * S-1의 SkinMetric[] 형태를 SkinAnalysisSummary로 변환
 */
export function convertToSkinSummary(
  skinMetrics: Array<{ id: string; status: MetricStatus }>
): SkinAnalysisSummary {
  // metrics 배열을 id로 인덱싱
  const metricsById = skinMetrics.reduce((acc, metric) => {
    acc[metric.id] = metric.status;
    return acc;
  }, {} as Record<string, MetricStatus>);

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

// 상수 내보내기 (테스트 및 외부 사용)
export {
  WORKOUT_CATEGORY_TIPS,
  INTENSITY_TIPS,
  SKIN_METRIC_TIPS,
  GENERAL_TIPS,
};
