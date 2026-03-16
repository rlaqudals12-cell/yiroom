/**
 * 쿠폰/프로모션 Service
 * @description 프로모션 조회, 쿠폰 발급/적용/사용 처리
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { productLogger } from '@/lib/utils/logger';
import crypto from 'crypto';

// ================================================
// 타입 정의
// ================================================

export type PromotionType = 'percentage_off' | 'fixed_off' | 'free_shipping';

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  promotionType: PromotionType;
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number | null;
  partnerName: string | null;
  category: string | null;
  startsAt: string;
  expiresAt: string;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
}

export interface UserCoupon {
  id: string;
  clerkUserId: string;
  promotionId: string;
  couponCode: string;
  isUsed: boolean;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  promotion?: Promotion;
}

export interface CouponApplyResult {
  valid: boolean;
  discount: number;
  originalAmount: number;
  finalAmount: number;
  message: string;
  couponId?: string;
}

// DB row 타입
interface PromotionRow {
  id: string;
  title: string;
  description: string | null;
  promotion_type: string;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  partner_name: string | null;
  category: string | null;
  starts_at: string;
  expires_at: string;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
}

interface UserCouponRow {
  id: string;
  clerk_user_id: string;
  promotion_id: string;
  coupon_code: string;
  is_used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

// 기본 배송비 (무료 배송 할인 시 사용)
const DEFAULT_SHIPPING_FEE = 3000;

// ================================================
// 읽기 함수
// ================================================

/**
 * 활성 프로모션 목록 조회
 * RLS 정책에 의해 활성 + 유효기간 내 프로모션만 반환
 */
export async function getActivePromotions(supabase: SupabaseClient): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from('promotions')
    .select(
      'id, title, description, promotion_type, discount_value, min_purchase_amount, max_discount_amount, partner_name, category, starts_at, expires_at, max_uses, current_uses, is_active'
    )
    .order('created_at', { ascending: false });

  if (error) {
    productLogger.error('쿠폰 활성 프로모션 조회 실패:', error);
    return [];
  }

  return (data as PromotionRow[]).map(mapPromotionRow);
}

/**
 * 사용자 쿠폰 목록 조회 (프로모션 정보 포함)
 */
export async function getUserCoupons(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<UserCoupon[]> {
  const { data, error } = await supabase
    .from('user_coupons')
    .select(
      'id, clerk_user_id, promotion_id, coupon_code, is_used, used_at, expires_at, created_at'
    )
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false });

  if (error) {
    productLogger.error('쿠폰 사용자 쿠폰 조회 실패:', error);
    return [];
  }

  const coupons = (data as UserCouponRow[]).map(mapUserCouponRow);

  // 프로모션 정보 병합
  if (coupons.length > 0) {
    const promotionIds = [...new Set(coupons.map((c) => c.promotionId))];
    const { data: promoData } = await supabase
      .from('promotions')
      .select(
        'id, title, description, promotion_type, discount_value, min_purchase_amount, max_discount_amount, partner_name, category, starts_at, expires_at, max_uses, current_uses, is_active'
      )
      .in('id', promotionIds);

    if (promoData) {
      const promoMap = new Map<string, Promotion>();
      for (const row of promoData as PromotionRow[]) {
        promoMap.set(row.id, mapPromotionRow(row));
      }
      for (const coupon of coupons) {
        coupon.promotion = promoMap.get(coupon.promotionId);
      }
    }
  }

  return coupons;
}

/**
 * 적용 가능 프로모션 필터
 * 파트너, 카테고리, 금액 조건에 맞는 프로모션 반환
 */
export async function getApplicablePromotions(
  supabase: SupabaseClient,
  partnerName?: string,
  category?: string,
  amount?: number
): Promise<Promotion[]> {
  const promotions = await getActivePromotions(supabase);

  return promotions.filter((promo) => {
    // 파트너 필터: 프로모션에 파트너가 지정된 경우 일치해야 함
    if (promo.partnerName !== null && partnerName && promo.partnerName !== partnerName) {
      return false;
    }

    // 카테고리 필터: 프로모션에 카테고리가 지정된 경우 일치해야 함
    if (promo.category !== null && category && promo.category !== category) {
      return false;
    }

    // 금액 필터: 최소 구매금액 이상이어야 함
    if (amount !== undefined && promo.minPurchaseAmount > 0 && amount < promo.minPurchaseAmount) {
      return false;
    }

    // 사용 횟수 제한 확인
    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      return false;
    }

    return true;
  });
}

// ================================================
// 쓰기 함수 (인증 필요)
// ================================================

/**
 * 쿠폰 발급
 * 프로모션 ID에 대해 고유 쿠폰 코드를 생성하여 발급
 */
export async function issueCoupon(
  supabase: SupabaseClient,
  clerkUserId: string,
  promotionId: string
): Promise<UserCoupon | null> {
  // 프로모션 유효성 확인 (service role 또는 RLS 통과된 클라이언트)
  const { data: promoData, error: promoError } = await supabase
    .from('promotions')
    .select('id, expires_at, max_uses, current_uses, is_active')
    .eq('id', promotionId)
    .single();

  if (promoError || !promoData) {
    productLogger.error('쿠폰 프로모션 조회 실패:', promoError);
    return null;
  }

  // 활성 여부 확인
  if (!promoData.is_active) {
    productLogger.warn('쿠폰 비활성 프로모션에 발급 시도:', promotionId);
    return null;
  }

  // 사용 횟수 제한 확인
  if (promoData.max_uses !== null && promoData.current_uses >= promoData.max_uses) {
    productLogger.warn('쿠폰 소진된 프로모션:', promotionId);
    return null;
  }

  // 쿠폰 코드 생성
  const couponCode = generateCouponCode();

  const { data, error } = await supabase
    .from('user_coupons')
    .insert({
      clerk_user_id: clerkUserId,
      promotion_id: promotionId,
      coupon_code: couponCode,
      expires_at: promoData.expires_at,
    })
    .select()
    .single();

  if (error) {
    productLogger.error('쿠폰 발급 실패:', error);
    return null;
  }

  // 프로모션 사용 횟수 증가
  await supabase
    .from('promotions')
    .update({ current_uses: (promoData.current_uses ?? 0) + 1 })
    .eq('id', promotionId);

  return mapUserCouponRow(data as UserCouponRow);
}

/**
 * 쿠폰 적용 (검증 + 할인 계산)
 * 쿠폰 코드를 검증하고 할인 금액을 계산
 */
export async function applyCoupon(
  supabase: SupabaseClient,
  couponCode: string,
  orderAmount: number,
  partnerName?: string,
  category?: string
): Promise<CouponApplyResult> {
  const invalidResult = (message: string): CouponApplyResult => ({
    valid: false,
    discount: 0,
    originalAmount: orderAmount,
    finalAmount: orderAmount,
    message,
  });

  // 쿠폰 조회
  const { data: couponData, error: couponError } = await supabase
    .from('user_coupons')
    .select(
      'id, clerk_user_id, promotion_id, coupon_code, is_used, used_at, expires_at, created_at'
    )
    .eq('coupon_code', couponCode)
    .single();

  if (couponError || !couponData) {
    return invalidResult('유효하지 않은 쿠폰 코드예요.');
  }

  const coupon = couponData as UserCouponRow;

  // 이미 사용된 쿠폰
  if (coupon.is_used) {
    return invalidResult('이미 사용된 쿠폰이에요.');
  }

  // 만료 확인
  if (new Date(coupon.expires_at) < new Date()) {
    return invalidResult('만료된 쿠폰이에요.');
  }

  // 프로모션 정보 조회
  const { data: promoData, error: promoError } = await supabase
    .from('promotions')
    .select(
      'id, title, description, promotion_type, discount_value, min_purchase_amount, max_discount_amount, partner_name, category, starts_at, expires_at, max_uses, current_uses, is_active'
    )
    .eq('id', coupon.promotion_id)
    .single();

  if (promoError || !promoData) {
    return invalidResult('프로모션 정보를 찾을 수 없어요.');
  }

  const promo = promoData as PromotionRow;

  // 프로모션 활성 확인
  if (!promo.is_active) {
    return invalidResult('종료된 프로모션이에요.');
  }

  // 파트너 일치 확인 (프로모션에 파트너가 지정된 경우)
  if (promo.partner_name !== null && partnerName && promo.partner_name !== partnerName) {
    return invalidResult('이 쿠폰은 해당 파트너에서 사용할 수 없어요.');
  }

  // 카테고리 일치 확인 (프로모션에 카테고리가 지정된 경우)
  if (promo.category !== null && category && promo.category !== category) {
    return invalidResult('이 쿠폰은 해당 카테고리에서 사용할 수 없어요.');
  }

  // 최소 구매금액 확인
  if (promo.min_purchase_amount > 0 && orderAmount < promo.min_purchase_amount) {
    return invalidResult(
      `최소 ${promo.min_purchase_amount.toLocaleString()}원 이상 구매 시 사용할 수 있어요.`
    );
  }

  // 할인 계산
  const discount = calculateDiscount(
    promo.promotion_type as PromotionType,
    promo.discount_value,
    orderAmount,
    promo.max_discount_amount
  );

  const finalAmount = Math.max(0, orderAmount - discount);

  return {
    valid: true,
    discount,
    originalAmount: orderAmount,
    finalAmount,
    message: '쿠폰이 적용되었어요!',
    couponId: coupon.id,
  };
}

/**
 * 쿠폰 사용 처리
 * 결제 완료 후 쿠폰을 사용 처리
 */
export async function useCoupon(supabase: SupabaseClient, couponId: string): Promise<void> {
  const { error } = await supabase
    .from('user_coupons')
    .update({
      is_used: true,
      used_at: new Date().toISOString(),
    })
    .eq('id', couponId);

  if (error) {
    productLogger.error('쿠폰 사용 처리 실패:', error);
    throw new Error('쿠폰 사용 처리에 실패했습니다.');
  }
}

// ================================================
// 유틸리티 함수
// ================================================

/**
 * 쿠폰 코드 생성 (8자 대문자 영숫자)
 */
export function generateCouponCode(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

/**
 * 할인 금액 계산
 * @param type 프로모션 타입
 * @param discountValue 할인 값
 * @param orderAmount 주문 금액
 * @param maxDiscountAmount 최대 할인 금액 (percentage_off용)
 */
export function calculateDiscount(
  type: PromotionType,
  discountValue: number,
  orderAmount: number,
  maxDiscountAmount: number | null
): number {
  switch (type) {
    case 'percentage_off': {
      let discount = orderAmount * (discountValue / 100);
      // 최대 할인 금액 적용
      if (maxDiscountAmount !== null && discount > maxDiscountAmount) {
        discount = maxDiscountAmount;
      }
      return Math.round(discount);
    }
    case 'fixed_off':
      return Math.min(discountValue, orderAmount);
    case 'free_shipping':
      return DEFAULT_SHIPPING_FEE;
    default:
      return 0;
  }
}

/**
 * 프로모션 할인 텍스트 생성
 */
export function getDiscountText(promotion: Promotion): string {
  switch (promotion.promotionType) {
    case 'percentage_off':
      return `${promotion.discountValue}% 할인`;
    case 'fixed_off':
      return `${promotion.discountValue.toLocaleString()}원 할인`;
    case 'free_shipping':
      return '무료 배송';
    default:
      return '';
  }
}

// ================================================
// 매핑 함수 (내부용)
// ================================================

function mapPromotionRow(row: PromotionRow): Promotion {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    promotionType: row.promotion_type as PromotionType,
    discountValue: row.discount_value,
    minPurchaseAmount: row.min_purchase_amount,
    maxDiscountAmount: row.max_discount_amount,
    partnerName: row.partner_name,
    category: row.category,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    currentUses: row.current_uses,
    isActive: row.is_active,
  };
}

function mapUserCouponRow(row: UserCouponRow): UserCoupon {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    promotionId: row.promotion_id,
    couponCode: row.coupon_code,
    isUsed: row.is_used,
    usedAt: row.used_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
