/**
 * 구강 제품 추천 엔진
 *
 * @module lib/oral-health/product-recommender
 * @description 구강 프로필 기반 맞춤 제품 추천
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import type {
  UserOralProfile,
  ProductPreferences,
  OralProductRecommendation,
  InterdentalRecommendation,
  ToothColorResult,
  GumHealthResult,
} from '@/types/oral-health';

/**
 * 치약 추천 데이터베이스
 */
const TOOTHPASTE_DATABASE = [
  {
    name: '시린이 전용 치약',
    brand: '센소다인',
    keyIngredients: ['질산칼륨', '불소'],
    targetConditions: ['sensitivity'],
    priceLevel: 'mid' as const,
    isNatural: false,
  },
  {
    name: '잇몸 케어 치약',
    brand: '페리오',
    keyIngredients: ['토코페롤', '알란토인', '불소'],
    targetConditions: ['gingivitis'],
    priceLevel: 'low' as const,
    isNatural: false,
  },
  {
    name: '미백 치약',
    brand: '클로즈업',
    keyIngredients: ['과산화수소', '실리카'],
    targetConditions: ['whitening'],
    priceLevel: 'low' as const,
    isNatural: false,
  },
  {
    name: '충치 예방 치약',
    brand: '2080',
    keyIngredients: ['불소 1450ppm', '자일리톨'],
    targetConditions: ['cavityRisk'],
    priceLevel: 'low' as const,
    isNatural: false,
  },
  {
    name: '치석 케어 치약',
    brand: '죽염',
    keyIngredients: ['피로인산나트륨', '불소'],
    targetConditions: ['calculus'],
    priceLevel: 'mid' as const,
    isNatural: false,
  },
  {
    name: '천연 허브 치약',
    brand: '닥터노아',
    keyIngredients: ['티트리 오일', '페퍼민트', '녹차 추출물'],
    targetConditions: ['halitosis'],
    priceLevel: 'high' as const,
    isNatural: true,
  },
  {
    name: '교정용 치약',
    brand: '오르토',
    keyIngredients: ['불소', 'CPC', '알란토인'],
    targetConditions: ['braces'],
    priceLevel: 'mid' as const,
    isNatural: false,
  },
  {
    name: '임플란트 전용 치약',
    brand: '임플란',
    keyIngredients: ['히알루론산', '알로에', '불소'],
    targetConditions: ['implant'],
    priceLevel: 'high' as const,
    isNatural: false,
  },
];

/**
 * 구강 청결제 추천 데이터베이스
 */
const MOUTHWASH_DATABASE = [
  {
    name: '리스테린 쿨민트',
    brand: '리스테린',
    keyIngredients: ['유칼립톨', '멘톨', '티몰', '살리실산메틸'],
    targetConditions: ['halitosis', 'gingivitis'],
    priceLevel: 'low' as const,
    isNatural: false,
    alcoholFree: false,
  },
  {
    name: '가그린 무알콜',
    brand: '가그린',
    keyIngredients: ['CPC', '자일리톨'],
    targetConditions: ['sensitivity', 'cavityRisk'],
    priceLevel: 'low' as const,
    isNatural: false,
    alcoholFree: true,
  },
  {
    name: '페리오 가글',
    brand: '페리오',
    keyIngredients: ['CPC', '불소'],
    targetConditions: ['gingivitis'],
    priceLevel: 'mid' as const,
    isNatural: false,
    alcoholFree: true,
  },
  {
    name: '오라틴 가글',
    brand: '오라틴',
    keyIngredients: ['락토페린', '라이소자임'],
    targetConditions: ['sensitivity'],
    priceLevel: 'high' as const,
    isNatural: true,
    alcoholFree: true,
  },
];

/**
 * 사용자 상태에서 타겟 조건 추출
 */
function extractTargetConditions(
  profile: UserOralProfile,
  toothResult?: ToothColorResult,
  gumResult?: GumHealthResult
): string[] {
  const conditions: string[] = [];

  // 민감도
  if (profile.sensitivity === 'mild' || profile.sensitivity === 'severe') {
    conditions.push('sensitivity');
  }

  // 잇몸 건강
  if (profile.gumHealth === 'gingivitis' || profile.gumHealth === 'periodontitis') {
    conditions.push('gingivitis');
  }

  // 충치 위험
  if (profile.cavityRisk === 'medium' || profile.cavityRisk === 'high') {
    conditions.push('cavityRisk');
  }

  // 치석
  if (profile.calculus === 'mild' || profile.calculus === 'heavy') {
    conditions.push('calculus');
  }

  // 구취
  if (profile.halitosis) {
    conditions.push('halitosis');
  }

  // 치과 시술
  if (profile.dentalWork.includes('braces')) {
    conditions.push('braces');
  }
  if (profile.dentalWork.includes('implant')) {
    conditions.push('implant');
  }

  // 분석 결과 기반
  if (toothResult && toothResult.interpretation.brightness === 'dark') {
    conditions.push('whitening');
  }

  if (gumResult && gumResult.healthStatus !== 'healthy') {
    conditions.push('gingivitis');
  }

  return [...new Set(conditions)];
}

/**
 * 치약 매칭 점수 계산
 */
function calculateToothpasteScore(
  toothpaste: typeof TOOTHPASTE_DATABASE[0],
  conditions: string[],
  preferences: ProductPreferences
): number {
  let score = 50; // 기본 점수

  // 조건 매칭
  const matchingConditions = toothpaste.targetConditions.filter(c =>
    conditions.includes(c)
  );
  score += matchingConditions.length * 20;

  // 가격대 매칭
  if (toothpaste.priceLevel === preferences.budgetLevel) {
    score += 10;
  }

  // 천연 선호
  if (preferences.preferNatural && toothpaste.isNatural) {
    score += 15;
  }

  return Math.min(100, score);
}

/**
 * 구강 청결제 매칭 점수 계산
 */
function calculateMouthwashScore(
  mouthwash: typeof MOUTHWASH_DATABASE[0],
  conditions: string[],
  preferences: ProductPreferences
): number {
  let score = 50;

  // 조건 매칭
  const matchingConditions = mouthwash.targetConditions.filter(c =>
    conditions.includes(c)
  );
  score += matchingConditions.length * 20;

  // 가격대 매칭
  if (mouthwash.priceLevel === preferences.budgetLevel) {
    score += 10;
  }

  // 무알콜 선호
  if (preferences.alcoholFree && mouthwash.alcoholFree) {
    score += 15;
  } else if (preferences.alcoholFree && !mouthwash.alcoholFree) {
    score -= 30; // 알콜 포함 시 큰 감점
  }

  // 천연 선호
  if (preferences.preferNatural && mouthwash.isNatural) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * 치간 청소 도구 추천
 */
function recommendInterdental(profile: UserOralProfile): InterdentalRecommendation {
  const primary: InterdentalRecommendation['primary'] = [];
  const alternative: InterdentalRecommendation['alternative'] = [];

  // 교정 중인 경우
  if (profile.dentalWork.includes('braces')) {
    primary.push({
      type: 'superfloss',
      reason: '교정 장치 사이 청소에 적합합니다.',
    });
    primary.push({
      type: 'interdental_brush',
      reason: '교정 와이어 주변 플라크 제거에 효과적입니다.',
    });
    alternative.push({
      type: 'water_flosser',
      reason: '물살로 부드럽게 청소할 수 있습니다.',
    });
  }
  // 브릿지/크라운
  else if (profile.dentalWork.includes('bridge') || profile.dentalWork.includes('crown')) {
    primary.push({
      type: 'superfloss',
      reason: '브릿지 하부 청소에 적합합니다.',
    });
    primary.push({
      type: 'interdental_brush',
      reason: '보철물 주변 청소에 효과적입니다.',
    });
  }
  // 임플란트
  else if (profile.dentalWork.includes('implant')) {
    primary.push({
      type: 'interdental_brush',
      reason: '임플란트 주변 청소에 가장 효과적입니다.',
    });
    primary.push({
      type: 'water_flosser',
      reason: '임플란트에 부드럽고 안전합니다.',
    });
  }
  // 민감한 잇몸
  else if (profile.sensitivity === 'severe' || profile.gumHealth === 'periodontitis') {
    primary.push({
      type: 'water_flosser',
      reason: '민감한 잇몸에 부드럽게 사용할 수 있습니다.',
    });
    primary.push({
      type: 'floss_ptfe',
      reason: 'PTFE 재질로 잇몸 자극이 적습니다.',
    });
  }
  // 일반
  else {
    primary.push({
      type: 'floss_waxed',
      reason: '일반적인 치간 청소에 적합합니다.',
    });
    if (profile.calculus !== 'none') {
      primary.push({
        type: 'interdental_brush',
        reason: '치석이 쌓이기 쉬운 부위 청소에 효과적입니다.',
      });
    }
    alternative.push({
      type: 'water_flosser',
      reason: '편리하게 치간 청소를 할 수 있습니다.',
    });
  }

  return { primary, alternative };
}

/**
 * 피해야 할 성분 결정
 */
function getAvoidIngredients(profile: UserOralProfile): string[] {
  const avoid: string[] = [];

  if (profile.sensitivity === 'severe') {
    avoid.push('SLS (소듐라우릴설페이트)');
    avoid.push('과산화수소');
  }

  if (profile.gumHealth === 'periodontitis') {
    avoid.push('강한 연마제');
    avoid.push('고농도 알콜');
  }

  return avoid;
}

/**
 * 권장 성분 결정
 */
function getKeyIngredients(profile: UserOralProfile): string[] {
  const key: string[] = [];

  if (profile.sensitivity !== 'none') {
    key.push('질산칼륨');
    key.push('인산칼슘');
  }

  if (profile.gumHealth !== 'healthy') {
    key.push('토코페롤 (비타민 E)');
    key.push('알란토인');
    key.push('CPC');
  }

  if (profile.cavityRisk !== 'low') {
    key.push('불소 1450ppm');
    key.push('자일리톨');
  }

  return key;
}

/**
 * 케어 루틴 생성
 */
function generateCareRoutine(
  profile: UserOralProfile
): OralProductRecommendation['careRoutine'] {
  const routine: OralProductRecommendation['careRoutine'] = [
    {
      step: 1,
      action: '칫솔질',
      timing: '아침, 저녁 식후 30분',
      duration: '2-3분',
    },
    {
      step: 2,
      action: '치간 청소',
      timing: '저녁 칫솔질 전',
      duration: '1-2분',
    },
    {
      step: 3,
      action: '구강 청결제 가글',
      timing: '칫솔질 후',
      duration: '30초-1분',
    },
  ];

  // 특수 케어 추가
  if (profile.gumHealth !== 'healthy') {
    routine.push({
      step: 4,
      action: '잇몸 마사지',
      timing: '아침, 저녁',
      duration: '1분',
    });
  }

  if (profile.dentalWork.includes('braces')) {
    routine.splice(1, 0, {
      step: 2,
      action: '교정 전용 브러시로 장치 주변 청소',
      timing: '매 식후',
      duration: '1-2분',
    });
    // 스텝 번호 재조정
    routine.forEach((step, index) => {
      step.step = index + 1;
    });
  }

  return routine;
}

/**
 * 구강 제품 추천
 *
 * @param profile - 사용자 구강 프로필
 * @param preferences - 제품 선호도
 * @param toothResult - 치아 색상 분석 결과 (선택)
 * @param gumResult - 잇몸 건강 분석 결과 (선택)
 * @returns 맞춤 제품 추천
 */
export function recommendOralProducts(
  profile: UserOralProfile,
  preferences: ProductPreferences,
  toothResult?: ToothColorResult,
  gumResult?: GumHealthResult
): OralProductRecommendation {
  const conditions = extractTargetConditions(profile, toothResult, gumResult);

  // 치약 추천
  const toothpasteScores = TOOTHPASTE_DATABASE.map(tp => ({
    ...tp,
    matchScore: calculateToothpasteScore(tp, conditions, preferences),
    reason: getToothpasteReason(tp, conditions),
  }));

  const sortedToothpaste = toothpasteScores
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // 구강 청결제 추천
  const mouthwashScores = MOUTHWASH_DATABASE.map(mw => ({
    ...mw,
    matchScore: calculateMouthwashScore(mw, conditions, preferences),
    reason: getMouthwashReason(mw, conditions, preferences),
  }));

  const sortedMouthwash = mouthwashScores
    .filter(mw => mw.matchScore >= 40) // 최소 점수 이상만
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // 치간 청소 추천
  const interdental = recommendInterdental(profile);

  // 액세서리 추천
  const accessories = getAccessories(profile);

  return {
    toothpaste: sortedToothpaste.map(tp => ({
      name: tp.name,
      brand: tp.brand,
      keyIngredients: tp.keyIngredients,
      matchScore: tp.matchScore,
      reason: tp.reason,
    })),
    mouthwash: sortedMouthwash.map(mw => ({
      name: mw.name,
      brand: mw.brand,
      keyIngredients: mw.keyIngredients,
      matchScore: mw.matchScore,
      reason: mw.reason,
    })),
    interdental,
    accessories,
    avoidIngredients: getAvoidIngredients(profile),
    keyIngredients: getKeyIngredients(profile),
    careRoutine: generateCareRoutine(profile),
  };
}

/**
 * 치약 추천 이유 생성
 */
function getToothpasteReason(
  toothpaste: typeof TOOTHPASTE_DATABASE[0],
  conditions: string[]
): string {
  const matches = toothpaste.targetConditions.filter(c => conditions.includes(c));

  if (matches.length === 0) {
    return '일반적인 구강 관리에 적합합니다.';
  }

  const reasonMap: Record<string, string> = {
    sensitivity: '시린 이에 효과적입니다.',
    gingivitis: '잇몸 건강 개선에 도움이 됩니다.',
    whitening: '치아 미백에 효과적입니다.',
    cavityRisk: '충치 예방에 효과적입니다.',
    calculus: '치석 형성을 억제합니다.',
    halitosis: '구취 제거에 효과적입니다.',
    braces: '교정 중 구강 관리에 적합합니다.',
    implant: '임플란트 주변 관리에 적합합니다.',
  };

  const reasons = matches.map(m => reasonMap[m]).filter(Boolean);
  return reasons.join(' ') || '귀하의 구강 상태에 적합합니다.';
}

/**
 * 구강 청결제 추천 이유 생성
 */
function getMouthwashReason(
  mouthwash: typeof MOUTHWASH_DATABASE[0],
  conditions: string[],
  preferences: ProductPreferences
): string {
  const parts: string[] = [];

  if (preferences.alcoholFree && mouthwash.alcoholFree) {
    parts.push('무알콜로 자극이 적습니다.');
  }

  const matches = mouthwash.targetConditions.filter(c => conditions.includes(c));
  if (matches.includes('halitosis')) {
    parts.push('구취 제거에 효과적입니다.');
  }
  if (matches.includes('gingivitis')) {
    parts.push('잇몸 건강에 도움이 됩니다.');
  }

  return parts.length > 0 ? parts.join(' ') : '일반적인 구강 청결에 적합합니다.';
}

/**
 * 액세서리 추천
 */
function getAccessories(
  profile: UserOralProfile
): OralProductRecommendation['accessories'] {
  const accessories: OralProductRecommendation['accessories'] = [];

  // 혀 클리너
  if (profile.halitosis) {
    accessories.push({
      type: '혀 클리너',
      reason: '혀 세균 제거로 구취를 줄여줍니다.',
    });
  }

  // 치간 칫솔 홀더
  if (profile.dentalWork.length > 0) {
    accessories.push({
      type: '치간 칫솔 세트 (다양한 크기)',
      reason: '다양한 치간 간격에 맞춰 사용할 수 있습니다.',
    });
  }

  // 칫솔 살균기
  accessories.push({
    type: '칫솔 살균기',
    reason: '칫솔 위생 관리에 도움이 됩니다.',
  });

  return accessories;
}

/**
 * 구강 제품 추천 요약 텍스트 생성
 */
export function generateProductRecommendationSummary(
  recommendation: OralProductRecommendation
): string {
  const topToothpaste = recommendation.toothpaste[0];
  const topMouthwash = recommendation.mouthwash[0];

  let summary = `## 추천 제품 요약\n\n`;

  if (topToothpaste) {
    summary += `**치약**: ${topToothpaste.brand} ${topToothpaste.name}\n`;
    summary += `- ${topToothpaste.reason}\n\n`;
  }

  if (topMouthwash) {
    summary += `**구강 청결제**: ${topMouthwash.brand} ${topMouthwash.name}\n`;
    summary += `- ${topMouthwash.reason}\n\n`;
  }

  if (recommendation.interdental.primary.length > 0) {
    summary += `**치간 청소**: ${recommendation.interdental.primary[0].type}\n`;
    summary += `- ${recommendation.interdental.primary[0].reason}\n\n`;
  }

  if (recommendation.avoidIngredients.length > 0) {
    summary += `**피해야 할 성분**: ${recommendation.avoidIngredients.join(', ')}\n`;
  }

  return summary;
}
