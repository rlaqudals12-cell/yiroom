'use client';

/**
 * ShoppingRecommend 컴포넌트
 *
 * 쇼핑 추천 UI (외부 링크 연결)
 * - 부족한 아이템 추천
 * - 외부 쇼핑몰 딥링크
 * - 가격 비교 정보
 * - 어필리에이트 링크 지원
 *
 * @module components/fashion/ShoppingRecommend
 * @see docs/adr/ADR-050-fashion-closet-crossmodule.md
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md K-2
 */

import { useState, useCallback } from 'react';
import {
  ShoppingBag,
  ExternalLink,
  TrendingUp,
  Sparkles,
  Tag,
  Store,
  Heart,
  Filter,
  ArrowUpDown,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { OutfitItem, StyleCategory } from '@/lib/fashion';
import { STYLE_CATEGORY_LABELS } from '@/lib/fashion';

// 쇼핑몰 정보
interface ShopInfo {
  id: string;
  name: string;
  logo?: string;
  color: string;
}

const SHOPS: Record<string, ShopInfo> = {
  musinsa: { id: 'musinsa', name: '무신사', color: '#000000' },
  zigzag: { id: 'zigzag', name: '지그재그', color: '#FF3F6C' },
  wconcept: { id: 'wconcept', name: 'W컨셉', color: '#000000' },
  ssf: { id: 'ssf', name: 'SSF샵', color: '#1A1A1A' },
  ably: { id: 'ably', name: '에이블리', color: '#FF6B6B' },
  coupang: { id: 'coupang', name: '쿠팡', color: '#E52628' },
};

// 쇼핑 추천 아이템 타입
export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  color?: string;
  colorName?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl?: string;
  shopId: string;
  productUrl: string;
  affiliateUrl?: string;
  matchRate?: number;
  isTrending?: boolean;
  isRecommended?: boolean;
  tags?: string[];
  reason?: string;
}

// 정렬 옵션
type SortOption = 'match' | 'price_low' | 'price_high' | 'discount' | 'popular';

// 필터 옵션
interface FilterOptions {
  shops: string[];
  priceRange: 'all' | 'under50k' | '50k-100k' | '100k-200k' | 'over200k';
  onlyDiscount: boolean;
  onlyTrending: boolean;
}

interface ShoppingRecommendProps {
  /** 추천 쇼핑 아이템 목록 */
  items: ShoppingItem[];
  /** 부족한 아이템 (코디에 필요하지만 옷장에 없는 것) */
  missingItems?: OutfitItem[];
  /** 스타일 카테고리 */
  styleCategory?: StyleCategory;
  /** 아이템 클릭 시 콜백 */
  onItemClick?: (item: ShoppingItem) => void;
  /** 위시리스트 추가 콜백 */
  onAddToWishlist?: (item: ShoppingItem) => void;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 쇼핑 추천 컴포넌트
 */
export function ShoppingRecommend({
  items,
  missingItems = [],
  styleCategory = 'casual',
  onItemClick,
  onAddToWishlist,
  className,
}: ShoppingRecommendProps) {
  // 상태
  const [sortOption, setSortOption] = useState<SortOption>('match');
  const [filters, setFilters] = useState<FilterOptions>({
    shops: [],
    priceRange: 'all',
    onlyDiscount: false,
    onlyTrending: false,
  });
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // 필터링 및 정렬된 아이템
  const filteredAndSortedItems = (() => {
    let result = [...items];

    // 쇼핑몰 필터
    if (filters.shops.length > 0) {
      result = result.filter((item) => filters.shops.includes(item.shopId));
    }

    // 가격대 필터
    if (filters.priceRange !== 'all') {
      result = result.filter((item) => {
        switch (filters.priceRange) {
          case 'under50k':
            return item.price < 50000;
          case '50k-100k':
            return item.price >= 50000 && item.price < 100000;
          case '100k-200k':
            return item.price >= 100000 && item.price < 200000;
          case 'over200k':
            return item.price >= 200000;
          default:
            return true;
        }
      });
    }

    // 할인 필터
    if (filters.onlyDiscount) {
      result = result.filter((item) => item.discountRate && item.discountRate > 0);
    }

    // 트렌드 필터
    if (filters.onlyTrending) {
      result = result.filter((item) => item.isTrending);
    }

    // 정렬
    switch (sortOption) {
      case 'match':
        result.sort((a, b) => (b.matchRate ?? 0) - (a.matchRate ?? 0));
        break;
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        result.sort((a, b) => (b.discountRate ?? 0) - (a.discountRate ?? 0));
        break;
      case 'popular':
        result.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
        break;
    }

    return result;
  })();

  // 활성 필터 개수
  const activeFilterCount =
    filters.shops.length +
    (filters.priceRange !== 'all' ? 1 : 0) +
    (filters.onlyDiscount ? 1 : 0) +
    (filters.onlyTrending ? 1 : 0);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    setFilters({
      shops: [],
      priceRange: 'all',
      onlyDiscount: false,
      onlyTrending: false,
    });
  }, []);

  // 위시리스트 토글
  const toggleWishlist = useCallback(
    (item: ShoppingItem) => {
      setWishlist((prev) => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
          onAddToWishlist?.(item);
        }
        return next;
      });
    },
    [onAddToWishlist]
  );

  // 외부 링크 열기
  const handleOpenLink = useCallback(
    (item: ShoppingItem) => {
      const url = item.affiliateUrl || item.productUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
      onItemClick?.(item);
    },
    [onItemClick]
  );

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className={cn('space-y-4', className)} data-testid="shopping-recommend">
      {/* 부족한 아이템 안내 */}
      {missingItems.length > 0 && (
        <Card className="border-primary/50 bg-primary/5" data-testid="missing-items">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              코디 완성에 필요한 아이템
            </CardTitle>
            <CardDescription>
              {STYLE_CATEGORY_LABELS[styleCategory]} 스타일 코디를 완성하려면 아래 아이템이
              필요해요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingItems.map((item, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="gap-1 py-1.5 px-3"
                >
                  <div
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 필터 및 정렬 컨트롤 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* 필터 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                필터
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {/* 쇼핑몰 필터 */}
              <DropdownMenuLabel className="flex items-center gap-1">
                <Store className="h-3 w-3" />
                쇼핑몰
              </DropdownMenuLabel>
              {Object.values(SHOPS).map((shop) => (
                <DropdownMenuCheckboxItem
                  key={shop.id}
                  checked={filters.shops.includes(shop.id)}
                  onCheckedChange={(checked) => {
                    setFilters((prev) => ({
                      ...prev,
                      shops: checked
                        ? [...prev.shops, shop.id]
                        : prev.shops.filter((s) => s !== shop.id),
                    }));
                  }}
                >
                  {shop.name}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              {/* 가격대 필터 */}
              <DropdownMenuLabel className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                가격대
              </DropdownMenuLabel>
              {[
                { value: 'all', label: '전체' },
                { value: 'under50k', label: '5만원 미만' },
                { value: '50k-100k', label: '5-10만원' },
                { value: '100k-200k', label: '10-20만원' },
                { value: 'over200k', label: '20만원 이상' },
              ].map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.priceRange === option.value}
                  onCheckedChange={() => {
                    setFilters((prev) => ({
                      ...prev,
                      priceRange: option.value as FilterOptions['priceRange'],
                    }));
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              {/* 기타 필터 */}
              <DropdownMenuCheckboxItem
                checked={filters.onlyDiscount}
                onCheckedChange={(checked) => {
                  setFilters((prev) => ({ ...prev, onlyDiscount: checked }));
                }}
              >
                할인 상품만
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.onlyTrending}
                onCheckedChange={(checked) => {
                  setFilters((prev) => ({ ...prev, onlyTrending: checked }));
                }}
              >
                트렌드 상품만
              </DropdownMenuCheckboxItem>

              {activeFilterCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-destructive hover:text-destructive"
                    onClick={clearFilters}
                  >
                    필터 초기화
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 정렬 옵션 */}
          <Select
            value={sortOption}
            onValueChange={(v) => setSortOption(v as SortOption)}
          >
            <SelectTrigger className="w-32 h-9">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">매칭도순</SelectItem>
              <SelectItem value="price_low">낮은 가격순</SelectItem>
              <SelectItem value="price_high">높은 가격순</SelectItem>
              <SelectItem value="discount">할인율순</SelectItem>
              <SelectItem value="popular">인기순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Badge variant="secondary">{filteredAndSortedItems.length}개 상품</Badge>
      </div>

      {/* 상품 목록 */}
      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="shopping-items">
          {filteredAndSortedItems.map((item) => {
            const shop = SHOPS[item.shopId];
            const isInWishlist = wishlist.has(item.id);

            return (
              <Card
                key={item.id}
                className="group overflow-hidden hover:shadow-md transition-shadow"
                data-testid={`shopping-item-${item.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* 상품 이미지/색상 */}
                    <div className="relative shrink-0">
                      {item.imageUrl ? (
                        <div
                          className="w-24 h-24 rounded-lg bg-cover bg-center border"
                          style={{ backgroundImage: `url(${item.imageUrl})` }}
                        />
                      ) : (
                        <div
                          className="w-24 h-24 rounded-lg border shadow-inner"
                          style={{ backgroundColor: item.color || '#e5e5e5' }}
                        />
                      )}
                      {/* 매칭도 배지 */}
                      {item.matchRate && item.matchRate >= 80 && (
                        <Badge
                          className="absolute -top-2 -right-2 bg-primary text-xs"
                        >
                          {item.matchRate}%
                        </Badge>
                      )}
                    </div>

                    {/* 상품 정보 */}
                    <div className="flex-1 min-w-0">
                      {/* 상품명 및 태그 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.category}
                            {item.colorName && ` | ${item.colorName}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => toggleWishlist(item)}
                        >
                          <Heart
                            className={cn(
                              'h-4 w-4',
                              isInWishlist && 'fill-red-500 text-red-500'
                            )}
                          />
                        </Button>
                      </div>

                      {/* 태그 */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.isTrending && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <TrendingUp className="h-3 w-3" />
                            트렌드
                          </Badge>
                        )}
                        {item.isRecommended && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Sparkles className="h-3 w-3" />
                            추천
                          </Badge>
                        )}
                      </div>

                      {/* 가격 */}
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-lg font-bold">
                          {formatPrice(item.price)}원
                        </span>
                        {item.originalPrice && item.discountRate && (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(item.originalPrice)}원
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {item.discountRate}%
                            </Badge>
                          </>
                        )}
                      </div>

                      {/* 쇼핑몰 및 구매 버튼 */}
                      <div className="flex items-center justify-between mt-3">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: shop?.color,
                            color: shop?.color,
                          }}
                        >
                          {shop?.name || item.shopId}
                        </Badge>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleOpenLink(item)}
                        >
                          구매하기
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* 추천 이유 */}
                      {item.reason && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card data-testid="empty-results">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">조건에 맞는 상품이 없어요</h3>
            <p className="text-sm text-muted-foreground mb-4">
              필터 조건을 변경해보세요.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              필터 초기화
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * 쇼핑 아이템 카드 (개별 사용용)
 */
interface ShoppingItemCardProps {
  item: ShoppingItem;
  onBuyClick?: (item: ShoppingItem) => void;
  onWishlistClick?: (item: ShoppingItem) => void;
  isInWishlist?: boolean;
  className?: string;
}

export function ShoppingItemCard({
  item,
  onBuyClick,
  onWishlistClick,
  isInWishlist = false,
  className,
}: ShoppingItemCardProps) {
  const shop = SHOPS[item.shopId];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <Card
      className={cn('group overflow-hidden hover:shadow-md transition-shadow', className)}
      data-testid="shopping-item-card"
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* 이미지/색상 */}
          <div className="relative shrink-0">
            {item.imageUrl ? (
              <div
                className="w-20 h-20 rounded-lg bg-cover bg-center border"
                style={{ backgroundImage: `url(${item.imageUrl})` }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-lg border shadow-inner"
                style={{ backgroundColor: item.color || '#e5e5e5' }}
              />
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground mb-2">{item.category}</p>

            <div className="flex items-baseline gap-2">
              <span className="font-bold">{formatPrice(item.price)}원</span>
              {item.discountRate && (
                <Badge variant="destructive" className="text-xs">
                  {item.discountRate}%
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="text-xs">
                {shop?.name || item.shopId}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onWishlistClick?.(item)}
                >
                  <Heart
                    className={cn(
                      'h-4 w-4',
                      isInWishlist && 'fill-red-500 text-red-500'
                    )}
                  />
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1"
                  onClick={() => onBuyClick?.(item)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ShoppingRecommend;
