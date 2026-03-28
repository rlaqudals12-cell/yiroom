/**
 * P1-4 테스트: ScanningAnimation 컴포넌트
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ScanningAnimation } from '@/components/analysis/overlay/ScanningAnimation';

describe('ScanningAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render when isAnalyzing is true', () => {
    render(<ScanningAnimation type="face" isAnalyzing={true} />);
    expect(screen.getByTestId('scanning-animation')).toBeInTheDocument();
  });

  it('should not render when isAnalyzing is false', () => {
    render(<ScanningAnimation type="face" isAnalyzing={false} />);
    expect(screen.queryByTestId('scanning-animation')).not.toBeInTheDocument();
  });

  it('should display correct label for face type', () => {
    render(<ScanningAnimation type="face" isAnalyzing={true} />);
    expect(screen.getByText('얼굴 분석 중')).toBeInTheDocument();
  });

  it('should display correct label for body type', () => {
    render(<ScanningAnimation type="body" isAnalyzing={true} />);
    expect(screen.getByText('체형 분석 중')).toBeInTheDocument();
  });

  it('should display correct label for tooth type', () => {
    render(<ScanningAnimation type="tooth" isAnalyzing={true} />);
    expect(screen.getByText('구강 분석 중')).toBeInTheDocument();
  });

  it('should show progress when provided', () => {
    render(<ScanningAnimation type="face" isAnalyzing={true} progress={45} />);
    expect(screen.getByText('얼굴 분석 중 45%')).toBeInTheDocument();
  });

  it('should have progressbar role for accessibility', () => {
    render(<ScanningAnimation type="face" isAnalyzing={true} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '얼굴 분석 중');
  });

  it('should call onComplete after animation duration', () => {
    const onComplete = vi.fn();
    render(<ScanningAnimation type="face" isAnalyzing={true} onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    // face duration은 2000ms
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should hide after animation completes', () => {
    render(<ScanningAnimation type="face" isAnalyzing={true} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId('scanning-animation')).not.toBeInTheDocument();
  });

  it('should reset when isAnalyzing changes to false', () => {
    const { rerender } = render(<ScanningAnimation type="face" isAnalyzing={true} />);
    expect(screen.getByTestId('scanning-animation')).toBeInTheDocument();

    rerender(<ScanningAnimation type="face" isAnalyzing={false} />);
    expect(screen.queryByTestId('scanning-animation')).not.toBeInTheDocument();
  });
});
