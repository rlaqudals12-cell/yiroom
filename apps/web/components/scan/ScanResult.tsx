'use client';

/**
 * 스캔 결과 컴포넌트
 * - 제품 정보 표시
 * - 호환성 점수 (추후 구현)
 * - 성분 분석 (추후 구현)
 */

import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Sparkles,
  CheckCircle2,
  Plus,
  Share2,
  ChevronRight,
  ExternalLink,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { IngredientEWGBadge } from '@/components/products/ingredients';
import type { GlobalProduct, ProductLookupSource } from '@/types/scan';
import type { AffiliateLink } from '@/lib/scan/barcode-product-bridge';

interface ScanResultProps {
  /** 제품 정보 */
  product: GlobalProduct;
  /** 데이터 소스 */
  source: ProductLookupSource;
  /** 신뢰도 */
  confidence: number;
  /** 내부 제품 상세 URL (/beauty/[id]) */
  detailUrl?: string;
  /** 어필리에이트 구매 링크 목록 */
  affiliateLinks?: AffiliateLink[];
  /** 제품함 추가 콜백 */
  onAddToShelf?: () => void;
  /** 공유 콜백 */
  onShare?: () => void;
  /** 다시 스캔 콜백 */
  onRescan?: () => void;
  className?: string;
}

// 데이터 소스 표시
const SOURCE_LABELS: Record<ProductLookupSource, { label: string; color: string }> = {
  internal_db: { label: '이룸 DB', color: 'bg-green-100 text-green-700' },
  open_beauty_facts: { label: 'Open Beauty Facts', color: 'bg-blue-100 text-blue-700' },
  ocr_analysis: { label: 'OCR 분석', color: 'bg-purple-100 text-purple-700' },
};

// 카테고리 라벨
const CATEGORY_LABELS: Record<string, string> = {
  skincare: '스킨케어',
  makeup: '메이크업',
  bodycare: '바디케어',
  haircare: '헤어케어',
  suncare: '선케어',
  fragrance: '향수',
  supplement: '보충제',
  other: '기타',
};

export function ScanResult({
  product,
  source,
  confidence: _confidence,
  detailUrl,
  affiliateLinks,
  onAddToShelf,
  onShare,
  onRescan,
  className,
}: ScanResultProps) {
  const sourceInfo = SOURCE_LABELS[source];

  return (
    <div data-testid="scan-result" className={cn('space-y-4', className)}>
      {/* 제품 헤더 */}
      <div className="flex gap-4 p-4 bg-card rounded-xl border">
        {/* 제품 이미지 */}
        <div className="shrink-0 w-24 h-24 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          ) : (
            <Package className="w-10 h-10 text-muted-foreground" />
          )}
        </div>

        {/* 제품 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-lg leading-tight line-clamp-2">{product.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{product.brand}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* 카테고리 */}
            <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
              {CATEGORY_LABELS[product.category] || product.category}
            </span>

            {/* 데이터 소스 */}
            <span className={cn('text-xs px-2 py-0.5 rounded-full', sourceInfo.color)}>
              {sourceInfo.label}
            </span>

            {/* 검증 여부 */}
            {product.verified && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                검증됨
              </span>
            )}
          </div>

          {/* EWG 등급 — 참고 지표 (데이터 있을 때만) */}
          {product.ewgGrade != null && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs text-muted-foreground">EWG 참고 지표:</span>
              <IngredientEWGBadge score={product.ewgGrade} size="sm" showLabel={false} />
            </div>
          )}
        </div>
      </div>

      {/* 나와의 적합도 안내 — 성분표를 찍으면 내 피부 기준 판정 */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <div className="flex items-center gap-2 text-foreground">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-medium">나와의 적합도 보기</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          성분표를 촬영하면 내 피부 기준으로 이 제품이 얼마나 맞는지 판정해드려요
        </p>
        <Link
          href="/analysis/skin"
          className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
        >
          피부 분석 시작하기
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 주요 성분 */}
      {product.keyIngredients && product.keyIngredients.length > 0 && (
        <div className="p-4 bg-card rounded-xl border">
          <h3 className="font-medium mb-3">주요 성분</h3>
          <div className="flex flex-wrap gap-2">
            {product.keyIngredients.map((ingredient) => (
              <span key={ingredient} className="text-sm px-2.5 py-1 bg-muted rounded-full">
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 전성분 목록 */}
      {product.ingredients && product.ingredients.length > 0 && (
        <details className="p-4 bg-card rounded-xl border">
          <summary className="font-medium cursor-pointer flex items-center justify-between">
            전성분 ({product.ingredients.length}개)
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </summary>
          <div className="mt-3 space-y-2">
            {product.ingredients.map((ing) => (
              <div key={ing.order} className="flex items-start gap-2 text-sm">
                <span className="shrink-0 w-6 h-6 flex items-center justify-center bg-muted rounded text-xs">
                  {ing.order}
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    <span className="font-medium">{ing.nameKo || ing.inciName}</span>
                    {ing.nameKo && (
                      <span className="text-muted-foreground ml-1">({ing.inciName})</span>
                    )}
                  </span>
                  {ing.ewgGrade != null && (
                    <IngredientEWGBadge score={ing.ewgGrade} size="sm" showLabel={false} />
                  )}
                </div>
              </div>
            ))}
          </div>
          {product.ingredients.some((ing) => ing.ewgGrade != null) && (
            <p className="mt-3 text-xs text-muted-foreground">
              EWG 등급은 성분 안전성 참고 지표예요(출처: EWG Skin Deep). 농도·개인차는 반영되지
              않아요.
            </p>
          )}
        </details>
      )}

      {/* 제품 상세 / 구매 버튼 */}
      {(detailUrl || (affiliateLinks && affiliateLinks.length > 0)) && (
        <div data-testid="scan-result-actions" className="p-4 bg-card rounded-xl border space-y-3">
          {/* 내부 제품 상세 보기 */}
          {detailUrl && (
            <Button asChild className="w-full gap-2" data-testid="scan-detail-button">
              <Link href={detailUrl}>
                <Package className="w-4 h-4" />
                제품 상세 보기
              </Link>
            </Button>
          )}

          {/* 어필리에이트 구매 링크 */}
          {affiliateLinks && affiliateLinks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">구매하기</p>
              {affiliateLinks.map((link) => (
                <Button
                  key={`${link.partner}-${link.url}`}
                  asChild
                  variant="outline"
                  className="w-full justify-between gap-2"
                  data-testid="scan-affiliate-link"
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      {link.partner}
                      {link.price != null && (
                        <span className="text-xs text-muted-foreground">
                          {link.price.toLocaleString('ko-KR')}원
                        </span>
                      )}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        {onAddToShelf && (
          <Button onClick={onAddToShelf} className="flex-1 gap-2">
            <Plus className="w-4 h-4" />내 제품함에 추가
          </Button>
        )}
        {onShare && (
          <Button onClick={onShare} variant="outline" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 다시 스캔 */}
      {onRescan && (
        <button
          onClick={onRescan}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2"
        >
          다른 제품 스캔하기
        </button>
      )}
    </div>
  );
}
