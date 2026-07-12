'use client';

/**
 * 제품 추천 카드 컴포넌트
 */

import { ShoppingBag, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdBadge } from '@/components/primitives/badge-variants/AdBadge';
import { AffiliateCardDisclosure } from '@/components/affiliate/AffiliateDisclosure';
import type { ProductRecommendation } from '@/types/chat';

interface ProductCardProps {
  product: ProductRecommendation;
}

export function ProductCard({ product }: ProductCardProps) {
  // 제휴 링크로 나가는 카드만 고지 대상 (내부 상세 이동은 제휴 아님)
  const isAffiliate = Boolean(product.affiliateUrl);

  const handleClick = () => {
    // 제품 상세 페이지로 이동 또는 어필리에이트 링크
    if (product.affiliateUrl) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
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
              {/* 제휴 링크 카드는 '제휴' 뱃지로 광고성 명시 (공정위 추천보증 심사지침) */}
              {isAffiliate && <AdBadge label="제휴" variant="subtle" size="xs" />}
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.reason}</p>
          </div>

          {/* 버튼 */}
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            보기
          </Button>
        </div>

        {/* 제휴 고지 — 구매(제휴) 링크 인접 노출 (표시광고법·FTC §255.5) */}
        {isAffiliate && <AffiliateCardDisclosure className="mt-2 text-[10px] leading-snug" />}
      </CardContent>
    </Card>
  );
}
