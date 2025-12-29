'use client';

/**
 * 저장된 코디 목록 페이지
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { OutfitCard } from '@/components/inventory';
import type {
  SavedOutfit,
  SavedOutfitDB,
  InventoryItem,
  InventoryItemDB,
} from '@/types/inventory';

export default function OutfitsPage() {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();

  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 데이터 로드
  const fetchData = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      // 코디 목록 조회
      const { data: outfitData, error: outfitError } = await supabase
        .from('saved_outfits')
        .select('*')
        .order('created_at', { ascending: false });

      if (outfitError) {
        console.error('[Outfits] Fetch error:', outfitError);
        return;
      }

      // 아이템 목록 조회 (코디에 포함된 아이템 표시용)
      const { data: itemData, error: itemError } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('category', 'closet');

      if (itemError) {
        console.error('[Outfits] Items fetch error:', itemError);
      }

      // 변환
      const clientOutfits = (outfitData as SavedOutfitDB[]).map((row) => ({
        id: row.id,
        clerkUserId: row.clerk_user_id,
        name: row.name,
        description: row.description,
        itemIds: row.item_ids,
        collageImageUrl: row.collage_image_url,
        occasion: row.occasion,
        season: row.season,
        weatherCondition: row.weather_condition,
        wearCount: row.wear_count,
        lastWornAt: row.last_worn_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const clientItems = (itemData as InventoryItemDB[] || []).map((row) => ({
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

      setOutfits(clientOutfits);
      setItems(clientItems);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 착용 기록
  const handleWear = async (outfit: SavedOutfit) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('saved_outfits')
      .update({
        wear_count: outfit.wearCount + 1,
        last_worn_at: new Date().toISOString(),
      })
      .eq('id', outfit.id);

    if (!error) {
      setOutfits((prev) =>
        prev.map((o) =>
          o.id === outfit.id
            ? {
                ...o,
                wearCount: o.wearCount + 1,
                lastWornAt: new Date().toISOString(),
              }
            : o
        )
      );
    }
  };

  // 삭제
  const handleDelete = async (outfit: SavedOutfit) => {
    if (!supabase || !confirm('이 코디를 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('saved_outfits')
      .delete()
      .eq('id', outfit.id);

    if (!error) {
      setOutfits((prev) => prev.filter((o) => o.id !== outfit.id));
    }
  };

  // 필터링
  const filteredOutfits = outfits.filter(
    (outfit) =>
      !searchQuery ||
      outfit.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outfit.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div data-testid="outfits-page" className="pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">내 코디</h1>
            <Button size="sm" onClick={() => router.push('/closet/outfits/new')}>
              <Plus className="w-4 h-4 mr-1" />
              새 코디
            </Button>
          </div>

          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="코디 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <Skeleton className="aspect-[3/4]" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOutfits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? '검색 결과가 없어요' : '아직 저장된 코디가 없어요'}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push('/closet/outfits/new')}>
                첫 번째 코디 만들기
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredOutfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                items={items}
                onSelect={(o) => router.push(`/closet/outfits/${o.id}`)}
                onEdit={(o) => router.push(`/closet/outfits/${o.id}/edit`)}
                onDelete={handleDelete}
                onWear={handleWear}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
