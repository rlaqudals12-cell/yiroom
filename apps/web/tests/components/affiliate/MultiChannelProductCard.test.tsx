/**
 * MultiChannelProductCard 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MultiChannelProductCard } from '@/components/affiliate/MultiChannelProductCard';
import type { ChannelOption } from '@/components/affiliate/MultiChannelProductCard';

describe('MultiChannelProductCard', () => {
  const mockChannels: ChannelOption[] = [
    {
      productId: 'prod-coupang-123',
      partner: 'coupang',
      partnerDisplayName: '쿠팡',
      price: 15900,
      originalPrice: 19900,
      deliveryDays: 1,
      deliveryType: 'rocket',
      isFreeShipping: true,
      affiliateUrl: 'https://link.coupang.com/a/123',
      inStock: true,
    },
    {
      productId: 'prod-iherb-456',
      partner: 'iherb',
      partnerDisplayName: 'iHerb',
      price: 12500,
      deliveryDays: 7,
      deliveryType: 'international',
      isFreeShipping: false,
      affiliateUrl: 'https://kr.iherb.com/pr/product/456',
      inStock: true,
      benefits: '5% 적립',
    },
    {
      productId: 'prod-musinsa-789',
      partner: 'musinsa',
      partnerDisplayName: '무신사',
      price: 18000,
      deliveryDays: 2,
      deliveryType: 'next_day',
      isFreeShipping: true,
      affiliateUrl: 'https://www.musinsa.com/app/goods/789',
      inStock: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('제품 카드를 렌더링한다', () => {
    render(
      <MultiChannelProductCard
        productName="비타민 D 3000IU"
        brand="테스트 브랜드"
        channels={mockChannels}
      />
    );

    expect(screen.getByTestId('multi-channel-product-card')).toBeInTheDocument();
    expect(screen.getByText('비타민 D 3000IU')).toBeInTheDocument();
    expect(screen.getByText('테스트 브랜드')).toBeInTheDocument();
  });

  it('재고 있는 채널만 표시한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={mockChannels} />);

    // 쿠팡, iHerb는 재고 있음
    expect(screen.getByText('쿠팡')).toBeInTheDocument();
    expect(screen.getByText('iHerb')).toBeInTheDocument();
    // 무신사는 재고 없음 - 표시되지 않음
    expect(screen.queryByText('무신사')).not.toBeInTheDocument();
  });

  it('최저가 채널에 최저가 뱃지를 표시한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={mockChannels} />);

    // iHerb가 최저가 (12,500원)
    expect(screen.getByText('최저가')).toBeInTheDocument();
  });

  it('가격을 포맷팅하여 표시한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={mockChannels} />);

    expect(screen.getByText('12,500원')).toBeInTheDocument();
    expect(screen.getByText('15,900원')).toBeInTheDocument();
  });

  it('배송 타입을 표시한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={mockChannels} />);

    expect(screen.getByText('로켓배송')).toBeInTheDocument();
    expect(screen.getByText('7일 내 도착')).toBeInTheDocument();
  });

  it('무료배송 표시를 한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={mockChannels} />);

    expect(screen.getByText('무료배송')).toBeInTheDocument();
  });

  it('추가 혜택을 표시한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={mockChannels} />);

    expect(screen.getByText('5% 적립')).toBeInTheDocument();
  });

  it('채널 클릭 시 콜백을 호출한다', async () => {
    const onChannelClick = vi.fn();
    // window.open 모킹
    const mockOpen = vi.fn();
    vi.spyOn(window, 'open').mockImplementation(mockOpen);

    // fetch 모킹 (클릭 트래킹 API)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ affiliateUrl: 'https://kr.iherb.com/pr/product/456' }),
    });

    render(
      <MultiChannelProductCard
        productName="테스트 상품"
        channels={mockChannels}
        onChannelClick={onChannelClick}
      />
    );

    // iHerb 채널 클릭 (텍스트로 찾아서 클릭 가능한 부모 요소 클릭)
    const iherbText = screen.getByText('iHerb');
    // cursor-pointer가 포함된 부모 div를 찾기
    let clickableElement = iherbText.parentElement;
    while (clickableElement && !clickableElement.className.includes('cursor-pointer')) {
      clickableElement = clickableElement.parentElement;
    }

    if (clickableElement) {
      fireEvent.click(clickableElement);
    }

    // 콜백은 동기적으로 호출됨
    expect(onChannelClick).toHaveBeenCalled();

    // window.open은 비동기 fetch 완료 후 호출됨
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith(
        'https://kr.iherb.com/pr/product/456',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  it('채널이 없으면 안내 메시지를 표시한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={[]} />);

    expect(screen.getByText('현재 구매 가능한 채널이 없어요')).toBeInTheDocument();
  });

  it('모든 채널이 품절이면 안내 메시지를 표시한다', () => {
    const outOfStockChannels = mockChannels.map((c) => ({ ...c, inStock: false }));

    render(<MultiChannelProductCard productName="테스트 상품" channels={outOfStockChannels} />);

    expect(screen.getByText('현재 구매 가능한 채널이 없어요')).toBeInTheDocument();
  });

  it('법적 고지를 표시한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={mockChannels} />);

    expect(screen.getByText(/수수료가 지급됩니다/)).toBeInTheDocument();
  });

  it('채널 수를 표시한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={mockChannels} />);

    expect(screen.getByText(/2개 채널/)).toBeInTheDocument(); // 재고 있는 것만
  });

  it('할인율을 표시한다', () => {
    render(<MultiChannelProductCard productName="테스트 상품" channels={mockChannels} />);

    // 쿠팡: (19900 - 15900) / 19900 = 20%
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });
});
