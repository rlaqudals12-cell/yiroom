'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, SlidersHorizontal, ChevronDown, Star, Sparkles } from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 뷰티 카테고리 페이지
 * - 카테고리별 제품 목록
 * - 정렬/필터 옵션
 * - 매칭률 필터
 */

type SortOption = 'match' | 'rating' | 'review' | 'price_low' | 'price_high';

const sortOptions: { id: SortOption; label: string }[] = [
  { id: 'match', label: '매칭률순' },
  { id: 'rating', label: '평점순' },
  { id: 'review', label: '리뷰순' },
  { id: 'price_low', label: '가격 낮은순' },
  { id: 'price_high', label: '가격 높은순' },
];

// 카테고리 정보
const categoryInfo: Record<string, { name: string; description: string }> = {
  skincare: { name: '스킨케어', description: '피부 타입에 맞는 기초 케어' },
  makeup: { name: '메이크업', description: '퍼스널컬러 맞춤 색조' },
  hair: { name: '헤어', description: '두피/모발 맞춤 케어' },
  body: { name: '바디', description: '보디 케어 제품' },
  suncare: { name: '선케어', description: '자외선 차단 제품' },
};

// 임시 제품 데이터
const mockProducts = [
  {
    id: '1',
    name: '비타민C 15% 세럼',
    brand: '이룸 스킨',
    price: 32000,
    rating: 4.8,
    reviewCount: 1234,
    matchRate: 95,
  },
  {
    id: '2',
    name: '히알루론산 토너',
    brand: '클린뷰티',
    price: 28000,
    rating: 4.7,
    reviewCount: 892,
    matchRate: 92,
  },
  {
    id: '3',
    name: '레티놀 0.5% 크림',
    brand: '스킨랩',
    price: 45000,
    rating: 4.6,
    reviewCount: 567,
    matchRate: 88,
  },
  {
    id: '4',
    name: '나이아신아마이드 세럼',
    brand: '더마솔루션',
    price: 38000,
    rating: 4.9,
    reviewCount: 2341,
    matchRate: 97,
  },
  {
    id: '5',
    name: '세라마이드 크림',
    brand: '베리어랩',
    price: 52000,
    rating: 4.5,
    reviewCount: 432,
    matchRate: 85,
  },
  {
    id: '6',
    name: 'AHA/BHA 필링 패드',
    brand: '코스알엑스',
    price: 24000,
    rating: 4.7,
    reviewCount: 1567,
    matchRate: 90,
  },
  {
    id: '7',
    name: '수분 앰플',
    brand: '닥터지',
    price: 35000,
    rating: 4.6,
    reviewCount: 789,
    matchRate: 93,
  },
  {
    id: '8',
    name: '시카 밤',
    brand: '라로슈포제',
    price: 42000,
    rating: 4.8,
    reviewCount: 1023,
    matchRate: 91,
  },
];

export default function BeautyCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [matchFilterOn, setMatchFilterOn] = useState(true);
  const [minMatchRate] = useState(80);

  const category = categoryInfo[slug] || { name: slug, description: '' };

  // 필터링 및 정렬된 제품
  const filteredProducts = useMemo(() => {
    let products = [...mockProducts];

    // 매칭률 필터
    if (matchFilterOn) {
      products = products.filter((p) => p.matchRate >= minMatchRate);
    }

    // 정렬
    switch (sortBy) {
      case 'match':
        products.sort((a, b) => b.matchRate - a.matchRate);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
      case 'review':
        products.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'price_low':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        products.sort((a, b) => b.price - a.price);
        break;
    }

    return products;
  }, [sortBy, matchFilterOn, minMatchRate]);

  // 무한 스크롤
  const { displayedItems, hasMore, isLoading, sentinelRef } = useInfiniteScroll(filteredProducts, {
    pageSize: 6,
    initialLoadSize: 6,
  });

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="beauty-category-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold">{category.name}</h1>
              {category.description && (
                <p className="text-xs text-muted-foreground">{category.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push(`/beauty/category/${slug}?filter=open`)}
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="필터"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* 필터/정렬 바 */}
        <div className="flex items-center justify-between px-4 py-2 border-t">
          {/* 매칭률 필터 */}
          <button
            onClick={() => setMatchFilterOn(!matchFilterOn)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
              matchFilterOn
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Sparkles className="w-4 h-4" />
            {minMatchRate}% 이상
          </button>

          {/* 정렬 */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {sortOptions.find((o) => o.id === sortBy)?.label}
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id);
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors',
                      sortBy === option.id && 'text-primary font-medium'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 제품 목록 */}
      <div className="px-4 py-4">
        <p className="text-sm text-muted-foreground mb-4">{filteredProducts.length}개 제품</p>

        <div className="grid grid-cols-2 gap-3">
          {displayedItems.map((product, index) => (
            <FadeInUp key={product.id} delay={Math.min(index, 5) as 0 | 1 | 2 | 3 | 4 | 5}>
              <button
                onClick={() => router.push(`/beauty/${product.id}`)}
                className="bg-card rounded-xl border p-3 text-left hover:shadow-md transition-shadow w-full"
              >
                {/* 매칭률 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary">{product.matchRate}% 매칭</span>
                </div>

                {/* 이미지 */}
                <div className="w-full aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-3xl">💄</span>
                </div>

                {/* 정보 */}
                <p className="text-xs text-muted-foreground">{product.brand}</p>
                <p className="text-sm font-medium line-clamp-2 mt-0.5">{product.name}</p>

                {/* 평점 */}
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">
                    ({product.reviewCount.toLocaleString()})
                  </span>
                </div>

                {/* 가격 */}
                <p className="text-sm font-semibold mt-2">{product.price.toLocaleString()}원</p>
              </button>
            </FadeInUp>
          ))}
        </div>

        {/* 무한 스크롤 트리거 */}
        <div ref={sentinelRef} className="py-4">
          {isLoading && (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card rounded-xl border p-3">
                  <Skeleton className="h-3 w-12 mb-2" />
                  <Skeleton className="w-full aspect-square rounded-lg mb-3" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-3 w-20 mt-2" />
                  <Skeleton className="h-4 w-16 mt-2" />
                </div>
              ))}
            </div>
          )}
          {!hasMore && displayedItems.length > 0 && (
            <p className="text-center text-sm text-muted-foreground">모든 제품을 확인했습니다</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
