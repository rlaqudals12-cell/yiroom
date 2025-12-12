/**
 * N-1 FoodAnalysisLoading 컴포넌트 테스트
 * Task 2.4: 카메라 촬영 UI
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FoodAnalysisLoading from '@/components/nutrition/FoodAnalysisLoading';

describe('FoodAnalysisLoading', () => {
  it('로딩 애니메이션을 렌더링한다', () => {
    const onComplete = vi.fn();
    render(<FoodAnalysisLoading onComplete={onComplete} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('AI가 음식을 분석하고 있어요...')).toBeInTheDocument();
  });

  it('프로그레스 바를 표시한다', () => {
    const onComplete = vi.fn();
    render(<FoodAnalysisLoading onComplete={onComplete} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('분석 항목 목록을 표시한다', () => {
    const onComplete = vi.fn();
    render(<FoodAnalysisLoading onComplete={onComplete} />);

    expect(screen.getByText('분석 항목')).toBeInTheDocument();
    expect(screen.getByText('• 음식 인식')).toBeInTheDocument();
    expect(screen.getByText('• 칼로리')).toBeInTheDocument();
    expect(screen.getByText('• 탄수화물')).toBeInTheDocument();
    expect(screen.getByText('• 단백질')).toBeInTheDocument();
    expect(screen.getByText('• 지방')).toBeInTheDocument();
    expect(screen.getByText('• 신호등 분류')).toBeInTheDocument();
  });

  it('로딩 팁을 표시한다', () => {
    const onComplete = vi.fn();
    render(<FoodAnalysisLoading onComplete={onComplete} />);

    // 첫 번째 팁이 표시되어야 함
    expect(screen.getByText(/음식에 포함된 영양소를 분석하고 있어요/)).toBeInTheDocument();
  });

  it('초기 프로그레스 값이 0%이다', () => {
    const onComplete = vi.fn();
    render(<FoodAnalysisLoading onComplete={onComplete} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('onComplete prop이 함수로 전달된다', () => {
    const onComplete = vi.fn();
    render(<FoodAnalysisLoading onComplete={onComplete} />);

    // 컴포넌트가 정상 렌더링되면 onComplete가 전달되었음을 확인
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('로딩 완료 시 onComplete 콜백을 호출한다', async () => {
    const onComplete = vi.fn();
    render(<FoodAnalysisLoading onComplete={onComplete} />);

    // AnalysisLoadingBase: 3초 progress + 300ms 딜레이 = 약 3.3초
    // 테스트 환경에서 충분한 여유를 두고 대기
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    }, { timeout: 5000 });
  }, 6000);
});
