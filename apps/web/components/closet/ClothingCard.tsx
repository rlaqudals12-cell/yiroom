'use client';

/**
 * 옷 아이템 카드 컴포넌트
 * - 이미지 썸네일
 * - 아이템 이름, 브랜드
 * - 즐겨찾기 토글
 * - 착용 횟수
 */

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ClothingItem, ClothingMetadata } from '@/types/inventory';

interface ClothingCardProps {
  item: ClothingItem;
  onSelect?: (item: ClothingItem) => void;
  onFavoriteToggle?: (item: ClothingItem) => void;
  onEdit?: (item: ClothingItem) => void;
  onDelete?: (item: ClothingItem) => void;
  selected?: boolean;
  selectable?: boolean;
}

export function ClothingCard({
  item,
  onSelect,
  onFavoriteToggle,
  onEdit,
  onDelete,
  selected = false,
  selectable = false,
}: ClothingCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const metadata = item.metadata as ClothingMetadata;
  const colors = metadata?.color || [];

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(item);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(item);
  };

  return (
    <div
      data-testid="clothing-card"
      onClick={handleClick}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card border transition-all duration-200',
        selectable && 'cursor-pointer hover:shadow-md',
        selected && 'ring-2 ring-primary border-primary'
      )}
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-square bg-muted">
        {!imageError ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className={cn(
              'object-cover transition-opacity duration-300',
              isImageLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <span className="text-sm">이미지 없음</span>
          </div>
        )}

        {isImageLoading && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}

        {/* 선택 체크박스 */}
        {selectable && (
          <div
            className={cn(
              'absolute top-2 left-2 w-5 h-5 rounded-full border-2 transition-colors',
              selected ? 'bg-primary border-primary' : 'bg-white/80 border-gray-300'
            )}
          >
            {selected && (
              <svg
                className="w-full h-full text-white p-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        )}

        {/* 즐겨찾기 버튼 */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-full transition-all',
            'bg-white/80 backdrop-blur-sm hover:bg-white',
            item.isFavorite ? 'text-red-500' : 'text-gray-400'
          )}
          aria-label={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <Heart className="w-4 h-4" fill={item.isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* 색상 표시 */}
        {colors.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {colors.slice(0, 3).map((color, idx) => (
              <div
                key={idx}
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{
                  backgroundColor: color.startsWith('#') ? color : undefined,
                }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-2.5">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{item.name}</h3>
            {item.brand && <p className="text-xs text-muted-foreground truncate">{item.brand}</p>}
          </div>

          {/* 더보기 메뉴 */}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted -mr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && <DropdownMenuItem onClick={() => onEdit(item)}>수정</DropdownMenuItem>}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
                    삭제
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 태그 & 착용 횟수 */}
        <div className="flex items-center justify-between mt-1.5">
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1 overflow-hidden">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {item.tags[0]}
              </Badge>
              {item.tags.length > 1 && (
                <span className="text-[10px] text-muted-foreground">+{item.tags.length - 1}</span>
              )}
            </div>
          )}
          {item.useCount > 0 && (
            <span className="text-[10px] text-muted-foreground">{item.useCount}회 착용</span>
          )}
        </div>
      </div>
    </div>
  );
}
