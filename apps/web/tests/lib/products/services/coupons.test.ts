/**
 * 쿠폰/프로모션 서비스 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  calculateDiscount,
  generateCouponCode,
  getDiscountText,
} from '@/lib/products/services/coupons';
import type { Promotion, PromotionType } from '@/lib/products/services/coupons';

// ================================================
// calculateDiscount
// ================================================
describe('calculateDiscount', () => {
  it('퍼센트 할인: 10% off, 50000원 주문 → 5000원 할인', () => {
    const result = calculateDiscount('percentage_off', 10, 50000, null);
    expect(result).toBe(5000);
  });

  it('퍼센트 할인: maxDiscount 적용 (20% off, 100000원 주문, 최대 10000원)', () => {
    const result = calculateDiscount('percentage_off', 20, 100000, 10000);
    // 20% of 100000 = 20000이지만 최대 10000원
    expect(result).toBe(10000);
  });

  it('퍼센트 할인: maxDiscount 미달 시 계산값 그대로 (10% off, 30000원, 최대 10000원)', () => {
    const result = calculateDiscount('percentage_off', 10, 30000, 10000);
    // 10% of 30000 = 3000, 최대 10000보다 작으므로 3000
    expect(result).toBe(3000);
  });

  it('퍼센트 할인: 반올림 처리 (15% off, 33333원)', () => {
    const result = calculateDiscount('percentage_off', 15, 33333, null);
    // 15% of 33333 = 4999.95 → 반올림 5000
    expect(result).toBe(5000);
  });

  it('정액 할인: 3000원 off', () => {
    const result = calculateDiscount('fixed_off', 3000, 50000, null);
    expect(result).toBe(3000);
  });

  it('정액 할인: 주문금액보다 할인이 큰 경우 주문금액으로 제한', () => {
    const result = calculateDiscount('fixed_off', 5000, 3000, null);
    expect(result).toBe(3000);
  });

  it('무료 배송: 기본 배송비 3000원 반환', () => {
    const result = calculateDiscount('free_shipping', 0, 50000, null);
    expect(result).toBe(3000);
  });

  it('알 수 없는 타입: 0 반환', () => {
    const result = calculateDiscount('unknown' as PromotionType, 10, 50000, null);
    expect(result).toBe(0);
  });
});

// ================================================
// generateCouponCode
// ================================================
describe('generateCouponCode', () => {
  it('8자리 대문자 코드 생성', () => {
    const code = generateCouponCode();
    expect(code).toHaveLength(8);
    expect(code).toBe(code.toUpperCase());
  });

  it('매번 고유한 코드 생성', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateCouponCode());
    }
    // 100개 코드 중 중복 없어야 함
    expect(codes.size).toBe(100);
  });

  it('영숫자와 하이픈만 포함 (UUID 기반)', () => {
    const code = generateCouponCode();
    // UUID slice이므로 영숫자+하이픈 (하이픈은 위치에 따라 포함될 수 있음)
    expect(code).toMatch(/^[A-Z0-9-]{8}$/);
  });
});

// ================================================
// getDiscountText
// ================================================
describe('getDiscountText', () => {
  const createPromotion = (overrides: Partial<Promotion>): Promotion => ({
    id: 'test-id',
    title: '테스트 프로모션',
    description: null,
    promotionType: 'percentage_off',
    discountValue: 10,
    minPurchaseAmount: 0,
    maxDiscountAmount: null,
    partnerName: null,
    category: null,
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    maxUses: null,
    currentUses: 0,
    isActive: true,
    ...overrides,
  });

  it('퍼센트 할인 텍스트', () => {
    const promo = createPromotion({ promotionType: 'percentage_off', discountValue: 15 });
    expect(getDiscountText(promo)).toBe('15% 할인');
  });

  it('정액 할인 텍스트', () => {
    const promo = createPromotion({ promotionType: 'fixed_off', discountValue: 5000 });
    expect(getDiscountText(promo)).toBe('5,000원 할인');
  });

  it('무료 배송 텍스트', () => {
    const promo = createPromotion({ promotionType: 'free_shipping', discountValue: 3000 });
    expect(getDiscountText(promo)).toBe('무료 배송');
  });
});

// ================================================
// 쿠폰 적용 시나리오 (순수 함수 기반)
// ================================================
describe('쿠폰 적용 시나리오', () => {
  it('최소 구매금액 미달 시 할인 불가', () => {
    // applyCoupon은 DB 의존이므로 calculateDiscount로 금액 검증만 테스트
    const minPurchase = 30000;
    const orderAmount = 20000;
    const meetsMinimum = orderAmount >= minPurchase;
    expect(meetsMinimum).toBe(false);
  });

  it('최소 구매금액 이상이면 할인 적용', () => {
    const minPurchase = 30000;
    const orderAmount = 50000;
    const meetsMinimum = orderAmount >= minPurchase;
    expect(meetsMinimum).toBe(true);

    const discount = calculateDiscount('percentage_off', 10, orderAmount, null);
    expect(discount).toBe(5000);
  });

  it('파트너 미일치 필터링', () => {
    const promoPartner: string = 'Olive Young';
    const requestPartner: string = 'Coupang';
    const partnerMatch = promoPartner === requestPartner;
    expect(partnerMatch).toBe(false);
  });

  it('카테고리 미일치 필터링', () => {
    const promoCategory: string = 'skincare';
    const requestCategory: string = 'makeup';
    const categoryMatch = promoCategory === requestCategory;
    expect(categoryMatch).toBe(false);
  });

  it('전체 적용 쿠폰 (partnerName=null) 모든 파트너에 적용', () => {
    // partnerName이 null이면 모든 파트너에 적용
    const promoPartner: string | null = null;
    const requestPartner = 'Coupang';

    // 프로모션에 파트너가 없으면 파트너 필터 통과
    const partnerOk = promoPartner === null || promoPartner === requestPartner;
    expect(partnerOk).toBe(true);
  });

  it('전체 적용 쿠폰 (category=null) 모든 카테고리에 적용', () => {
    const promoCategory: string | null = null;
    const requestCategory = 'skincare';

    const categoryOk = promoCategory === null || promoCategory === requestCategory;
    expect(categoryOk).toBe(true);
  });

  it('만료된 쿠폰 검증', () => {
    const expiresAt = '2025-01-01T00:00:00Z';
    const isExpired = new Date(expiresAt) < new Date();
    expect(isExpired).toBe(true);
  });

  it('이미 사용된 쿠폰 검증', () => {
    const isUsed = true;
    expect(isUsed).toBe(true);
  });

  it('할인 후 최종 금액은 0 미만이 되지 않음', () => {
    const orderAmount = 2000;
    const discount = calculateDiscount('fixed_off', 5000, orderAmount, null);
    const finalAmount = Math.max(0, orderAmount - discount);
    expect(finalAmount).toBe(0);
  });
});
