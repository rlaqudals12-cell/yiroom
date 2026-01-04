'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Timer, Zap, Star, ChevronRight, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

/**
 * 타임딜 제품 타입
 */
interface TimeDealProduct {
  id: string;
  name: string;
  brand: string;
  originalPrice: number;
  salePrice: number;
  discountRate: number;
  imageUrl: string;
  rating: number;
  reviews: number;
  stock: number;
  soldCount: number;
}

/**
 * 타임딜 섹션 Props
 */
interface TimeDealSectionProps {
  className?: string;
}

// 할인율 옵션 (30%, 40%, 50%)
const DISCOUNT_RATES = [30, 40, 50];

// 이미지 placeholder 생성
function getProductImageUrl(imageUrl: string | null | undefined, brand: string): string {
  if (imageUrl) return imageUrl;
  const colors = ['fce7f3', 'dbeafe', 'd1fae5', 'fef3c7', 'ede9fe', 'ffedd5'];
  const colorIndex = brand.charCodeAt(0) % colors.length;
  return `https://placehold.co/200x200/${colors[colorIndex]}/${colors[colorIndex]}`;
}

/**
 * 남은 시간 계산 (오늘 자정까지)
 */
function getRemainingTime(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight.getTime() - now.getTime();

  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

/**
 * 타임딜 섹션 (화해/올리브영 스타일)
 * - DB에서 인기 제품 불러와서 타임딜로 표시
 * - 실시간 카운트다운
 * - 재고 소진율 표시
 */
export function TimeDealSection({ className }: TimeDealSectionProps) {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();
  const [timeLeft, setTimeLeft] = useState(getRemainingTime());
  const [deals, setDeals] = useState<TimeDealProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // DB에서 인기 제품 로드
  useEffect(() => {
    async function loadTimeDeals() {
      try {
        // 평점 높고 리뷰 많은 제품 4개 조회
        const { data, error } = await supabase
          .from('cosmetic_products')
          .select('id, name, brand, price_krw, rating, review_count, image_url')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .order('review_count', { ascending: false })
          .limit(4);

        if (error) {
          console.error('[TimeDeal] 제품 조회 실패:', error);
          return;
        }

        // 타임딜 데이터로 변환 (할인율 적용)
        const timeDealProducts: TimeDealProduct[] = (data || []).map((product, index) => {
          const discountRate = DISCOUNT_RATES[index % DISCOUNT_RATES.length];
          const originalPrice = product.price_krw || 25000;
          const salePrice = Math.round(originalPrice * (1 - discountRate / 100));

          // 가상 재고/판매량 (일관된 값 생성을 위해 ID 해시 사용)
          const hash = product.id
            .split('')
            .reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
          const stock = 50 + (hash % 50);
          const soldCount = Math.round(stock * (0.5 + (hash % 40) / 100));

          return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            originalPrice,
            salePrice,
            discountRate,
            imageUrl: getProductImageUrl(product.image_url, product.brand),
            rating: product.rating ?? 4.5,
            reviews: product.review_count ?? 0,
            stock,
            soldCount,
          };
        });

        setDeals(timeDealProducts);
      } catch (err) {
        console.error('[TimeDeal] 오류:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTimeDeals();
  }, [supabase]);

  // 카운트다운 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getRemainingTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 가격 포맷
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  }, []);

  // 재고 소진율 계산
  const getSoldPercentage = useCallback((sold: number, stock: number) => {
    return Math.round((sold / stock) * 100);
  }, []);

  // 로딩 중이거나 제품 없으면 표시 안함
  if (isLoading || deals.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-900/20 rounded-2xl border border-rose-200 dark:border-rose-800/30 overflow-hidden',
        className
      )}
      aria-label="오늘의 타임딜"
      data-testid="time-deal-section"
    >
      {/* 헤더 */}
      <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-rose-500 to-pink-500">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-white flex items-center gap-1.5">
              오늘의 타임딜
              <Flame className="w-4 h-4 text-yellow-300" aria-hidden="true" />
            </h2>
            <p className="text-xs text-white/80">최대 50% 할인</p>
          </div>
        </div>

        {/* 카운트다운 타이머 */}
        <div className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
          <Timer className="w-4 h-4 text-white" aria-hidden="true" />
          <span className="text-sm font-mono font-bold text-white">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* 제품 슬라이더 */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {deals.map((product) => {
            const soldPercentage = getSoldPercentage(product.soldCount, product.stock);
            const isAlmostGone = soldPercentage >= 80;

            return (
              <button
                key={product.id}
                onClick={() => router.push(`/beauty/${product.id}`)}
                className="flex-shrink-0 w-40 bg-white dark:bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                {/* 제품 이미지 */}
                <div className="relative w-full aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* 할인율 배지 */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
                    {product.discountRate}%
                  </div>
                  {/* 거의 소진 배지 */}
                  {isAlmostGone && (
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-red-500/90 text-white text-xs font-bold rounded text-center animate-pulse">
                      거의 소진!
                    </div>
                  )}
                </div>

                {/* 제품 정보 */}
                <div className="p-3 text-left">
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <p className="text-sm font-medium line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">
                    {product.name}
                  </p>

                  {/* 평점 */}
                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    <span className="text-xs font-medium">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({product.reviews.toLocaleString()})
                    </span>
                  </div>

                  {/* 가격 */}
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}원
                    </p>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      {formatPrice(product.salePrice)}원
                    </p>
                  </div>

                  {/* 재고 진행바 */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{product.soldCount}개 판매</span>
                      <span
                        className={cn(
                          'font-medium',
                          isAlmostGone ? 'text-red-500' : 'text-muted-foreground'
                        )}
                      >
                        {100 - soldPercentage}% 남음
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isAlmostGone
                            ? 'bg-gradient-to-r from-red-500 to-orange-500'
                            : 'bg-gradient-to-r from-rose-500 to-pink-500'
                        )}
                        style={{ width: `${soldPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 전체보기 링크 */}
      <button
        onClick={() => router.push('/beauty?sort=rating')}
        className="w-full py-3 flex items-center justify-center gap-1 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors border-t border-rose-200 dark:border-rose-800/30"
      >
        인기 제품 더보기
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </section>
  );
}

export default TimeDealSection;
