import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockDataNotice } from '@/components/common/MockDataNotice';

describe('MockDataNotice', () => {
  describe('기본 모드', () => {
    it('should render full notice by default', () => {
      render(<MockDataNotice />);

      const notice = screen.getByTestId('mock-data-notice');
      expect(notice).toBeInTheDocument();
      expect(notice).toHaveAttribute('role', 'alert');
    });

    it('should display warning title', () => {
      render(<MockDataNotice />);

      expect(screen.getByText('임시 데이터 표시 중')).toBeInTheDocument();
    });

    it('should display explanation message', () => {
      render(<MockDataNotice />);

      expect(
        screen.getByText(/현재 AI 분석 서비스를 이용할 수 없어/)
      ).toBeInTheDocument();
      expect(screen.getByText(/잠시 후 다시 시도하시면/)).toBeInTheDocument();
    });

    it('should have amber/warning color scheme', () => {
      render(<MockDataNotice />);

      const notice = screen.getByTestId('mock-data-notice');
      expect(notice).toHaveClass('bg-amber-50');
      expect(notice).toHaveClass('border-amber-200');
    });

    it('should apply custom className', () => {
      render(<MockDataNotice className="my-custom-class" />);

      const notice = screen.getByTestId('mock-data-notice');
      expect(notice).toHaveClass('my-custom-class');
    });

    it('should have aria-live for accessibility', () => {
      render(<MockDataNotice />);

      const notice = screen.getByTestId('mock-data-notice');
      expect(notice).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('컴팩트 모드', () => {
    it('should render compact notice when compact prop is true', () => {
      render(<MockDataNotice compact />);

      const notice = screen.getByTestId('mock-data-notice-compact');
      expect(notice).toBeInTheDocument();
    });

    it('should display short label in compact mode', () => {
      render(<MockDataNotice compact />);

      expect(screen.getByText('샘플 결과')).toBeInTheDocument();
    });

    it('should have role status in compact mode', () => {
      render(<MockDataNotice compact />);

      const notice = screen.getByTestId('mock-data-notice-compact');
      expect(notice).toHaveAttribute('role', 'status');
    });

    it('should have accessibility label in compact mode', () => {
      render(<MockDataNotice compact />);

      const notice = screen.getByTestId('mock-data-notice-compact');
      expect(notice).toHaveAttribute(
        'aria-label',
        '임시 데이터가 표시되고 있습니다'
      );
    });

    it('should apply custom className in compact mode', () => {
      render(<MockDataNotice compact className="compact-custom" />);

      const notice = screen.getByTestId('mock-data-notice-compact');
      expect(notice).toHaveClass('compact-custom');
    });

    it('should have smaller pill-like styling', () => {
      render(<MockDataNotice compact />);

      const notice = screen.getByTestId('mock-data-notice-compact');
      expect(notice).toHaveClass('rounded-full');
      expect(notice).toHaveClass('text-xs');
    });
  });
});
