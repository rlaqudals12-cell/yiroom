'use client';

/**
 * 제품함 목록
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShelfItem } from './ShelfItem';
import { ShelfFilters } from './ShelfFilters';
import { cn } from '@/lib/utils';
import type { ShelfItem as ShelfItemType, ShelfStatus } from '@/lib/scan/product-shelf';

interface ShelfListProps {
  className?: string;
}

export function ShelfList({ className }: ShelfListProps) {
  const router = useRouter();
  const [items, setItems] = useState<ShelfItemType[]>([]);
  const [counts, setCounts] = useState<Record<ShelfStatus, number>>();
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ShelfStatus | 'all'>('all');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // 목록 로드
  const loadItems = useCallback(
    async (reset = false) => {
      try {
        setLoading(true);
        const offset = reset ? 0 : page * PAGE_SIZE;
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
          counts: reset ? 'true' : 'false',
        });
        if (selectedStatus !== 'all') {
          params.set('status', selectedStatus);
        }

        const response = await fetch(`/api/scan/shelf?${params}`);
        if (!response.ok) throw new Error('Failed to load shelf');

        const data = await response.json();

        if (reset) {
          setItems(data.items);
          if (data.counts) {
            setCounts(data.counts);
          }
          setPage(1);
        } else {
          setItems((prev) => [...prev, ...data.items]);
          setPage((p) => p + 1);
        }

        setHasMore(data.items.length === PAGE_SIZE);
      } catch (error) {
        console.error('[ShelfList] Load error:', error);
      } finally {
        setLoading(false);
      }
    },
    [page, selectedStatus]
  );

  // 초기 로드
  useEffect(() => {
    loadItems(true);
  }, [selectedStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // 상태 변경
  const handleStatusChange = async (item: ShelfItemType, newStatus: ShelfStatus) => {
    try {
      const response = await fetch(`/api/scan/shelf/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // 목록 새로고침
      loadItems(true);
    } catch (error) {
      console.error('[ShelfList] Status change error:', error);
    }
  };

  // 삭제
  const handleDelete = async (item: ShelfItemType) => {
    if (!confirm('이 제품을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/scan/shelf/${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      // 목록에서 제거
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (counts) {
        setCounts((prev) => ({
          ...prev!,
          [item.status]: Math.max(0, (prev![item.status] || 0) - 1),
        }));
      }
    } catch (error) {
      console.error('[ShelfList] Delete error:', error);
    }
  };

  // 아이템 선택 (상세 페이지로 이동)
  const handleSelect = (item: ShelfItemType) => {
    router.push(`/scan/shelf/${item.id}`);
  };

  return (
    <div data-testid="shelf-list" className={cn('flex flex-col gap-4', className)}>
      {/* 필터 */}
      <ShelfFilters selectedStatus={selectedStatus} counts={counts} onChange={setSelectedStatus} />

      {/* 목록 */}
      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">제품함이 비어있어요</p>
            <p className="text-sm text-muted-foreground">제품을 스캔하여 추가해보세요</p>
          </div>
          <Button onClick={() => router.push('/scan')}>제품 스캔하기</Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <ShelfItem
                key={item.id}
                item={item}
                onSelect={handleSelect}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* 더 보기 */}
          {hasMore && (
            <Button
              variant="outline"
              onClick={() => loadItems()}
              disabled={loading}
              className="mx-auto"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}더 보기
            </Button>
          )}
        </>
      )}
    </div>
  );
}
