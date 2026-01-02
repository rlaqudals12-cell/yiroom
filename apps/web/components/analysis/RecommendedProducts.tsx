'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles, Loader2 } from 'lucide-react';

import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import {
  getCosmeticProducts,
  getRecommendedEquipment,
  addMatchInfoToProducts,
} from '@/lib/products';
import type {
  AnyProduct,
  ProductWithMatch,
  SkinType,
  SkinConcern,
  PersonalColorSeason,
  TargetMuscle,
} from '@/types/product';
import type { UserProfile } from '@/lib/products/matching';

// 분석 타입별 설정
type AnalysisType = 'personal-color' | 'skin' | 'body';

interface AnalysisResult {
  // 퍼스널 컬러 분석 결과
  seasonType?: PersonalColorSeason;

  // 피부 분석 결과
  skinType?: SkinType;
  skinConcerns?: SkinConcern[];

  // 체형 분석 결과
  bodyType?: string;
  recommendedExercises?: string[];
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

  useEffect(() => {
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

          case 'body': {
            // 체형 분석 → 운동 기구 추천
            const { bodyType, recommendedExercises } = analysisResult;
            if (bodyType) {
              // 체형별 타겟 근육 매핑
              const bodyTypeToMuscles: Record<string, string[]> = {
                X: ['full_body'],
                A: ['shoulders', 'back', 'chest'],
                V: ['legs', 'core'],
                H: ['core', 'legs', 'shoulders'],
                O: ['full_body', 'core'],
                I: ['chest', 'shoulders', 'legs'],
                Y: ['legs', 'core'],
                '8': ['core'],
                S: ['full_body'],
                W: ['core', 'legs'],
                N: ['full_body'],
              };

              const targetMuscles = (bodyTypeToMuscles[bodyType] || [
                'full_body',
              ]) as TargetMuscle[];
              userProfile = {
                targetMuscles,
                workoutGoals: recommendedExercises,
              };

              fetchedProducts = await getRecommendedEquipment(targetMuscles);
            }
            break;
          }
        }

        // 매칭 점수 계산 및 정렬
        if (fetchedProducts.length > 0) {
          const productsWithMatch = addMatchInfoToProducts(fetchedProducts, userProfile);
          setProducts(productsWithMatch.slice(0, maxProducts));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('[RecommendedProducts] 제품 로딩 실패:', err);
        setError('제품을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [analysisType, analysisResult, maxProducts]);

  // 분석 타입별 섹션 제목 및 링크
  const sectionConfig = {
    'personal-color': {
      title: '나에게 어울리는 메이크업',
      subtitle: '퍼스널 컬러 기반 추천',
      link: `/products?category=makeup&season=${analysisResult.seasonType || ''}`,
      emoji: '💄',
    },
    skin: {
      title: '피부 맞춤 스킨케어',
      subtitle: '피부 타입 기반 추천',
      link: `/products?category=skincare&skinType=${analysisResult.skinType || ''}`,
      emoji: '✨',
    },
    body: {
      title: '체형별 추천 운동 기구',
      subtitle: '체형 분석 기반 추천',
      link: `/products?category=equipment&bodyType=${analysisResult.bodyType || ''}`,
      emoji: '💪',
    },
  };

  const config = sectionConfig[analysisType];

  // 로딩 상태
  if (isLoading) {
    return (
      <section className={className} data-testid="recommended-products-loading">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">추천 제품 로딩 중...</span>
        </div>
      </section>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <section className={className} data-testid="recommended-products-error">
        <div className="text-center py-8 text-muted-foreground">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  // 제품이 없는 경우
  if (products.length === 0) {
    return null;
  }

  return (
    <section className={className} data-testid="recommended-products">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.emoji}</span>
          <div>
            <h2 className="text-lg font-semibold">{config.title}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
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
