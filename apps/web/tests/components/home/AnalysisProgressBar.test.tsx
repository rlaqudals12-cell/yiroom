import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnalysisProgressBar } from '@/components/home/AnalysisProgressBar';

describe('AnalysisProgressBar', () => {
  describe('렌더링', () => {
    it('진행도 텍스트가 올바르게 표시됨', () => {
      render(<AnalysisProgressBar completed={3} total={5} />);

      expect(screen.getByText('3/5 완료')).toBeInTheDocument();
    });

    it('0/5 완료 상태가 올바르게 표시됨', () => {
      render(<AnalysisProgressBar completed={0} total={5} />);

      expect(screen.getByText('0/5 완료')).toBeInTheDocument();
    });

    it('5/5 완료 상태가 올바르게 표시됨', () => {
      render(<AnalysisProgressBar completed={5} total={5} />);

      expect(screen.getByText('5/5 완료')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('progressbar role이 존재함', () => {
      render(<AnalysisProgressBar completed={3} total={5} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });

    it('aria-valuenow가 올바르게 설정됨', () => {
      render(<AnalysisProgressBar completed={3} total={5} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '3');
    });

    it('aria-valuemax가 올바르게 설정됨', () => {
      render(<AnalysisProgressBar completed={3} total={5} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemax', '5');
    });

    it('aria-label이 올바르게 설정됨', () => {
      render(<AnalysisProgressBar completed={3} total={5} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', '분석 진행도: 3/5 완료');
    });
  });

  describe('퍼센티지 계산', () => {
    it('0% 진행도 (0/5)', () => {
      const { container } = render(<AnalysisProgressBar completed={0} total={5} />);

      // 진행도 바의 width style 확인
      const progressFill = container.querySelector('[style*="width"]');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('60% 진행도 (3/5)', () => {
      const { container } = render(<AnalysisProgressBar completed={3} total={5} />);

      const progressFill = container.querySelector('[style*="width"]');
      expect(progressFill).toHaveStyle({ width: '60%' });
    });

    it('100% 진행도 (5/5)', () => {
      const { container } = render(<AnalysisProgressBar completed={5} total={5} />);

      const progressFill = container.querySelector('[style*="width"]');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });
  });

  describe('그라디언트 색상', () => {
    it('completedTypes가 없으면 기본 그라디언트 사용', () => {
      const { container } = render(<AnalysisProgressBar completed={3} total={5} />);

      const progressFill = container.querySelector('[class*="from-blue-400"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('personal-color 타입이면 violet 그라디언트 사용', () => {
      const { container } = render(
        <AnalysisProgressBar completed={3} total={5} completedTypes={['personal-color']} />
      );

      const progressFill = container.querySelector('[class*="from-violet-400"]');
      expect(progressFill).toBeInTheDocument();
    });

    it('skin 타입이면 rose 그라디언트 사용', () => {
      const { container } = render(
        <AnalysisProgressBar completed={3} total={5} completedTypes={['skin']} />
      );

      const progressFill = container.querySelector('[class*="from-rose-400"]');
      expect(progressFill).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('total이 0이면 0% 표시', () => {
      const { container } = render(<AnalysisProgressBar completed={0} total={0} />);

      const progressFill = container.querySelector('[style*="width"]');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('completed가 total보다 큰 경우 100% 초과 표시', () => {
      const { container } = render(<AnalysisProgressBar completed={6} total={5} />);

      const progressFill = container.querySelector('[style*="width"]');
      expect(progressFill).toHaveStyle({ width: '120%' });
    });
  });
});
