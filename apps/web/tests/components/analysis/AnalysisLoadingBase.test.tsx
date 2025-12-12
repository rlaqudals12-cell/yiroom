/**
 * AnalysisLoadingBase 컴포넌트 테스트
 * @description 공통 분석 로딩 컴포넌트 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import AnalysisLoadingBase from '@/components/analysis/AnalysisLoadingBase';

// lucide-react mock은 setup.ts에서 글로벌로 제공됨

describe('AnalysisLoadingBase', () => {
  const mockTips = [
    '첫 번째 팁입니다.',
    '두 번째 팁입니다.',
    '세 번째 팁입니다.',
  ];

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

      expect(screen.getByText('분석 중...')).toBeInTheDocument();
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

  describe('프로그레스 애니메이션', () => {
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

    it('시간이 지나면 프로그레스가 증가한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          duration={1000}
        />
      );

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // 50% 정도 진행되어야 함
      const progressBar = screen.getByRole('progressbar');
      const value = parseInt(progressBar.getAttribute('aria-valuenow') || '0');
      expect(value).toBeGreaterThan(40);
      expect(value).toBeLessThan(60);
    });

    it('duration 후 100%에 도달한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          duration={1000}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('100% 도달 후 onComplete를 호출한다', () => {
      render(
        <AnalysisLoadingBase
          onComplete={mockOnComplete}
          tips={mockTips}
          analysisItems={mockAnalysisItems}
          duration={1000}
        />
      );

      // duration(1000ms) + 완료 후 지연(300ms) + 여유분
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      act(() => {
        vi.advanceTimersByTime(500);
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
          duration={10000}
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
          duration={20000}
        />
      );

      // 3번째 팁까지
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
