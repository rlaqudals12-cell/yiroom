'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ChevronRight } from 'lucide-react';

import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton';
import { AffiliateCardDisclosure } from '@/components/affiliate/AffiliateDisclosure';
import {
  rankByMatchScore,
  getRankBadge,
  buildRankReasonLine,
  buildRankComparisonLine,
} from '@/lib/products';
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

/**
 * "맞춤 제품 더 보기" 도착지.
 *
 * 근본 수리(2026-07-12): 기존 링크는 `/products?category=cosmetic&sort=match`였는데
 *  - 'cosmetic'은 카테고리 값이 아니라 테이블명 개념 — 어떤 카테고리 컬럼에도 없어(실측: prod
 *    `category='cosmetic'` → 0행) 카테고리 필터로 쓰이면 무조건 0개가 된다.
 *  - `/products`는 `/beauty`로 308 영구 리다이렉트되며 의미 없는 파라미터는 사실상 유실됐다.
 *  - `sort=match`도 수신 페이지가 읽지 않는 유령 파라미터였다.
 * → 화장품 정본(/beauty)으로 직접 보내고, /beauty가 이해하는 `filter`로 대분류를 프리셋한다
 *   (skin→스킨케어, personal-color·makeup→메이크업(색조)). null-tolerant 쿼리라 0개가 되지 않는다.
 */
function moreProductsHref(analysisType: string): string {
  switch (analysisType) {
    case 'skin':
      return '/beauty?filter=skin';
    case 'personal-color':
    case 'makeup':
      return '/beauty?filter=personal-color';
    case 'hair':
      // /beauty에 헤어 대분류가 없어 전체 화장품으로 — 최소한 0개가 되지 않는다
      return '/beauty';
    default:
      // 영양/운동(숨김 모듈) — 이 섹션이 렌더될 일이 거의 없으나 안전한 폴백 유지
      return '/products';
  }
}

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

        // 5분 캐시 — 동일 분석 결과 재방문 시 즉시 로드
        const cacheKey = `matched-${params.toString()}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 5 * 60 * 1000) {
              setProducts(data);
              setIsLoading(false);
              return;
            }
          } catch {
            /* 캐시 파싱 실패 — 무시하고 재요청 */
          }
        }

        const response = await fetch(`/api/products/matched?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          const items = data.products ?? [];
          setProducts(items);
          // 캐시 저장
          try {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ data: items, timestamp: Date.now() })
            );
          } catch {
            /* 스토리지 용량 초과 — 무시 */
          }
        }
      } catch {
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
        {/* 로드 후 BEST 3열 그리드와 동일 레이아웃 → 스켈레톤↔결과 전환 시 레이아웃 시프트 방지 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: Math.min(maxProducts, 3) }).map((_, i) => (
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

  const moreHref = moreProductsHref(analysisType);

  // 적합도 내림차순 안정 정렬(동률이면 원래 순서 유지) 후 상위 3개 = BEST 순위
  const ranked = rankByMatchScore(products);
  const best = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  // BEST 1 vs 2 비교 — matchReasons 차집합, 차이 없으면 null(지어내지 않음)
  const comparison =
    best.length >= 2 ? buildRankComparisonLine(best[0].matchReasons, best[1].matchReasons) : null;

  return (
    <div data-testid="matched-products-section">
      <SectionHeader analysisType={analysisType} />

      {/* BEST 순위 (상위 3개) — 메달 배지 + "왜 이 순위인지" 한 줄 */}
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="matched-products-ranked">
        {best.map((mp, idx) => {
          const badge = getRankBadge(idx);
          return (
            <li key={mp.product.id} className="flex flex-col" data-testid="ranked-product">
              {badge && (
                <div
                  className="mb-1.5 flex items-center gap-1 text-xs font-bold text-pink-400"
                  data-testid="rank-badge"
                >
                  <span aria-hidden="true">{badge.emoji}</span>
                  <span>{badge.label}</span>
                </div>
              )}
              {/* 점수는 아래 이유 줄에서 "적합도 N점"으로 표기 → 카드 배지 중복 생략 */}
              {/* flex-1 — li(그리드 셀 stretch) 높이를 카드가 채워 3장 높이를 맞춘다.
                  카드 내부는 가격 행이 mt-auto로 하단 정렬되어 세 카드의 가격 행이 같은 높이에 온다. */}
              <ProductCard product={mp.product} matchReasons={mp.matchReasons} className="flex-1" />
              {/* 이유 줄은 최소 2줄 높이를 예약 — BEST 1만 줄 수가 많아 첫 카드가 커 보이는 어긋남 방지 */}
              <p
                className="mt-1.5 min-h-[2rem] text-[11px] leading-snug text-zinc-400"
                data-testid="rank-reason"
              >
                {buildRankReasonLine(mp.matchScore, mp.matchReasons)}
              </p>
            </li>
          );
        })}
      </ol>

      {/* BEST 1 vs 2 비교 한 줄 (고유 강점 차이가 있을 때만) */}
      {comparison && (
        <p className="mt-2 text-xs text-zinc-500" data-testid="rank-comparison">
          {comparison}
        </p>
      )}

      {/* 나머지 제품 — BEST 그리드와 동일한 열 수(sm:grid-cols-3)로 카드 폭 통일.
          단, 1개만 남으면 홀로 뚝 떨어져(고아) 보이므로 별도 블록으로 렌더하지 않고
          아래 "맞춤 제품 더 보기"로 정리한다.
          (실사용은 maxProducts=4 → best 3 + rest 1 → 이 경우 항상 BEST 3개만 노출) */}
      {rest.length >= 2 && (
        <div
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
          data-testid="matched-products-rest"
        >
          {rest.map(({ product, matchScore, matchReasons }) => (
            <ProductCard
              key={product.id}
              product={product}
              matchScore={matchScore}
              matchReasons={matchReasons}
            />
          ))}
        </div>
      )}

      <div className="mt-3 text-center">
        <Link
          href={moreHref}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-pink-400 transition-colors"
        >
          맞춤 제품 더 보기
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* 제휴 고지 — 추천 제품이 제휴 링크로 수익화되므로 섹션 하단에 명시 (표시광고법·FTC §255.5) */}
      <AffiliateCardDisclosure className="mt-3 text-center text-[10px] leading-snug text-zinc-500" />
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
