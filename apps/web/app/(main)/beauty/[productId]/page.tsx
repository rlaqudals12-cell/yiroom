'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  ArrowLeft,
  Share2,
  Star,
  MessageSquare,
  ShoppingCart,
  Check,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import type { CosmeticProduct, SkinType } from '@/types/product';
import { IngredientAnalysisSection } from '@/components/products/ingredients';
import { WishlistButton } from '@/components/products/WishlistButton';

/**
 * 뷰티 제품 상세 페이지 - UX 리스트럭처링
 * - 제품 이미지 + 기본 정보
 * - 내 피부 매칭률
 * - 성분 분석 (화해 스타일)
 * - 피부 타입별 리뷰
 * - AI 성분 요약
 * - 구매 링크
 */

// 기본 제품 데이터 (로딩 전 또는 오류 시)
const defaultProduct = {
  id: '',
  name: '',
  brand: '',
  price: 0,
  rating: 0,
  reviewCount: 0,
  qnaCount: 0,
  images: [] as string[],
  description: '',
};

export default function BeautyProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const productId = params.productId as string;

  const [userSkinTypeRaw, setUserSkinTypeRaw] = useState<SkinType | null>(null);
  const [product, setProduct] = useState<CosmeticProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 제품 데이터 가져오기
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('cosmetic_products')
          .select('*')
          .eq('id', productId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('[BeautyDetail] Product fetch error:', error);
          return;
        }

        if (data) {
          setProduct({
            id: data.id,
            name: data.name,
            brand: data.brand,
            category: data.category,
            subcategory: data.subcategory ?? undefined,
            priceRange: data.price_range,
            priceKrw: data.price_krw ?? undefined,
            skinTypes: data.skin_types ?? undefined,
            concerns: data.concerns ?? undefined,
            keyIngredients: data.key_ingredients ?? undefined,
            avoidIngredients: data.avoid_ingredients ?? undefined,
            personalColorSeasons: data.personal_color_seasons ?? undefined,
            imageUrl: data.image_url ?? undefined,
            purchaseUrl: data.purchase_url ?? undefined,
            rating: data.rating ?? undefined,
            reviewCount: data.review_count ?? undefined,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        }
      } catch (err) {
        console.error('[BeautyDetail] Product fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, supabase]);

  // 피부 분석 데이터 가져오기
  useEffect(() => {
    const fetchSkinAnalysis = async () => {
      if (!isLoaded || !user?.id) return;

      try {
        const { data } = await supabase
          .from('skin_analyses')
          .select('skin_type')
          .eq('clerk_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.skin_type) {
          setUserSkinTypeRaw(data.skin_type as SkinType);
        }
      } catch (err) {
        console.error('[BeautyDetail] Skin analysis fetch error:', err);
      }
    };

    fetchSkinAnalysis();
  }, [isLoaded, user?.id, supabase]);

  // 매칭률 계산
  const matchScore = useMemo(() => {
    if (!product || !userSkinTypeRaw) {
      return { overall: 0, skinType: false, skinConcerns: false, ingredients: false };
    }

    const skinTypeMatch = product.skinTypes?.includes(userSkinTypeRaw) ?? false;
    const hasGoodIngredients = (product.keyIngredients?.length ?? 0) > 0;
    const hasNoCaution = (product.avoidIngredients?.length ?? 0) === 0;

    // 매칭률 계산 (피부 타입 50%, 성분 30%, 주의 성분 20%)
    let overall = 50;
    if (skinTypeMatch) overall += 30;
    if (hasGoodIngredients) overall += 10;
    if (hasNoCaution) overall += 10;

    return {
      overall,
      skinType: skinTypeMatch,
      skinConcerns: skinTypeMatch,
      ingredients: hasGoodIngredients && hasNoCaution,
    };
  }, [product, userSkinTypeRaw]);

  // 표시용 제품 데이터
  const displayProduct = useMemo(() => {
    if (!product) return defaultProduct;
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.priceKrw ?? 0,
      rating: product.rating ?? 0,
      reviewCount: product.reviewCount ?? 0,
      qnaCount: 0,
      images: product.imageUrl ? [product.imageUrl] : [],
      description: '',
    };
  }, [product]);

  // 로딩 중
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-testid="beauty-product-detail-loading"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">제품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 제품을 찾을 수 없음
  if (!product) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
        data-testid="beauty-product-detail-not-found"
      >
        <AlertTriangle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">제품을 찾을 수 없습니다</p>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          뒤로가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="beauty-product-detail">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-medium truncate max-w-[200px]">{displayProduct.name}</h1>
          <div className="flex items-center gap-2">
            {/* 로컬 state만 토글하던 가짜 하트 → 실제 위시리스트 연동 (user_wishlists) */}
            <WishlistButton productType="cosmetic" productId={productId} variant="icon" />
            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: displayProduct.name, url }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(url);
                }
              }}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
              aria-label="공유"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-4 space-y-6">
        {/* 제품 이미지 */}
        <FadeInUp>
          <div className="w-full aspect-square bg-muted rounded-2xl flex items-center justify-center">
            <span className="text-4xl">💄</span>
          </div>
        </FadeInUp>

        {/* 기본 정보 */}
        <FadeInUp delay={1}>
          <section>
            <p className="text-sm text-muted-foreground">{displayProduct.brand}</p>
            <h2 className="text-xl font-bold text-foreground mt-1">{displayProduct.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              {/* 평점은 리뷰가 있을 때만 — 데이터 없는 제품의 "★ 0 (0개 리뷰)" 노출 방지 */}
              {displayProduct.reviewCount > 0 && (
                <>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{displayProduct.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({displayProduct.reviewCount.toLocaleString()}개 리뷰)
                    </span>
                  </div>
                  <span className="text-muted-foreground">|</span>
                </>
              )}
              {displayProduct.qnaCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Q&A {displayProduct.qnaCount}개
                  </span>
                </div>
              )}
            </div>
          </section>
        </FadeInUp>

        {/* 매칭률 */}
        <FadeInUp delay={2}>
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border border-green-200 dark:border-green-900/50 p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />내 피부 매칭률
            </h3>
            {userSkinTypeRaw ? (
              <>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {matchScore.overall}%
                    </span>
                  </div>
                  <div className="h-3 bg-green-100 dark:bg-green-900/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${matchScore.overall}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {matchScore.skinType && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3" /> 피부타입
                    </span>
                  )}
                  {matchScore.ingredients && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      <Check className="w-3 h-3" /> 성분
                    </span>
                  )}
                </div>
              </>
            ) : (
              /* 피부 미분석 시: "매칭률 0%" 오해 방지 — 분석 CTA로 대체 */
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  피부 분석을 하면 이 제품이 내 피부에 얼마나 맞는지 매칭률로 볼 수 있어요.
                </p>
                <button
                  onClick={() => router.push('/analysis/skin')}
                  className="inline-flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 px-4 py-2 rounded-full hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> 피부 분석하기
                </button>
              </div>
            )}
          </section>
        </FadeInUp>

        {/* 성분 분석 - 화해 스타일 (AI 요약 포함) */}
        <FadeInUp delay={3}>
          <IngredientAnalysisSection productId={productId} />
        </FadeInUp>
      </div>

      {/* 하단 구매 바 — 외부 구매처 검색 연결 (가짜 가격비교·리뷰는 실데이터 연동 전까지 비표시) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <a
          href={`https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(
            displayProduct.name
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          구매처에서 보기
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
