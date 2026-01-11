'use client';

/**
 * 제품함 아이템 카드
 */

import { useState } from 'react';
import Image from 'next/image';
import { Package, Star, MoreVertical, Trash2, Edit2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ShelfItem as ShelfItemType, ShelfStatus } from '@/lib/scan/product-shelf';

interface ShelfItemProps {
  item: ShelfItemType;
  onSelect?: (item: ShelfItemType) => void;
  onStatusChange?: (item: ShelfItemType, status: ShelfStatus) => void;
  onDelete?: (item: ShelfItemType) => void;
  className?: string;
}

const STATUS_LABELS: Record<ShelfStatus, string> = {
  owned: '보유 중',
  wishlist: '위시리스트',
  used_up: '다 씀',
  archived: '보관함',
};

const STATUS_COLORS: Record<ShelfStatus, string> = {
  owned: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  wishlist: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  used_up: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function ShelfItem({ item, onSelect, onStatusChange, onDelete, className }: ShelfItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClick = () => {
    if (!isMenuOpen) {
      onSelect?.(item);
    }
  };

  const handleStatusChange = (status: ShelfStatus) => {
    onStatusChange?.(item, status);
  };

  const handleDelete = () => {
    onDelete?.(item);
  };

  // 호환성 점수 색상
  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text-gray-400';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div
      data-testid="shelf-item"
      className={cn(
        'relative flex gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50',
        onSelect && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      {/* 제품 이미지 */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {item.productImageUrl ? (
          <Image src={item.productImageUrl} alt={item.productName} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* 제품 정보 */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="truncate text-sm font-medium">{item.productName}</h3>
          {item.productBrand && (
            <p className="truncate text-xs text-muted-foreground">{item.productBrand}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 상태 뱃지 */}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              STATUS_COLORS[item.status]
            )}
          >
            {STATUS_LABELS[item.status]}
          </span>

          {/* 평점 */}
          {item.rating && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {item.rating}
            </span>
          )}

          {/* 호환성 점수 */}
          {item.compatibilityScore !== undefined && (
            <span className={cn('text-xs font-medium', getScoreColor(item.compatibilityScore))}>
              {item.compatibilityScore}점
            </span>
          )}
        </div>
      </div>

      {/* 메뉴 버튼 */}
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {item.status !== 'owned' && (
            <DropdownMenuItem onClick={() => handleStatusChange('owned')}>
              <Edit2 className="mr-2 h-4 w-4" />
              보유 중으로 변경
            </DropdownMenuItem>
          )}
          {item.status !== 'used_up' && (
            <DropdownMenuItem onClick={() => handleStatusChange('used_up')}>
              <Archive className="mr-2 h-4 w-4" />다 쓴 제품으로 변경
            </DropdownMenuItem>
          )}
          {item.status !== 'wishlist' && (
            <DropdownMenuItem onClick={() => handleStatusChange('wishlist')}>
              <Star className="mr-2 h-4 w-4" />
              위시리스트에 추가
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
