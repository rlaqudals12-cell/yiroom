'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CouponCard } from './CouponCard';
import { Ticket } from 'lucide-react';
import type { Promotion, UserCoupon } from '@/lib/products/services/coupons';

interface CouponListProps {
  /** 활성 프로모션 목록 */
  promotions: Promotion[];
  /** 사용자 쿠폰 목록 */
  userCoupons: UserCoupon[];
  /** 쿠폰 받기 핸들러 */
  onClaim?: (promotionId: string) => void;
  /** 발급 로딩 중인 프로모션 ID */
  claimingId?: string;
  /** 추가 클래스 */
  className?: string;
}

type CouponTab = 'available' | 'used' | 'expired';

export function CouponList({
  promotions,
  userCoupons,
  onClaim,
  claimingId,
  className,
}: CouponListProps) {
  const [activeTab, setActiveTab] = useState<CouponTab>('available');

  // 사용자 쿠폰을 프로모션 ID별로 매핑
  const couponByPromoId = useMemo(() => {
    const map = new Map<string, UserCoupon>();
    for (const coupon of userCoupons) {
      map.set(coupon.promotionId, coupon);
    }
    return map;
  }, [userCoupons]);

  // 탭별 필터링
  const nowTimestamp = useMemo(() => Date.now(), []);

  // 사용 가능: 미사용 + 미만료
  const availableCoupons = useMemo(
    () => userCoupons.filter((c) => !c.isUsed && new Date(c.expiresAt).getTime() > nowTimestamp),
    [userCoupons, nowTimestamp]
  );

  // 사용 완료
  const usedCoupons = useMemo(() => userCoupons.filter((c) => c.isUsed), [userCoupons]);

  // 만료
  const expiredCoupons = useMemo(
    () => userCoupons.filter((c) => !c.isUsed && new Date(c.expiresAt).getTime() <= nowTimestamp),
    [userCoupons, nowTimestamp]
  );

  // 미발급 프로모션 (쿠폰을 받지 않은 프로모션)
  const unclaimedPromotions = useMemo(
    () => promotions.filter((p) => !couponByPromoId.has(p.id)),
    [promotions, couponByPromoId]
  );

  return (
    <div data-testid="coupon-list" className={cn('w-full', className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CouponTab)}>
        <TabsList className="w-full">
          <TabsTrigger value="available" className="flex-1">
            사용 가능 ({availableCoupons.length + unclaimedPromotions.length})
          </TabsTrigger>
          <TabsTrigger value="used" className="flex-1">
            사용 완료 ({usedCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex-1">
            만료 ({expiredCoupons.length})
          </TabsTrigger>
        </TabsList>

        {/* 사용 가능 탭 */}
        <TabsContent value="available" className="mt-4 space-y-3">
          {/* 미발급 프로모션 */}
          {unclaimedPromotions.map((promo) => (
            <CouponCard
              key={promo.id}
              promotion={promo}
              onClaim={onClaim}
              isLoading={claimingId === promo.id}
            />
          ))}

          {/* 발급된 사용 가능 쿠폰 */}
          {availableCoupons.map((coupon) => {
            const promo = coupon.promotion;
            if (!promo) return null;
            return <CouponCard key={coupon.id} promotion={promo} userCoupon={coupon} />;
          })}

          {/* 빈 상태 */}
          {availableCoupons.length === 0 && unclaimedPromotions.length === 0 && (
            <EmptyState message="사용 가능한 쿠폰이 없어요." />
          )}
        </TabsContent>

        {/* 사용 완료 탭 */}
        <TabsContent value="used" className="mt-4 space-y-3">
          {usedCoupons.map((coupon) => {
            const promo = coupon.promotion;
            if (!promo) return null;
            return <CouponCard key={coupon.id} promotion={promo} userCoupon={coupon} />;
          })}

          {usedCoupons.length === 0 && <EmptyState message="사용한 쿠폰이 없어요." />}
        </TabsContent>

        {/* 만료 탭 */}
        <TabsContent value="expired" className="mt-4 space-y-3">
          {expiredCoupons.map((coupon) => {
            const promo = coupon.promotion;
            if (!promo) return null;
            return <CouponCard key={coupon.id} promotion={promo} userCoupon={coupon} />;
          })}

          {expiredCoupons.length === 0 && <EmptyState message="만료된 쿠폰이 없어요." />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 빈 상태 컴포넌트
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Ticket className="h-12 w-12 text-gray-300 dark:text-gray-600" />
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
