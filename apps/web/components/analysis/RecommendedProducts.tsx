'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles, Loader2 } from 'lucide-react';

import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { getCosmeticProducts, addMatchInfoToProducts } from '@/lib/products';
import type {
  AnyProduct,
  ProductWithMatch,
  SkinType,
  SkinConcern,
  PersonalColorSeason,
  HairType,
  ScalpType,
  FaceShape,
  Undertone,
} from '@/types/product';
import type { UserProfile } from '@/lib/products/matching';

// 분석 타입별 설정
type AnalysisType = 'personal-color' | 'skin' | 'hair' | 'makeup';

interface AnalysisResult {
  // 퍼스널 컬러 분석 결과
  seasonType?: PersonalColorSeason;

  // 피부 분석 결과
  skinType?: SkinType;
  skinConcerns?: SkinConcern[];

  // 체형 분석 결과
  bodyType?: string;
  recommendedExercises?: string[];

  // H-1 헤어 분석 결과
  hairType?: string;
  scalpType?: string;
  hairConcerns?: string[];

  // M-1 메이크업 분석 결과
  undertone?: string;
  faceShape?: string;
}

interface RecommendedProductsProps {
  analysisType: AnalysisType;
  analysisResult: AnalysisResult;
  maxProducts?: number;
  className?: string;
}

/**
 * 분석 결과 기반 추천 제품 컴포넌트
 * - 분석 타입(퍼스널컬러/피부/체형)에 따라 맞춤 제품 표시
 * - 가로 스크롤로 3개 제품 미리보기
 * - 전체 보기 버튼으로 상세 페이지 이동
 */
export function RecommendedProducts({
  analysisType,
  analysisResult,
  maxProducts = 3,
  className,
}: RecommendedProductsProps) {
  const [products, setProducts] = useState<ProductWithMatch<AnyProduct>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 객체 참조 대신 primitive 값으로 안정적 비교 (useEffect 무한 루프 방지)
  const analysisResultKey = JSON.stringify(analysisResult);

  useEffect(() => {
    let cancelled = false;

    // eslint-disable-next-line sonarjs/cognitive-complexity -- component render
    async function fetchProducts() {
      setIsLoading(true);
      setError(null);

      try {
        let fetchedProducts: AnyProduct[] = [];
        let userProfile: UserProfile = {};

        switch (analysisType) {
          case 'personal-color': {
            // 퍼스널 컬러 → 메이크업 제품 추천
            const { seasonType } = analysisResult;
            if (seasonType) {
              userProfile = { personalColorSeason: seasonType };
              // 메이크업 카테고리 제품 가져오기
              fetchedProducts = await getCosmeticProducts(
                {
                  category: 'makeup',
                  personalColorSeasons: [seasonType],
                },
                20
              );
            }
            break;
          }

          case 'skin': {
            // 피부 분석 → 스킨케어 제품 추천
            const { skinType, skinConcerns } = analysisResult;
            if (skinType) {
              userProfile = {
                skinType,
                skinConcerns: skinConcerns || [],
              };
              // 스킨케어 제품 (클렌저, 토너, 세럼, 수분크림, 선크림)
              fetchedProducts = await getCosmeticProducts(
                {
                  skinTypes: [skinType],
                  concerns: skinConcerns,
                },
                20
              );
            }
            break;
          }

          case 'hair': {
            // 헤어 분석 → 헤어케어 제품 추천
            const { hairType, scalpType, hairConcerns } = analysisResult;
            if (hairType || scalpType) {
              userProfile = {
                hairType: hairType as HairType | undefined,
                scalpType: scalpType as ScalpType | undefined,
                hairConcerns: hairConcerns || [],
              };
              // 4개 헤어케어 카테고리 병렬 조회
              const hairCategories = [
                'shampoo',
                'conditioner',
                'hair-treatment',
                'scalp-care',
              ] as const;
              const hairProductArrays = await Promise.all(
                hairCategories.map((cat) =>
                  getCosmeticProducts(
                    {
                      category: cat,
                      ...(scalpType ? { skinTypes: [scalpType as SkinType] } : {}),
                    },
                    10
                  )
                )
              );
              fetchedProducts = hairProductArrays.flat();
            }
            break;
          }

          case 'makeup': {
            // 메이크업 분석 → 메이크업 제품 추천
            const { undertone, faceShape, seasonType: season } = analysisResult;
            if (undertone || faceShape) {
              userProfile = {
                undertone: undertone as Undertone | undefined,
                faceShape: faceShape as FaceShape | undefined,
                ...(season ? { personalColorSeason: season } : {}),
              };
              fetchedProducts = await getCosmeticProducts(
                {
                  category: 'makeup',
                  ...(season ? { personalColorSeasons: [season] } : {}),
                },
                20
              );
            }
            break;
          }
        }

        // 이전 요청이 취소된 경우 상태 업데이트 무시
        if (cancelled) return;

        // 매칭 점수 계산 및 정렬
        if (fetchedProducts.length > 0) {
          const productsWithMatch = addMatchInfoToProducts(fetchedProducts, userProfile);
          setProducts(productsWithMatch.slice(0, maxProducts));
        } else {
          setProducts([]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[RecommendedProducts] 제품 로딩 실패:', err);
        setError('제품을 불러오는 중 오류가 발생했어요.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- analysisResult를 primitive로 분해하여 안정적 비교
  }, [analysisType, analysisResultKey, maxProducts]);

  // 분석 타입별 섹션 제목 및 링크
  const sectionConfig = {
    'personal-color': {
      title: '나에게 어울리는 메이크업',
      subtitle: '퍼스널 컬러 기반 추천',
      link: `/products?category=makeup&season=${analysisResult.seasonType || ''}`,
    },
    skin: {
      title: '피부 맞춤 스킨케어',
      subtitle: '피부 타입 기반 추천',
      link: `/products?category=skincare&skinType=${analysisResult.skinType || ''}`,
    },
    hair: {
      title: '나에게 맞는 헤어케어',
      subtitle: '두피/모발 타입 기반 추천',
      link: `/products?category=haircare&scalpType=${analysisResult.scalpType || ''}`,
    },
    makeup: {
      title: '나에게 어울리는 메이크업',
      subtitle: '얼굴형/언더톤 기반 추천',
      link: `/products?category=makeup&undertone=${analysisResult.undertone || ''}`,
    },
  };

  const config = sectionConfig[analysisType];

  // 로딩 상태
  if (isLoading) {
    return (
      <section
        className={className}
        data-testid="recommended-products-loading"
        aria-label="추천 제품 로딩 중"
      >
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="ml-2 text-muted-foreground">추천 제품 로딩 중...</span>
        </div>
      </section>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <section
        className={className}
        data-testid="recommended-products-error"
        aria-label="추천 제품 오류"
      >
        <div className="text-center py-8 text-muted-foreground" role="alert">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  // 제품이 없는 경우
  if (products.length === 0) {
    return (
      <section className={className} data-testid="recommended-products-empty">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
        </div>
        <div className="text-center py-8 bg-muted/30 rounded-xl border border-border/50">
          <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">맞춤 제품을 준비하고 있어요</p>
        </div>
      </section>
    );
  }

  return (
    <section className={className} data-testid="recommended-products" aria-label={config.title}>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg font-semibold">{config.title}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {config.subtitle}
            </p>
          </div>
        </div>
        <Link href={config.link}>
          <Button variant="ghost" size="sm" className="text-primary">
            전체 보기
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* 제품 가로 스크롤 */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {products.map((item, index) => (
          <div key={item.product.id} className="flex-shrink-0 w-[160px] md:w-[180px]">
            <ProductCard
              product={item.product}
              matchScore={item.matchScore}
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* 더 많은 제품 보기 CTA */}
      <div className="mt-4 text-center">
        <Link href={config.link}>
          <Button variant="outline" size="sm" className="w-full max-w-xs">
            맞춤 제품 더 보기
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
