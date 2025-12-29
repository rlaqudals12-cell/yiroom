/**
 * 인기 제품 테이블
 * @description 클릭 기준 상위 제품 목록
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TopProduct } from '@/lib/affiliate/stats';

interface TopProductsTableProps {
  products: TopProduct[];
  isLoading?: boolean;
}

// 파트너 뱃지 색상
const partnerBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  coupang: 'destructive',
  iherb: 'default',
  musinsa: 'secondary',
};

export function TopProductsTable({ products, isLoading }: TopProductsTableProps) {
  if (isLoading) {
    return (
      <Card data-testid="top-products-loading">
        <CardHeader>
          <CardTitle>인기 제품 TOP 10</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-8 w-8 bg-muted rounded" />
                <div className="flex-1 h-4 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="top-products-table">
      <CardHeader>
        <CardTitle>인기 제품 TOP 10</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* 순위 */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${index < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                `}
              >
                {index + 1}
              </div>

              {/* 제품 정보 */}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{product.productName}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={partnerBadgeVariant[product.partnerId] || 'outline'}>
                    {product.partnerId}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    클릭 {product.clicks} · 전환 {product.conversions}
                  </span>
                </div>
              </div>

              {/* 수익 */}
              <div className="text-right">
                <div className="font-bold text-sm">₩{product.commissionKrw.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {product.clicks > 0
                    ? `전환율 ${((product.conversions / product.clicks) * 100).toFixed(1)}%`
                    : '-'}
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              아직 클릭 데이터가 없습니다
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
