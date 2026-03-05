/**
 * AnalysisLoadingBase 컴포넌트 테스트
 * @description 공통 분석 로딩 컴포넌트 (단계별 프로그레스) 테스트
 * @version 2.0
 * @date 2026-03-04
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AnalysisLoadingBase from '@/components/analysis/AnalysisLoadingBase';

describe('AnalysisLoadingBase', () => {
  const mockTips = ['첫 번째 팁입니다.', '두 번째 팁입니다.', '세 번째 팁입니다.'];

  const mockAnalysisItems = (
    <div data-testid="analysis-items">
      <span>항목 1</span>
      <span>항목 2</span>
    </div>
  );

  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnComplete.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('기본 렌더링', () => {
    it('로딩 메시지를 표시한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      // preparing 단계의 기본 메시지
      expect(screen.getByText('이미지를 준비하고 있어요')).toBeInTheDocument();
    });

    it('커스텀 로딩 메시지를 표시한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          loadingMessage="AI 분석 중..."
        />
      );

      expect(screen.getByText('AI 분석 중...')).toBeInTheDocument();
    });

    it('프로그레스 바를 표시한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('분석 항목을 표시한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      expect(screen.getByText('분석 항목')).toBeInTheDocument();
      expect(screen.getByTestId('analysis-items')).toBeInTheDocument();
    });

    it('첫 번째 팁을 표시한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      expect(screen.getByText(/첫 번째 팁입니다/)).toBeInTheDocument();
    });
  });

  describe('단계별 프로그레스', () => {
    it('초기 프로그레스는 0%이다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('preparing 단계에서 30%까지 진행한다 (1초)', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      const progressBar = screen.getByRole('progressbar');
      const value = parseInt(progressBar.getAttribute('aria-valuenow') || '0');
      expect(value).toBeGreaterThanOrEqual(30);
    });

    it('analyzing 단계에서 75%까지 느리게 진행한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      // preparing 완료 (1초) — phase 전환 허용
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      // analyzing 진행 (5초)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      const progressBar = screen.getByRole('progressbar');
      const value = parseInt(progressBar.getAttribute('aria-valuenow') || '0');
      expect(value).toBeGreaterThan(30);
      expect(value).toBeLessThanOrEqual(75);
    });

    it('isApiComplete=true 시 generating→complete 단계로 전환하여 100%에 도달한다', () => {
      const { rerender } = render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          isApiComplete={false}
        />
      );

      // preparing 완료
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      // API 완료 신호
      rerender(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          isApiComplete={true}
        />
      );

      // generating(0.5초) + complete 전환
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('complete 후 onComplete를 호출한다', () => {
      const { rerender } = render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          isApiComplete={false}
        />
      );

      // preparing 완료 → analyzing phase 전환
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      // API 완료 신호 → generating phase 전환
      rerender(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          isApiComplete={true}
        />
      );

      // generating phase 진행 (50ms intervals, +2, until 95%)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // complete phase → onComplete 지연(500ms)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('팁 순환', () => {
    it('3초마다 다음 팁을 표시한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      expect(screen.getByText(/첫 번째 팁입니다/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/두 번째 팁입니다/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/세 번째 팁입니다/)).toBeInTheDocument();
    });

    it('마지막 팁 후 첫 번째 팁으로 순환한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      // 3번째 팁까지 (9초) → 첫 번째로 순환
      act(() => {
        vi.advanceTimersByTime(9000);
      });

      expect(screen.getByText(/첫 번째 팁입니다/)).toBeInTheDocument();
    });
  });

  describe('색상 테마', () => {
    it('기본 색상은 blue이다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      const loader = screen.getByTestId('loader-icon');
      expect(loader.className).toContain('text-blue-500');
    });

    it('pink 색상을 적용한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          accentColor="pink"
        />
      );

      const loader = screen.getByTestId('loader-icon');
      expect(loader.className).toContain('text-pink-500');
    });

    it('purple 색상을 적용한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          accentColor="purple"
        />
      );

      const loader = screen.getByTestId('loader-icon');
      expect(loader.className).toContain('text-purple-500');
    });
  });

  describe('접근성', () => {
    it('status role을 가진다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('progressbar에 올바른 aria 속성이 있다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
        />
      );

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });
  });
});
