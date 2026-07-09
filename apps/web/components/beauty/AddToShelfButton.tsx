'use client';

import { useState, useEffect, useCallback } from 'react';
import { PackagePlus, PackageCheck, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { ProductIngredient } from '@/types/scan';
import { cn } from '@/lib/utils';

interface AddToShelfButtonProps {
  /** 카탈로그 제품 UUID */
  productId: string;
  productName: string;
  productBrand?: string;
  productImageUrl?: string;
  /** 카탈로그 대표 성분 (전성분 아님 — 이름 수준) */
  keyIngredients?: string[];
  className?: string;
}

/**
 * 제품 상세 → "내 제품함에 담기" 진입점
 *
 * 스캔 외 등록 경로: 카탈로그 제품을 바로 제품함(user_product_shelf)에 담아
 * 오늘의 맞춤 루틴에 반영되게 한다 (ADR-117).
 *
 * - 마운트 시 내 제품함에 이미 있으면 "제품함에 있음" 비활성 상태
 * - 성분은 카탈로그 key_ingredients 수준으로 정직하게 매핑 (이름만)
 */
export function AddToShelfButton({
  productId,
  productName,
  productBrand,
  productImageUrl,
  keyIngredients,
  className,
}: AddToShelfButtonProps) {
  const { user, isLoaded } = useUser();
  const [isPresent, setIsPresent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  // 마운트 시 이미 담긴 제품인지 확인 (product_id 또는 이름+브랜드 일치)
  useEffect(() => {
    let cancelled = false;

    async function checkPresence(): Promise<void> {
      if (!user?.id) {
        setChecking(false);
        return;
      }

      try {
        const res = await fetch('/api/scan/shelf?limit=100');
        if (!res.ok) {
          if (!cancelled) setChecking(false);
          return;
        }
        const data = await res.json();
        const items: Array<{
          productId?: string;
          productName?: string;
          productBrand?: string;
        }> = data.items ?? [];

        const exists = items.some(
          (item) =>
            (productId && item.productId === productId) ||
            (item.productName === productName && (item.productBrand ?? '') === (productBrand ?? ''))
        );

        if (!cancelled) {
          setIsPresent(exists);
          setChecking(false);
        }
      } catch {
        if (!cancelled) setChecking(false);
      }
    }

    if (isLoaded) {
      checkPresence();
    }

    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoaded, productId, productName, productBrand]);

  const handleAdd = useCallback(async () => {
    if (!user?.id) {
      // 비로그인: 로그인 유도 (WishlistButton과 동일 패턴)
      toast.error('로그인이 필요합니다');
      return;
    }

    // 카탈로그 대표 성분을 ProductIngredient 형태로 매핑
    // (전성분이 아니라 이름 수준 — 정직하게 그 범위만)
    const productIngredients: ProductIngredient[] = (keyIngredients ?? []).map((name, index) => ({
      order: index + 1,
      inciName: name,
      nameKo: name,
    }));

    setSubmitting(true);
    try {
      const res = await fetch('/api/scan/shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          productBrand,
          productImageUrl,
          productIngredients,
          scanMethod: 'manual',
          status: 'owned',
        }),
      });

      if (res.ok) {
        setIsPresent(true);
        // 정직성: 오늘의 캡슐은 날짜 단위 서버 캐시(ADR-073)라 이미 생성된 오늘 루틴엔
        // 즉시 반영되지 않을 수 있음 — 시점을 특정하지 않는 문구 사용. 캐시 무효화는 v2(ADR-117).
        toast.success('내 제품함에 담았어요 — 맞춤 루틴에 반영돼요');
      } else {
        toast.error('제품함에 담지 못했어요. 다시 시도해 주세요.');
      }
    } catch (error) {
      console.error('[AddToShelfButton] 담기 실패:', error);
      toast.error('오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, productId, productName, productBrand, productImageUrl, keyIngredients]);

  const isDisabled = submitting || checking || isPresent;

  // 상태별 아이콘 (중첩 삼항 회피)
  let icon = <PackagePlus className="h-5 w-5" />;
  if (submitting) {
    icon = <Loader2 className="h-5 w-5 animate-spin" />;
  } else if (isPresent) {
    icon = <PackageCheck className="h-5 w-5" />;
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={isDisabled}
      data-testid="add-to-shelf-button"
      title={isPresent ? '제품함에 있음' : '내 제품함에 담기'}
      aria-label={isPresent ? '이미 제품함에 있는 제품' : '내 제품함에 담기'}
      className={cn(
        'rounded-full p-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-violet-300',
        'disabled:cursor-not-allowed',
        isPresent
          ? 'text-violet-500 opacity-70'
          : 'text-muted-foreground hover:bg-violet-50 hover:text-violet-500 dark:hover:bg-violet-950/40',
        className
      )}
    >
      {icon}
    </button>
  );
}
