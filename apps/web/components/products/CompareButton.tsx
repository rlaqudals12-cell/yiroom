'use client';

import { GitCompare, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ActionToast } from '@/components/common/ActionToast';
import {
  useProductCompareStore,
  canAddToCompare,
  type CompareItem,
} from '@/lib/stores/productCompareStore';
import { trackCustomEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface CompareButtonProps {
  product: CompareItem;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 제품 비교 추가/제거 버튼
 */
export function CompareButton({
  product,
  variant = 'icon',
  size = 'md',
  className,
}: CompareButtonProps) {
  const { items, addItem, removeItem } = useProductCompareStore();
  const isInCompare = items.some((i) => i.productId === product.productId);
  const canAdd = canAddToCompare(product.productType);

  const handleToggle = () => {
    if (isInCompare) {
      removeItem(product.productId);
      toast.custom(() => (
        <ActionToast type="compare" message="비교 목록에서 제거했어요" />
      ));
    } else {
      if (!canAdd) {
        toast.error('같은 종류의 제품만 비교할 수 있어요 (최대 3개)');
        return;
      }

      const added = addItem(product);
      if (added) {
        trackCustomEvent('feature_use', 'Product Added to Compare', {
          productId: product.productId,
          productType: product.productType,
        });
        toast.custom(() => (
          <ActionToast
            type="compare"
            message="비교 목록에 추가했어요"
            productName={product.name}
          />
        ));
      }
    }
  };

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  if (variant === 'icon') {
    return (
      <Button
        variant={isInCompare ? 'default' : 'outline'}
        size="icon"
        className={cn(sizeClasses[size], className)}
        onClick={handleToggle}
        aria-label={isInCompare ? '비교 목록에서 제거' : '비교 목록에 추가'}
      >
        {isInCompare ? (
          <Check className="h-4 w-4" />
        ) : (
          <GitCompare className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isInCompare ? 'default' : 'outline'}
      className={className}
      onClick={handleToggle}
    >
      {isInCompare ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          비교 중
        </>
      ) : (
        <>
          <GitCompare className="mr-2 h-4 w-4" />
          비교하기
        </>
      )}
    </Button>
  );
}

export default CompareButton;
