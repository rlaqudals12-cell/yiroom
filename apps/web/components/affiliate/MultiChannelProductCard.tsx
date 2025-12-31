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
  /** 제품 ID (클릭 트래킹용) */
  productId: string;
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
  const sortedChannels = [...channels].filter((c) => c.inStock).sort((a, b) => a.price - b.price);

  // 최저가 찾기
  const lowestPrice = sortedChannels.length > 0 ? sortedChannels[0].price : null;

  // 가장 빠른 배송 찾기
  const fastestDelivery =
    sortedChannels.length > 0
      ? sortedChannels.reduce((fastest, current) =>
          current.deliveryDays < fastest.deliveryDays ? current : fastest
        )
      : null;

  const handleChannelClick = async (channel: ChannelOption) => {
    setSelectedChannel(channel.partner);
    onChannelClick?.(channel);

    // 클릭 트래킹 API 호출
    try {
      const response = await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: channel.productId,
          sourcePage: window.location.pathname,
          sourceComponent: 'MultiChannelProductCard',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // API에서 반환된 어필리에이트 URL 사용 (최신 URL)
        window.open(data.affiliateUrl || channel.affiliateUrl, '_blank', 'noopener,noreferrer');
      } else {
        // API 실패 시에도 기존 URL로 이동
        window.open(channel.affiliateUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // 네트워크 오류 시에도 기존 URL로 이동
      window.open(channel.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (sortedChannels.length === 0) {
    return (
      <div
        className={cn('bg-card rounded-lg border p-4', className)}
        data-testid="multi-channel-product-card"
      >
        <p className="text-muted-foreground text-center text-sm">현재 구매 가능한 채널이 없어요</p>
      </div>
    );
  }

  return (
    <div
      className={cn('bg-card overflow-hidden rounded-lg border', className)}
      data-testid="multi-channel-product-card"
    >
      {/* 제품 정보 */}
      <div className="border-b p-4">
        <div className="flex gap-4">
          {imageUrl && (
            <div className="bg-muted relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image src={imageUrl} alt={productName} fill sizes="80px" className="object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {brand && <p className="text-muted-foreground text-xs">{brand}</p>}
            <h3 className="line-clamp-2 text-sm font-medium">{productName}</h3>
            {lowestPrice && (
              <p className="text-primary mt-1 text-lg font-bold">{formatPrice(lowestPrice)}~</p>
            )}
          </div>
        </div>
      </div>

      {/* 채널 헤더 */}
      <div className="bg-muted/50 px-4 py-2">
        <p className="text-muted-foreground text-xs">
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
                'hover:bg-muted/50 flex cursor-pointer items-center gap-3 p-3 transition-colors',
                selectedChannel === channel.partner && 'bg-muted/50'
              )}
              onClick={() => handleChannelClick(channel)}
            >
              {/* 파트너 아이콘 */}
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border text-lg',
                  getPartnerColor(channel.partner)
                )}
              >
                {getPartnerIcon(channel.partner)}
              </div>

              {/* 채널 정보 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{channel.partnerDisplayName}</span>
                  {isLowest && <Badge className="bg-green-600 text-xs">최저가</Badge>}
                  {isFastest && !isLowest && (
                    <Badge variant="outline" className="border-blue-300 text-xs text-blue-600">
                      빠른배송
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
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
                {discountPercent > 0 && <p className="text-xs text-red-500">-{discountPercent}%</p>}
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
      <div className="bg-muted/30 border-t px-4 py-2">
        <p className="text-muted-foreground text-xs">
          * 이 링크를 통해 구매하시면 이룸에 소정의 수수료가 지급됩니다.
        </p>
      </div>
    </div>
  );
}
