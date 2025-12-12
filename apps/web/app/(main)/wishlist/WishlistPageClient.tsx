'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, Package, Sparkles, Pill, Dumbbell, Leaf, Loader2, Trash2 } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { getUserWishlist, removeFromWishlist } from '@/lib/wishlist';
import {
  getCosmeticProductById,
  getSupplementProductById,
  getWorkoutEquipmentById,
  getHealthFoodById,
} from '@/lib/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Link from 'next/link';
import type { ProductType, AnyProduct } from '@/types/product';
import type { WishlistItem } from '@/lib/wishlist';

interface WishlistPageClientProps {
  clerkUserId: string;
}

const PRODUCT_TYPE_LABELS: Record<ProductType, { label: string; icon: React.ReactNode }> = {
  cosmetic: { label: '화장품', icon: <Sparkles className="h-4 w-4" /> },
  supplement: { label: '영양제', icon: <Pill className="h-4 w-4" /> },
  workout_equipment: { label: '운동기구', icon: <Dumbbell className="h-4 w-4" /> },
  health_food: { label: '건강식품', icon: <Leaf className="h-4 w-4" /> },
};

export function WishlistPageClient({ clerkUserId }: WishlistPageClientProps) {
  const supabase = useClerkSupabaseClient();
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [products, setProducts] = useState<Map<string, AnyProduct>>(new Map());
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // 위시리스트 로드
  const loadWishlist = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);
    try {
      const items = await getUserWishlist(supabase, clerkUserId);
      setWishlists(items);

      // 제품 상세 정보 로드
      const productMap = new Map<string, AnyProduct>();

      await Promise.all(
        items.map(async (item) => {
          const key = `${item.productType}:${item.productId}`;
          let product: AnyProduct | null = null;

          switch (item.productType) {
            case 'cosmetic':
              product = await getCosmeticProductById(item.productId);
              break;
            case 'supplement':
              product = await getSupplementProductById(item.productId);
              break;
            case 'workout_equipment':
              product = await getWorkoutEquipmentById(item.productId);
              break;
            case 'health_food':
              product = await getHealthFoodById(item.productId);
              break;
          }

          if (product) {
            productMap.set(key, product);
          }
        })
      );

      setProducts(productMap);
    } catch (error) {
      console.error('위시리스트 로드 실패:', error);
      toast.error('위시리스트를 불러오는데 실패했어요');
    } finally {
      setLoading(false);
    }
  }, [supabase, clerkUserId]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // 위시리스트에서 제거
  const handleRemove = async (item: WishlistItem) => {
    if (!supabase) return;

    setRemovingIds((prev) => new Set(prev).add(item.id));

    try {
      const result = await removeFromWishlist(
        supabase,
        clerkUserId,
        item.productType,
        item.productId
      );

      if (result.success) {
        setWishlists((prev) => prev.filter((w) => w.id !== item.id));
        toast.success('위시리스트에서 제거했어요');
      } else {
        toast.error('제거에 실패했어요');
      }
    } catch (error) {
      console.error('위시리스트 제거 실패:', error);
      toast.error('오류가 발생했어요');
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // 타입별 필터링
  const getItemsByType = (type: ProductType | 'all') => {
    if (type === 'all') return wishlists;
    return wishlists.filter((item) => item.productType === type);
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (wishlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-10 w-10 text-pink-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">위시리스트가 비어있어요</h2>
        <p className="text-gray-500 text-center mb-6">
          관심 있는 제품에 하트를 눌러 추가해 보세요
        </p>
        <Link href="/products">
          <Button className="gap-2">
            <Package className="h-4 w-4" />
            제품 둘러보기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        위시리스트
        <span className="text-pink-500 text-lg font-normal ml-2">
          {wishlists.length}개
        </span>
      </h1>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto mb-4">
          <TabsTrigger value="all" className="gap-1">
            전체 ({wishlists.length})
          </TabsTrigger>
          {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((type) => {
            const count = getItemsByType(type).length;
            if (count === 0) return null;
            return (
              <TabsTrigger key={type} value={type} className="gap-1">
                {PRODUCT_TYPE_LABELS[type].icon}
                {PRODUCT_TYPE_LABELS[type].label} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="all">
          <WishlistGrid
            items={wishlists}
            products={products}
            onRemove={handleRemove}
            removingIds={removingIds}
            formatPrice={formatPrice}
          />
        </TabsContent>

        {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((type) => (
          <TabsContent key={type} value={type}>
            <WishlistGrid
              items={getItemsByType(type)}
              products={products}
              onRemove={handleRemove}
              removingIds={removingIds}
              formatPrice={formatPrice}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface WishlistGridProps {
  items: WishlistItem[];
  products: Map<string, AnyProduct>;
  onRemove: (item: WishlistItem) => void;
  removingIds: Set<string>;
  formatPrice: (price: number) => string;
}

function WishlistGrid({
  items,
  products,
  onRemove,
  removingIds,
  formatPrice,
}: WishlistGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => {
        const key = `${item.productType}:${item.productId}`;
        const product = products.get(key);
        const isRemoving = removingIds.has(item.id);

        if (!product) {
          return (
            <Card key={item.id} className="opacity-50">
              <CardContent className="p-4">
                <p className="text-gray-500">제품 정보를 불러올 수 없어요</p>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href={`/products/${item.productType}/${item.productId}`}>
                <div className="flex gap-4">
                  {/* 제품 이미지 */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-300" />
                    )}
                  </div>

                  {/* 제품 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">{product.brand}</p>
                    <p className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">
                      {product.name}
                    </p>
                    <p className="text-pink-600 font-semibold">
                      {product.priceKrw ? `${formatPrice(product.priceKrw)}원` : '가격 정보 없음'}
                    </p>
                  </div>
                </div>
              </Link>

              {/* 제거 버튼 */}
              <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(item)}
                  disabled={isRemoving}
                  className="text-gray-400 hover:text-red-500 gap-1"
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  제거
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
