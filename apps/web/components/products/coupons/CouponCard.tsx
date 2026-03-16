'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Clock, Tag } from 'lucide-react';
import type { Promotion, UserCoupon } from '@/lib/products/services/coupons';
import { getDiscountText } from '@/lib/products/services/coupons';

interface CouponCardProps {
  /** 프로모션 정보 */
  promotion: Promotion;
  /** 사용자 쿠폰 (발급된 경우) */
  userCoupon?: UserCoupon;
  /** 쿠폰 받기 클릭 핸들러 */
  onClaim?: (promotionId: string) => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 추가 클래스 */
  className?: string;
}

// 쿠폰 만료까지 남은 일수 계산
function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// 금액 포맷
function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export function CouponCard({
  promotion,
  userCoupon,
  onClaim,
  isLoading = false,
  className,
}: CouponCardProps) {
  const [claimed, setClaimed] = useState(!!userCoupon);
  const daysRemaining = getDaysRemaining(promotion.expiresAt);
  const isUsed = userCoupon?.isUsed ?? false;
  const isExpired = daysRemaining === 0;
  const discountText = getDiscountText(promotion);

  const handleClaim = (): void => {
    if (!onClaim || claimed || isLoading) return;
    setClaimed(true);
    onClaim(promotion.id);
  };

  // 상태에 따른 스타일
  const isDisabled = isUsed || isExpired;

  return (
    <div
      data-testid="coupon-card"
      className={cn(
        'relative overflow-hidden rounded-xl border-2 border-dashed p-4 transition-all',
        isDisabled
          ? 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50'
          : 'border-indigo-300 bg-white hover:border-indigo-400 hover:shadow-md dark:border-indigo-600 dark:bg-gray-900',
        className
      )}
    >
      {/* 할인 배지 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {/* 할인율/금액 */}
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-indigo-500" />
            <span
              className={cn(
                'text-2xl font-bold',
                isDisabled
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-indigo-600 dark:text-indigo-400'
              )}
            >
              {discountText}
            </span>
          </div>

          {/* 제목 */}
          <h3 className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            {promotion.title}
          </h3>

          {/* 설명 */}
          {promotion.description && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {promotion.description}
            </p>
          )}

          {/* 조건 태그 */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {promotion.minPurchaseAmount > 0 && (
              <Badge variant="outline" className="text-xs">
                {formatAmount(promotion.minPurchaseAmount)}원 이상
              </Badge>
            )}
            {promotion.maxDiscountAmount !== null && (
              <Badge variant="outline" className="text-xs">
                최대 {formatAmount(promotion.maxDiscountAmount)}원
              </Badge>
            )}
            {promotion.partnerName && (
              <Badge variant="outline" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {promotion.partnerName}
              </Badge>
            )}
            {promotion.category && (
              <Badge variant="outline" className="text-xs">
                {promotion.category}
              </Badge>
            )}
          </div>

          {/* 만료일 */}
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="h-3 w-3" />
            {isExpired ? (
              <span>만료됨</span>
            ) : (
              <span>
                {daysRemaining}일 남음 ({new Date(promotion.expiresAt).toLocaleDateString('ko-KR')})
              </span>
            )}
          </div>
        </div>

        {/* 쿠폰 받기/사용 상태 버튼 */}
        <div className="flex flex-col items-center gap-1">
          <CouponStatusBadge
            isUsed={isUsed}
            isExpired={isExpired}
            claimed={claimed}
            isLoading={isLoading}
            onClaim={handleClaim}
          />

          {/* 쿠폰 코드 표시 */}
          {userCoupon && !isDisabled && (
            <span className="mt-1 font-mono text-xs text-gray-500">{userCoupon.couponCode}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// 상태에 따른 뱃지/버튼 (중첩 삼항 연산자 회피)
function CouponStatusBadge({
  isUsed,
  isExpired,
  claimed,
  isLoading,
  onClaim,
}: {
  isUsed: boolean;
  isExpired: boolean;
  claimed: boolean;
  isLoading: boolean;
  onClaim: () => void;
}) {
  if (isUsed) {
    return (
      <Badge variant="secondary" className="whitespace-nowrap text-xs">
        사용 완료
      </Badge>
    );
  }

  if (isExpired) {
    return (
      <Badge variant="secondary" className="whitespace-nowrap text-xs">
        만료
      </Badge>
    );
  }

  if (claimed) {
    return (
      <Badge className="whitespace-nowrap bg-indigo-100 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
        받은 쿠폰
      </Badge>
    );
  }

  return (
    <Button
      size="sm"
      onClick={onClaim}
      disabled={isLoading}
      className="whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-700"
    >
      {isLoading ? '발급 중...' : '쿠폰 받기'}
    </Button>
  );
}
