/**
 * 이탈 복구 배너 테스트
 *
 * 분석 중 화면을 벗어난 사용자가 돌아왔을 때:
 * - 저장된 세션이 있으면 결과 링크를 준다
 * - 없으면 "결과가 있다"고 말하지 않는다 (정직성)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IntegratedSessionRow } from '@/lib/analysis/integrated';

const sessionState: { session: IntegratedSessionRow | null; isLoading: boolean } = {
  session: null,
  isLoading: false,
};

vi.mock('@/hooks/useLatestIntegratedSession', () => ({
  useLatestIntegratedSession: () => ({ ...sessionState, error: null }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { PendingAnalysisBanner } from '@/app/(main)/analysis/integrated/_components/PendingAnalysisBanner';

function makeSession(createdAt: number): IntegratedSessionRow {
  return {
    id: 'session-1',
    clerk_user_id: 'user_1',
    face_image_url: null,
    body_image_url: null,
    questionnaire: {},
    status: 'completed',
    axes_completed: ['skin'],
    axes_failed: [],
    used_fallback: [],
    persona: null,
    created_at: new Date(createdAt).toISOString(),
    completed_at: null,
  };
}

describe('PendingAnalysisBanner', () => {
  const startedAt = Date.parse('2026-08-17T10:00:00.000Z');

  beforeEach(() => {
    sessionState.session = null;
    sessionState.isLoading = false;
    vi.clearAllMocks();
  });

  it('조회 중에는 아무것도 단언하지 않는다', () => {
    sessionState.isLoading = true;
    const { container } = render(
      <PendingAnalysisBanner startedAt={startedAt} onDismiss={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('제출 이후 생성된 세션이 있으면 결과 링크를 제공한다', () => {
    sessionState.session = makeSession(startedAt + 30_000);
    render(<PendingAnalysisBanner startedAt={startedAt} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '진행 중이던 분석이 있어요'
    );
    expect(screen.getByTestId('pending-analysis-link')).toHaveAttribute(
      'href',
      '/analysis/integrated/result/session-1'
    );
  });

  it('세션이 없으면 링크 없이 저장되지 않았다고 알린다', () => {
    render(<PendingAnalysisBanner startedAt={startedAt} onDismiss={vi.fn()} />);

    expect(screen.queryByTestId('pending-analysis-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '결과가 저장되지 않았어요'
    );
  });

  it('제출 이전에 만들어진 옛 세션은 이번 분석으로 오인하지 않는다', () => {
    sessionState.session = makeSession(startedAt - 60 * 60 * 1000);
    render(<PendingAnalysisBanner startedAt={startedAt} onDismiss={vi.fn()} />);

    expect(screen.queryByTestId('pending-analysis-link')).not.toBeInTheDocument();
  });

  it('닫기 버튼은 onDismiss를 호출한다', () => {
    const onDismiss = vi.fn();
    render(<PendingAnalysisBanner startedAt={startedAt} onDismiss={onDismiss} />);

    screen.getByTestId('pending-analysis-dismiss').click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
