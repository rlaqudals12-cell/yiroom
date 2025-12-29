'use client';

/**
 * 다중 채널 제품 카드
 * @description 동일 제품을 여러 파트너에서 가격/배송 비교
 */

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AffiliatePartnerName } from '@/types/affiliate';

// ============================================
// 타입 정의
// ============================================

export interface ChannelOption {
  /** 파트너 이름 */
  partner: AffiliatePartnerName;
  /** 파트너 표시명 */
  partnerDisplayName: string;
  /** 가격 (원) */
  price: number;
  /** 정가 (할인 전) */
  originalPrice?: number;
  /** 배송일 (일) */
  deliveryDays: number;
  /** 배송 타입 */
  deliveryType: 'rocket' | 'next_day' | 'standard' | 'international';
  /** 무료 배송 여부 */
  isFreeShipping: boolean;
  /** 어필리에이트 링크 */
  affiliateUrl: string;
  /** 재고 여부 */
  inStock: boolean;
  /** 추가 혜택 (포인트 등) */
  benefits?: string;
}

export interface MultiChannelProductCardProps {
  /** 제품명 */
  productName: string;
  /** 브랜드 */
  brand?: string;
  /** 제품 이미지 */
  imageUrl?: string;
  /** 채널별 옵션 */
  channels: ChannelOption[];
  /** 채널 클릭 콜백 */
  onChannelClick?: (channel: ChannelOption) => void;
  /** 추가 클래스 */
  className?: string;
}

// ============================================
// 헬퍼 함수
// ============================================

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

function getDeliveryLabel(type: ChannelOption['deliveryType'], days: number): string {
  switch (type) {
    case 'rocket':
      return '로켓배송';
    case 'next_day':
      return '내일 도착';
    case 'international':
      return `${days}일 내 도착`;
    case 'standard':
    default:
      return `${days}일 배송`;
  }
}

function getPartnerIcon(partner: AffiliatePartnerName): string {
  switch (partner) {
    case 'coupang':
      return '🚀';
    case 'iherb':
      return '💰';
    case 'musinsa':
      return '👕';
    default:
      return '🛒';
  }
}

function getPartnerColor(partner: AffiliatePartnerName): string {
  switch (partner) {
    case 'coupang':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'iherb':
      return 'bg-green-50 border-green-200 text-green-700';
    case 'musinsa':
      return 'bg-gray-50 border-gray-200 text-gray-700';
    default:
      return 'bg-blue-50 border-blue-200 text-blue-700';
  }
}

// ============================================
// 컴포넌트
// ============================================

export function MultiChannelProductCard({
  productName,
  brand,
  imageUrl,
  channels,
  onChannelClick,
  className,
}: MultiChannelProductCardProps) {
  const [selectedChannel, setSelectedChannel] = useState<AffiliatePartnerName | null>(null);

  // 재고 있는 채널만 정렬 (가격 순)
  const sortedChannels = [...channels]
    .filter((c) => c.inStock)
    .sort((a, b) => a.price - b.price);

  // 최저가 찾기
  const lowestPrice = sortedChannels.length > 0 ? sortedChannels[0].price : null;

  // 가장 빠른 배송 찾기
  const fastestDelivery = sortedChannels.length > 0
    ? sortedChannels.reduce((fastest, current) =>
        current.deliveryDays < fastest.deliveryDays ? current : fastest
      )
    : null;

  const handleChannelClick = (channel: ChannelOption) => {
    setSelectedChannel(channel.partner);
    onChannelClick?.(channel);
    // 어필리에이트 링크로 이동
    window.open(channel.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  if (sortedChannels.length === 0) {
    return (
      <div
        className={cn('rounded-lg border bg-card p-4', className)}
        data-testid="multi-channel-product-card"
      >
        <p className="text-sm text-muted-foreground text-center">
          현재 구매 가능한 채널이 없어요
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-lg border bg-card overflow-hidden', className)}
      data-testid="multi-channel-product-card"
    >
      {/* 제품 정보 */}
      <div className="p-4 border-b">
        <div className="flex gap-4">
          {imageUrl && (
            <div className="relative w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
              <Image
                src={imageUrl}
                alt={productName}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {brand && (
              <p className="text-xs text-muted-foreground">{brand}</p>
            )}
            <h3 className="font-medium text-sm line-clamp-2">{productName}</h3>
            {lowestPrice && (
              <p className="text-lg font-bold text-primary mt-1">
                {formatPrice(lowestPrice)}~
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 채널 헤더 */}
      <div className="px-4 py-2 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          어디서 구매하시겠어요? ({sortedChannels.length}개 채널)
        </p>
      </div>

      {/* 채널 목록 */}
      <div className="divide-y">
        {sortedChannels.map((channel) => {
          const isLowest = channel.price === lowestPrice;
          const isFastest = channel.partner === fastestDelivery?.partner;
          const discountPercent = channel.originalPrice
            ? Math.round(((channel.originalPrice - channel.price) / channel.originalPrice) * 100)
            : 0;

          return (
            <div
              key={channel.partner}
              className={cn(
                'p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-muted/50',
                selectedChannel === channel.partner && 'bg-muted/50'
              )}
              onClick={() => handleChannelClick(channel)}
            >
              {/* 파트너 아이콘 */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-lg border',
                  getPartnerColor(channel.partner)
                )}
              >
                {getPartnerIcon(channel.partner)}
              </div>

              {/* 채널 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {channel.partnerDisplayName}
                  </span>
                  {isLowest && (
                    <Badge className="bg-green-600 text-xs">최저가</Badge>
                  )}
                  {isFastest && !isLowest && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                      빠른배송
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {getDeliveryLabel(channel.deliveryType, channel.deliveryDays)}
                  </span>
                  {channel.isFreeShipping && (
                    <span className="text-xs text-green-600">무료배송</span>
                  )}
                  {channel.benefits && (
                    <span className="text-xs text-purple-600">{channel.benefits}</span>
                  )}
                </div>
              </div>

              {/* 가격 */}
              <div className="text-right">
                <p className="font-bold">{formatPrice(channel.price)}</p>
                {discountPercent > 0 && (
                  <p className="text-xs text-red-500">-{discountPercent}%</p>
                )}
              </div>

              {/* 구매 버튼 */}
              <Button size="sm" variant="outline" className="flex-shrink-0">
                구매
              </Button>
            </div>
          );
        })}
      </div>

      {/* 법적 고지 */}
      <div className="px-4 py-2 bg-muted/30 border-t">
        <p className="text-xs text-muted-foreground">
          * 이 링크를 통해 구매하시면 이룸에 소정의 수수료가 지급됩니다.
        </p>
      </div>
    </div>
  );
}
