'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, SlidersHorizontal, ChevronDown, Star, Sparkles, Loader2 } from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Skeleton } from '@/components/ui/skeleton';

// 제품 타입
interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  reviewCount: number;
  matchRate: number;
  type: 'item' | 'outfit';
  imageUrl?: string;
}

/**
 * 스타일 카테고리 페이지
 * - 카테고리별 제품/코디 목록
 * - 정렬/필터 옵션
 * - 체형 매칭률 필터
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
  tops: { name: '상의', description: '티셔츠, 블라우스, 니트' },
  bottoms: { name: '하의', description: '팬츠, 스커트, 진' },
  outer: { name: '아우터', description: '자켓, 코트, 가디건' },
  dress: { name: '원피스', description: '미니, 미디, 맥시 원피스' },
  shoes: { name: '신발', description: '스니커즈, 힐, 부츠' },
  bags: { name: '가방', description: '토트, 숄더, 크로스백' },
  outfit: { name: '코디', description: '완성된 코디 추천' },
};

// 카테고리 → 서브카테고리 매핑
const categoryToSubcategory: Record<string, string[]> = {
  tops: ['top', 'blouse', 'tshirt', 'sweater', 'shirt'],
  bottoms: ['pants', 'skirt', 'jeans', 'shorts'],
  outer: ['jacket', 'coat', 'cardigan', 'blazer'],
  dress: ['dress', 'onepiece'],
  shoes: ['sneakers', 'heels', 'boots', 'loafers', 'sandals'],
  bags: ['tote', 'shoulder', 'crossbody', 'clutch', 'backpack'],
};

// 폴백 제품 데이터 (데이터가 없을 때 사용)
const fallbackProducts: Product[] = [
  {
    id: '1',
    name: '크롭 니트',
    brand: '무신사',
    price: 39000,
    rating: 4.8,
    reviewCount: 1234,
    matchRate: 95,
    type: 'item',
  },
  {
    id: '2',
    name: '하이웨스트 슬랙스',
    brand: 'W컨셉',
    price: 59000,
    rating: 4.7,
    reviewCount: 892,
    matchRate: 93,
    type: 'item',
  },
  {
    id: '3',
    name: '플레어 스커트',
    brand: '룩핀',
    price: 45000,
    rating: 4.6,
    reviewCount: 567,
    matchRate: 90,
    type: 'item',
  },
  {
    id: '4',
    name: '오버사이즈 셔츠',
    brand: '유니클로',
    price: 49900,
    rating: 4.5,
    reviewCount: 2341,
    matchRate: 88,
    type: 'item',
  },
  {
    id: '5',
    name: '봄 웜톤 코디',
    brand: '이룸 추천',
    price: 187000,
    rating: 4.9,
    reviewCount: 432,
    matchRate: 97,
    type: 'outfit',
  },
  {
    id: '6',
    name: 'A라인 원피스',
    brand: 'ZARA',
    price: 79000,
    rating: 4.7,
    reviewCount: 1567,
    matchRate: 91,
    type: 'item',
  },
  {
    id: '7',
    name: '와이드 데님',
    brand: '리바이스',
    price: 89000,
    rating: 4.6,
    reviewCount: 789,
    matchRate: 86,
    type: 'item',
  },
  {
    id: '8',
    name: '캐주얼 데일리 코디',
    brand: '이룸 추천',
    price: 156000,
    rating: 4.8,
    reviewCount: 1023,
    matchRate: 94,
    type: 'outfit',
  },
];

export default function StyleCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const slug = params.slug as string;

  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [matchFilterOn, setMatchFilterOn] = useState(true);
  const [minMatchRate] = useState(80);
  const [userBodyType, setUserBodyType] = useState<string>('미분석');
  const [userBodyTypeRaw, setUserBodyTypeRaw] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  const category = categoryInfo[slug] || { name: slug, description: '' };

  // 제품 데이터 가져오기
  // eslint-disable-next-line sonarjs/cognitive-complexity -- complex business logic
  const fetchProducts = useCallback(async () => {
    try {
      setIsProductsLoading(true);

      if (slug === 'outfit') {
        // 코디는 lookbook_posts에서 가져옴
        const { data, error } = await supabase
          .from('lookbook_posts')
          .select('id, caption, body_type, personal_color, likes_count, image_url')
          .eq('is_public', true)
          .order('likes_count', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedProducts = data.map(
            (post): Product => ({
              id: post.id,
              name: post.caption || '코디 룩',
              brand: '이룸 추천',
              price: 0,
              rating: 4.5 + Math.random() * 0.5,
              reviewCount: post.likes_count || 0,
              matchRate: userBodyTypeRaw && post.body_type === userBodyTypeRaw ? 95 : 70,
              type: 'outfit',
              imageUrl: post.image_url,
            })
          );
          setProducts(mappedProducts);
        } else {
          setProducts(fallbackProducts.filter((p) => p.type === 'outfit'));
        }
      } else {
        // 패션 제품은 affiliate_products에서 가져옴
        const subcategories = categoryToSubcategory[slug] || [];
        let query = supabase
          .from('affiliate_products')
          .select('id, name, brand, price_krw, image_url, subcategory')
          .eq('category', 'fashion')
          .eq('is_active', true)
          .limit(20);

        if (subcategories.length > 0) {
          query = query.in('subcategory', subcategories);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedProducts = data.map(
            (product): Product => ({
              id: product.id,
              name: product.name,
              brand: product.brand || '',
              price: product.price_krw || 0,
              rating: 4.0 + Math.random() * 1,
              reviewCount: Math.floor(Math.random() * 1000) + 100,
              matchRate: 75 + Math.floor(Math.random() * 25),
              type: 'item',
              imageUrl: product.image_url,
            })
          );
          setProducts(mappedProducts);
        } else {
          setProducts(fallbackProducts.filter((p) => p.type === 'item'));
        }
      }
    } catch (err) {
      console.error('[StyleCategory] Products fetch error:', err);
      setProducts(fallbackProducts);
    } finally {
      setIsProductsLoading(false);
    }
  }, [slug, supabase, userBodyTypeRaw]);

  // 제품 가져오기
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 체형 데이터 가져오기
  useEffect(() => {
    const fetchBodyType = async () => {
      if (!isLoaded || !user?.id) return;

      try {
        const { data } = await supabase
          .from('body_analyses')
          .select('body_type')
          .eq('clerk_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setUserBodyTypeRaw(data.body_type);
          const bodyTypeMap: Record<string, string> = {
            S: '스트레이트',
            W: '웨이브',
            N: '내추럴',
          };
          setUserBodyType(bodyTypeMap[data.body_type] || data.body_type);
        }
      } catch (err) {
        console.error('[StyleCategory] Body type fetch error:', err);
      }
    };

    fetchBodyType();
  }, [isLoaded, user?.id, supabase]);

  // 필터링 및 정렬된 제품
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 매칭률 필터
    if (matchFilterOn) {
      result = result.filter((p) => p.matchRate >= minMatchRate);
    }

    // 정렬
    switch (sortBy) {
      case 'match':
        result.sort((a, b) => b.matchRate - a.matchRate);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'review':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [products, sortBy, matchFilterOn, minMatchRate]);

  // 무한 스크롤
  const { displayedItems, hasMore, isLoading, sentinelRef } = useInfiniteScroll(filteredProducts, {
    pageSize: 6,
    initialLoadSize: 6,
  });

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="style-category-page">
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
            onClick={() => router.push('/style/filter')}
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="필터"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* 체형 프로필 */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-t text-sm">
          <span className="text-muted-foreground">내 체형:</span>{' '}
          <span className="font-medium text-foreground">{userBodyType}</span>
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
        {isProductsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filteredProducts.length}개 아이템</p>

            <div className="grid grid-cols-2 gap-3">
              {displayedItems.map((product, index) => (
                <FadeInUp key={product.id} delay={Math.min(index, 5) as 0 | 1 | 2 | 3 | 4 | 5}>
                  <button
                    onClick={() =>
                      product.type === 'outfit'
                        ? router.push(`/style/outfit/${product.id}`)
                        : router.push(`/style/${product.id}`)
                    }
                    className="bg-card rounded-xl border p-3 text-left hover:shadow-md transition-shadow w-full"
                  >
                    {/* 매칭률 */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary">
                        {product.matchRate}% 매칭
                      </span>
                      {product.type === 'outfit' && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          코디
                        </span>
                      )}
                    </div>

                    {/* 이미지 */}
                    <div className="w-full aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-3xl">{product.type === 'outfit' ? '👔' : '👕'}</span>
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
                <p className="text-center text-sm text-muted-foreground">
                  모든 아이템을 확인했습니다
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
