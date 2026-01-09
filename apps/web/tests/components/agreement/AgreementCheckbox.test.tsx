/**
 * AgreementCheckbox 컴포넌트 테스트
 * SDD-TERMS-AGREEMENT.md §8.3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgreementCheckbox } from '@/components/agreement/AgreementCheckbox';
import type { AgreementItem } from '@/components/agreement/types';

const mockTermsItem: AgreementItem = {
  id: 'terms',
  label: '이용약관 동의',
  required: true,
  detailUrl: '/terms',
};

const mockMarketingItem: AgreementItem = {
  id: 'marketing',
  label: '마케팅 정보 수신 동의',
  required: false,
  description: '프로모션, 이벤트, 신기능 알림을 받습니다',
  detailUrl: '/help/marketing',
};

describe('AgreementCheckbox', () => {
  describe('필수 항목', () => {
    it('필수 항목을 렌더링한다', () => {
      render(<AgreementCheckbox item={mockTermsItem} checked={false} onChange={vi.fn()} />);

      expect(screen.getByTestId('agreement-item-terms')).toBeInTheDocument();
      expect(screen.getByText('(필수)')).toBeInTheDocument();
      expect(screen.getByText('이용약관 동의')).toBeInTheDocument();
    });

    it('필수 텍스트가 primary 색상을 가진다', () => {
      render(<AgreementCheckbox item={mockTermsItem} checked={false} onChange={vi.fn()} />);

      const requiredBadge = screen.getByText('(필수)');
      expect(requiredBadge).toHaveClass('text-primary');
    });
  });

  describe('선택 항목', () => {
    it('선택 항목을 렌더링한다', () => {
      render(<AgreementCheckbox item={mockMarketingItem} checked={false} onChange={vi.fn()} />);

      expect(screen.getByTestId('agreement-item-marketing')).toBeInTheDocument();
      expect(screen.getByText('(선택)')).toBeInTheDocument();
      expect(screen.getByText('마케팅 정보 수신 동의')).toBeInTheDocument();
    });

    it('설명을 표시한다', () => {
      render(<AgreementCheckbox item={mockMarketingItem} checked={false} onChange={vi.fn()} />);

      expect(screen.getByText('프로모션, 이벤트, 신기능 알림을 받습니다')).toBeInTheDocument();
    });

    it('선택 텍스트가 muted 색상을 가진다', () => {
      render(<AgreementCheckbox item={mockMarketingItem} checked={false} onChange={vi.fn()} />);

      const optionalBadge = screen.getByText('(선택)');
      expect(optionalBadge).toHaveClass('text-muted-foreground');
    });
  });

  describe('체크박스 상호작용', () => {
    it('체크박스 클릭 시 onChange가 호출된다', () => {
      const handleChange = vi.fn();
      render(<AgreementCheckbox item={mockTermsItem} checked={false} onChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('체크된 상태를 표시한다', () => {
      render(<AgreementCheckbox item={mockTermsItem} checked={true} onChange={vi.fn()} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'checked');
    });

    it('체크 해제된 상태를 표시한다', () => {
      render(<AgreementCheckbox item={mockTermsItem} checked={false} onChange={vi.fn()} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    });
  });

  describe('상세 보기 링크', () => {
    it('상세 보기 링크를 렌더링한다', () => {
      render(<AgreementCheckbox item={mockTermsItem} checked={false} onChange={vi.fn()} />);

      const link = screen.getByRole('link', { name: '이용약관 동의 상세 보기' });
      expect(link).toHaveAttribute('href', '/terms');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('접근성', () => {
    it('체크박스에 aria-label이 설정된다', () => {
      render(<AgreementCheckbox item={mockTermsItem} checked={false} onChange={vi.fn()} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-label', '이용약관 동의');
    });

    it('레이블 클릭으로 체크박스를 토글할 수 있다', () => {
      const handleChange = vi.fn();
      render(<AgreementCheckbox item={mockTermsItem} checked={false} onChange={handleChange} />);

      const label = screen.getByText('이용약관 동의');
      fireEvent.click(label);

      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });
});
