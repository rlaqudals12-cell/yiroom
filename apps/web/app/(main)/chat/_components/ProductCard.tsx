'use client';

/**
 * 제품 추천 카드 컴포넌트
 */

import { ShoppingBag, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProductRecommendation } from '@/types/chat';

interface ProductCardProps {
  product: ProductRecommendation;
}

export function ProductCard({ product }: ProductCardProps) {
  const handleClick = () => {
    // 제품 상세 페이지로 이동 또는 어필리에이트 링크
    if (product.affiliateUrl) {
      window.open(product.affiliateUrl, '_blank');
    } else {
      window.location.href = `/products/${product.productId}`;
    }
  };

  return (
    <Card
      data-testid="product-card"
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* 아이콘 */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">{product.productName}</h4>
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.reason}</p>
          </div>

          {/* 버튼 */}
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
