'use client';

/**
 * Phase J P3-C: 저장된 코디 페이지
 * 사용자가 저장한 전체 코디 목록 및 관리
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Trash2, Calendar, Sparkles, FolderOpen } from 'lucide-react';
import { useSavedOutfits } from '@/hooks/useSavedOutfits';
import { OUTFIT_OCCASION_LABELS, OUTFIT_OCCASION_ICONS } from '@/types/styling';
import type { SavedOutfit } from '@/lib/api/outfits';

// 시즌 라벨
const SEASON_LABELS = {
  spring: '봄 웜톤',
  summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
} as const;

// 시즌 색상
const SEASON_COLORS = {
  spring: '#FFD700',
  summer: '#87CEEB',
  autumn: '#D2691E',
  winter: '#4169E1',
} as const;

/** 저장된 코디 카드 */
function SavedOutfitCard({
  savedOutfit,
  onDelete,
}: {
  savedOutfit: SavedOutfit;
  onDelete: (id: string) => void;
}) {
  const { outfit, seasonType, occasion, savedAt } = savedOutfit;

  return (
    <Card className="overflow-hidden" data-testid="saved-outfit-card">
      <CardContent className="p-4 space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              style={{ backgroundColor: SEASON_COLORS[seasonType] }}
              className="text-white text-[10px]"
            >
              {SEASON_LABELS[seasonType]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {OUTFIT_OCCASION_ICONS[occasion]} {OUTFIT_OCCASION_LABELS[occasion]}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(outfit.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* 코디 미리보기 */}
        <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
          {/* 의상 색상 */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5">
              <div
                className="w-6 h-8 rounded-t shadow-sm border border-border/30"
                style={{ backgroundColor: outfit.clothing.colors.top.hex }}
              />
              <div
                className="w-6 h-10 rounded-b shadow-sm border border-border/30"
                style={{ backgroundColor: outfit.clothing.colors.bottom.hex }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">의상</span>
          </div>

          {/* 악세서리 */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5">
              {outfit.accessory.items.slice(0, 2).map((item, idx) => (
                <div
                  key={idx}
                  className="w-5 h-5 rounded-full shadow-sm border border-border/30"
                  style={{ backgroundColor: item.gemstone?.hex || '#C0C0C0' }}
                />
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground">악세서리</span>
          </div>

          {/* 메이크업 */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5">
              <div
                className="w-5 h-5 rounded shadow-sm border border-border/30"
                style={{ backgroundColor: outfit.makeup.lipstick.hex }}
              />
              <div
                className="w-5 h-5 rounded shadow-sm border border-border/30"
                style={{ backgroundColor: outfit.makeup.blusher.hex }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">메이크업</span>
          </div>
        </div>

        {/* 팁 */}
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
          {outfit.tip}
        </p>

        {/* 저장 날짜 */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {savedAt.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
          에 저장됨
        </div>
      </CardContent>
    </Card>
  );
}

/** 빈 상태 */
function EmptyState() {
  const router = useRouter();

  return (
    <Card className="border-dashed">
      <CardContent className="py-12 flex flex-col items-center text-center">
        <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium mb-2">저장된 코디가 없습니다</h3>
        <p className="text-sm text-muted-foreground mb-4">마음에 드는 코디를 저장해보세요</p>
        <Button onClick={() => router.push('/outfit')}>코디 추천 보기</Button>
      </CardContent>
    </Card>
  );
}

export default function SavedOutfitsPage() {
  const router = useRouter();
  const { savedOutfits, isLoading, deleteOutfit, hasMore, loadMore, totalCount } = useSavedOutfits({
    autoFetch: true,
  });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    await deleteOutfit(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4" data-testid="saved-outfits-page">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">저장된 코디</h1>
          <p className="text-muted-foreground text-sm">
            {totalCount > 0
              ? `${totalCount}개의 코디가 저장되어 있습니다`
              : '저장된 코디를 관리하세요'}
          </p>
        </div>
      </div>

      {/* 로딩 */}
      {isLoading && savedOutfits.length === 0 && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && savedOutfits.length === 0 && <EmptyState />}

      {/* 코디 목록 */}
      {savedOutfits.length > 0 && (
        <div className="space-y-4">
          {savedOutfits.map((savedOutfit) => (
            <SavedOutfitCard
              key={savedOutfit.id}
              savedOutfit={savedOutfit}
              onDelete={setDeleteTarget}
            />
          ))}

          {/* 더 불러오기 */}
          {hasMore && (
            <Button variant="outline" className="w-full" onClick={loadMore} disabled={isLoading}>
              {isLoading ? '불러오는 중...' : '더 보기'}
            </Button>
          )}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>코디 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 코디를 삭제하시겠습니까? 삭제된 코디는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
