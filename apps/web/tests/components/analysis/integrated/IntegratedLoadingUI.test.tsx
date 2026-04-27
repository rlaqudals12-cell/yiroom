/**
 * IntegratedLoadingUI 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

import { IntegratedLoadingUI } from '@/app/(main)/analysis/integrated/_components/IntegratedLoadingUI';

describe('IntegratedLoadingUI', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기 렌더 시 5축 모두 진행 중 아이콘 표시', () => {
    render(<IntegratedLoadingUI />);
    // 왜: elapsedSec이 초기 0이므로 모든 축이 estimatedSec보다 작음 → 모두 진행 중
    const loaders = screen.getAllByTestId('icon-loader');
    expect(loaders).toHaveLength(5);
  });

  it('시간이 지나면 완료 아이콘으로 전환', () => {
    render(<IntegratedLoadingUI />);

    // 4초 경과 → PC(3s) 완료 / 나머지 4개 진행 중
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    const checks = screen.getAllByTestId('icon-check');
    expect(checks.length).toBeGreaterThanOrEqual(1);
  });

  it('12초 초과 시 느린 경고 메시지 표시', () => {
    render(<IntegratedLoadingUI />);

    act(() => {
      vi.advanceTimersByTime(13000);
    });

    expect(screen.getByText(/조금 오래 걸릴 수 있어요/)).toBeInTheDocument();
  });

  it('초기에는 예상 소요 메시지 표시', () => {
    render(<IntegratedLoadingUI />);
    expect(screen.getByText(/예상 소요: 약 10초/)).toBeInTheDocument();
  });

  it('최상위 컨테이너 data-testid 존재', () => {
    render(<IntegratedLoadingUI />);
    expect(screen.getByTestId('integrated-loading')).toBeInTheDocument();
  });
});
