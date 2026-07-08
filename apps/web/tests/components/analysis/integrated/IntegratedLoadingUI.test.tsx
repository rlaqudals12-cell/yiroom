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

  it('시간이 지나면 완료 아이콘으로 전환 (60초+에 걸쳐 순차)', () => {
    render(<IntegratedLoadingUI />);

    // 15초 경과 → PC(14s) 완료 / 나머지 진행 중
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    const checks = screen.getAllByTestId('icon-check');
    expect(checks.length).toBeGreaterThanOrEqual(1);
  });

  it('마지막 축(메이크업)은 타이머로 완료되지 않음 — 응답 도착까지 스피너 유지', () => {
    render(<IntegratedLoadingUI />);

    // 충분히 오래(120초) 지나도 마지막 축은 완료 처리 안 됨 (완료 위장 금지)
    act(() => {
      vi.advanceTimersByTime(120000);
    });

    // PC/피부/체형/헤어 4개만 완료, 메이크업은 스피너 유지
    expect(screen.getAllByTestId('icon-check')).toHaveLength(4);
    expect(screen.getAllByTestId('icon-loader')).toHaveLength(1);
  });

  it('75초 초과 시 느린 경고 메시지 표시', () => {
    render(<IntegratedLoadingUI />);

    act(() => {
      vi.advanceTimersByTime(76000);
    });

    expect(screen.getByText(/거의 다 됐어요/)).toBeInTheDocument();
  });

  it('초기에는 정직한 소요 안내 메시지 표시', () => {
    render(<IntegratedLoadingUI />);
    expect(screen.getByText(/최대 1~2분 걸릴 수 있어요/)).toBeInTheDocument();
  });

  it('최상위 컨테이너 data-testid 존재', () => {
    render(<IntegratedLoadingUI />);
    expect(screen.getByTestId('integrated-loading')).toBeInTheDocument();
  });
});
