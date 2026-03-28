/**
 * M-1 + S-1 피부타입 고려 메이크업 인사이트
 *
 * S-1 → M-1: 피부 상태 → 메이크업 제품 추천 조정
 * - 건성 피부 → 보습형 베이스, 크림 타입 제품
 * - 지성 피부 → 매트형 베이스, 파우더 타입 제품
 * - 트러블 → 커버력 높은 컨실러, 논코메도제닉
 * - 민감성 → 저자극 성분, 미네랄 베이스
 * - 주름 → 안티에이징 프라이머, 쿠션
 */

import type { MetricStatus } from '@/lib/mock/skin-analysis';

// 피부 분석 요약 (S-1에서 전달)
export interface SkinSummaryForMakeup {
  hydration: MetricStatus;
  oil: MetricStatus;
  pores: MetricStatus;
  wrinkles: MetricStatus;
  trouble: MetricStatus;
  pigmentation: MetricStatus;
}

// 메이크업 추천 조정
export interface MakeupAdjustment {
  icon: string;
  category: MakeupCategory;
  title: string;
  description: string;
  recommendedTypes: string[];
  avoidTypes: string[];
  priority: 'high' | 'medium' | 'low';
  relatedSkinMetric: string;
}

// 메이크업 카테고리
export type MakeupCategory =
  | 'base' // 베이스 (파운데이션, 쿠션, BB)
  | 'primer' // 프라이머
  | 'concealer' // 컨실러
  | 'powder' // 파우더/세팅
  | 'lip' // 립 제품
  | 'eye'; // 아이 메이크업

// 메이크업 스킨 인사이트 결과
export interface MakeupSkinInsight {
  hasAnalysis: boolean;
  adjustments: MakeupAdjustment[];
  baseRecommendation: BaseRecommendation | null;
  summaryMessage: string;
}

// 베이스 메이크업 종합 추천
export interface BaseRecommendation {
  skinType: string;
  finishType: 'dewy' | 'satin' | 'matte' | 'semi-matte';
  coverageLevel: 'light' | 'medium' | 'full';
  keyIngredients: string[];
  avoidIngredients: string[];
  message: string;
}

// 피부 지표별 메이크업 조정 데이터
const SKIN_MAKEUP_ADJUSTMENTS: Record<string, Record<'warning', MakeupAdjustment[] | null>> = {
  hydration: {
    warning: [
      {
        icon: '',
        category: 'base',
        title: '보습형 베이스 추천',
        description:
          '피부 수분이 낮아요. 보습 성분이 포함된 쿠션이나 수분 파운데이션이 더 자연스러워요.',
        recommendedTypes: ['수분 쿠션', '글로우 파운데이션', '크림 타입 BB'],
        avoidTypes: ['매트 파운데이션', '파우더 파운데이션'],
        priority: 'high',
        relatedSkinMetric: 'hydration',
      },
      {
        icon: '',
        category: 'primer',
        title: '보습 프라이머 필수',
        description:
          '메이크업 전 보습 프라이머로 수분 베이스를 만들어주세요. 화장 지속력이 높아져요.',
        recommendedTypes: ['하이드레이팅 프라이머', '글로우 프라이머'],
        avoidTypes: ['매트 프라이머', '실리콘 프라이머'],
        priority: 'high',
        relatedSkinMetric: 'hydration',
      },
    ],
  },
  oil: {
    warning: [
      {
        icon: '',
        category: 'base',
        title: '유분 조절 베이스 추천',
        description:
          '유분이 많은 피부예요. 매트 타입 베이스와 세팅 파우더로 유분을 잡아주면 좋아요.',
        recommendedTypes: ['매트 파운데이션', '세미매트 쿠션', '오일프리 파운데이션'],
        avoidTypes: ['글로우 쿠션', '오일 기반 파운데이션'],
        priority: 'high',
        relatedSkinMetric: 'oil',
      },
      {
        icon: '',
        category: 'powder',
        title: '세팅 파우더 사용',
        description: 'T존에 세팅 파우더를 사용하면 유분 번들거림을 방지할 수 있어요.',
        recommendedTypes: ['루스 파우더', '블러링 파우더', '유분 흡착 파우더'],
        avoidTypes: ['시머 파우더', '하이라이터 파우더'],
        priority: 'medium',
        relatedSkinMetric: 'oil',
      },
    ],
  },
  trouble: {
    warning: [
      {
        icon: '',
        category: 'concealer',
        title: '고커버 컨실러 추천',
        description:
          '트러블이 있으시네요. 커버력 높은 컨실러로 부분적으로 커버하고, 논코메도제닉 제품을 선택해주세요.',
        recommendedTypes: ['풀커버 컨실러', '논코메도제닉 컨실러', '그린 컬러 코렉터'],
        avoidTypes: ['코메도제닉 오일 함유 제품'],
        priority: 'high',
        relatedSkinMetric: 'trouble',
      },
      {
        icon: '',
        category: 'base',
        title: '저자극 베이스 선택',
        description:
          '트러블 피부에는 논코메도제닉, 저자극 베이스를 사용해주세요. 모공을 막지 않는 제품이 좋아요.',
        recommendedTypes: ['미네랄 파운데이션', '논코메도제닉 쿠션', '시카 베이스'],
        avoidTypes: ['두꺼운 크림 파운데이션', '실리콘 함량 높은 제품'],
        priority: 'high',
        relatedSkinMetric: 'trouble',
      },
    ],
  },
  wrinkles: {
    warning: [
      {
        icon: '',
        category: 'primer',
        title: '안티에이징 프라이머',
        description:
          '주름이 있는 부위에 안티에이징 프라이머를 사용하면 잔주름이 덜 부각되어 보여요.',
        recommendedTypes: ['필링 프라이머', '안티에이징 프라이머', '블러링 프라이머'],
        avoidTypes: ['매트 프라이머 (건조함 유발)'],
        priority: 'medium',
        relatedSkinMetric: 'wrinkles',
      },
      {
        icon: '',
        category: 'base',
        title: '새틴 마감 베이스',
        description:
          '매트 마감은 주름을 더 부각시킬 수 있어요. 새틴이나 세미글로우 마감의 베이스를 추천해요.',
        recommendedTypes: ['새틴 파운데이션', '세미글로우 쿠션', '라이트 커버 베이스'],
        avoidTypes: ['풀매트 파운데이션', '헤비 파우더'],
        priority: 'medium',
        relatedSkinMetric: 'wrinkles',
      },
    ],
  },
  pores: {
    warning: [
      {
        icon: '',
        category: 'primer',
        title: '포어 미니마이징 프라이머',
        description: '모공이 넓어요. 포어 블러링 프라이머로 모공을 메워주면 베이스가 매끄러워져요.',
        recommendedTypes: ['포어 미니마이징 프라이머', '실리콘 프라이머'],
        avoidTypes: ['글로우 프라이머 (모공 부각)'],
        priority: 'medium',
        relatedSkinMetric: 'pores',
      },
    ],
  },
  pigmentation: {
    warning: [
      {
        icon: '',
        category: 'concealer',
        title: '컬러 코렉팅 추천',
        description:
          '색소침착이 있으시네요. 피치/오렌지 컬러 코렉터로 다크서클과 기미를 보정할 수 있어요.',
        recommendedTypes: ['피치 컬러 코렉터', '오렌지 컬러 코렉터', '브라이트닝 컨실러'],
        avoidTypes: ['너무 밝은 컨실러 (잿빛 표현)'],
        priority: 'medium',
        relatedSkinMetric: 'pigmentation',
      },
    ],
  },
};

// 피부 타입별 베이스 종합 추천
const BASE_RECOMMENDATIONS: Record<string, BaseRecommendation> = {
  dry: {
    skinType: '건성',
    finishType: 'dewy',
    coverageLevel: 'medium',
    keyIngredients: ['히알루론산', '글리세린', '세라마이드', '스쿠알란'],
    avoidIngredients: ['알코올', '살리실산'],
    message: '건성 피부에는 글로우/듀이 마감의 수분 베이스가 잘 어울려요.',
  },
  oily: {
    skinType: '지성',
    finishType: 'matte',
    coverageLevel: 'medium',
    keyIngredients: ['나이아신아마이드', '살리실산', '징크'],
    avoidIngredients: ['미네랄 오일', '코코넛 오일'],
    message: '지성 피부에는 매트 마감의 오일프리 베이스가 좋아요.',
  },
  sensitive: {
    skinType: '민감성',
    finishType: 'satin',
    coverageLevel: 'light',
    keyIngredients: ['시카', '알로에', '센텔라', '판테놀'],
    avoidIngredients: ['향료', '에센셜 오일', '알코올'],
    message: '민감성 피부에는 무향 저자극 미네랄 베이스를 추천해요.',
  },
  combination: {
    skinType: '복합성',
    finishType: 'semi-matte',
    coverageLevel: 'medium',
    keyIngredients: ['나이아신아마이드', '히알루론산'],
    avoidIngredients: ['코메도제닉 오일'],
    message: '복합성 피부에는 T존은 매트, 볼은 보습인 세미매트 마감을 추천해요.',
  },
  normal: {
    skinType: '중성',
    finishType: 'satin',
    coverageLevel: 'light',
    keyIngredients: ['히알루론산', '비타민E'],
    avoidIngredients: [],
    message: '중성 피부에는 새틴 마감의 가벼운 베이스가 잘 어울려요.',
  },
};

/**
 * 피부 타입 추론 (S-1 지표 기반)
 */
function inferSkinType(
  skinSummary: SkinSummaryForMakeup
): 'dry' | 'oily' | 'sensitive' | 'combination' | 'normal' {
  if (skinSummary.trouble === 'warning') return 'sensitive';
  if (skinSummary.hydration === 'warning' && skinSummary.oil === 'warning') return 'combination';
  if (skinSummary.hydration === 'warning') return 'dry';
  if (skinSummary.oil === 'warning') return 'oily';
  return 'normal';
}

/**
 * 피부 분석 결과를 기반으로 메이크업 인사이트 생성
 */
export function getMakeupSkinInsight(skinSummary: SkinSummaryForMakeup | null): MakeupSkinInsight {
  if (!skinSummary) {
    return {
      hasAnalysis: false,
      adjustments: [],
      baseRecommendation: null,
      summaryMessage: 'S-1 피부 분석을 완료하면 피부 타입에 맞는 메이크업 추천을 받을 수 있어요!',
    };
  }

  const adjustments: MakeupAdjustment[] = [];
  const skinMetricKeys = ['hydration', 'oil', 'trouble', 'wrinkles', 'pores', 'pigmentation'];

  // 피부 지표별 메이크업 조정 수집
  for (const key of skinMetricKeys) {
    const status = skinSummary[key as keyof SkinSummaryForMakeup];
    if (status === 'warning') {
      const adjustmentList = SKIN_MAKEUP_ADJUSTMENTS[key]?.warning;
      if (adjustmentList) {
        adjustments.push(...adjustmentList);
      }
    }
  }

  // 우선순위별 정렬
  adjustments.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // 최대 4개까지 표시
  const topAdjustments = adjustments.slice(0, 4);

  // 베이스 메이크업 종합 추천
  const skinType = inferSkinType(skinSummary);
  const baseRecommendation = BASE_RECOMMENDATIONS[skinType] ?? null;

  // 요약 메시지 생성
  const warningCount = Object.values(skinSummary).filter((s) => s === 'warning').length;
  let summaryMessage: string;

  if (warningCount >= 3) {
    summaryMessage = `${baseRecommendation?.skinType ?? ''} 피부를 위한 메이크업 가이드를 준비했어요. 피부 케어와 메이크업을 함께 고려해 보세요.`;
  } else if (warningCount >= 1) {
    summaryMessage = `${baseRecommendation?.skinType ?? ''} 피부에 맞는 메이크업 팁을 확인해보세요.`;
  } else {
    summaryMessage = '피부 상태가 좋아요! 어떤 메이크업이든 잘 어울릴 거예요.';
  }

  return {
    hasAnalysis: true,
    adjustments: topAdjustments,
    baseRecommendation,
    summaryMessage,
  };
}

/**
 * S-1 분석 결과를 SkinSummaryForMakeup으로 변환
 */
export function convertSkinToMakeupSummary(
  skinMetrics: Array<{ id: string; status: MetricStatus }>
): SkinSummaryForMakeup {
  const metricsById = skinMetrics.reduce(
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
    trouble: metricsById.trouble ?? 'normal',
    pigmentation: metricsById.pigmentation ?? 'normal',
  };
}

// 상수 내보내기 (테스트용)
export { SKIN_MAKEUP_ADJUSTMENTS, BASE_RECOMMENDATIONS };
