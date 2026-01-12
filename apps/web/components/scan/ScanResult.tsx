'use client';

/**
 * 스캔 결과 컴포넌트
 * - 제품 정보 표시
 * - 호환성 점수 (추후 구현)
 * - 성분 분석 (추후 구현)
 */

import Image from 'next/image';
import Link from 'next/link';
import { Package, Star, CheckCircle2, Plus, Share2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { GlobalProduct, ProductLookupSource } from '@/types/scan';

interface ScanResultProps {
  /** 제품 정보 */
  product: GlobalProduct;
  /** 데이터 소스 */
  source: ProductLookupSource;
  /** 신뢰도 */
  confidence: number;
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

          {/* EWG 등급 */}
          {product.ewgGrade && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground">EWG 등급:</span>
              <span
                className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  product.ewgGrade <= 2 && 'bg-green-100 text-green-700',
                  product.ewgGrade >= 3 && product.ewgGrade <= 6 && 'bg-yellow-100 text-yellow-700',
                  product.ewgGrade >= 7 && 'bg-red-100 text-red-700'
                )}
              >
                {product.ewgGrade}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 호환성 분석 (추후 구현) */}
      <div className="p-4 bg-card rounded-xl border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Star className="w-5 h-5" />
          <span className="font-medium">맞춤 분석</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          피부/퍼스널컬러 분석 후 맞춤 호환성을 확인할 수 있어요
        </p>
        <Link
          href="/analysis"
          className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
        >
          분석 시작하기
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
                <div>
                  <span className="font-medium">{ing.nameKo || ing.inciName}</span>
                  {ing.nameKo && (
                    <span className="text-muted-foreground ml-1">({ing.inciName})</span>
                  )}
                  {ing.ewgGrade && (
                    <span
                      className={cn(
                        'ml-2 text-xs px-1 rounded',
                        ing.ewgGrade <= 2 && 'bg-green-100 text-green-700',
                        ing.ewgGrade >= 3 && ing.ewgGrade <= 6 && 'bg-yellow-100 text-yellow-700',
                        ing.ewgGrade >= 7 && 'bg-red-100 text-red-700'
                      )}
                    >
                      EWG {ing.ewgGrade}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </details>
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
