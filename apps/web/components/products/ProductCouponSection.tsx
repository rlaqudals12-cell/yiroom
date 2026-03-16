'use client';

/**
 * 제품 상세 페이지용 쿠폰 배너 래퍼
 * - 활성 프로모션 + 사용자 쿠폰 조회 후 CouponBanner에 전달
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { CouponBanner } from '@/components/products/coupons/CouponBanner';
import {
  getActivePromotions,
  getUserCoupons,
  issueCoupon,
  type Promotion,
  type UserCoupon,
} from '@/lib/products/services/coupons';

export function ProductCouponSection(): React.JSX.Element | null {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [claimingId, setClaimingId] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const loadCouponData = async (): Promise<void> => {
      try {
        const promos = await getActivePromotions(supabase);
        setPromotions(promos);

        if (user?.id) {
          const coupons = await getUserCoupons(supabase, user.id);
          setUserCoupons(coupons);
        }
      } catch (error) {
        console.error('[ProductCouponSection] Failed to load coupons:', error);
      } finally {
        setLoaded(true);
      }
    };

    loadCouponData();
  }, [isLoaded, user?.id, supabase]);

  const handleClaim = useCallback(
    async (promotionId: string) => {
      if (!user?.id) return;
      setClaimingId(promotionId);
      try {
        const result = await issueCoupon(supabase, user.id, promotionId);
        if (result) {
          setUserCoupons((prev) => [...prev, result]);
        }
      } catch (error) {
        console.error('[ProductCouponSection] Claim failed:', error);
      } finally {
        setClaimingId(undefined);
      }
    },
    [user?.id, supabase]
  );

  // 로딩 전 또는 프로모션 없으면 숨김
  if (!loaded || promotions.length === 0) return null;

  const availableCount = userCoupons.filter((c) => !c.isUsed).length;

  return (
    <div data-testid="product-coupon-section">
      <CouponBanner
        promotions={promotions}
        userCoupons={userCoupons}
        availableCount={availableCount}
        onClaim={handleClaim}
        claimingId={claimingId}
      />
    </div>
  );
}
