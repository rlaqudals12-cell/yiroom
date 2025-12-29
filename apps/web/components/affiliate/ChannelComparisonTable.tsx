'use client';

/**
 * 채널 비교 테이블
 * @description 여러 파트너의 가격/배송 상세 비교
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ChannelOption } from './MultiChannelProductCard';

// ============================================
// 타입 정의
// ============================================

export interface ChannelComparisonTableProps {
  /** 채널 옵션 목록 */
  channels: ChannelOption[];
  /** 채널 선택 콜백 */
  onSelectChannel?: (channel: ChannelOption) => void;
  /** 정렬 기준 */
  sortBy?: 'price' | 'delivery' | 'none';
  /** 추가 클래스 */
  className?: string;
}

// ============================================
// 헬퍼 함수
// ============================================

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

function getDeliveryBadge(type: ChannelOption['deliveryType']): {
  label: string;
  className: string;
} {
  switch (type) {
    case 'rocket':
      return { label: '로켓', className: 'bg-red-100 text-red-700' };
    case 'next_day':
      return { label: '내일', className: 'bg-blue-100 text-blue-700' };
    case 'international':
      return { label: '해외', className: 'bg-purple-100 text-purple-700' };
    case 'standard':
    default:
      return { label: '일반', className: 'bg-gray-100 text-gray-700' };
  }
}

// ============================================
// 컴포넌트
// ============================================

export function ChannelComparisonTable({
  channels,
  onSelectChannel,
  sortBy = 'price',
  className,
}: ChannelComparisonTableProps) {
  // 정렬
  const sortedChannels = [...channels].sort((a, b) => {
    if (!a.inStock && b.inStock) return 1;
    if (a.inStock && !b.inStock) return -1;

    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'delivery':
        return a.deliveryDays - b.deliveryDays;
      default:
        return 0;
    }
  });

  // 최저가 / 최단 배송 찾기
  const inStockChannels = sortedChannels.filter((c) => c.inStock);
  const lowestPrice = inStockChannels.length > 0
    ? Math.min(...inStockChannels.map((c) => c.price))
    : null;
  const fastestDays = inStockChannels.length > 0
    ? Math.min(...inStockChannels.map((c) => c.deliveryDays))
    : null;

  if (channels.length === 0) {
    return (
      <div
        className={cn('rounded-lg border bg-card p-4', className)}
        data-testid="channel-comparison-table"
      >
        <p className="text-sm text-muted-foreground text-center">
          비교할 채널이 없어요
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-lg border bg-card overflow-hidden', className)}
      data-testid="channel-comparison-table"
    >
      {/* 테이블 헤더 */}
      <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
        <div>쇼핑몰</div>
        <div className="text-right">가격</div>
        <div className="text-center">배송</div>
        <div className="text-center">혜택</div>
        <div></div>
      </div>

      {/* 테이블 바디 */}
      <div className="divide-y">
        {sortedChannels.map((channel) => {
          const isLowest = channel.price === lowestPrice;
          const isFastest = channel.deliveryDays === fastestDays;
          const deliveryBadge = getDeliveryBadge(channel.deliveryType);
          const discountPercent = channel.originalPrice
            ? Math.round(((channel.originalPrice - channel.price) / channel.originalPrice) * 100)
            : 0;

          return (
            <div
              key={channel.partner}
              className={cn(
                'grid grid-cols-5 gap-2 px-4 py-3 items-center',
                !channel.inStock && 'opacity-50'
              )}
            >
              {/* 쇼핑몰 */}
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {channel.partnerDisplayName}
                </span>
              </div>

              {/* 가격 */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="font-bold text-sm">{formatPrice(channel.price)}</span>
                  {isLowest && channel.inStock && (
                    <Badge className="bg-green-600 text-[10px] px-1">최저</Badge>
                  )}
                </div>
                {discountPercent > 0 && (
                  <span className="text-xs text-red-500">-{discountPercent}%</span>
                )}
              </div>

              {/* 배송 */}
              <div className="text-center">
                <Badge className={cn('text-[10px]', deliveryBadge.className)}>
                  {deliveryBadge.label}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {channel.deliveryDays}일
                  {isFastest && channel.inStock && ' ⚡'}
                </p>
              </div>

              {/* 혜택 */}
              <div className="text-center">
                <div className="flex flex-col items-center gap-0.5">
                  {channel.isFreeShipping && (
                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                      무배
                    </Badge>
                  )}
                  {channel.benefits && (
                    <span className="text-[10px] text-purple-600">{channel.benefits}</span>
                  )}
                  {!channel.isFreeShipping && !channel.benefits && (
                    <span className="text-[10px] text-muted-foreground">-</span>
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div className="text-right">
                {channel.inStock ? (
                  <Button
                    size="sm"
                    variant={isLowest ? 'default' : 'outline'}
                    className="text-xs h-7"
                    onClick={() => {
                      onSelectChannel?.(channel);
                      window.open(channel.affiliateUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    구매
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    품절
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 요약 */}
      <div className="px-4 py-2 bg-muted/30 border-t flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {inStockChannels.length}개 채널 비교
        </p>
        {lowestPrice && (
          <p className="text-xs">
            최저가 <span className="font-bold text-primary">{formatPrice(lowestPrice)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
