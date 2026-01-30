/**
 * 인사이트 생성기
 *
 * @module lib/insights/generator
 * @description 분석 데이터를 기반으로 인사이트 생성
 */

import type {
  Insight,
  InsightCategory,
  AnalysisModule,
  AnalysisDataBundle,
  InsightGeneratorOptions,
  InsightGenerationResult,
  ColorMatchInsight,
  SkinCareInsight,
  StyleTipInsight,
  ProductRecommendationInsight,
  SynergyInsight,
  HealthAlertInsight,
} from './types';
import {
  calculatePriorityScore,
  scoreToPriority,
  sortByPriorityScore,
  filterByMinScore,
} from './scoring';

// ============================================
// 유틸리티
// ============================================

/**
 * 고유 ID 생성
 */
function generateInsightId(): string {
  return `insight_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 현재 시간 ISO 문자열
 */
function nowISO(): string {
  return new Date().toISOString();
}

// ============================================
// 개별 인사이트 생성 함수
// ============================================

/**
 * 컬러 매칭 인사이트 생성 (PC + Skin)
 */
function generateColorSkinInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): ColorMatchInsight | null {
  const { personalColor, skin } = data;
  if (!personalColor || !skin) return null;

  const relatedModules: AnalysisModule[] = ['personal_color', 'skin'];
  const priorityScore = calculatePriorityScore({
    category: 'color_match',
    relatedModules,
    confidence: personalColor.confidence,
    dataBundle: data,
  });

  const title =
    language === 'ko'
      ? '퍼스널컬러 + 피부 타입 맞춤 추천'
      : 'Personal Color + Skin Type Recommendations';

  const description =
    language === 'ko'
      ? `${personalColor.season} 시즌의 ${skin.skinType} 피부에 맞는 베이스 메이크업을 추천해요`
      : `We recommend base makeup for ${personalColor.season} season with ${skin.skinType} skin`;

  return {
    id: generateInsightId(),
    category: 'color_match',
    title,
    description,
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    seasonType: personalColor.season,
    recommendedColors: personalColor.colorPalette?.slice(0, 5),
  };
}

/**
 * 스타일 팁 인사이트 생성 (PC + Body)
 */
function generateStyleBodyInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): StyleTipInsight | null {
  const { personalColor, body } = data;
  if (!personalColor || !body) return null;

  const relatedModules: AnalysisModule[] = ['personal_color', 'body'];
  const priorityScore = calculatePriorityScore({
    category: 'style_tip',
    relatedModules,
    confidence: personalColor.confidence,
    dataBundle: data,
  });

  const title =
    language === 'ko' ? '컬러 + 체형 스타일링 가이드' : 'Color + Body Type Styling Guide';

  const description =
    language === 'ko'
      ? `${personalColor.season} 톤의 ${body.bodyType} 체형에 어울리는 스타일을 확인해보세요`
      : `Check out styles that suit ${personalColor.season} tone with ${body.bodyType} body type`;

  return {
    id: generateInsightId(),
    category: 'style_tip',
    title,
    description,
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    bodyType: body.bodyType,
  };
}

/**
 * 스킨케어 인사이트 생성 (Skin 단독 또는 복합)
 */
function generateSkinCareInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): SkinCareInsight | null {
  const { skin } = data;
  if (!skin) return null;

  const relatedModules: AnalysisModule[] = ['skin'];
  const priorityScore = calculatePriorityScore({
    category: 'skin_care',
    relatedModules,
    confidence: 75, // 피부 분석 기본 신뢰도
    dataBundle: data,
  });

  const title = language === 'ko' ? '맞춤 스킨케어 루틴' : 'Personalized Skincare Routine';

  // 피부 타입별 맞춤 설명
  const skinTypeDescriptions: Record<string, { ko: string; en: string }> = {
    dry: {
      ko: '건성 피부에 맞는 고보습 루틴을 추천해요',
      en: 'We recommend a high-moisture routine for dry skin',
    },
    oily: {
      ko: '지성 피부를 위한 유수분 밸런스 케어를 추천해요',
      en: 'We recommend oil-water balance care for oily skin',
    },
    combination: {
      ko: '복합성 피부를 위한 부위별 맞춤 케어를 추천해요',
      en: 'We recommend zone-specific care for combination skin',
    },
    sensitive: {
      ko: '민감 피부를 위한 저자극 루틴을 추천해요',
      en: 'We recommend a gentle routine for sensitive skin',
    },
    normal: {
      ko: '건강한 피부를 유지하는 기본 케어를 추천해요',
      en: 'We recommend basic care to maintain healthy skin',
    },
  };

  const desc = skinTypeDescriptions[skin.skinType] || skinTypeDescriptions['normal'];

  return {
    id: generateInsightId(),
    category: 'skin_care',
    title,
    description: language === 'ko' ? desc.ko : desc.en,
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    skinConcerns: skin.concerns,
  };
}

/**
 * 모발 + 퍼스널컬러 인사이트 생성
 */
function generateHairColorInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): ProductRecommendationInsight | null {
  const { personalColor, hair } = data;
  if (!personalColor || !hair) return null;

  const relatedModules: AnalysisModule[] = ['personal_color', 'hair'];
  const priorityScore = calculatePriorityScore({
    category: 'product_recommendation',
    relatedModules,
    confidence: personalColor.confidence,
    dataBundle: data,
  });

  const title =
    language === 'ko' ? '퍼스널컬러 맞춤 헤어컬러' : 'Hair Color Based on Personal Color';

  const description =
    language === 'ko'
      ? `${personalColor.season} 시즌에 어울리는 헤어컬러와 ${hair.hairType} 모발 관리법을 확인해보세요`
      : `Check hair colors for ${personalColor.season} season and care tips for ${hair.hairType} hair`;

  return {
    id: generateInsightId(),
    category: 'product_recommendation',
    title,
    description,
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    productCategory: 'hair_color',
    reason: language === 'ko' ? '퍼스널컬러 + 모발 상태 기반' : 'Based on personal color + hair condition',
  };
}

/**
 * 구강 건강 알림 인사이트 생성
 */
function generateOralHealthInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): HealthAlertInsight | null {
  const { oralHealth } = data;
  if (!oralHealth) return null;

  // 염증 점수가 높으면 높은 우선순위
  const inflammationScore = oralHealth.inflammationScore ?? 0;
  const isUrgent = inflammationScore >= 60;
  const isWarning = inflammationScore >= 30;

  const relatedModules: AnalysisModule[] = ['oral_health'];
  const priorityScore = calculatePriorityScore({
    category: 'health_alert',
    relatedModules,
    confidence: 80,
    dataBundle: data,
  });

  // 심각도에 따라 점수 조정
  const adjustedScore = isUrgent ? Math.min(100, priorityScore + 20) : priorityScore;

  const title =
    language === 'ko'
      ? isUrgent
        ? '구강 건강 주의 필요'
        : '구강 건강 관리 팁'
      : isUrgent
        ? 'Oral Health Attention Required'
        : 'Oral Health Care Tips';

  const description =
    language === 'ko'
      ? isUrgent
        ? '잇몸 상태 확인이 필요해요. 치과 방문을 권장합니다.'
        : '꾸준한 관리로 건강한 구강을 유지하세요'
      : isUrgent
        ? 'Gum condition needs attention. Dental visit recommended.'
        : 'Maintain healthy oral care with regular routine';

  return {
    id: generateInsightId(),
    category: 'health_alert',
    title,
    description,
    relatedModules,
    priority: scoreToPriority(adjustedScore),
    priorityScore: adjustedScore,
    createdAt: nowISO(),
    severity: isUrgent ? 'urgent' : isWarning ? 'warning' : 'info',
    recommendedAction:
      language === 'ko'
        ? isUrgent
          ? '치과 방문 권장'
          : '정기 검진 권장'
        : isUrgent
          ? 'Dental visit recommended'
          : 'Regular checkup recommended',
  };
}

/**
 * 종합 시너지 인사이트 생성
 */
function generateSynergyInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): SynergyInsight | null {
  const completedModules: AnalysisModule[] = [];

  if (data.personalColor) completedModules.push('personal_color');
  if (data.skin) completedModules.push('skin');
  if (data.body) completedModules.push('body');
  if (data.face) completedModules.push('face');
  if (data.hair) completedModules.push('hair');
  if (data.oralHealth) completedModules.push('oral_health');

  // 3개 이상 모듈이 있어야 시너지 의미 있음
  if (completedModules.length < 3) return null;

  const priorityScore = calculatePriorityScore({
    category: 'synergy',
    relatedModules: completedModules,
    confidence: 85,
    dataBundle: data,
  });

  const synergyScore = Math.round((completedModules.length / 6) * 100);

  const title =
    language === 'ko' ? `${completedModules.length}개 분석 시너지 달성!` : `${completedModules.length} Analysis Synergy Achieved!`;

  const description =
    language === 'ko'
      ? '여러 분석 결과를 종합한 맞춤형 추천을 받을 수 있어요'
      : 'Get personalized recommendations based on multiple analysis results';

  return {
    id: generateInsightId(),
    category: 'synergy',
    title,
    description,
    relatedModules: completedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    synergyEffect:
      language === 'ko'
        ? '통합 분석으로 더 정확한 추천 가능'
        : 'More accurate recommendations through integrated analysis',
    synergyScore,
  };
}

// ============================================
// 메인 생성 함수
// ============================================

/**
 * 인사이트 생성
 *
 * @param dataBundle - 분석 데이터 번들
 * @param options - 생성 옵션
 * @returns 인사이트 생성 결과
 *
 * @example
 * ```typescript
 * const result = generateInsights({
 *   personalColor: { season: 'spring', undertone: 'warm', confidence: 85 },
 *   skin: { skinType: 'combination' },
 * }, { maxInsights: 5 });
 * ```
 */
export function generateInsights(
  dataBundle: AnalysisDataBundle,
  options: InsightGeneratorOptions = {}
): InsightGenerationResult {
  const startTime = Date.now();

  const {
    maxInsights = 10,
    minPriorityScore = 0,
    includeCategories,
    excludeCategories,
    language = 'ko',
  } = options;

  // 모든 인사이트 생성
  const allInsights: (Insight | null)[] = [
    generateColorSkinInsight(dataBundle, language),
    generateStyleBodyInsight(dataBundle, language),
    generateSkinCareInsight(dataBundle, language),
    generateHairColorInsight(dataBundle, language),
    generateOralHealthInsight(dataBundle, language),
    generateSynergyInsight(dataBundle, language),
  ];

  // null 제거
  let insights = allInsights.filter((i): i is Insight => i !== null);

  // 카테고리 필터링
  if (includeCategories && includeCategories.length > 0) {
    insights = insights.filter((i) => includeCategories.includes(i.category));
  }

  if (excludeCategories && excludeCategories.length > 0) {
    insights = insights.filter((i) => !excludeCategories.includes(i.category));
  }

  // 최소 점수 필터링
  insights = filterByMinScore(insights, minPriorityScore);

  // 점수 기준 정렬
  insights = sortByPriorityScore(insights);

  // 최대 개수 제한
  const totalGenerated = insights.length;
  insights = insights.slice(0, maxInsights);

  // 사용된 모듈 추출
  const usedModulesSet = new Set<AnalysisModule>();
  insights.forEach((insight) => {
    insight.relatedModules.forEach((m) => usedModulesSet.add(m));
  });

  return {
    insights,
    totalGenerated,
    returnedCount: insights.length,
    usedModules: Array.from(usedModulesSet),
    generationTime: Date.now() - startTime,
  };
}

/**
 * 단일 카테고리 인사이트만 생성
 */
export function generateInsightsByCategory(
  dataBundle: AnalysisDataBundle,
  category: InsightCategory,
  language: 'ko' | 'en' = 'ko'
): Insight[] {
  const result = generateInsights(dataBundle, {
    includeCategories: [category],
    language,
  });
  return result.insights;
}

/**
 * 특정 모듈 관련 인사이트만 생성
 */
export function generateInsightsForModule(
  dataBundle: AnalysisDataBundle,
  module: AnalysisModule,
  language: 'ko' | 'en' = 'ko'
): Insight[] {
  const result = generateInsights(dataBundle, { language });
  return result.insights.filter((i) => i.relatedModules.includes(module));
}
