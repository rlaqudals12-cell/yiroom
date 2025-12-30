/**
 * ActionToast 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionToast } from '@/components/common/ActionToast';

describe('ActionToast', () => {
  describe('렌더링', () => {
    it('메시지를 표시한다', () => {
      render(<ActionToast type="success" message="성공했습니다" />);

      expect(screen.getByText('성공했습니다')).toBeInTheDocument();
    });

    it('제품명이 있으면 표시한다', () => {
      render(
        <ActionToast
          type="wishlist"
          message="위시리스트에 추가했어요"
          productName="테스트 제품"
        />
      );

      expect(screen.getByText('위시리스트에 추가했어요')).toBeInTheDocument();
      expect(screen.getByText('테스트 제품')).toBeInTheDocument();
    });

    it('제품명이 없으면 표시하지 않는다', () => {
      render(<ActionToast type="cart" message="장바구니에 추가했어요" />);

      expect(screen.getByText('장바구니에 추가했어요')).toBeInTheDocument();
      expect(screen.queryByTestId('product-name')).not.toBeInTheDocument();
    });
  });

  describe('타입별 스타일', () => {
    it('wishlist 타입은 분홍색 스타일이다', () => {
      render(<ActionToast type="wishlist" message="테스트" />);

      const toast = screen.getByTestId('action-toast');
      expect(toast.className).toContain('bg-pink-50');
      expect(toast.className).toContain('border-pink-200');
    });

    it('cart 타입은 파란색 스타일이다', () => {
      render(<ActionToast type="cart" message="테스트" />);

      const toast = screen.getByTestId('action-toast');
      expect(toast.className).toContain('bg-blue-50');
      expect(toast.className).toContain('border-blue-200');
    });

    it('compare 타입은 황금색 스타일이다', () => {
      render(<ActionToast type="compare" message="테스트" />);

      const toast = screen.getByTestId('action-toast');
      expect(toast.className).toContain('bg-amber-50');
      expect(toast.className).toContain('border-amber-200');
    });

    it('success 타입은 녹색 스타일이다', () => {
      render(<ActionToast type="success" message="테스트" />);

      const toast = screen.getByTestId('action-toast');
      expect(toast.className).toContain('bg-green-50');
      expect(toast.className).toContain('border-green-200');
    });
  });

  describe('아이콘', () => {
    it('wishlist 타입은 Heart 아이콘을 렌더링한다', () => {
      render(<ActionToast type="wishlist" message="테스트" />);
      expect(screen.getByTestId('lucide-heart')).toBeInTheDocument();
    });

    it('cart 타입은 ShoppingCart 아이콘을 렌더링한다', () => {
      render(<ActionToast type="cart" message="테스트" />);
      expect(screen.getByTestId('lucide-shoppingcart')).toBeInTheDocument();
    });

    it('compare 타입은 Star 아이콘을 렌더링한다', () => {
      render(<ActionToast type="compare" message="테스트" />);
      expect(screen.getByTestId('lucide-star')).toBeInTheDocument();
    });

    it('success 타입은 Check 아이콘을 렌더링한다', () => {
      render(<ActionToast type="success" message="테스트" />);
      expect(screen.getByTestId('lucide-check')).toBeInTheDocument();
    });
  });
});
