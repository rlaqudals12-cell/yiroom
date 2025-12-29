'use client';

/**
 * 내 옷장 메인 페이지
 * - 의류 목록 그리드
 * - 카테고리/계절/TPO 필터
 * - 검색
 * - 아이템 추가
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  InventoryGrid,
  CategoryFilter,
  ItemDetailSheet,
} from '@/components/inventory';
import type {
  InventoryItem,
  InventoryItemDB,
} from '@/types/inventory';

export default function ClosetPage() {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();

  // 상태
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // 필터
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 상세 보기
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const LIMIT = 20;

  // 아이템 목록 조회
  const fetchItems = useCallback(
    async (reset = false) => {
      if (!supabase) return;

      setLoading(true);
      try {
        const currentOffset = reset ? 0 : offset;

        let query = supabase
          .from('user_inventory')
          .select('*')
          .eq('category', 'closet')
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + LIMIT - 1);

        // 카테고리 필터
        if (selectedCategories.length > 0) {
          query = query.in('sub_category', selectedCategories);
        }

        // 시즌 필터
        if (selectedSeasons.length > 0) {
          query = query.overlaps('metadata->season', selectedSeasons);
        }

        // 검색
        if (searchQuery) {
          query = query.or(
            `name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`
          );
        }

        const { data, error } = await query;

        if (error) {
          console.error('[Closet] Fetch error:', error);
          return;
        }

        // DB 형식 -> 클라이언트 형식 변환
        const clientItems = (data as InventoryItemDB[]).map((row) => ({
          id: row.id,
          clerkUserId: row.clerk_user_id,
          category: row.category,
          subCategory: row.sub_category,
          name: row.name,
          imageUrl: row.image_url,
          originalImageUrl: row.original_image_url,
          brand: row.brand,
          tags: row.tags,
          isFavorite: row.is_favorite,
          useCount: row.use_count,
          lastUsedAt: row.last_used_at,
          expiryDate: row.expiry_date,
          metadata: row.metadata,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));

        if (reset) {
          setItems(clientItems);
          setOffset(LIMIT);
        } else {
          setItems((prev) => [...prev, ...clientItems]);
          setOffset((prev) => prev + LIMIT);
        }

        setHasMore(clientItems.length === LIMIT);
      } finally {
        setLoading(false);
      }
    },
    [supabase, offset, selectedCategories, selectedSeasons, searchQuery]
  );

  // 초기 로드
  useEffect(() => {
    fetchItems(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedSeasons, searchQuery]);

  // 즐겨찾기 토글
  const handleFavoriteToggle = async (item: InventoryItem) => {
    if (!supabase) return;

    const newValue = !item.isFavorite;

    // 낙관적 업데이트
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isFavorite: newValue } : i))
    );

    const { error } = await supabase
      .from('user_inventory')
      .update({ is_favorite: newValue })
      .eq('id', item.id);

    if (error) {
      // 롤백
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isFavorite: !newValue } : i
        )
      );
    }
  };

  // 아이템 삭제
  const handleDelete = async (item: InventoryItem) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('user_inventory')
      .delete()
      .eq('id', item.id);

    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setShowDetail(false);
    }
  };

  // 착용 기록
  const handleRecordWear = async (item: InventoryItem) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('user_inventory')
      .update({
        use_count: item.useCount + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                useCount: i.useCount + 1,
                lastUsedAt: new Date().toISOString(),
              }
            : i
        )
      );
      setSelectedItem((prev) =>
        prev?.id === item.id
          ? {
              ...prev,
              useCount: prev.useCount + 1,
              lastUsedAt: new Date().toISOString(),
            }
          : prev
      );
    }
  };

  // 아이템 클릭
  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  return (
    <div data-testid="closet-page" className="pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">내 옷장</h1>
            <Button size="sm" onClick={() => router.push('/closet/add')}>
              <Plus className="w-4 h-4 mr-1" />
              추가
            </Button>
          </div>

          {/* 검색바 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="옷 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="px-4 pb-3">
          <CategoryFilter
            type="category"
            selected={selectedCategories}
            onChange={setSelectedCategories}
          />
        </div>
      </div>

      {/* 그리드 */}
      <div className="px-4 pt-4">
        <InventoryGrid
          items={items}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => fetchItems(false)}
          onItemSelect={handleItemSelect}
          onFavoriteToggle={handleFavoriteToggle}
          onAddNew={() => router.push('/closet/add')}
          emptyMessage="아직 등록된 옷이 없어요"
          emptyAction={{
            label: '첫 번째 옷 추가하기',
            onClick: () => router.push('/closet/add'),
          }}
        />
      </div>

      {/* 상세 Sheet */}
      <ItemDetailSheet
        item={selectedItem}
        open={showDetail}
        onOpenChange={setShowDetail}
        onFavoriteToggle={handleFavoriteToggle}
        onEdit={(item) => router.push(`/closet/${item.id}/edit`)}
        onDelete={handleDelete}
        onRecordWear={handleRecordWear}
      />

      {/* 필터 Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>필터</SheetTitle>
            <VisuallyHidden asChild>
              <SheetDescription>옷장 필터 옵션</SheetDescription>
            </VisuallyHidden>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* 시즌 필터 */}
            <div>
              <h3 className="text-sm font-medium mb-2">시즌</h3>
              <CategoryFilter
                type="season"
                selected={selectedSeasons}
                onChange={setSelectedSeasons}
                multiple
              />
            </div>

            {/* 필터 초기화 */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedCategories([]);
                setSelectedSeasons([]);
                setShowFilters(false);
              }}
            >
              필터 초기화
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
