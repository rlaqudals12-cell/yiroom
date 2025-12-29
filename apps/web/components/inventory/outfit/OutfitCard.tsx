'use client';

/**
 * 저장된 코디 카드 컴포넌트
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MoreVertical, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CollageView } from './CollageView';
import type { SavedOutfit, InventoryItem } from '@/types/inventory';
import { SEASON_LABELS, OCCASION_LABELS, Season, Occasion } from '@/types/inventory';

interface OutfitCardProps {
  outfit: SavedOutfit;
  items?: InventoryItem[];
  onSelect?: (outfit: SavedOutfit) => void;
  onEdit?: (outfit: SavedOutfit) => void;
  onDelete?: (outfit: SavedOutfit) => void;
  onWear?: (outfit: SavedOutfit) => void;
}

export function OutfitCard({
  outfit,
  items = [],
  onSelect,
  onEdit,
  onDelete,
  onWear,
}: OutfitCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 코디에 포함된 아이템들
  const outfitItems = items.filter((item) => outfit.itemIds.includes(item.id));

  const handleClick = () => {
    if (onSelect && !isMenuOpen) {
      onSelect(outfit);
    }
  };

  return (
    <div
      data-testid="outfit-card"
      onClick={handleClick}
      className={cn(
        'group bg-card border rounded-xl overflow-hidden transition-all',
        onSelect && 'cursor-pointer hover:shadow-md'
      )}
    >
      {/* 콜라주 이미지 */}
      <div className="relative">
        {outfit.collageImageUrl ? (
          <div className="aspect-[3/4] bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outfit.collageImageUrl}
              alt={outfit.name || '코디'}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <CollageView items={outfitItems} layout="stack" size="md" />
          </div>
        )}

        {/* 더보기 메뉴 */}
        {(onEdit || onDelete || onWear) && (
          <div className="absolute top-2 right-2">
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onWear && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onWear(outfit);
                    }}
                  >
                    착용 기록
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(outfit);
                    }}
                  >
                    수정
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(outfit);
                    }}
                    className="text-destructive"
                  >
                    삭제
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="p-3 space-y-2">
        {/* 이름 */}
        <h3 className="font-medium truncate">
          {outfit.name || `코디 ${outfit.itemIds.length}벌`}
        </h3>

        {/* 시즌/상황 태그 */}
        <div className="flex flex-wrap gap-1">
          {outfit.season.slice(0, 2).map((season) => (
            <Badge key={season} variant="outline" className="text-[10px] px-1.5 py-0">
              {SEASON_LABELS[season as Season]}
            </Badge>
          ))}
          {outfit.occasion && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {OCCASION_LABELS[outfit.occasion as Occasion]}
            </Badge>
          )}
        </div>

        {/* 착용 정보 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{outfit.wearCount}회</span>
          </div>
          {outfit.lastWornAt && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {format(new Date(outfit.lastWornAt), 'M/d', { locale: ko })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
