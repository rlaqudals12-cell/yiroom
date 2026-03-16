/**
 * M-1 + S-1 피부타입 고려 메이크업 인사이트 (모바일)
 *
 * 피부 상태에 따른 메이크업 제품 추천 조정
 * - 건성 → 보습형 베이스, 크림 타입
 * - 지성 → 매트형 베이스, 파우더 타입
 * - 트러블 → 커버력 높은 컨실러, 논코메도제닉
 * - 민감성 → 저자극 성분, 미네랄 베이스
 */

/** 피부 메트릭 상태 */
export type MetricStatus = 'good' | 'moderate' | 'poor';

/** 피부 분석 요약 (S-1에서 전달) */
export interface SkinSummaryForMakeup {
  hydration: MetricStatus;
  oil: MetricStatus;
  pores: MetricStatus;
  wrinkles: MetricStatus;
  trouble: MetricStatus;
  pigmentation: MetricStatus;
}

/** 메이크업 카테고리 */
export type MakeupCategory = 'base' | 'primer' | 'concealer' | 'powder' | 'lip' | 'eye';

/** 메이크업 추천 조정 */
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

/** 베이스 메이크업 종합 추천 */
export interface BaseRecommendation {
  skinType: string;
  finishType: 'dewy' | 'satin' | 'matte' | 'semi-matte';
  coverageLevel: 'light' | 'medium' | 'full';
  keyIngredients: string[];
  avoidIngredients: string[];
  message: string;
}

/** 메이크업 스킨 인사이트 결과 */
export interface MakeupSkinInsight {
  hasAnalysis: boolean;
  adjustments: MakeupAdjustment[];
  baseRecommendation: BaseRecommendation | null;
  summaryMessage: string;
}

/**
 * 피부 분석 기반 메이크업 인사이트 생성
 */
export function generateMakeupSkinInsight(
  skinSummary: SkinSummaryForMakeup | null
): MakeupSkinInsight {
  if (!skinSummary) {
    return {
      hasAnalysis: false,
      adjustments: [],
      baseRecommendation: null,
      summaryMessage: '피부 분석을 먼저 진행하면 맞춤 메이크업 추천을 받을 수 있어요.',
    };
  }

  const adjustments: MakeupAdjustment[] = [];

  // 수분 부족 → 보습형 베이스
  if (skinSummary.hydration === 'poor') {
    adjustments.push({
      icon: '💧',
      category: 'base',
      title: '보습형 베이스 추천',
      description: '건조한 피부에 수분감 있는 베이스가 좋아요.',
      recommendedTypes: ['쿠션', '수분 파운데이션', '글로우 프라이머'],
      avoidTypes: ['매트 파운데이션', '파우더 타입'],
      priority: 'high',
      relatedSkinMetric: 'hydration',
    });
  }

  // 유분 과다 → 매트형 베이스
  if (skinSummary.oil === 'poor') {
    adjustments.push({
      icon: '✨',
      category: 'base',
      title: '매트형 베이스 추천',
      description: '유분이 많은 피부에 매트한 마감이 좋아요.',
      recommendedTypes: ['매트 파운데이션', '세팅 파우더', '프라이머'],
      avoidTypes: ['글로우 타입', '오일 베이스'],
      priority: 'high',
      relatedSkinMetric: 'oil',
    });
  }

  // 모공 → 포어 프라이머
  if (skinSummary.pores === 'poor') {
    adjustments.push({
      icon: '🔍',
      category: 'primer',
      title: '모공 커버 프라이머',
      description: '모공이 눈에 띄면 블러링 프라이머가 도움이 돼요.',
      recommendedTypes: ['실리콘 프라이머', '블러링 프라이머'],
      avoidTypes: ['글로우 프라이머'],
      priority: 'medium',
      relatedSkinMetric: 'pores',
    });
  }

  // 트러블 → 높은 커버력 + 논코메도제닉
  if (skinSummary.trouble === 'poor') {
    adjustments.push({
      icon: '🛡️',
      category: 'concealer',
      title: '트러블 커버 컨실러',
      description: '트러블 부위에 높은 커버력의 컨실러를 추천해요.',
      recommendedTypes: ['풀커버 컨실러', '논코메도제닉'],
      avoidTypes: ['유분 많은 제품'],
      priority: 'high',
      relatedSkinMetric: 'trouble',
    });
  }

  // 색소침착 → 컬러 컨실러
  if (skinSummary.pigmentation === 'poor') {
    adjustments.push({
      icon: '🎨',
      category: 'concealer',
      title: '컬러 보정 컨실러',
      description: '색소침착에 그린/피치 컬러 보정이 효과적이에요.',
      recommendedTypes: ['컬러 컨실러 (그린/피치)', '브라이트닝 베이스'],
      avoidTypes: [],
      priority: 'medium',
      relatedSkinMetric: 'pigmentation',
    });
  }

  // 주름 → 안티에이징 프라이머
  if (skinSummary.wrinkles === 'poor') {
    adjustments.push({
      icon: '🌸',
      category: 'primer',
      title: '안티에이징 프라이머',
      description: '주름 부위를 매끄럽게 채워주는 프라이머가 좋아요.',
      recommendedTypes: ['필링 프라이머', '안티에이징 프라이머'],
      avoidTypes: ['매트 파우더 (주름 강조)'],
      priority: 'medium',
      relatedSkinMetric: 'wrinkles',
    });
  }

  // 베이스 추천 종합
  const baseRecommendation = generateBaseRecommendation(skinSummary);

  const summaryMessage =
    adjustments.length > 0
      ? `피부 상태를 고려한 ${adjustments.length}가지 메이크업 조정을 추천해요.`
      : '현재 피부 상태가 양호해서 원하는 메이크업을 자유롭게 사용해도 좋아요.';

  return {
    hasAnalysis: true,
    adjustments,
    baseRecommendation,
    summaryMessage,
  };
}

/** 베이스 메이크업 종합 추천 */
function generateBaseRecommendation(skin: SkinSummaryForMakeup): BaseRecommendation {
  const isDry = skin.hydration === 'poor';
  const isOily = skin.oil === 'poor';
  const hasTrouble = skin.trouble === 'poor';

  let skinType = '복합성';
  let finishType: BaseRecommendation['finishType'] = 'satin';
  let coverageLevel: BaseRecommendation['coverageLevel'] = 'medium';
  const keyIngredients: string[] = [];
  const avoidIngredients: string[] = [];

  if (isDry && !isOily) {
    skinType = '건성';
    finishType = 'dewy';
    keyIngredients.push('히알루론산', '세라마이드', '글리세린');
    avoidIngredients.push('알코올', '탈크');
  } else if (isOily && !isDry) {
    skinType = '지성';
    finishType = 'matte';
    keyIngredients.push('나이아신아마이드', '살리실산', '실리카');
    avoidIngredients.push('미네랄 오일', '코코넛 오일');
  } else if (isDry && isOily) {
    skinType = '복합성';
    finishType = 'semi-matte';
    keyIngredients.push('히알루론산', '나이아신아마이드');
  }

  if (hasTrouble) {
    coverageLevel = 'full';
    keyIngredients.push('티트리', '센텔라');
    avoidIngredients.push('향료', '인공 색소');
  }

  const message = `${skinType} 피부에 ${
    finishType === 'dewy'
      ? '촉촉한'
      : finishType === 'matte'
        ? '매트한'
        : finishType === 'semi-matte'
          ? '세미매트한'
          : '새틴'
  } ${coverageLevel === 'full' ? '풀커버' : coverageLevel === 'medium' ? '중간' : '가벼운'} 베이스를 추천해요.`;

  return { skinType, finishType, coverageLevel, keyIngredients, avoidIngredients, message };
}
