/**
 * 계절별 제품 매칭 보정
 * @description 현재 계절에 맞는 제품에 보너스 점수 부여
 */

// ============================================
// 타입
// ============================================

export type KoreaSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonalBoostResult {
  /** 보너스 점수 (0-15) */
  bonus: number;
  /** 계절 매칭 이유 */
  reason: string | null;
  /** 현재 계절 */
  season: KoreaSeason;
}

// ============================================
// 계절 판별
// ============================================

/**
 * 한국 기준 계절 판별 (월 기반)
 */
export function getKoreaSeason(date: Date = new Date()): KoreaSeason {
  const month = date.getMonth() + 1; // 0-indexed → 1-indexed
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// ============================================
// 계절별 키워드
// ============================================

/** 계절별 추천 키워드 (제품명/카테고리에서 매칭) */
const SEASONAL_KEYWORDS: Record<KoreaSeason, string[]> = {
  spring: [
    '진정',
    '장벽',
    '알레르기',
    '미세먼지',
    '자외선',
    '선크림',
    '수분',
    '트러블',
    '민감',
    '꽃가루',
    '보호',
  ],
  summer: [
    '자외선',
    '선크림',
    'spf',
    '워터프루프',
    '쿨링',
    '시원',
    '유분',
    '모공',
    '세범',
    '클렌징',
    '각질',
    '미백',
    '땀',
    '제모',
    '바디미스트',
  ],
  autumn: [
    '보습',
    '수분',
    '영양',
    '재생',
    '안티에이징',
    '리페어',
    '크림',
    '오일',
    '세라마이드',
    '콜라겐',
    '탄력',
  ],
  winter: [
    '보습',
    '수분',
    '영양',
    '리치',
    '밤',
    '오일',
    '건조',
    '각질',
    '크림',
    '세라마이드',
    '시어버터',
    '핸드크림',
    '립밤',
    '바디크림',
  ],
};

/** 계절별 비추천 키워드 (역시즌 감점) */
const ANTI_SEASONAL_KEYWORDS: Record<KoreaSeason, string[]> = {
  spring: ['리치', '헤비'],
  summer: ['리치', '오일', '헤비', '밤'],
  autumn: ['쿨링', '워터프루프'],
  winter: ['쿨링', '시원', '워터프루프', '제모'],
};

// ============================================
// 보정 계산
// ============================================

/**
 * 제품의 계절 보정 점수 계산
 * @param productName - 제품명
 * @param productTags - 제품 태그 (선택)
 * @param now - 기준 날짜 (테스트용)
 * @returns 보너스 점수 + 이유
 */
export function calculateSeasonalBoost(
  productName: string,
  productTags?: string[],
  now?: Date
): SeasonalBoostResult {
  const season = getKoreaSeason(now);
  const text = `${productName} ${(productTags ?? []).join(' ')}`.toLowerCase();

  const positiveKeywords = SEASONAL_KEYWORDS[season];
  const negativeKeywords = ANTI_SEASONAL_KEYWORDS[season];

  // 매칭된 긍정 키워드 수
  const positiveMatches = positiveKeywords.filter((kw) => text.includes(kw));
  // 매칭된 부정 키워드 수
  const negativeMatches = negativeKeywords.filter((kw) => text.includes(kw));

  let bonus = 0;
  let reason: string | null = null;

  if (positiveMatches.length > 0) {
    // 매칭 키워드 수에 따라 5-15점
    bonus = Math.min(5 + positiveMatches.length * 5, 15);
    const seasonName = SEASON_NAMES[season];
    reason = `${seasonName} 추천 제품`;
  }

  // 역시즌 감점 (-5)
  if (negativeMatches.length > 0 && bonus > 0) {
    bonus = Math.max(bonus - 5, 0);
  }

  // 역시즌만 있고 긍정 없으면 감점 표시
  if (negativeMatches.length > 0 && positiveMatches.length === 0) {
    bonus = -5;
    const seasonName = SEASON_NAMES[season];
    reason = `${seasonName}에 비추천`;
  }

  return { bonus, reason, season };
}

const SEASON_NAMES: Record<KoreaSeason, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

// ============================================
// 계절 추천 카테고리
// ============================================

/** 계절별 추천 카테고리 우선순위 */
const SEASONAL_CATEGORIES: Record<KoreaSeason, string[]> = {
  spring: ['skincare', 'supplement'],
  summer: ['skincare', 'supplement', 'healthfood'],
  autumn: ['skincare', 'supplement'],
  winter: ['skincare', 'supplement', 'healthfood'],
};

/**
 * 현재 계절에 추천되는 카테고리인지 확인
 */
export function isSeasonalCategory(category: string, now?: Date): boolean {
  const season = getKoreaSeason(now);
  return SEASONAL_CATEGORIES[season].includes(category);
}

/**
 * 계절별 스킨케어 팁 메시지
 */
export function getSeasonalTip(now?: Date): string {
  const season = getKoreaSeason(now);
  const tips: Record<KoreaSeason, string> = {
    spring: '봄철에는 자외선 차단과 진정 케어가 중요해요. 미세먼지 클렌징도 잊지 마세요!',
    summer: '여름에는 가벼운 수분 케어와 자외선 차단이 필수예요. 유분기 조절에 신경 쓰세요.',
    autumn: '가을에는 보습 강화와 장벽 회복에 집중하세요. 건조함이 시작돼요.',
    winter: '겨울에는 리치한 보습 제품으로 피부 장벽을 보호하세요. 입술과 손도 관리해 주세요.',
  };
  return tips[season];
}
