'use client';

import { Heart, ShoppingCart, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActionToastType = 'wishlist' | 'cart' | 'compare' | 'success';

interface ActionToastProps {
  type: ActionToastType;
  message: string;
  productName?: string;
}

const TOAST_ICONS: Record<ActionToastType, React.ReactNode> = {
  wishlist: <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />,
  cart: <ShoppingCart className="h-5 w-5 text-blue-500" />,
  compare: <Star className="h-5 w-5 text-amber-500" />,
  success: <Check className="h-5 w-5 text-green-500" />,
};

const TOAST_COLORS: Record<ActionToastType, string> = {
  wishlist: 'bg-pink-50 border-pink-200',
  cart: 'bg-blue-50 border-blue-200',
  compare: 'bg-amber-50 border-amber-200',
  success: 'bg-green-50 border-green-200',
};

/**
 * 액션 피드백 토스트 컴포넌트
 * sonner의 custom toast로 사용
 */
export function ActionToast({ type, message, productName }: ActionToastProps) {
  return (
    <div
      data-testid="action-toast"
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        TOAST_COLORS[type]
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
        {TOAST_ICONS[type]}
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{message}</span>
        {productName && (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {productName}
          </span>
        )}
      </div>
    </div>
  );
}

export default ActionToast;
