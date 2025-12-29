'use client';

/**
 * 의류 상세 페이지
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ArrowLeft,
  Heart,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  Shirt,
  TrendingUp,
  Palette,
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
import {
  InventoryItemDB,
  ClothingMetadata,
  SEASON_LABELS,
  OCCASION_LABELS,
  PATTERN_LABELS,
  Season,
  Occasion,
} from '@/types/inventory';

export default function ClothingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;
  const supabase = useClerkSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<InventoryItemDB | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 데이터 로드
  useEffect(() => {
    async function loadItem() {
      if (!supabase || !itemId) return;

      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !data) {
        console.error('[ClothingDetail] Load error:', error);
        router.push('/closet');
        return;
      }

      setItem(data as InventoryItemDB);
      setLoading(false);
    }

    loadItem();
  }, [supabase, itemId, router]);

  // 즐겨찾기 토글
  const handleFavoriteToggle = async () => {
    if (!supabase || !item) return;

    const newValue = !item.is_favorite;
    setItem((prev) => (prev ? { ...prev, is_favorite: newValue } : prev));

    const { error } = await supabase
      .from('user_inventory')
      .update({ is_favorite: newValue })
      .eq('id', itemId);

    if (error) {
      setItem((prev) => (prev ? { ...prev, is_favorite: !newValue } : prev));
    }
  };

  // 착용 기록
  const handleRecordWear = async () => {
    if (!supabase || !item) return;

    const { error } = await supabase
      .from('user_inventory')
      .update({
        use_count: item.use_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (!error) {
      setItem((prev) =>
        prev
          ? {
              ...prev,
              use_count: prev.use_count + 1,
              last_used_at: new Date().toISOString(),
            }
          : prev
      );
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!supabase) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', itemId);

      if (!error) {
        router.push('/closet');
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
        <Skeleton className="w-full aspect-square" />
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="w-3/4 h-7" />
          <Skeleton className="w-1/2 h-5" />
          <Skeleton className="w-full h-16" />
        </div>
      </div>
    );
  }

  if (!item) return null;

  const metadata = item.metadata as Partial<ClothingMetadata>;
  const colors = metadata.color || [];
  const seasons = (metadata.season || []) as Season[];
  const occasions = (metadata.occasion || []) as Occasion[];
  const pattern = metadata.pattern;

  return (
    <div data-testid="clothing-detail-page" className="min-h-screen pb-20">
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
              onClick={handleFavoriteToggle}
              className={item.is_favorite ? 'text-red-500' : ''}
            >
              <Heart
                className="w-5 h-5"
                fill={item.is_favorite ? 'currentColor' : 'none'}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/closet/${itemId}/edit`)}
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
                  <AlertDialogTitle>아이템 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{item.name}&rdquo;을(를) 삭제하시겠습니까?
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

      {/* 이미지 */}
      <div className="aspect-square bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-contain"
        />
      </div>

      {/* 정보 */}
      <div className="px-4 py-4 space-y-6">
        {/* 기본 정보 */}
        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          {item.brand && (
            <p className="text-muted-foreground mt-1">{item.brand}</p>
          )}
        </div>

        {/* 착용 통계 */}
        <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold">{item.use_count}회</div>
              <div className="text-xs text-muted-foreground">착용</div>
            </div>
          </div>
          {item.last_used_at && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {format(new Date(item.last_used_at), 'M월 d일', {
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
          {/* 색상 */}
          {colors.length > 0 && (
            <div className="flex items-start gap-3">
              <Palette className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-2">
                {colors.map((color, idx) => (
                  <Badge key={idx} variant="secondary">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 시즌 */}
          {seasons.length > 0 && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-2">
                {seasons.map((season) => (
                  <Badge key={season} variant="outline">
                    {SEASON_LABELS[season]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 상황 */}
          {occasions.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex flex-wrap gap-2">
                {occasions.map((occasion) => (
                  <Badge key={occasion} variant="secondary">
                    {OCCASION_LABELS[occasion]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 패턴 */}
          {pattern && (
            <div className="text-sm">
              <span className="text-muted-foreground">패턴: </span>
              {PATTERN_LABELS[pattern]}
            </div>
          )}

          {/* 태그 */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t">
              {item.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 등록 정보 */}
        <div className="text-xs text-muted-foreground pt-4 border-t">
          등록일:{' '}
          {format(new Date(item.created_at), 'yyyy년 M월 d일', { locale: ko })}
        </div>
      </div>
    </div>
  );
}
