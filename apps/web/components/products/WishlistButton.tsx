'use client';

import { useState, useCallback, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { toggleWishlist, checkWishlistStatus } from '@/lib/wishlist';
import { toast } from 'sonner';
import type { ProductType } from '@/types/product';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productType: ProductType;
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

export function WishlistButton({
  productType,
  productId,
  size = 'md',
  variant = 'icon',
  className,
}: WishlistButtonProps) {
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 초기 위시리스트 상태 로드
  useEffect(() => {
    async function loadStatus() {
      if (!user?.id || !supabase) {
        setInitialLoading(false);
        return;
      }

      try {
        const status = await checkWishlistStatus(supabase, user.id, productType, productId);
        setIsWishlisted(status);
      } catch (error) {
        console.error('위시리스트 상태 로드 실패:', error);
      } finally {
        setInitialLoading(false);
      }
    }

    if (isLoaded) {
      loadStatus();
    }
  }, [user?.id, supabase, productType, productId, isLoaded]);

  const handleToggle = useCallback(async () => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다');
      return;
    }

    if (!supabase) {
      toast.error('잠시 후 다시 시도해 주세요');
      return;
    }

    setLoading(true);
    try {
      const result = await toggleWishlist(supabase, user.id, productType, productId);

      if (result.success) {
        setIsWishlisted(result.isWishlisted);
        toast.success(result.isWishlisted ? '위시리스트에 추가했어요' : '위시리스트에서 제거했어요');
      } else {
        toast.error('오류가 발생했어요. 다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('위시리스트 토글 실패:', error);
      toast.error('오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, productType, productId]);

  // 로그인 전이면 아이콘만 표시 (클릭 시 로그인 안내)
  const isDisabled = loading || initialLoading;

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];

  const buttonSize = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  }[size];

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isDisabled}
        className={cn(
          'rounded-full p-2 transition-all duration-200',
          'hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isWishlisted ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400',
          className
        )}
        aria-label={isWishlisted ? '위시리스트에서 제거' : '위시리스트에 추가'}
      >
        {loading ? (
          <Loader2 className={cn(iconSize, 'animate-spin')} />
        ) : (
          <Heart
            className={cn(iconSize, 'transition-transform', isWishlisted && 'fill-current scale-110')}
          />
        )}
      </button>
    );
  }

  return (
    <Button
      variant={isWishlisted ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={isDisabled}
      className={cn(
        'gap-2',
        isWishlisted && 'bg-pink-500 hover:bg-pink-600',
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
      )}
      {isWishlisted ? '찜 완료' : '찜하기'}
    </Button>
  );
}
