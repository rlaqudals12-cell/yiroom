'use client';

import { useState, useEffect } from 'react';
import { Heart, Ban, Search, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { FavoriteItem } from '@/types/hybrid';

// 인기 성분 목록 (자동완성용)
const POPULAR_INGREDIENTS = [
  { name: '히알루론산', nameEn: 'Hyaluronic Acid' },
  { name: '나이아신아마이드', nameEn: 'Niacinamide' },
  { name: '레티놀', nameEn: 'Retinol' },
  { name: '비타민C', nameEn: 'Vitamin C' },
  { name: '세라마이드', nameEn: 'Ceramide' },
  { name: '살리실산', nameEn: 'Salicylic Acid' },
  { name: '글리콜산', nameEn: 'Glycolic Acid' },
  { name: '펩타이드', nameEn: 'Peptide' },
  { name: '티트리', nameEn: 'Tea Tree' },
  { name: '센텔라', nameEn: 'Centella Asiatica' },
  { name: '알로에', nameEn: 'Aloe Vera' },
  { name: '콜라겐', nameEn: 'Collagen' },
];

export interface IngredientFavoriteFilterProps {
  /** 현재 즐겨찾기 성분 */
  favorites: FavoriteItem[];
  /** 현재 기피 성분 */
  avoids: FavoriteItem[];
  /** 즐겨찾기 변경 콜백 */
  onFavoritesChange: (favorites: FavoriteItem[]) => void;
  /** 기피 변경 콜백 */
  onAvoidsChange: (avoids: FavoriteItem[]) => void;
  /** 추가 className */
  className?: string;
}

/**
 * 성분 즐겨찾기 필터 (Beauty 도메인)
 * - 좋아하는 성분 / 기피 성분 관리
 * - 검색 및 자동완성
 * - Sheet(바텀시트) UI
 */
export function IngredientFavoriteFilter({
  favorites,
  avoids,
  onFavoritesChange,
  onAvoidsChange,
  className,
}: IngredientFavoriteFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'favorites' | 'avoids'>('favorites');
  const [suggestions, setSuggestions] = useState<typeof POPULAR_INGREDIENTS>([]);

  // 검색어 변경 시 자동완성
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = POPULAR_INGREDIENTS.filter(
        (ing) =>
          ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ing.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  // 성분 추가
  const handleAddIngredient = (name: string, nameEn?: string) => {
    const newItem: FavoriteItem = {
      id: `temp-${Date.now()}`,
      clerkUserId: '',
      domain: 'beauty',
      itemType: 'ingredient',
      itemName: name,
      itemNameEn: nameEn,
      isFavorite: activeTab === 'favorites',
      createdAt: new Date().toISOString(),
    };

    if (activeTab === 'favorites') {
      // 중복 체크
      if (!favorites.some((f) => f.itemName === name)) {
        onFavoritesChange([...favorites, newItem]);
      }
    } else {
      if (!avoids.some((a) => a.itemName === name)) {
        onAvoidsChange([...avoids, newItem]);
      }
    }

    setSearchQuery('');
  };

  // 성분 제거
  const handleRemoveIngredient = (itemName: string, isFavorite: boolean) => {
    if (isFavorite) {
      onFavoritesChange(favorites.filter((f) => f.itemName !== itemName));
    } else {
      onAvoidsChange(avoids.filter((a) => a.itemName !== itemName));
    }
  };

  const totalCount = favorites.length + avoids.length;

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid="ingredient-favorite-filter">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Heart className="h-4 w-4 text-pink-500" aria-hidden="true" />
            성분 필터
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {totalCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>성분 즐겨찾기 관리</SheetTitle>
          </SheetHeader>

          {/* 탭 */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === 'favorites' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('favorites')}
              className="flex-1 gap-2"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              좋아요 ({favorites.length})
            </Button>
            <Button
              variant={activeTab === 'avoids' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('avoids')}
              className="flex-1 gap-2"
            >
              <Ban className="h-4 w-4" aria-hidden="true" />
              기피 ({avoids.length})
            </Button>
          </div>

          {/* 검색 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="성분 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />

            {/* 자동완성 드롭다운 */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {suggestions.map((ing) => (
                  <button
                    key={ing.name}
                    onClick={() => handleAddIngredient(ing.name, ing.nameEn)}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex items-center justify-between"
                  >
                    <span>{ing.name}</span>
                    <span className="text-xs text-muted-foreground">{ing.nameEn}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 직접 입력 버튼 */}
          {searchQuery.trim() && !suggestions.some((s) => s.name === searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddIngredient(searchQuery.trim())}
              className="mb-4 w-full gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              &quot;{searchQuery}&quot; 추가하기
            </Button>
          )}

          {/* 선택된 성분 목록 */}
          <div className="space-y-2 overflow-y-auto flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {activeTab === 'favorites' ? '좋아하는 성분' : '기피 성분'}
            </p>

            <div className="flex flex-wrap gap-2">
              {(activeTab === 'favorites' ? favorites : avoids).map((item) => (
                <Badge
                  key={item.itemName}
                  variant="secondary"
                  className={cn(
                    'gap-1 pr-1',
                    activeTab === 'favorites'
                      ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  )}
                >
                  {activeTab === 'favorites' ? (
                    <Heart className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Ban className="h-3 w-3" aria-hidden="true" />
                  )}
                  {item.itemName}
                  <button
                    onClick={() => handleRemoveIngredient(item.itemName, activeTab === 'favorites')}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </Badge>
              ))}

              {(activeTab === 'favorites' ? favorites : avoids).length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  {activeTab === 'favorites'
                    ? '좋아하는 성분을 추가해주세요'
                    : '기피 성분을 추가해주세요'}
                </p>
              )}
            </div>
          </div>

          {/* 인기 성분 추천 */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">인기 성분</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_INGREDIENTS.slice(0, 6).map((ing) => (
                <Button
                  key={ing.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddIngredient(ing.name, ing.nameEn)}
                  className="text-xs"
                  disabled={
                    favorites.some((f) => f.itemName === ing.name) ||
                    avoids.some((a) => a.itemName === ing.name)
                  }
                >
                  {ing.name}
                </Button>
              ))}
            </div>
          </div>

          <SheetFooter className="mt-4">
            <Button className="w-full" onClick={() => setIsOpen(false)}>
              완료
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* 활성 필터 배지 표시 */}
      {favorites.length > 0 && (
        <Badge variant="secondary" className="gap-1 bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
          <Heart className="h-3 w-3" aria-hidden="true" />
          {favorites.length}
        </Badge>
      )}
      {avoids.length > 0 && (
        <Badge variant="secondary" className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <Ban className="h-3 w-3" aria-hidden="true" />
          {avoids.length}
        </Badge>
      )}
    </div>
  );
}

export default IngredientFavoriteFilter;
