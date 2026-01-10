import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductRecommendation from '@/components/skin/routine/ProductRecommendation';
import type { AffiliateProduct } from '@/types/affiliate';

describe('ProductRecommendation', () => {
  const mockProducts: AffiliateProduct[] = [
    {
      id: 'prod-1',
      partnerId: 'partner-1',
      externalProductId: 'ext-1',
      name: '젠틀 클렌저',
      brand: '뷰티브랜드',
      priceKrw: 25000,
      priceOriginalKrw: 30000,
      thumbnailUrl: 'https://example.com/image1.jpg',
      rating: 4.5,
      reviewCount: 1250,
      currency: 'KRW',
      affiliateUrl: 'https://example.com/buy1',
      isInStock: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod-2',
      partnerId: 'partner-1',
      externalProductId: 'ext-2',
      name: '딥 클렌징 폼',
      brand: '스킨케어랩',
      priceKrw: 18000,
      thumbnailUrl: 'https://example.com/image2.jpg',
      rating: 4.2,
      reviewCount: 890,
      currency: 'KRW',
      affiliateUrl: 'https://example.com/buy2',
      isInStock: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders with test id', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);
    expect(screen.getByTestId('product-recommendation')).toBeInTheDocument();
  });

  it('displays category header with emoji and name', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);

    expect(screen.getByText('클렌저 추천')).toBeInTheDocument();
  });

  it('renders all products', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);

    expect(screen.getByText('젠틀 클렌저')).toBeInTheDocument();
    expect(screen.getByText('딥 클렌징 폼')).toBeInTheDocument();
  });

  it('displays product brand', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);

    expect(screen.getByText('뷰티브랜드')).toBeInTheDocument();
    expect(screen.getByText('스킨케어랩')).toBeInTheDocument();
  });

  it('displays product price', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);

    expect(screen.getByText('25,000원')).toBeInTheDocument();
    expect(screen.getByText('18,000원')).toBeInTheDocument();
  });

  it('displays original price with strikethrough when discounted', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);

    // 첫 번째 제품은 원가 30,000원
    expect(screen.getByText('30,000원')).toBeInTheDocument();
  });

  it('displays product rating', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('4.2')).toBeInTheDocument();
  });

  it('displays review count', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);

    expect(screen.getByText('(1,250)')).toBeInTheDocument();
    expect(screen.getByText('(890)')).toBeInTheDocument();
  });

  it('calls onProductClick when product is clicked', () => {
    const onProductClick = vi.fn();
    render(
      <ProductRecommendation
        products={mockProducts}
        category="cleanser"
        onProductClick={onProductClick}
      />
    );

    const productCards = screen.getAllByTestId('product-recommendation-card');
    fireEvent.click(productCards[0]);

    expect(onProductClick).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('shows empty state when no products', () => {
    render(<ProductRecommendation products={[]} category="cleanser" />);

    expect(screen.getByTestId('product-recommendation-empty')).toBeInTheDocument();
    expect(screen.getByText('추천 제품을 불러오는 중...')).toBeInTheDocument();
  });

  it('renders product images', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('alt', '젠틀 클렌저');
    expect(images[1]).toHaveAttribute('alt', '딥 클렌징 폼');
  });

  it('displays different category emoji for different categories', () => {
    render(<ProductRecommendation products={mockProducts} category="toner" />);

    expect(screen.getByText('토너 추천')).toBeInTheDocument();
    // 토너 이모지
    const container = screen.getByTestId('product-recommendation');
    expect(container.textContent).toContain('💧');
  });

  it('applies custom className', () => {
    render(
      <ProductRecommendation products={mockProducts} category="cleanser" className="custom-class" />
    );

    expect(screen.getByTestId('product-recommendation')).toHaveClass('custom-class');
  });

  it('renders multiple product cards as buttons', () => {
    render(<ProductRecommendation products={mockProducts} category="cleanser" />);

    // 각 제품이 버튼으로 렌더링됨
    const cards = screen.getAllByTestId('product-recommendation-card');
    expect(cards).toHaveLength(2);
    cards.forEach((card) => {
      expect(card.tagName).toBe('BUTTON');
    });
  });
});
