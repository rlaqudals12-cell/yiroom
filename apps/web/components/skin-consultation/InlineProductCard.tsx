'use client';

/**
 * Phase D: 인라인 제품 추천 카드 컴포넌트
 *
 * 채팅 내에서 제품을 컴팩트하게 표시하는 카드
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ExternalLink } from 'lucide-react';
import type { ProductRecommendation } from '@/types/skin-consultation';

interface InlineProductCardProps {
  /** 제품 정보 */
  product: ProductRecommendation;
  /** 클릭 핸들러 */
  onClick?: () => void;
}

/**
 * 채팅 내 인라인 제품 추천 카드
 * - 컴팩트한 디자인
 * - 제품 이미지, 이름, 브랜드 표시
 * - 추천 이유 표시
 * - 클릭 시 제품 상세 이동
 */
export default function InlineProductCard({ product, onClick }: InlineProductCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
      data-testid="inline-product-card"
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* 제품 이미지 */}
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-12 h-12 rounded-md object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* 브랜드 + 카테고리 */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{product.brand}</span>
              {product.category && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {product.category}
                </Badge>
              )}
            </div>

            {/* 제품명 */}
            <p className="font-medium text-sm truncate">{product.name}</p>

            {/* 추천 이유 */}
            {product.reason && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.reason}</p>
            )}

            {/* 매칭률 */}
            {product.matchRate && (
              <div className="flex items-center gap-1 mt-1">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${product.matchRate}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{product.matchRate}% 매칭</span>
              </div>
            )}
          </div>

          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
