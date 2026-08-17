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
import { Plus, Search, SlidersHorizontal, ChevronRight } from 'lucide-react';
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
import { InventoryGrid, CategoryFilter, ItemDetailSheet } from '@/components/inventory';
import { filterClosetItems, buildClosetSearchFilter } from '@/lib/inventory/client';
// 비공개 버킷 이미지 해석 — 'use client' 번들에 서버 repository가 딸려오지 않도록 image-url만 직접 import
import { resolveInventoryImageUrl, signInventoryImagePaths } from '@/lib/inventory/image-url';
import type { InventoryItem, InventoryItemDB } from '@/types/inventory';

export default function ClosetPage() {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();

  // 상태
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  // 조회 실패 — 조용한 무반응("옷이 없어요")으로 위장하지 않는다
  const [fetchError, setFetchError] = useState(false);

  // 필터
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 상세 보기
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const LIMIT = 20;
  // 필터가 켜지면 DB가 아니라 클라이언트에서 거르므로(아래 주석 참조) 한 번에 더 크게 가져온다.
  // 20벌만 가져와 거르면 화면이 자주 비어 "필터=아무것도 없음"으로 오인된다.
  const FILTERED_LIMIT = 200;

  // 카테고리·시즌은 DB에서 거를 수 없다:
  // - 카테고리: sub_category에 한글 세부종류('티셔츠')가 저장돼 영문 값 in() 조회는 항상 0건
  // - 시즌: metadata->season은 jsonb라 배열 연산자(overlaps)가 적용되지 않아 쿼리 실패
  // 따라서 조회 후 클라이언트에서 조립기·집계와 같은 기준(resolveClothingCategory)으로 거른다.
  const hasClientFilter = selectedCategories.length > 0 || selectedSeasons.length > 0;

  // 아이템 목록 조회
  const fetchItems = useCallback(
    async (reset = false) => {
      if (!supabase) return;

      setLoading(true);
      try {
        const pageSize = hasClientFilter ? FILTERED_LIMIT : LIMIT;
        const currentOffset = reset ? 0 : offset;

        let query = supabase
          .from('user_inventory')
          .select('*')
          .eq('category', 'closet')
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + pageSize - 1);

        // 검색 (DB에서 처리 가능 — name/brand는 실제 컬럼).
        // 검색어는 그대로 끼워 넣지 않는다 — 쉼표·괄호가 or() 구분자로 해석돼 쿼리가 깨진다
        if (searchQuery) {
          query = query.or(buildClosetSearchFilter(searchQuery));
        }

        const { data, error } = await query;

        if (error) {
          console.error('[Closet] Fetch error:', error);
          setFetchError(true);
          if (reset) setItems([]);
          setHasMore(false);
          return;
        }

        setFetchError(false);

        // DB 형식 -> 클라이언트 형식 변환
        const rows = (data ?? []) as InventoryItemDB[];
        // 비공개 버킷 — DB엔 스토리지 경로만 있으므로 페이지 단위로 한 번에 서명한다
        // (아이템마다 서명하면 N+1 요청). 레거시 절대 URL은 서명 없이 그대로 통과.
        const signedImages = await signInventoryImagePaths(supabase, [
          ...rows.flatMap((r) => [r.image_url, r.original_image_url]),
        ]);
        const clientItems: InventoryItem[] = rows.map((row) => ({
          id: row.id,
          clerkUserId: row.clerk_user_id,
          category: row.category,
          subCategory: row.sub_category,
          name: row.name,
          imageUrl: resolveInventoryImageUrl(row.image_url, signedImages),
          originalImageUrl: resolveInventoryImageUrl(row.original_image_url, signedImages),
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

        const visibleItems = filterClosetItems(clientItems, {
          categories: selectedCategories,
          seasons: selectedSeasons,
        });

        if (reset) {
          setItems(visibleItems);
          setOffset(pageSize);
        } else {
          setItems((prev) => [...prev, ...visibleItems]);
          setOffset((prev) => prev + pageSize);
        }

        // 더 있는지는 필터 전 '원본 행 수'로 판정한다 — 걸러진 페이지에서 무한 스크롤이
        // 조기 종료돼 뒤쪽 아이템이 영영 안 보이는 일을 막는다
        setHasMore(rows.length === pageSize);
      } finally {
        setLoading(false);
      }
    },
    [supabase, offset, hasClientFilter, selectedCategories, selectedSeasons, searchQuery]
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
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isFavorite: newValue } : i)));

    const { error } = await supabase
      .from('user_inventory')
      .update({ is_favorite: newValue })
      .eq('id', item.id);

    if (error) {
      // 롤백
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isFavorite: !newValue } : i)));
    }
  };

  // 아이템 삭제
  const handleDelete = async (item: InventoryItem) => {
    if (!supabase) return;

    const { error } = await supabase.from('user_inventory').delete().eq('id', item.id);

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
            {/* 등록 기본 경로 = 일괄(사진 여러 장). 한 벌씩 경로는 일괄 화면에서 이어간다 —
                등록 진입점마다 다른 화면으로 갈리지 않게 한 곳으로 모은다 */}
            <Button size="sm" onClick={() => router.push('/closet/add/batch')}>
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
            <Button variant="outline" size="icon" onClick={() => setShowFilters(true)}>
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

      {/* 조회 실패 — 빈 옷장(정상 0벌)과 구분해 정직하게 알리고 재시도 경로를 준다 */}
      {fetchError && (
        <div className="px-4 pt-4" data-testid="closet-fetch-error">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm font-medium">옷장을 불러오지 못했어요</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              일시적인 문제일 수 있어요. 잠시 후 다시 시도해주세요.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fetchItems(true)}
              data-testid="closet-fetch-retry"
            >
              다시 시도
            </Button>
          </div>
        </div>
      )}

      {/* 오늘의 코디 진입 — 옷장에서 코디 조립으로 이어지는 경로 가시화.
          옷 0벌 empty 상태는 기존 그대로 유지(그때는 등록이 우선이라 노출하지 않음) */}
      {items.length > 0 && (
        <div className="px-4 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/closet/recommend')}
            data-testid="closet-recommend-cta"
          >
            오늘의 코디 받기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* 그리드 */}
      <div className="px-4 pt-4">
        <InventoryGrid
          items={items}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => fetchItems(false)}
          onItemSelect={handleItemSelect}
          onFavoriteToggle={handleFavoriteToggle}
          onAddNew={() => router.push('/closet/add/batch')}
          emptyMessage="아직 등록된 옷이 없어요"
          emptyAction={{
            label: '사진 여러 장 한 번에 등록',
            onClick: () => router.push('/closet/add/batch'),
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
