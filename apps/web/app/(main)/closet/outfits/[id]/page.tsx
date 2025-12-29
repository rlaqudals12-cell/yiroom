'use client';

/**
 * 코디 상세 페이지
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  Shirt,
  TrendingUp,
  Sun,
} from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CollageView } from '@/components/inventory';
import type {
  InventoryItem,
  InventoryItemDB,
  Season,
  Occasion,
} from '@/types/inventory';
import { SEASON_LABELS, OCCASION_LABELS } from '@/types/inventory';

interface SavedOutfitDB {
  id: string;
  clerk_user_id: string;
  name: string | null;
  description: string | null;
  item_ids: string[];
  season: Season[];
  occasion: string | null;
  wear_count: number;
  last_worn_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function OutfitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const outfitId = params.id as string;
  const supabase = useClerkSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [outfit, setOutfit] = useState<SavedOutfitDB | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [deleting, setDeleting] = useState(false);

  // 데이터 로드
  const loadOutfit = useCallback(async () => {
    if (!supabase || !outfitId) return;

    // 코디 정보 로드
    const { data: outfitData, error: outfitError } = await supabase
      .from('saved_outfits')
      .select('*')
      .eq('id', outfitId)
      .single();

    if (outfitError || !outfitData) {
      console.error('[OutfitDetail] Load error:', outfitError);
      router.push('/closet/outfits');
      return;
    }

    setOutfit(outfitData as SavedOutfitDB);

    // 아이템 정보 로드
    if (outfitData.item_ids?.length > 0) {
      const { data: itemsData, error: itemsError } = await supabase
        .from('user_inventory')
        .select('*')
        .in('id', outfitData.item_ids);

      if (!itemsError && itemsData) {
        const clientItems = (itemsData as InventoryItemDB[]).map((row) => ({
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
        setItems(clientItems);
      }
    }

    setLoading(false);
  }, [supabase, outfitId, router]);

  useEffect(() => {
    loadOutfit();
  }, [loadOutfit]);

  // 착용 기록
  const handleRecordWear = async () => {
    if (!supabase || !outfit) return;

    const { error } = await supabase
      .from('saved_outfits')
      .update({
        wear_count: outfit.wear_count + 1,
        last_worn_at: new Date().toISOString(),
      })
      .eq('id', outfitId);

    if (!error) {
      setOutfit((prev) =>
        prev
          ? {
              ...prev,
              wear_count: prev.wear_count + 1,
              last_worn_at: new Date().toISOString(),
            }
          : prev
      );

      // 포함된 아이템들의 착용 횟수도 증가
      for (const item of items) {
        await supabase
          .from('user_inventory')
          .update({
            use_count: item.useCount + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!supabase) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('id', outfitId);

      if (!error) {
        router.push('/closet/outfits');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="w-9 h-9 rounded-md" />
          </div>
        </div>
        <div className="flex justify-center py-8">
          <Skeleton className="w-64 h-64 rounded-xl" />
        </div>
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="w-3/4 h-7" />
          <Skeleton className="w-1/2 h-5" />
          <Skeleton className="w-full h-16" />
        </div>
      </div>
    );
  }

  if (!outfit) return null;

  return (
    <div data-testid="outfit-detail-page" className="min-h-screen pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/closet/outfits/${outfitId}/edit`)}
            >
              <Edit2 className="w-5 h-5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>코디 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 코디를 삭제하시겠습니까?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {deleting ? '삭제 중...' : '삭제'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* 콜라주 뷰 */}
      <div className="flex justify-center py-6">
        <CollageView items={items} layout="mannequin" size="lg" />
      </div>

      {/* 정보 */}
      <div className="px-4 py-4 space-y-6">
        {/* 기본 정보 */}
        <div>
          <h1 className="text-2xl font-bold">
            {outfit.name || '이름 없는 코디'}
          </h1>
          {outfit.description && (
            <p className="text-muted-foreground mt-1">{outfit.description}</p>
          )}
        </div>

        {/* 착용 통계 */}
        <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold">{outfit.wear_count}회</div>
              <div className="text-xs text-muted-foreground">착용</div>
            </div>
          </div>
          {outfit.last_worn_at && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {format(new Date(outfit.last_worn_at), 'M월 d일', {
                    locale: ko,
                  })}
                </div>
                <div className="text-xs text-muted-foreground">마지막 착용</div>
              </div>
            </div>
          )}
        </div>

        {/* 착용 기록 버튼 */}
        <Button className="w-full" size="lg" onClick={handleRecordWear}>
          <Shirt className="w-4 h-4 mr-2" />
          오늘 착용 기록
        </Button>

        {/* 상세 정보 */}
        <div className="space-y-4">
          {/* 시즌 */}
          {outfit.season?.length > 0 && (
            <div className="flex items-start gap-3">
              <Sun className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-2">
                {outfit.season.map((s) => (
                  <Badge key={s} variant="outline">
                    {SEASON_LABELS[s]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 상황 */}
          {outfit.occasion && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
              <Badge variant="secondary">
                {OCCASION_LABELS[outfit.occasion as Occasion]}
              </Badge>
            </div>
          )}
        </div>

        {/* 포함된 아이템 */}
        <div className="space-y-3">
          <h2 className="font-semibold">포함된 아이템 ({items.length}개)</h2>
          <div className="grid grid-cols-4 gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="aspect-square rounded-lg bg-muted overflow-hidden cursor-pointer"
                onClick={() => router.push(`/closet/${item.id}`)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 등록 정보 */}
        <div className="text-xs text-muted-foreground pt-4 border-t">
          등록일:{' '}
          {format(new Date(outfit.created_at), 'yyyy년 M월 d일', { locale: ko })}
        </div>
      </div>
    </div>
  );
}
