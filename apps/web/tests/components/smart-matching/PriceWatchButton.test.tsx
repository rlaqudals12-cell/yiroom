/**
 * PriceWatchButton 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriceWatchButton } from '@/components/smart-matching/PriceWatchButton';

describe('PriceWatchButton', () => {
  it('기본 상태를 표시한다', () => {
    render(<PriceWatchButton productId="product-1" />);

    expect(screen.getByText('가격 알림')).toBeInTheDocument();
    expect(screen.getByTestId('price-watch-button')).toBeInTheDocument();
  });

  it('알림 설정 상태를 표시한다', () => {
    render(<PriceWatchButton productId="product-1" isWatching />);

    expect(screen.getByText('알림 설정됨')).toBeInTheDocument();
  });

  it('클릭 시 토글 콜백을 호출한다', () => {
    const onToggle = vi.fn();
    render(<PriceWatchButton productId="product-1" onToggle={onToggle} />);

    fireEvent.click(screen.getByTestId('price-watch-button'));

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('알림 중일 때 클릭하면 설정 콜백을 호출한다', () => {
    const onConfigureAlert = vi.fn();
    render(
      <PriceWatchButton
        productId="product-1"
        isWatching
        onConfigureAlert={onConfigureAlert}
      />
    );

    fireEvent.click(screen.getByTestId('price-watch-button'));

    expect(onConfigureAlert).toHaveBeenCalled();
  });

  it('알림 상태에 따라 스타일이 변경된다', () => {
    // 알림 중이 아닌 상태
    const { unmount } = render(<PriceWatchButton productId="product-1" />);
    expect(screen.getByTestId('price-watch-button')).not.toHaveClass('bg-yellow-500');
    unmount();

    // 알림 중인 상태 - 새로 렌더링
    render(<PriceWatchButton productId="product-1" isWatching />);
    expect(screen.getByTestId('price-watch-button')).toHaveClass('bg-yellow-500');
  });

  it('커스텀 className을 적용할 수 있다', () => {
    render(<PriceWatchButton productId="product-1" className="custom-class" />);

    expect(screen.getByTestId('price-watch-button')).toHaveClass('custom-class');
  });
});
