/**
 * ChannelComparisonTable 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChannelComparisonTable } from '@/components/affiliate/ChannelComparisonTable';
import type { ChannelOption } from '@/components/affiliate/MultiChannelProductCard';

describe('ChannelComparisonTable', () => {
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

  it('비교 테이블을 렌더링한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} />);

    expect(screen.getByTestId('channel-comparison-table')).toBeInTheDocument();
  });

  it('헤더를 표시한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} />);

    expect(screen.getByText('쇼핑몰')).toBeInTheDocument();
    expect(screen.getByText('가격')).toBeInTheDocument();
    expect(screen.getByText('배송')).toBeInTheDocument();
    expect(screen.getByText('혜택')).toBeInTheDocument();
  });

  it('모든 채널을 표시한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} />);

    expect(screen.getByText('쿠팡')).toBeInTheDocument();
    expect(screen.getByText('iHerb')).toBeInTheDocument();
    expect(screen.getByText('무신사')).toBeInTheDocument();
  });

  it('가격순으로 정렬한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} sortBy="price" />);

    const rows = screen.getAllByText(/원$/);
    // 첫 번째는 재고 있는 것 중 최저가 (iHerb 12,500원)
    expect(rows[0].textContent).toContain('12,500');
  });

  it('배송일순으로 정렬한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} sortBy="delivery" />);

    // 쿠팡이 가장 빠름 (1일) - 재고 있는 채널 중에서
    // 첫 번째 행이 쿠팡인지 확인 (최단 배송은 ⚡ 이모지 포함)
    const rows = screen.getAllByText(/^\d+일/);
    expect(rows[0].textContent).toContain('1일');
  });

  it('최저가에 최저 뱃지를 표시한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} />);

    expect(screen.getByText('최저')).toBeInTheDocument();
  });

  it('배송 타입 뱃지를 표시한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} />);

    expect(screen.getByText('로켓')).toBeInTheDocument();
    expect(screen.getByText('해외')).toBeInTheDocument();
    expect(screen.getByText('내일')).toBeInTheDocument();
  });

  it('무료배송 표시를 한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} />);

    expect(screen.getAllByText('무배').length).toBeGreaterThanOrEqual(1);
  });

  it('품절 채널에 품절 표시를 한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} />);

    expect(screen.getByText('품절')).toBeInTheDocument();
  });

  it('채널 선택 시 콜백을 호출한다', () => {
    const onSelectChannel = vi.fn();
    const mockOpen = vi.fn();
    vi.spyOn(window, 'open').mockImplementation(mockOpen);

    render(<ChannelComparisonTable channels={mockChannels} onSelectChannel={onSelectChannel} />);

    // 구매 버튼 클릭
    const buyButtons = screen.getAllByText('구매');
    fireEvent.click(buyButtons[0]);

    expect(onSelectChannel).toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalled();
  });

  it('채널이 없으면 안내 메시지를 표시한다', () => {
    render(<ChannelComparisonTable channels={[]} />);

    expect(screen.getByText('비교할 채널이 없어요')).toBeInTheDocument();
  });

  it('채널 수와 최저가 요약을 표시한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} />);

    expect(screen.getByText(/2개 채널 비교/)).toBeInTheDocument();
    // 최저가가 요약 영역과 행에 모두 표시됨
    expect(screen.getAllByText('12,500원').length).toBeGreaterThanOrEqual(1);
  });

  it('할인율을 표시한다', () => {
    render(<ChannelComparisonTable channels={mockChannels} />);

    expect(screen.getByText('-20%')).toBeInTheDocument();
  });
});
