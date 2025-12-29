/**
 * PriceComparisonCard 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriceComparisonCard } from '@/components/smart-matching/PriceComparisonCard';
import type { PriceComparison, PurchaseOption } from '@/types/smart-matching';

describe('PriceComparisonCard', () => {
  const mockOption: PurchaseOption = {
    platform: 'coupang',
    originalPrice: 50000,
    salePrice: 45000,
    discountPercent: 10,
    deliveryType: 'rocket',
    deliveryDays: 1,
    deliveryFee: 0,
    points: 450,
    inStock: true,
    affiliateUrl: 'https://example.com',
    commissionRate: 3.0,
    lastUpdated: new Date(),
    reliability: 'cached',
  };

  const mockComparison: PriceComparison = {
    productId: 'product-1',
    options: [mockOption],
    bestPrice: mockOption,
    fastestDelivery: mockOption,
    bestValue: mockOption,
    lastUpdated: new Date(),
  };

  it('가격 비교 정보를 표시한다', () => {
    render(<PriceComparisonCard comparison={mockComparison} />);

    expect(screen.getByText('가격 비교')).toBeInTheDocument();
    expect(screen.getByText('1개 판매처')).toBeInTheDocument();
  });

  it('최저가 옵션을 강조 표시한다', () => {
    render(<PriceComparisonCard comparison={mockComparison} />);

    expect(screen.getByText('최저가')).toBeInTheDocument();
    // 가격은 하이라이트 섹션과 옵션 목록 두 곳에 표시됨
    expect(screen.getAllByText('45,000원').length).toBeGreaterThanOrEqual(1);
  });

  it('플랫폼 이름을 표시한다', () => {
    render(<PriceComparisonCard comparison={mockComparison} />);

    // 플랫폼 이름은 하이라이트 섹션과 옵션 목록 두 곳에 표시됨
    expect(screen.getAllByText(/쿠팡/).length).toBeGreaterThanOrEqual(1);
  });

  it('배송 타입을 표시한다', () => {
    render(<PriceComparisonCard comparison={mockComparison} />);

    // 배송 타입은 하이라이트 섹션과 옵션 목록 두 곳에 표시됨
    expect(screen.getAllByText(/로켓배송/).length).toBeGreaterThanOrEqual(1);
  });

  it('구매하기 버튼 클릭 시 콜백을 호출한다', () => {
    const onSelectOption = vi.fn();
    render(
      <PriceComparisonCard
        comparison={mockComparison}
        onSelectOption={onSelectOption}
      />
    );

    fireEvent.click(screen.getByText('구매하기'));

    expect(onSelectOption).toHaveBeenCalledWith(mockOption);
  });

  it('옵션이 없으면 안내 메시지를 표시한다', () => {
    const emptyComparison: PriceComparison = {
      productId: 'product-1',
      options: [],
      lastUpdated: new Date(),
    };

    render(<PriceComparisonCard comparison={emptyComparison} />);

    expect(screen.getByText('가격 정보를 찾을 수 없어요')).toBeInTheDocument();
  });

  it('data-testid가 설정되어 있다', () => {
    render(<PriceComparisonCard comparison={mockComparison} />);

    expect(screen.getByTestId('price-comparison-card')).toBeInTheDocument();
  });

  it('할인율을 표시한다', () => {
    render(<PriceComparisonCard comparison={mockComparison} />);

    expect(screen.getByText('-10%')).toBeInTheDocument();
  });
});
