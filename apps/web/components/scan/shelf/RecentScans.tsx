'use client';

/**
 * 최근 스캔 히스토리
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Package, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShelfItem } from '@/lib/scan/product-shelf';

interface RecentScansProps {
  limit?: number;
  className?: string;
}

export function RecentScans({ limit = 5, className }: RecentScansProps) {
  const router = useRouter();
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/scan/history?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to load history');

        const data = await response.json();
        setItems(data.items);
      } catch (error) {
        console.error('[RecentScans] Load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [limit]);

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-16 flex-shrink-0 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div data-testid="recent-scans" className={className}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">최근 스캔</h3>
        <button
          onClick={() => router.push('/scan/shelf')}
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
        >
          전체 보기
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(`/scan/shelf/${item.id}`)}
            className="flex flex-shrink-0 flex-col items-center gap-1"
          >
            <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-muted">
              {item.productImageUrl ? (
                <Image
                  src={item.productImageUrl}
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <span className="max-w-14 truncate text-xs text-muted-foreground">
              {item.productBrand || item.productName.slice(0, 6)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
