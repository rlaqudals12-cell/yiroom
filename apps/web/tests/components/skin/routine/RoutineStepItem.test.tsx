import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoutineStepItem from '@/components/skin/routine/RoutineStepItem';
import type { RoutineStep } from '@/types/skincare-routine';
import type { AffiliateProduct } from '@/types/affiliate';

// i18n 도입(next-intl)으로 컴포넌트가 번역 키를 사용 —
// tests/setup.ts 기본 목은 키를 그대로 반환하므로 실제 ko 메시지로 오버라이드해
// 한국어 문구 검증을 유지한다.
vi.mock('next-intl', async () => {
  const messages = (await import('@/messages/ko.json')).default as unknown as Record<
    string,
    Record<string, string>
  >;
  return {
    useTranslations: (namespace?: string) => (key: string) =>
      (namespace ? messages[namespace]?.[key] : undefined) ?? key,
    useLocale: () => 'ko',
    useMessages: () => messages,
    NextIntlClientProvider: ({ children }: { children?: unknown }) => children,
  };
});

describe('RoutineStepItem', () => {
  const baseStep: RoutineStep = {
    order: 1,
    category: 'cleanser',
    name: '클렌저',
    purpose: '피지와 노폐물 제거',
    duration: '1분',
    tips: ['미온수 사용', '거품 충분히 내기'],
    isOptional: false,
  };

  const mockProduct: AffiliateProduct = {
    id: 'prod-1',
    partnerId: 'partner-1',
    externalProductId: 'ext-1',
    name: '젠틀 클렌저',
    brand: '뷰티브랜드',
    priceKrw: 25000,
    thumbnailUrl: 'https://example.com/image.jpg',
    currency: 'KRW',
    affiliateUrl: 'https://example.com/buy',
    isInStock: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders with test id', () => {
    render(<RoutineStepItem step={baseStep} />);
    expect(screen.getByTestId('routine-step-item')).toBeInTheDocument();
  });

  it('displays step order number', () => {
    render(<RoutineStepItem step={baseStep} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays step name', () => {
    render(<RoutineStepItem step={baseStep} />);
    expect(screen.getByText('클렌저')).toBeInTheDocument();
  });

  it('displays step purpose', () => {
    render(<RoutineStepItem step={baseStep} />);
    expect(screen.getByText('피지와 노폐물 제거')).toBeInTheDocument();
  });

  it('displays duration', () => {
    render(<RoutineStepItem step={baseStep} />);
    expect(screen.getByText('1분')).toBeInTheDocument();
  });

  it('displays optional badge for optional steps', () => {
    render(<RoutineStepItem step={{ ...baseStep, isOptional: true }} />);
    expect(screen.getByText('선택')).toBeInTheDocument();
  });

  it('does not show optional badge for required steps', () => {
    render(<RoutineStepItem step={baseStep} />);
    expect(screen.queryByText('선택')).not.toBeInTheDocument();
  });

  it('expands to show tips when clicked', () => {
    render(<RoutineStepItem step={baseStep} />);

    // 팁은 처음에 보이지 않음
    expect(screen.queryByText('미온수 사용')).not.toBeInTheDocument();

    // 클릭하면 확장
    fireEvent.click(screen.getByTestId('routine-step-item').querySelector('[role="button"]')!);

    expect(screen.getByText('미온수 사용')).toBeInTheDocument();
    expect(screen.getByText('거품 충분히 내기')).toBeInTheDocument();
  });

  it('shows "사용 팁" label when expanded', () => {
    render(<RoutineStepItem step={baseStep} />);

    fireEvent.click(screen.getByTestId('routine-step-item').querySelector('[role="button"]')!);

    expect(screen.getByText('사용 팁')).toBeInTheDocument();
  });

  it('shows products when showProducts is true and products exist', () => {
    const stepWithProducts: RoutineStep = {
      ...baseStep,
      recommendedProducts: [mockProduct],
    };

    render(<RoutineStepItem step={stepWithProducts} showProducts />);

    // 클릭해서 확장
    fireEvent.click(screen.getByTestId('routine-step-item').querySelector('[role="button"]')!);

    expect(screen.getByText('추천 제품')).toBeInTheDocument();
    expect(screen.getByText('젠틀 클렌저')).toBeInTheDocument();
  });

  it('displays product brand and price', () => {
    const stepWithProducts: RoutineStep = {
      ...baseStep,
      recommendedProducts: [mockProduct],
    };

    render(<RoutineStepItem step={stepWithProducts} showProducts />);
    fireEvent.click(screen.getByTestId('routine-step-item').querySelector('[role="button"]')!);

    expect(screen.getByText('뷰티브랜드')).toBeInTheDocument();
    expect(screen.getByText('25,000원')).toBeInTheDocument();
  });

  it('calls onProductClick when product is clicked', () => {
    const onProductClick = vi.fn();
    const stepWithProducts: RoutineStep = {
      ...baseStep,
      recommendedProducts: [mockProduct],
    };

    render(
      <RoutineStepItem step={stepWithProducts} showProducts onProductClick={onProductClick} />
    );

    fireEvent.click(screen.getByTestId('routine-step-item').querySelector('[role="button"]')!);
    fireEvent.click(screen.getByTestId('product-recommendation-item'));

    expect(onProductClick).toHaveBeenCalledWith(mockProduct);
  });

  it('displays category emoji', () => {
    render(<RoutineStepItem step={baseStep} />);
    // 클렌저 카테고리의 이모지는 '🧴'
    const container = screen.getByTestId('routine-step-item');
    expect(container.textContent).toContain('🧴');
  });

  it('applies custom className', () => {
    render(<RoutineStepItem step={baseStep} className="custom-class" />);
    expect(screen.getByTestId('routine-step-item')).toHaveClass('custom-class');
  });
});
