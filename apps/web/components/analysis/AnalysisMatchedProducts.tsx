'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ChevronRight } from 'lucide-react';

import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton';
import type { AnyProduct } from '@/types/product';

/**
 * 분석 결과 기반 맞춤 제품 추천 섹션
 *
 * S-1 피부, PC-1 퍼스널컬러 등 분석 결과 페이지에서
 * 해당 분석에 매칭되는 구체 제품 카드를 표시
 *
 * 수익 연결: 제품 클릭 → 상세 페이지 → 어필리에이트 링크
 *
 * @see docs/TODO.md 섹션 6 갭 #2: "성분 추천" → "구체 제품 추천"
 */

interface MatchedProduct {
  product: AnyProduct;
  matchScore: number;
  matchReasons: string[];
}

interface AnalysisMatchedProductsProps {
  /** 분석 모듈 (skin, personal-color, body, hair, makeup 등) */
  analysisType: string;
  /** 피부 타입 (S-1) */
  skinType?: string;
  /** 피부 고민 (S-1) */
  skinConcerns?: string[];
  /** 퍼스널컬러 시즌 (PC-1) */
  personalColorSeason?: string;
  /** 헤어 타입 (H-1) */
  hairType?: string;
  /** 두피 타입 (H-1) */
  scalpType?: string;
  /** 언더톤 (M-1) */
  undertone?: string;
  /** 표시할 제품 수 */
  maxProducts?: number;
}

// 분석 타입별 제품 카테고리 매핑
const ANALYSIS_CATEGORY_MAP: Record<string, string> = {
  skin: 'cosmetic',
  'personal-color': 'cosmetic',
  hair: 'cosmetic',
  makeup: 'cosmetic',
  nutrition: 'supplement',
  workout: 'equipment',
};

export function AnalysisMatchedProducts({
  analysisType,
  skinType,
  skinConcerns,
  personalColorSeason,
  hairType,
  scalpType,
  undertone,
  maxProducts = 4,
}: AnalysisMatchedProductsProps): React.JSX.Element {
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMatchedProducts(): Promise<void> {
      try {
        const params = new URLSearchParams();
        params.set('analysisType', analysisType);
        params.set('limit', String(maxProducts));
        if (skinType) params.set('skinType', skinType);
        if (skinConcerns?.length) params.set('skinConcerns', skinConcerns.join(','));
        if (personalColorSeason) params.set('personalColorSeason', personalColorSeason);
        if (hairType) params.set('hairType', hairType);
        if (scalpType) params.set('scalpType', scalpType);
        if (undertone) params.set('undertone', undertone);

        const response = await fetch(`/api/products/matched?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          setProducts(data.products ?? []);
        }
      } catch {
        // 제품 로딩 실패 — 조용히 처리 (핵심 분석에 영향 없음)
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMatchedProducts();
  }, [
    analysisType,
    skinType,
    skinConcerns,
    personalColorSeason,
    hairType,
    scalpType,
    undertone,
    maxProducts,
  ]);

  // 로딩 중
  if (isLoading) {
    return (
      <div data-testid="matched-products-loading">
        <SectionHeader analysisType={analysisType} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: maxProducts }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // 제품 없음 — 섹션 자체를 숨기지 않고 안내 표시
  if (products.length === 0) {
    return (
      <div data-testid="matched-products-empty">
        <SectionHeader analysisType={analysisType} />
        <div className="rounded-xl border border-zinc-800 bg-neutral-900/50 p-6 text-center">
          <ShoppingBag className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
          <p className="text-sm text-zinc-500">맞춤 제품을 준비 중이에요. 곧 추천해드릴게요.</p>
        </div>
      </div>
    );
  }

  const category = ANALYSIS_CATEGORY_MAP[analysisType] ?? 'cosmetic';

  return (
    <div data-testid="matched-products-section">
      <SectionHeader analysisType={analysisType} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {products.map(({ product, matchScore }) => (
          <ProductCard key={product.id} product={product} matchScore={matchScore} />
        ))}
      </div>
      <div className="mt-3 text-center">
        <Link
          href={`/products?category=${category}&sort=match`}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-pink-400 transition-colors"
        >
          맞춤 제품 더 보기
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

/** 섹션 헤더 */
function SectionHeader({ analysisType }: { analysisType: string }): React.JSX.Element {
  const labels: Record<string, string> = {
    skin: '피부 분석 맞춤 제품',
    'personal-color': '퍼스널컬러 맞춤 제품',
    hair: '헤어 맞춤 제품',
    makeup: '메이크업 맞춤 제품',
    nutrition: '영양 맞춤 보충제',
    workout: '운동 맞춤 장비',
  };

  return (
    <div className="mb-3 flex items-center gap-2">
      <ShoppingBag className="h-4 w-4 text-pink-400" />
      <h3 className="text-sm font-semibold text-zinc-200">
        {labels[analysisType] ?? '맞춤 제품 추천'}
      </h3>
    </div>
  );
}
