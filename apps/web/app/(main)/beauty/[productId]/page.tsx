'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  MessageSquare,
  ShoppingCart,
  Check,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';

/**
 * 뷰티 제품 상세 페이지 - UX 리스트럭처링
 * - 제품 이미지 + 기본 정보
 * - 내 피부 매칭률
 * - 성분 분석 (화해 스타일)
 * - 피부 타입별 리뷰
 * - AI 성분 요약
 * - 구매 링크
 */

// 임시 제품 데이터
const mockProduct = {
  id: '1',
  name: '비타민C 15% 세럼',
  brand: '이룸 스킨',
  price: 32000,
  rating: 4.8,
  reviewCount: 1234,
  qnaCount: 56,
  images: ['/products/serum-1.jpg'],
  description: '고농축 비타민C가 피부 톤을 밝게 해주는 세럼입니다.',
};

// 매칭률 데이터
const matchScore = {
  overall: 95,
  skinType: true,
  skinConcerns: true,
  ingredients: true,
};

// 성분 데이터
const ingredients = {
  good: [
    { name: '나이아신아마이드', effect: '미백, 피지 조절' },
    { name: '히알루론산', effect: '수분 공급' },
    { name: '아데노신', effect: '주름 개선' },
    { name: '비타민C', effect: '항산화, 미백' },
    { name: '세라마이드', effect: '피부 장벽 강화' },
  ],
  caution: [
    { name: '향료', warning: '민감성 피부 주의' },
  ],
};

// 리뷰 데이터
const reviews = [
  {
    id: '1',
    skinType: '복합성',
    rating: 5,
    content: '건조함 없이 촉촉해요! 비타민C 세럼 중에 제일 순해요.',
    date: '2024-12-20',
    helpful: 23,
  },
  {
    id: '2',
    skinType: '지성',
    rating: 4,
    content: '흡수가 빨라서 좋아요. 저녁에만 사용하고 있어요.',
    date: '2024-12-18',
    helpful: 15,
  },
  {
    id: '3',
    skinType: '민감성',
    rating: 5,
    content: '예민한 피부인데도 자극 없이 잘 사용하고 있어요!',
    date: '2024-12-15',
    helpful: 31,
  },
];

// 구매 링크
const purchaseLinks = [
  { store: '올리브영', price: 32000, url: 'https://oliveyoung.co.kr' },
  { store: '쿠팡', price: 29900, url: 'https://coupang.com' },
  { store: '네이버', price: 30500, url: 'https://shopping.naver.com' },
];

// AI 성분 요약
const aiSummary =
  '비타민C와 나이아신아마이드가 함께 들어있어 미백과 보습에 효과적이에요. 히알루론산이 수분을 잡아주고, 아데노신이 피부 탄력을 개선해줍니다. 민감한 피부도 사용 가능하지만, 향료가 포함되어 있어 알레르기가 있다면 주의하세요.';

export default function BeautyProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;

  const [isLiked, setIsLiked] = useState(false);
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [filterBySkinType, setFilterBySkinType] = useState(true);

  // TODO: 실제 데이터 연동
  const userSkinType = '복합성';

  const filteredReviews = filterBySkinType
    ? reviews.filter((r) => r.skinType === userSkinType)
    : reviews;

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
          <h1 className="text-base font-medium truncate max-w-[200px]">
            {mockProduct.name}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={isLiked ? '좋아요 취소' : '좋아요'}
            >
              <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
            </button>
            <button
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
              aria-label="공유"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="px-4 py-4 space-y-6">
        {/* 제품 이미지 */}
        <FadeInUp>
          <div className="w-full aspect-square bg-muted rounded-2xl flex items-center justify-center">
            <span className="text-4xl">💄</span>
          </div>
        </FadeInUp>

        {/* 기본 정보 */}
        <FadeInUp delay={1}>
          <section>
            <p className="text-sm text-muted-foreground">{mockProduct.brand}</p>
            <h2 className="text-xl font-bold text-foreground mt-1">
              {mockProduct.name}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{mockProduct.rating}</span>
                <span className="text-sm text-muted-foreground">
                  ({mockProduct.reviewCount.toLocaleString()}개 리뷰)
                </span>
              </div>
              <span className="text-muted-foreground">|</span>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Q&A {mockProduct.qnaCount}개
                </span>
              </div>
            </div>
          </section>
        </FadeInUp>

        {/* 매칭률 */}
        <FadeInUp delay={2}>
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-green-600" />
              내 피부 매칭률
            </h3>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-3xl font-bold text-green-600">
                  {matchScore.overall}%
                </span>
              </div>
              <div className="h-3 bg-green-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${matchScore.overall}%` }}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {matchScore.skinType && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  <Check className="w-3 h-3" /> 피부타입
                </span>
              )}
              {matchScore.skinConcerns && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  <Check className="w-3 h-3" /> 피부고민
                </span>
              )}
              {matchScore.ingredients && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  <Check className="w-3 h-3" /> 성분
                </span>
              )}
            </div>
          </section>
        </FadeInUp>

        {/* 성분 분석 */}
        <FadeInUp delay={3}>
          <section className="bg-card rounded-2xl border p-4">
            <h3 className="font-semibold text-foreground mb-4">성분 분석</h3>

            {/* 좋은 성분 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium text-green-700">
                  좋은 성분 ({ingredients.good.length})
                </span>
              </div>
              <div className="space-y-2 pl-8">
                {ingredients.good
                  .slice(0, showAllIngredients ? undefined : 3)
                  .map((ing, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-foreground">{ing.name}</span>
                      <span className="text-muted-foreground"> - {ing.effect}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 주의 성분 */}
            {ingredients.caution.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-medium text-amber-700">
                    주의 성분 ({ingredients.caution.length})
                  </span>
                </div>
                <div className="space-y-2 pl-8">
                  {ingredients.caution.map((ing, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-foreground">{ing.name}</span>
                      <span className="text-amber-600"> - {ing.warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowAllIngredients(!showAllIngredients)}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              {showAllIngredients ? '간략히 보기' : '전체 성분 보기'}
            </button>
          </section>
        </FadeInUp>

        {/* AI 성분 요약 */}
        <FadeInUp delay={4}>
          <section className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-violet-600" />
              AI 성분 요약
            </h3>
            <p className="text-sm text-foreground leading-relaxed">{aiSummary}</p>
          </section>
        </FadeInUp>

        {/* 리뷰 */}
        <FadeInUp delay={5}>
          <section className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">리뷰</h3>
              <button
                onClick={() => setFilterBySkinType(!filterBySkinType)}
                className={cn(
                  'flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors',
                  filterBySkinType
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                내 피부 타입만 보기 ({userSkinType})
              </button>
            </div>

            <div className="space-y-4">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-muted/50 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {review.skinType}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3 h-3',
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {review.date}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{review.content}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      도움됨 {review.helpful}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  내 피부 타입 리뷰가 아직 없어요
                </p>
              )}
            </div>

            <button
              onClick={() => router.push(`/beauty/${productId}/reviews`)}
              className="w-full mt-4 text-center text-sm text-primary hover:underline flex items-center justify-center gap-1"
            >
              리뷰 더보기 ({mockProduct.reviewCount.toLocaleString()})
              <ChevronRight className="w-4 h-4" />
            </button>
          </section>
        </FadeInUp>
      </main>

      {/* 하단 구매 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex gap-2 mb-3">
          {purchaseLinks.map((link) => (
            <a
              key={link.store}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center gap-1 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <span className="text-xs text-muted-foreground">{link.store}</span>
              <span className="text-sm font-medium">
                {link.price.toLocaleString()}원
              </span>
            </a>
          ))}
        </div>
        <button
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          최저가 구매하기 ({Math.min(...purchaseLinks.map((l) => l.price)).toLocaleString()}원)
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
