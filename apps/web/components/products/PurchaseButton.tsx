'use client';

import { useAuth } from '@clerk/nextjs';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openAffiliateLink } from '@/lib/products/affiliate';
import { toAffiliateProductType } from '@/types/affiliate';
import type { ProductType } from '@/types/product';

interface PurchaseButtonProps {
  productType: ProductType;
  productId: string;
  purchaseUrl?: string;
  affiliateUrl?: string;
  className?: string;
}

/**
 * 구매 버튼 컴포넌트
 * affiliateUrl이 있으면 어필리에이트 링크로, 없으면 purchaseUrl로 이동
 * 클릭 시 트래킹 기록
 */
export function PurchaseButton({
  productType,
  productId,
  purchaseUrl,
  affiliateUrl,
  className,
}: PurchaseButtonProps) {
  const { userId } = useAuth();

  // 사용할 URL 결정 (affiliateUrl 우선)
  const targetUrl = affiliateUrl || purchaseUrl;

  const handleClick = () => {
    if (!targetUrl) return;

    // 어필리에이트 링크 열기 + 트래킹
    openAffiliateLink(
      targetUrl,
      toAffiliateProductType(productType),
      productId,
      userId ?? undefined
    );
  };

  if (!targetUrl) {
    return (
      <Button size="lg" className={className} disabled>
        구매 링크 준비 중
      </Button>
    );
  }

  return (
    <Button size="lg" className={className} onClick={handleClick}>
      <ExternalLink className="mr-2 h-4 w-4" />
      구매하러 가기
    </Button>
  );
}
