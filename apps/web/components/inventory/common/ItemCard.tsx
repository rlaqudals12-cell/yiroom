'use client';

/**
 * 인벤토리 아이템 카드 컴포넌트
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
// 저장값은 대개 한글 색상명('화이트')이라 hex 대표색으로 풀어야 스와치를 칠할 수 있다
import { colorNameToHex } from '@/lib/inventory/color-bridge';
import type { InventoryItem, ClothingMetadata } from '@/types/inventory';

interface ItemCardProps {
  item: InventoryItem;
  onSelect?: (item: InventoryItem) => void;
  onFavoriteToggle?: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  selected?: boolean;
  selectable?: boolean;
}

export function ItemCard({
  item,
  onSelect,
  onFavoriteToggle,
  onEdit,
  onDelete,
  selected = false,
  selectable = false,
}: ItemCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const metadata = item.metadata as Partial<ClothingMetadata>;
  const colors = metadata?.color || [];

  // 클릭 발화 기준은 onSelect 유무다(selectable 아님).
  // 과거엔 selectable까지 요구해, 선택 모드가 아닌 옷장 목록에서는 카드를 눌러도
  // 아무 일도 일어나지 않았다 — 상세 시트(수정·삭제 포함)가 영구 미개봉이었다.
  const handleClick = (): void => {
    onSelect?.(item);
  };

  // 키보드 조작 — 카드는 div라 기본 키 동작이 없다. 버튼 시맨틱(role·tabIndex)을 주는 이상
  // Enter/Space가 클릭과 같아야 한다(그러지 않으면 마우스 없이는 상세를 열 수 없다).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!onSelect) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    // 스페이스의 페이지 스크롤, 엔터의 폼 제출 같은 기본 동작을 막고 선택으로만 쓴다
    e.preventDefault();
    onSelect(item);
  };

  const handleFavoriteClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onFavoriteToggle?.(item);
  };

  // 즐겨찾기·더보기는 카드 안의 형제 액션이라 카드 클릭까지 번지면 안 된다
  const stopKeyPropagation = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
  };

  // 누를 수 있는 카드일 때만 버튼 시맨틱을 준다 — 아무 동작도 없는 div에 role=button을 달면
  // 스크린리더에 "누를 수 있다"는 거짓말이 된다
  const interactive = !!onSelect;
  const interactiveProps = interactive
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-label': `${item.name} 상세 보기`,
        'aria-pressed': selectable ? selected : undefined,
      }
    : {};

  return (
    <div
      data-testid="item-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...interactiveProps}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card border transition-all duration-200',
        onSelect && 'cursor-pointer hover:shadow-md',
        // 키보드 포커스가 보이지 않으면 탭 이동이 미아가 된다
        interactive &&
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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

        {/* 선택 체크박스 (selectable 모드) */}
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
          onKeyDown={stopKeyPropagation}
          className={cn(
            'absolute top-2 right-2 p-1.5 rounded-full transition-all',
            'bg-white/80 backdrop-blur-sm hover:bg-white',
            item.isFavorite ? 'text-red-500' : 'text-gray-400'
          )}
          aria-label={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <Heart className="w-4 h-4" fill={item.isFavorite ? 'currentColor' : 'none'} />
        </button>

        {/* 색상 표시 — hex는 그대로, 한글 색상명은 대표 hex로 변환.
            둘 다 안 되면 빈 원(무엇을 뜻하는지 알 수 없는 점) 대신 이름 칩으로 보여준다 */}
        {colors.length > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            {colors.slice(0, 3).map((color, idx) => {
              const swatchHex = color.startsWith('#') ? color : colorNameToHex(color);
              return swatchHex ? (
                <span
                  key={idx}
                  data-testid="item-color-swatch"
                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: swatchHex }}
                  title={color}
                  aria-label={color}
                />
              ) : (
                <span
                  key={idx}
                  data-testid="item-color-chip"
                  className="rounded-full bg-white/85 px-1.5 py-0.5 text-[9px] font-medium text-gray-700 shadow-sm"
                  title={color}
                >
                  {color}
                </span>
              );
            })}
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
                  aria-label={`${item.name} 더보기`}
                  className="p-1 rounded hover:bg-muted -mr-1"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={stopKeyPropagation}
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
          {item.tags.length > 0 && (
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
