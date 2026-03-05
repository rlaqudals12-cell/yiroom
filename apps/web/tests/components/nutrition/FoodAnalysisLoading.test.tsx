/**
 * N-1 FoodAnalysisLoading 컴포넌트 테스트
 * Task 2.4: 카메라 촬영 UI
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FoodAnalysisLoading from '@/components/nutrition/FoodAnalysisLoading';

describe('FoodAnalysisLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('로딩 애니메이션을 렌더링한다', () => {
    render(<FoodAnalysisLoading />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('AI가 음식을 분석하고 있어요...')).toBeInTheDocument();
  });

  it('프로그레스 바를 표시한다', () => {
    render(<FoodAnalysisLoading />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('분석 항목 목록을 표시한다', () => {
    render(<FoodAnalysisLoading />);

    expect(screen.getByText('분석 항목')).toBeInTheDocument();
    expect(screen.getByText('• 음식 인식')).toBeInTheDocument();
    expect(screen.getByText('• 칼로리')).toBeInTheDocument();
    expect(screen.getByText('• 탄수화물')).toBeInTheDocument();
    expect(screen.getByText('• 단백질')).toBeInTheDocument();
    expect(screen.getByText('• 지방')).toBeInTheDocument();
    expect(screen.getByText('• 신호등 분류')).toBeInTheDocument();
  });

  it('로딩 팁을 표시한다', () => {
    render(<FoodAnalysisLoading />);

    expect(screen.getByText(/음식에 포함된 영양소를 분석하고 있어요/)).toBeInTheDocument();
  });

  it('초기 프로그레스 값이 0%이다', () => {
    render(<FoodAnalysisLoading />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('onComplete prop이 함수로 전달된다', () => {
    const onComplete = vi.fn();
    render(<FoodAnalysisLoading onComplete={onComplete} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('isApiComplete=true 시 onComplete 콜백을 호출한다', () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <FoodAnalysisLoading isApiComplete={false} onComplete={onComplete} />
    );

    // preparing 완료 → analyzing phase 전환
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // API 완료 신호 → generating → complete
    rerender(<FoodAnalysisLoading isApiComplete={true} onComplete={onComplete} />);

    // generating + complete + onComplete 지연
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
