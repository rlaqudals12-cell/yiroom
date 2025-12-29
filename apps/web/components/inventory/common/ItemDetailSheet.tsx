'use client';

/**
 * 아이템 상세 정보 바텀시트
 * - 아이템 상세 정보 표시
 * - 수정/삭제 기능
 * - 착용 기록
 */

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Heart,
  Calendar,
  Tag,
  Shirt,
  Palette,
  Trash2,
  Edit2,
  TrendingUp,
} from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
import type { InventoryItem, ClothingMetadata } from '@/types/inventory';
import { SEASON_LABELS, OCCASION_LABELS, PATTERN_LABELS } from '@/types/inventory';

interface ItemDetailSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  onFavoriteToggle?: (item: InventoryItem) => void;
  onRecordWear?: (item: InventoryItem) => void;
}

export function ItemDetailSheet({
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onFavoriteToggle,
  onRecordWear,
}: ItemDetailSheetProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item) return null;

  const metadata = item.metadata as Partial<ClothingMetadata>;
  const colors = metadata?.color || [];
  const seasons = metadata?.season || [];
  const occasions = metadata?.occasion || [];
  const pattern = metadata?.pattern;

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(item);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{item.name}</SheetTitle>
          <VisuallyHidden asChild>
            <SheetDescription>아이템 상세 정보</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>

        {/* 드래그 핸들 */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
        </div>

        <div
          data-testid="item-detail-sheet"
          className="flex flex-col h-full overflow-auto pb-24"
        >
          {/* 이미지 */}
          <div className="relative aspect-square max-h-[300px] mx-auto w-full bg-muted rounded-xl overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-contain"
            />

            {/* 즐겨찾기 버튼 */}
            <button
              type="button"
              onClick={() => onFavoriteToggle?.(item)}
              className={cn(
                'absolute top-3 right-3 p-2 rounded-full transition-all',
                'bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm',
                item.isFavorite ? 'text-red-500' : 'text-gray-400'
              )}
            >
              <Heart
                className="w-5 h-5"
                fill={item.isFavorite ? 'currentColor' : 'none'}
              />
            </button>
          </div>

          {/* 기본 정보 */}
          <div className="mt-4 space-y-4">
            <div>
              <h2 className="text-xl font-bold">{item.name}</h2>
              {item.brand && (
                <p className="text-muted-foreground">{item.brand}</p>
              )}
            </div>

            {/* 착용 통계 */}
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm">
                  <strong>{item.useCount}</strong>회 착용
                </span>
              </div>
              {item.lastUsedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    마지막:{' '}
                    {format(new Date(item.lastUsedAt), 'M월 d일', {
                      locale: ko,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* 착용 기록 버튼 */}
            {onRecordWear && (
              <Button
                onClick={() => onRecordWear(item)}
                className="w-full"
                size="lg"
              >
                <Shirt className="w-4 h-4 mr-2" />
                오늘 착용 기록
              </Button>
            )}

            {/* 상세 정보 */}
            <div className="space-y-3">
              {/* 색상 */}
              {colors.length > 0 && (
                <div className="flex items-start gap-3">
                  <Palette className="w-4 h-4 text-muted-foreground mt-1" />
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-sm"
                      >
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{
                            backgroundColor: color.startsWith('#')
                              ? color
                              : undefined,
                          }}
                        />
                        <span>{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 계절 */}
              {seasons.length > 0 && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
                  <div className="flex flex-wrap gap-1.5">
                    {seasons.map((season) => (
                      <Badge key={season} variant="outline">
                        {SEASON_LABELS[season]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* TPO */}
              {occasions.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-muted-foreground mt-1" />
                  <div className="flex flex-wrap gap-1.5">
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
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">패턴:</span>
                  <span>{PATTERN_LABELS[pattern]}</span>
                </div>
              )}

              {/* 태그 */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {item.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 등록 정보 */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              등록:{' '}
              {format(new Date(item.createdAt), 'yyyy년 M월 d일', {
                locale: ko,
              })}
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-2">
          {onEdit && (
            <Button
              variant="outline"
              onClick={() => onEdit(item)}
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              수정
            </Button>
          )}

          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>아이템 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{item.name}&rdquo;을(를) 삭제하시겠습니까? 이 작업은
                    되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
