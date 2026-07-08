'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, ChevronDown, Star, Sparkles, Loader2, Shirt, ExternalLink } from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { BottomNav } from '@/components/BottomNav';
import { cn } from '@/lib/utils';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Skeleton } from '@/components/ui/skeleton';

// 제품 타입 — 평점/리뷰수/매칭률은 실데이터가 있을 때만 (임의 생성 금지, 2026-07-08)
interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  matchRate?: number;
  type: 'item' | 'outfit';
  imageUrl?: string;
  /** 외부 제품 링크 (affiliate_url) — 내부 상세 페이지 없음 */
  url?: string;
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
              // 평점/리뷰는 실데이터 없음 — 임의 생성하지 않음
              matchRate: userBodyTypeRaw && post.body_type === userBodyTypeRaw ? 95 : 70,
              type: 'outfit',
              imageUrl: post.image_url,
            })
          );
          setProducts(mappedProducts);
        } else {
          setProducts([]); // 가짜 폴백 대신 정직한 빈 상태
        }
      } else {
        // 패션 제품은 affiliate_products에서 가져옴 (실 필드만: rating/review_count/affiliate_url)
        const subcategories = categoryToSubcategory[slug] || [];
        let query = supabase
          .from('affiliate_products')
          .select(
            'id, name, brand, price_krw, image_url, subcategory, rating, review_count, affiliate_url'
          )
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
              rating: product.rating ?? undefined,
              reviewCount: product.review_count ?? undefined,
              // 매칭률은 근거 데이터 없음 — 임의 생성하지 않음
              type: 'item',
              imageUrl: product.image_url,
              url: product.affiliate_url ?? undefined,
            })
          );
          setProducts(mappedProducts);
        } else {
          setProducts([]); // 패션 제품 DB 미보유 — 정직한 빈 상태
        }
      }
    } catch (err) {
      console.error('[StyleCategory] Products fetch error:', err);
      setProducts([]);
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

  // 필터링 및 정렬된 제품 (matchRate/rating/reviewCount는 실데이터 있을 때만 존재)
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 매칭률 필터 — 매칭률 데이터가 있는 항목에만 적용 (없는 항목은 유지)
    if (matchFilterOn) {
      result = result.filter((p) => p.matchRate === undefined || p.matchRate >= minMatchRate);
    }

    // 정렬
    switch (sortBy) {
      case 'match':
        result.sort((a, b) => (b.matchRate ?? 0) - (a.matchRate ?? 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'review':
        result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
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

            {/* 빈 상태 — 패션 제품 DB 미보유 시 가짜 폴백 대신 정직한 안내 */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 bg-card rounded-xl border">
                <Shirt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium mb-1">아직 준비된 아이템이 없어요</p>
                <p className="text-sm text-muted-foreground mb-4">
                  내 옷장을 등록하면 갖고 있는 옷으로 코디를 추천해드려요
                </p>
                <button
                  onClick={() => router.push('/closet/add/batch')}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  옷장 등록하기
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {displayedItems.map((product, index) => {
                const cardContent = (
                  <>
                    {/* 매칭률 (실 계산값 있을 때만) */}
                    {(product.matchRate !== undefined || product.type === 'outfit') && (
                      <div className="flex items-center justify-between mb-2">
                        {product.matchRate !== undefined ? (
                          <span className="text-xs font-bold text-primary">
                            {product.matchRate}% 매칭
                          </span>
                        ) : (
                          <span />
                        )}
                        {product.type === 'outfit' && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            코디
                          </span>
                        )}
                      </div>
                    )}

                    {/* 이미지 */}
                    <div className="w-full aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-3xl">{product.type === 'outfit' ? '👔' : '👕'}</span>
                    </div>

                    {/* 정보 */}
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                    <p className="text-sm font-medium line-clamp-2 mt-0.5">{product.name}</p>

                    {/* 평점 (실데이터 있을 때만) */}
                    {product.rating !== undefined && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{product.rating}</span>
                        {product.reviewCount !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            ({product.reviewCount.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}

                    {/* 가격 (있을 때만) */}
                    {product.price > 0 && (
                      <p className="text-sm font-semibold mt-2">
                        {product.price.toLocaleString()}원
                      </p>
                    )}
                  </>
                );

                const cardClass =
                  'bg-card rounded-xl border p-3 text-left hover:shadow-md transition-shadow w-full block';

                // 코디 → 내부 상세 페이지 (실존 라우트)
                // 제품 → 외부 제품 링크 (기존 /style/{id} 내부 라우트는 404였음)
                // 링크 없는 제품 → 비링크 카드
                let card: React.ReactNode;
                if (product.type === 'outfit') {
                  card = (
                    <button
                      onClick={() => router.push(`/style/outfit/${product.id}`)}
                      className={cardClass}
                    >
                      {cardContent}
                    </button>
                  );
                } else if (product.url) {
                  card = (
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(cardClass, 'relative')}
                    >
                      <ExternalLink className="w-3 h-3 absolute top-3 right-3 text-muted-foreground" />
                      {cardContent}
                    </a>
                  );
                } else {
                  card = <div className={cardClass}>{cardContent}</div>;
                }

                return (
                  <FadeInUp key={product.id} delay={Math.min(index, 5) as 0 | 1 | 2 | 3 | 4 | 5}>
                    {card}
                  </FadeInUp>
                );
              })}
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
