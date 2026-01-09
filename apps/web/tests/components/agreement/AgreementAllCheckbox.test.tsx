/**
 * AgreementAllCheckbox 컴포넌트 테스트
 * SDD-TERMS-AGREEMENT.md §6.2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgreementAllCheckbox } from '@/components/agreement/AgreementAllCheckbox';

describe('AgreementAllCheckbox', () => {
  describe('렌더링', () => {
    it('전체동의 체크박스를 렌더링한다', () => {
      render(<AgreementAllCheckbox checked={false} onChange={vi.fn()} />);

      expect(screen.getByTestId('agreement-all')).toBeInTheDocument();
      expect(screen.getByText('전체동의')).toBeInTheDocument();
    });

    it('체크박스에 aria-label이 설정된다', () => {
      render(<AgreementAllCheckbox checked={false} onChange={vi.fn()} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', '전체동의');
    });
  });

  describe('체크 상태', () => {
    it('체크된 상태를 표시한다', () => {
      render(<AgreementAllCheckbox checked={true} onChange={vi.fn()} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('체크 해제된 상태를 표시한다', () => {
      render(<AgreementAllCheckbox checked={false} onChange={vi.fn()} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });

    it('indeterminate 상태를 표시한다', () => {
      render(<AgreementAllCheckbox checked={false} indeterminate={true} onChange={vi.fn()} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    });
  });

  describe('상호작용', () => {
    it('체크박스 클릭 시 onChange가 호출된다', () => {
      const handleChange = vi.fn();
      render(<AgreementAllCheckbox checked={false} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('레이블 클릭으로 체크박스를 토글할 수 있다', () => {
      const handleChange = vi.fn();
      render(<AgreementAllCheckbox checked={false} onChange={handleChange} />);

      const label = screen.getByText('전체동의');
      fireEvent.click(label);

      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('스타일', () => {
    it('하단 구분선이 굵게 표시된다', () => {
      render(<AgreementAllCheckbox checked={false} onChange={vi.fn()} />);

      const container = screen.getByTestId('agreement-all');
      expect(container).toHaveClass('border-b-2');
    });

    it('레이블이 굵은 글씨체로 표시된다', () => {
      render(<AgreementAllCheckbox checked={false} onChange={vi.fn()} />);

      const label = screen.getByText('전체동의');
      expect(label).toHaveClass('font-semibold');
    });

    it('className을 전달할 수 있다', () => {
      render(<AgreementAllCheckbox checked={false} onChange={vi.fn()} className="custom-class" />);

      const container = screen.getByTestId('agreement-all');
      expect(container).toHaveClass('custom-class');
    });
  });
});
