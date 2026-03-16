'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CouponList } from './CouponList';
import { Ticket, ChevronRight } from 'lucide-react';
import type { Promotion, UserCoupon } from '@/lib/products/services/coupons';

interface CouponBannerProps {
  /** 활성 프로모션 목록 */
  promotions: Promotion[];
  /** 사용자 쿠폰 목록 */
  userCoupons: UserCoupon[];
  /** 사용 가능 쿠폰 수 */
  availableCount: number;
  /** 쿠폰 받기 핸들러 */
  onClaim?: (promotionId: string) => void;
  /** 발급 로딩 중인 프로모션 ID */
  claimingId?: string;
  /** 추가 클래스 */
  className?: string;
}

export function CouponBanner({
  promotions,
  userCoupons,
  availableCount,
  onClaim,
  claimingId,
  className,
}: CouponBannerProps) {
  const [open, setOpen] = useState(false);

  // 쿠폰이 없으면 배너 숨김
  if (availableCount === 0 && promotions.length === 0) {
    return null;
  }

  return (
    <div data-testid="coupon-banner" className={cn('w-full', className)}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-all',
              'border-indigo-200 bg-indigo-50 hover:bg-indigo-100',
              'dark:border-indigo-800 dark:bg-indigo-950 dark:hover:bg-indigo-900'
            )}
          >
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                사용 가능한 쿠폰이 있어요!
              </span>
              <Badge className="bg-indigo-600 text-white">{availableCount}장</Badge>
            </div>
            <ChevronRight className="h-4 w-4 text-indigo-400" />
          </button>
        </DialogTrigger>

        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-indigo-500" />내 쿠폰함
            </DialogTitle>
          </DialogHeader>

          <CouponList
            promotions={promotions}
            userCoupons={userCoupons}
            onClaim={onClaim}
            claimingId={claimingId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
