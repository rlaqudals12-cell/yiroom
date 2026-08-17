/**
 * IntegratedLoadingUI 컴포넌트 테스트
 *
 * 회귀 방지(가짜 진행률 금지): 경과시간 기반 축별 체크마크는 실패한 축까지
 * "완료"로 표시했다. 이제 완료 단언은 어디에도 없고 단일 스피너만 돈다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check" />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="icon-loader" {...props} />,
}));

import { IntegratedLoadingUI } from '@/app/(main)/analysis/integrated/_components/IntegratedLoadingUI';

describe('IntegratedLoadingUI', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('완료 체크마크를 만들지 않는다 — 시간이 아무리 지나도', () => {
    render(<IntegratedLoadingUI />);

    act(() => {
      vi.advanceTimersByTime(120000);
    });

    expect(screen.queryAllByTestId('icon-check')).toHaveLength(0);
  });

  it('진행 스피너는 단 하나이고 축 라벨에는 상태 아이콘이 없다', () => {
    const { container } = render(<IntegratedLoadingUI />);
    expect(screen.getAllByTestId('integrated-loading-spinner')).toHaveLength(1);
    // 축별 아이콘(체크/스피너)이 다시 생기면 실패 — 가짜 진행률 재발 방지
    expect(
      container.querySelectorAll(
        '[data-testid^="loading-axis-"] svg, [data-testid^="loading-axis-"] span'
      )
    ).toHaveLength(0);
  });

  it('분석 범위 5축 라벨을 모두 보여준다', () => {
    render(<IntegratedLoadingUI />);
    for (const code of ['personal_color', 'skin', 'body', 'hair', 'makeup']) {
      expect(screen.getByTestId(`loading-axis-${code}`)).toBeInTheDocument();
    }
  });

  it('초기 안내는 서버 상한(60초)과 일치하는 "최대 1분"이다', () => {
    render(<IntegratedLoadingUI />);
    expect(screen.getByTestId('loading-hint')).toHaveTextContent('최대 1분 정도 걸려요');
    expect(screen.queryByText(/1~2분/)).not.toBeInTheDocument();
  });

  it('45초 초과 시 대기 안내로 문구가 바뀐다', () => {
    render(<IntegratedLoadingUI />);

    act(() => {
      vi.advanceTimersByTime(46000);
    });

    expect(screen.getByTestId('loading-hint')).toHaveTextContent('거의 다 됐어요');
  });

  it('최상위 컨테이너 data-testid와 aria-busy 존재', () => {
    render(<IntegratedLoadingUI />);
    const root = screen.getByTestId('integrated-loading');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-busy', 'true');
  });
});
