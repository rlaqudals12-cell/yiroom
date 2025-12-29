'use client';

/**
 * 가격 알림 버튼
 * @description 제품 가격 모니터링 토글 버튼
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PriceWatchButtonProps {
  productId: string;
  isWatching?: boolean;
  onToggle?: (isWatching: boolean) => void;
  onConfigureAlert?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function PriceWatchButton({
  productId: _productId,
  isWatching = false,
  onToggle,
  onConfigureAlert,
  variant = 'outline',
  size = 'sm',
  className,
}: PriceWatchButtonProps) {
  const [watching, setWatching] = useState(isWatching);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (watching && onConfigureAlert) {
      // 이미 알림 중이면 설정 열기
      onConfigureAlert();
      return;
    }

    setLoading(true);
    try {
      const newState = !watching;
      setWatching(newState);
      onToggle?.(newState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={watching ? 'default' : variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={cn(
        watching && 'bg-yellow-500 hover:bg-yellow-600 text-white',
        className
      )}
      data-testid="price-watch-button"
    >
      {loading ? (
        <span className="animate-pulse">...</span>
      ) : watching ? (
        <>
          <span className="mr-1">&#x1F514;</span>
          알림 설정됨
        </>
      ) : (
        <>
          <span className="mr-1">&#x1F514;</span>
          가격 알림
        </>
      )}
    </Button>
  );
}
