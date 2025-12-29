'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  useRecentlyViewedStore,
  type RecentlyViewedItem,
} from '@/lib/stores/recentlyViewedStore';
import { productTypeToPath } from '@/lib/products';
import { cn } from '@/lib/utils';

interface RecentlyViewedProps {
  className?: string;
  limit?: number;
}

/**
 * 최근 본 제품 컴포넌트
 * 수평 스크롤로 최근 본 제품 목록 표시
 */
export function RecentlyViewed({ className, limit = 10 }: RecentlyViewedProps) {
  const { items, removeItem, clearAll } = useRecentlyViewedStore();
  const [mounted, setMounted] = useState(false);

  // 클라이언트 사이드에서만 렌더링 (hydration 이슈 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const displayItems = items.slice(0, limit);

  if (displayItems.length === 0) return null;

  return (
    <section className={cn('space-y-3', className)} data-testid="recently-viewed">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">최근 본 제품</h2>
          <span className="text-xs text-muted-foreground">
            ({displayItems.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          전체 삭제
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {displayItems.map((item) => (
            <RecentlyViewedCard
              key={item.productId}
              item={item}
              onRemove={() => removeItem(item.productId)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

function RecentlyViewedCard({
  item,
  onRemove,
}: {
  item: RecentlyViewedItem;
  onRemove: () => void;
}) {
  const href = `/products/${productTypeToPath(item.productType)}/${item.productId}`;

  return (
    <Card className="relative w-32 flex-shrink-0 overflow-hidden">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onRemove();
        }}
        className="absolute right-1 top-1 z-10 rounded-full bg-background/80 p-1 hover:bg-background"
        aria-label="삭제"
      >
        <X className="h-3 w-3" />
      </button>

      <Link href={href}>
        <div className="relative aspect-square bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <CardContent className="p-2">
          <p className="text-xs text-muted-foreground truncate">{item.brand}</p>
          <p className="text-xs font-medium truncate">{item.name}</p>
          {item.priceKrw && (
            <p className="text-xs font-semibold text-primary mt-1">
              {item.priceKrw.toLocaleString()}원
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

export default RecentlyViewed;
