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
  RoutineSuggestionInsight,
} from './types';
import {
  calculatePriorityScore,
  scoreToPriority,
  sortByPriorityScore,
  filterByMinScore,
} from './scoring';
import { selectText, selectByKey, classifyByRange } from '@/lib/utils/conditional-helpers';

// ============================================
// 한글 라벨 매핑
// ============================================

const SEASON_LABELS: Record<string, string> = {
  spring: '봄 웜톤',
  Spring: '봄 웜톤',
  summer: '여름 쿨톤',
  Summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  Autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
  Winter: '겨울 쿨톤',
};

const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  sensitive: '민감성',
  normal: '중성',
};

const BODY_TYPE_LABELS: Record<string, string> = {
  hourglass: '모래시계형',
  pear: '서양배형',
  apple: '사과형',
  rectangle: '직사각형',
  inverted_triangle: '역삼각형',
};

const HAIR_TYPE_LABELS: Record<string, string> = {
  straight: '직모',
  wavy: '웨이브',
  curly: '곱슬',
  coily: '강한 곱슬',
};

function seasonLabel(season: string): string {
  return SEASON_LABELS[season] ?? season;
}

function skinTypeLabel(skinType: string): string {
  return SKIN_TYPE_LABELS[skinType] ?? skinType;
}

function bodyTypeLabel(bodyType: string): string {
  return BODY_TYPE_LABELS[bodyType] ?? bodyType;
}

function hairTypeLabel(hairType: string): string {
  return HAIR_TYPE_LABELS[hairType] ?? hairType;
}

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
      ? `${seasonLabel(personalColor.season)}의 ${skinTypeLabel(skin.skinType)} 피부에 맞는 베이스 메이크업을 추천해요`
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
      ? `${seasonLabel(personalColor.season)}의 ${bodyTypeLabel(body.bodyType)} 체형에 어울리는 스타일을 확인해보세요`
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
      ? `${seasonLabel(personalColor.season)}에 어울리는 헤어컬러와 ${hairTypeLabel(hair.hairType)} 모발 관리법을 확인해보세요`
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
    reason:
      language === 'ko'
        ? '퍼스널컬러 + 모발 상태 기반'
        : 'Based on personal color + hair condition',
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
  const relatedModules: AnalysisModule[] = ['oral_health'];
  const priorityScore = calculatePriorityScore({
    category: 'health_alert',
    relatedModules,
    confidence: 80,
    dataBundle: data,
  });

  // 심각도에 따라 점수 조정
  const adjustedScore = isUrgent ? Math.min(100, priorityScore + 20) : priorityScore;

  // 긴급도에 따른 텍스트 키 결정
  const urgencyKey = isUrgent ? 'urgent' : 'normal';

  const title = selectText(language, {
    ko: selectByKey(
      urgencyKey,
      { urgent: '구강 건강 주의 필요', normal: '구강 건강 관리 팁' },
      '구강 건강 관리 팁'
    )!,
    en: selectByKey(
      urgencyKey,
      { urgent: 'Oral Health Attention Required', normal: 'Oral Health Care Tips' },
      'Oral Health Care Tips'
    )!,
  });

  const description = selectText(language, {
    ko: selectByKey(
      urgencyKey,
      {
        urgent: '잇몸 상태 확인이 필요해요. 치과 방문을 권장합니다.',
        normal: '꾸준한 관리로 건강한 구강을 유지하세요',
      },
      '꾸준한 관리로 건강한 구강을 유지하세요'
    )!,
    en: selectByKey(
      urgencyKey,
      {
        urgent: 'Gum condition needs attention. Dental visit recommended.',
        normal: 'Maintain healthy oral care with regular routine',
      },
      'Maintain healthy oral care with regular routine'
    )!,
  });

  // 심각도 분류: 염증 점수 범위 기반 (60+ urgent, 30+ warning, 나머지 info)
  const severity = classifyByRange(
    inflammationScore,
    [
      { min: 60, result: 'urgent' as const },
      { min: 30, result: 'warning' as const },
      { result: 'info' as const },
    ],
    'info' as const
  )!;

  const recommendedAction = selectText(language, {
    ko: selectByKey(
      urgencyKey,
      { urgent: '치과 방문 권장', normal: '정기 검진 권장' },
      '정기 검진 권장'
    )!,
    en: selectByKey(
      urgencyKey,
      { urgent: 'Dental visit recommended', normal: 'Regular checkup recommended' },
      'Regular checkup recommended'
    )!,
  });

  return {
    id: generateInsightId(),
    category: 'health_alert',
    title,
    description,
    relatedModules,
    priority: scoreToPriority(adjustedScore),
    priorityScore: adjustedScore,
    createdAt: nowISO(),
    severity,
    recommendedAction,
  };
}

/**
 * 루틴 제안 인사이트 생성 (시간대 기반)
 */
function generateRoutineSuggestionInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): RoutineSuggestionInsight | null {
  const { skin } = data;
  if (!skin) return null;

  const hour = new Date().getHours();
  let routineType: 'morning' | 'evening' | 'weekly';
  if (hour >= 6 && hour < 14) {
    routineType = 'morning';
  } else if (hour >= 14 && hour < 22) {
    routineType = 'evening';
  } else {
    routineType = 'weekly';
  }

  const relatedModules: AnalysisModule[] = ['skin'];
  const priorityScore = calculatePriorityScore({
    category: 'routine_suggestion',
    relatedModules,
    confidence: 70,
    dataBundle: data,
  });

  const routineTexts: Record<
    string,
    { title: { ko: string; en: string }; desc: { ko: string; en: string }; steps: string[] }
  > = {
    morning: {
      title: { ko: '오늘의 모닝 루틴', en: "Today's Morning Routine" },
      desc: {
        ko: `${skinTypeLabel(skin.skinType)} 피부를 위한 아침 케어 루틴이에요`,
        en: `Morning care routine for ${skin.skinType} skin`,
      },
      steps: ['세안', '토너', '세럼', '수분크림', '자외선 차단'],
    },
    evening: {
      title: { ko: '저녁 스킨케어 루틴', en: 'Evening Skincare Routine' },
      desc: {
        ko: '하루의 피로를 풀어주는 나이트 케어를 시작해요',
        en: 'Start your night care to relax after the day',
      },
      steps: ['클렌징', '토너', '에센스', '아이크림', '나이트크림'],
    },
    weekly: {
      title: { ko: '주간 스페셜 케어', en: 'Weekly Special Care' },
      desc: {
        ko: '이번 주 특별 케어로 피부에 활력을 더해요',
        en: 'Add vitality to your skin with special care this week',
      },
      steps: ['각질 제거', '딥클렌징', '시트 마스크'],
    },
  };

  const texts = routineTexts[routineType];

  return {
    id: generateInsightId(),
    category: 'routine_suggestion',
    title: language === 'ko' ? texts.title.ko : texts.title.en,
    description: language === 'ko' ? texts.desc.ko : texts.desc.en,
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    routineType,
    steps: texts.steps,
  };
}

/**
 * 스트레스-피부 연관 인사이트 생성
 */
function generateStressSkinInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): SkinCareInsight | null {
  const { skin } = data;
  if (!skin || !skin.sensitivityLevel || skin.sensitivityLevel < 40) return null;

  const relatedModules: AnalysisModule[] = ['skin'];
  const priorityScore = calculatePriorityScore({
    category: 'skin_care',
    relatedModules,
    confidence: 70,
    dataBundle: data,
  });

  return {
    id: generateInsightId(),
    category: 'skin_care',
    title: language === 'ko' ? '스트레스와 피부 상태' : 'Stress and Skin Condition',
    description:
      language === 'ko'
        ? '민감도가 높아졌어요. 저자극 제품과 충분한 수면으로 피부 장벽을 회복해보세요'
        : 'Sensitivity is elevated. Try gentle products and sufficient sleep to restore skin barrier',
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    skinConcerns: ['sensitivity', 'stress'],
  };
}

/**
 * 운동-피부 연관 인사이트 생성
 */
function generateExerciseSkinInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): SynergyInsight | null {
  const { skin, body } = data;
  if (!skin || !body) return null;

  const relatedModules: AnalysisModule[] = ['skin', 'body'];
  const priorityScore = calculatePriorityScore({
    category: 'synergy',
    relatedModules,
    confidence: 75,
    dataBundle: data,
  });

  return {
    id: generateInsightId(),
    category: 'synergy',
    title: language === 'ko' ? '운동과 피부 건강의 연결' : 'Connection Between Exercise and Skin',
    description:
      language === 'ko'
        ? '규칙적인 운동은 혈액 순환을 촉진해 피부 톤을 밝게 해요'
        : 'Regular exercise promotes blood circulation and brightens skin tone',
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    synergyEffect:
      language === 'ko'
        ? '운동 → 혈액순환 → 피부 톤 개선'
        : 'Exercise → Circulation → Skin tone improvement',
    synergyScore: 65,
  };
}

// 환절기 메시지 헬퍼
function getSeasonalDescription(language: 'ko' | 'en', isSpringSeason: boolean): string {
  if (language === 'ko') {
    return isSpringSeason
      ? '봄 환절기에는 수분 공급과 자외선 차단에 더 신경 써주세요'
      : '가을 환절기에는 보습 강화와 피부 장벽 케어가 중요해요';
  }
  return isSpringSeason
    ? 'In spring transition, focus more on hydration and sun protection'
    : 'In fall transition, strengthening moisture and skin barrier care is important';
}

/**
 * 계절 변화 피부 알림 인사이트
 */
function generateSeasonalSkinInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): SkinCareInsight | null {
  const { skin } = data;
  if (!skin) return null;

  const month = new Date().getMonth();
  // 환절기 (3-4월, 9-10월)만 생성
  const isTransition = [2, 3, 8, 9].includes(month);
  if (!isTransition) return null;

  const relatedModules: AnalysisModule[] = ['skin'];
  const priorityScore = calculatePriorityScore({
    category: 'skin_care',
    relatedModules,
    confidence: 80,
    dataBundle: data,
  });

  const isSpringSeason = month <= 4;

  return {
    id: generateInsightId(),
    category: 'skin_care',
    title: language === 'ko' ? '환절기 피부 관리' : 'Seasonal Skin Care',
    description: getSeasonalDescription(language, isSpringSeason),
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    skinConcerns: isSpringSeason ? ['dryness', 'uv'] : ['dryness', 'barrier'],
  };
}

/**
 * 헤어-피부 통합 인사이트
 */
function generateHairSkinInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): SynergyInsight | null {
  const { hair, skin } = data;
  if (!hair || !skin) return null;

  const relatedModules: AnalysisModule[] = ['hair', 'skin'];
  const priorityScore = calculatePriorityScore({
    category: 'synergy',
    relatedModules,
    confidence: 70,
    dataBundle: data,
  });

  return {
    id: generateInsightId(),
    category: 'synergy',
    title: language === 'ko' ? '두피와 피부 건강의 연관성' : 'Scalp and Skin Health Connection',
    description:
      language === 'ko'
        ? `${hairTypeLabel(hair.hairType)} 모발과 ${skinTypeLabel(skin.skinType)} 피부에 맞는 통합 케어를 확인해보세요`
        : `Check integrated care for ${hair.hairType} hair and ${skin.skinType} skin`,
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    synergyEffect:
      language === 'ko' ? '두피 건강이 피부 상태에 영향' : 'Scalp health affects skin condition',
    synergyScore: 55,
  };
}

/**
 * 미완료 분석 유도 인사이트
 */
function generateIncompleteAnalysisInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): ProductRecommendationInsight | null {
  // 모듈 상태를 데이터 기반으로 분류
  const moduleChecks: Array<{
    key: keyof AnalysisDataBundle;
    module: AnalysisModule;
    ko: string;
    en: string;
  }> = [
    { key: 'personalColor', module: 'personal_color', ko: '퍼스널컬러', en: 'Personal Color' },
    { key: 'skin', module: 'skin', ko: '피부', en: 'Skin' },
    { key: 'body', module: 'body', ko: '체형', en: 'Body' },
    { key: 'hair', module: 'hair', ko: '헤어', en: 'Hair' },
  ];

  const completedModules: AnalysisModule[] = [];
  const missingModules: string[] = [];

  for (const check of moduleChecks) {
    if (data[check.key]) {
      completedModules.push(check.module);
    } else {
      missingModules.push(language === 'ko' ? check.ko : check.en);
    }
  }

  // 1~4개 완료된 상태에서만 (전부 완료 또는 0개면 미표시)
  if (completedModules.length === 0 || missingModules.length === 0) return null;

  const priorityScore = calculatePriorityScore({
    category: 'product_recommendation',
    relatedModules: completedModules,
    confidence: 60,
    dataBundle: data,
  });

  const nextModule = missingModules[0];

  return {
    id: generateInsightId(),
    category: 'product_recommendation',
    title: language === 'ko' ? '더 정확한 추천을 위해' : 'For More Accurate Recommendations',
    description:
      language === 'ko'
        ? `${nextModule} 분석을 추가하면 맞춤 추천이 더 정확해져요`
        : `Adding ${nextModule} analysis will make personalized recommendations more accurate`,
    relatedModules: completedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    productCategory: 'cross_module',
    reason:
      language === 'ko'
        ? `${missingModules.length}개 모듈 미완료`
        : `${missingModules.length} modules incomplete`,
  };
}

/**
 * 체형-컬러 조합 스타일 인사이트
 */
function generateBodyColorStyleInsight(
  data: AnalysisDataBundle,
  language: 'ko' | 'en'
): StyleTipInsight | null {
  const { personalColor, body } = data;
  if (!personalColor || !body) return null;

  // generateStyleBodyInsight와 차별화: 실루엣 추천 포함
  const relatedModules: AnalysisModule[] = ['personal_color', 'body'];
  const priorityScore = calculatePriorityScore({
    category: 'style_tip',
    relatedModules,
    confidence: personalColor.confidence,
    dataBundle: data,
  });

  const silhouettes: Record<string, string[]> = {
    hourglass: ['핏앤플레어', 'A라인'],
    pear: ['오프숄더', '와이드팬츠'],
    apple: ['엠파이어 라인', 'V넥'],
    rectangle: ['벨트 코디', '레이어드'],
    inverted_triangle: ['부츠컷', '풀스커트'],
  };

  const recommended = silhouettes[body.bodyType] ?? ['베이직 핏'];

  return {
    id: generateInsightId(),
    category: 'style_tip',
    title: language === 'ko' ? '오늘의 스타일링 팁' : "Today's Styling Tip",
    description:
      language === 'ko'
        ? `${bodyTypeLabel(body.bodyType)} 체형에 ${seasonLabel(personalColor.season)} 컬러를 조합한 스타일링을 추천해요`
        : `We recommend styling that combines ${body.bodyType} body type with ${personalColor.season} colors`,
    relatedModules,
    priority: scoreToPriority(priorityScore),
    priorityScore,
    createdAt: nowISO(),
    bodyType: body.bodyType,
    recommendedSilhouettes: recommended,
  };
}

/**
 * 종합 통합 분석 인사이트 생성
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

  // 3개 이상 모듈이 있어야 의미 있음
  if (completedModules.length < 3) return null;

  const priorityScore = calculatePriorityScore({
    category: 'synergy',
    relatedModules: completedModules,
    confidence: 85,
    dataBundle: data,
  });

  const synergyScore = Math.round((completedModules.length / 6) * 100);

  const title =
    language === 'ko'
      ? `${completedModules.length}개 분석 통합 효과!`
      : `${completedModules.length} Analysis Combined Effect!`;

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

  // 모든 인사이트 생성 (6종 기존 + 7종 신규 = 13종)
  const allInsights: (Insight | null)[] = [
    generateColorSkinInsight(dataBundle, language),
    generateStyleBodyInsight(dataBundle, language),
    generateSkinCareInsight(dataBundle, language),
    generateHairColorInsight(dataBundle, language),
    generateOralHealthInsight(dataBundle, language),
    generateSynergyInsight(dataBundle, language),
    // 신규 인사이트 패턴
    generateRoutineSuggestionInsight(dataBundle, language),
    generateStressSkinInsight(dataBundle, language),
    generateExerciseSkinInsight(dataBundle, language),
    generateSeasonalSkinInsight(dataBundle, language),
    generateHairSkinInsight(dataBundle, language),
    generateIncompleteAnalysisInsight(dataBundle, language),
    generateBodyColorStyleInsight(dataBundle, language),
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
