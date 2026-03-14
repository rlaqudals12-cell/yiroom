/**
 * 어필리에이트 커미션 규칙
 * @description 카테고리별 커미션율 및 계산 로직
 */

import type { AffiliatePartnerName } from '@/types/affiliate';

// ============================================
// 커미션율 설정
// ============================================

/** 카테고리별 커미션율 (%) */
export const COMMISSION_RATES: Record<string, number> = {
  // 뷰티/스킨케어 (고마진)
  skincare: 7,
  makeup: 7,
  haircare: 6,
  fragrance: 8,

  // 건강/영양 (중마진)
  supplement: 5,
  health_food: 5,
  protein: 4,

  // 패션/의류 (중마진)
  fashion: 5,
  accessories: 6,

  // 운동/장비 (저마진)
  equipment: 3,
  sportswear: 4,

  // 기본
  default: 4,
};

/** 파트너별 최소 커미션 (KRW) */
export const MIN_COMMISSION_KRW: Record<string, number> = {
  coupang: 100,
  iherb: 200,
  musinsa: 150,
  default: 100,
};

/** 파트너별 최대 커미션 (KRW) */
export const MAX_COMMISSION_KRW: Record<string, number> = {
  coupang: 50_000,
  iherb: 100_000,
  musinsa: 30_000,
  default: 50_000,
};

// ============================================
// 커미션 계산
// ============================================

export interface CommissionResult {
  /** 계산된 커미션 (KRW) */
  commissionKrw: number;
  /** 적용된 커미션율 (%) */
  ratePercent: number;
  /** 사용된 카테고리 */
  category: string;
  /** 클램핑 적용 여부 */
  clamped: boolean;
}

/**
 * 커미션 계산
 */
export function calculateCommission(
  saleAmountKrw: number,
  category: string,
  partner: AffiliatePartnerName
): CommissionResult {
  // 카테고리별 커미션율 조회
  const normalizedCategory = category.toLowerCase().replace(/[^a-z_]/g, '');
  const ratePercent = COMMISSION_RATES[normalizedCategory] ?? COMMISSION_RATES.default;

  // 기본 커미션 계산
  let commissionKrw = Math.round(saleAmountKrw * (ratePercent / 100));

  // 최소/최대 클램핑
  const minCommission = MIN_COMMISSION_KRW[partner] ?? MIN_COMMISSION_KRW.default;
  const maxCommission = MAX_COMMISSION_KRW[partner] ?? MAX_COMMISSION_KRW.default;

  let clamped = false;
  if (commissionKrw < minCommission && saleAmountKrw > 0) {
    commissionKrw = minCommission;
    clamped = true;
  }
  if (commissionKrw > maxCommission) {
    commissionKrw = maxCommission;
    clamped = true;
  }

  return {
    commissionKrw,
    ratePercent,
    category: normalizedCategory,
    clamped,
  };
}

/**
 * 카테고리 추론 (제품명/브랜드 기반)
 */
export function inferCategory(productName: string, brand?: string): string {
  const text = `${productName} ${brand || ''}`.toLowerCase();

  // 뷰티/스킨케어
  if (/세럼|크림|로션|토너|클렌저|선크림|마스크팩|앰플|에센스|스킨/.test(text)) {
    return 'skincare';
  }
  if (/립|아이섀도|파운데이션|블러셔|마스카라|컨실러|프라이머/.test(text)) {
    return 'makeup';
  }
  if (/샴푸|린스|트리트먼트|헤어오일|두피|탈모/.test(text)) {
    return 'haircare';
  }
  if (/향수|퍼퓸|오드뚜왈렛|바디미스트/.test(text)) {
    return 'fragrance';
  }

  // 건강/영양
  if (/비타민|오메가|유산균|프로바이오|영양제|철분|아연|마그네슘/.test(text)) {
    return 'supplement';
  }
  if (/프로틴|단백질|bcaa|크레아틴|웨이/.test(text)) {
    return 'protein';
  }
  if (/견과|그래놀라|시리얼|건강식/.test(text)) {
    return 'health_food';
  }

  // 패션
  if (/티셔츠|바지|자켓|코트|원피스|셔츠|니트/.test(text)) {
    return 'fashion';
  }
  if (/가방|지갑|벨트|모자|스카프|선글라스|시계/.test(text)) {
    return 'accessories';
  }

  // 운동
  if (/덤벨|매트|폼롤러|밴드|케틀벨|바벨/.test(text)) {
    return 'equipment';
  }
  if (/레깅스|운동복|런닝화|트레이닝/.test(text)) {
    return 'sportswear';
  }

  return 'default';
}

/**
 * 커미션율 조회 (관리자 대시보드용)
 */
export function getCommissionRateTable(): Array<{
  category: string;
  ratePercent: number;
}> {
  return Object.entries(COMMISSION_RATES).map(([category, ratePercent]) => ({
    category,
    ratePercent,
  }));
}
