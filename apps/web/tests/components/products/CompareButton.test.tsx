/**
 * CompareButton 컴포넌트 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompareButton } from '@/components/products/CompareButton';
import { useProductCompareStore } from '@/lib/stores/productCompareStore';

// 토스트 모킹
vi.mock('sonner', () => ({
  toast: {
    custom: vi.fn(),
    error: vi.fn(),
  },
}));

// 트래킹 모킹
vi.mock('@/lib/analytics', () => ({
  trackCustomEvent: vi.fn(),
}));

describe('CompareButton', () => {
  const mockProduct = {
    productId: 'test-1',
    productType: 'cosmetic' as const,
    name: '테스트 제품',
    brand: '테스트 브랜드',
  };

  beforeEach(() => {
    // 스토어 초기화
    useProductCompareStore.setState({ items: [], isOpen: false });
  });

  describe('렌더링', () => {
    it('아이콘 버튼으로 렌더링한다 (기본)', () => {
      render(<CompareButton product={mockProduct} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '비교 목록에 추가');
    });

    it('버튼 variant로 렌더링한다', () => {
      render(<CompareButton product={mockProduct} variant="button" />);

      expect(screen.getByText('비교하기')).toBeInTheDocument();
    });
  });

  describe('비교 목록 추가', () => {
    it('클릭하면 비교 목록에 추가한다', async () => {
      const user = userEvent.setup();
      render(<CompareButton product={mockProduct} />);

      const button = screen.getByRole('button');
      await user.click(button);

      const state = useProductCompareStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].productId).toBe('test-1');
    });

    it('추가 후 aria-label이 변경된다', async () => {
      const user = userEvent.setup();
      render(<CompareButton product={mockProduct} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(button).toHaveAttribute('aria-label', '비교 목록에서 제거');
    });
  });

  describe('비교 목록 제거', () => {
    it('이미 추가된 제품을 클릭하면 제거한다', async () => {
      // 미리 추가
      useProductCompareStore.getState().addItem(mockProduct);

      const user = userEvent.setup();
      render(<CompareButton product={mockProduct} />);

      const button = screen.getByRole('button');
      await user.click(button);

      const state = useProductCompareStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('버튼 variant', () => {
    it('추가 전에는 "비교하기" 텍스트를 표시한다', () => {
      render(<CompareButton product={mockProduct} variant="button" />);

      expect(screen.getByText('비교하기')).toBeInTheDocument();
    });

    it('추가 후에는 "비교 중" 텍스트를 표시한다', () => {
      useProductCompareStore.getState().addItem(mockProduct);
      render(<CompareButton product={mockProduct} variant="button" />);

      expect(screen.getByText('비교 중')).toBeInTheDocument();
    });
  });

  describe('사이즈', () => {
    it('sm 사이즈가 적용된다', () => {
      render(<CompareButton product={mockProduct} size="sm" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-7');
      expect(button.className).toContain('w-7');
    });

    it('lg 사이즈가 적용된다', () => {
      render(<CompareButton product={mockProduct} size="lg" />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-11');
      expect(button.className).toContain('w-11');
    });
  });
});
