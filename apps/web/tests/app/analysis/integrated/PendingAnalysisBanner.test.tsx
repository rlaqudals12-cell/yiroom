/**
 * 이탈 복구 배너 테스트
 *
 * 분석 중 화면을 벗어난 사용자가 돌아왔을 때:
 * - **그 요청의** 세션(상관 ID 일치)만 결과 링크를 준다
 * - 없으면 "결과가 있다"고 말하지 않는다 (정직성)
 * - 아직 마무리되지 않은 세션(pending)을 "완료"로 포장하지 않는다
 *
 * 회귀 방지(2026-08 외부 리뷰 #3): 예전엔 "최신 세션 created_at ≥ 제출시각 −2분"으로
 * 판정해, 제출 직전에 만든 다른 세션을 이번 분석으로 오인해 엉뚱한 결과로 보냈다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IntegratedSessionRow, SessionStatus } from '@/lib/analysis/integrated';

const hookState: {
  session: IntegratedSessionRow | null;
  isLoading: boolean;
  lastRequestId: string | null;
} = {
  session: null,
  isLoading: false,
  lastRequestId: null,
};

vi.mock('@/hooks/usePendingIntegratedSession', () => ({
  usePendingIntegratedSession: (requestId: string | null) => {
    hookState.lastRequestId = requestId;
    return { session: hookState.session, isLoading: hookState.isLoading, error: null };
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { PendingAnalysisBanner } from '@/app/(main)/analysis/integrated/_components/PendingAnalysisBanner';

const REQUEST_ID = '11111111-2222-4333-8444-555555555555';

function makeSession(status: SessionStatus): IntegratedSessionRow {
  return {
    id: 'session-1',
    clerk_user_id: 'user_1',
    face_image_url: null,
    body_image_url: null,
    questionnaire: {},
    status,
    axes_completed: ['skin'],
    axes_failed: [],
    used_fallback: [],
    persona: null,
    created_at: new Date('2026-08-17T10:00:00.000Z').toISOString(),
    completed_at: null,
  };
}

describe('PendingAnalysisBanner', () => {
  beforeEach(() => {
    hookState.session = null;
    hookState.isLoading = false;
    hookState.lastRequestId = null;
    vi.clearAllMocks();
  });

  it('조회 중에는 아무것도 단언하지 않는다', () => {
    hookState.isLoading = true;
    const { container } = render(
      <PendingAnalysisBanner requestId={REQUEST_ID} onDismiss={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('마커의 상관 ID로만 조회한다 (시각 추정 없음)', () => {
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onDismiss={vi.fn()} />);
    expect(hookState.lastRequestId).toBe(REQUEST_ID);
  });

  it('상관 ID가 일치하는 완료 세션이면 결과 링크를 제공한다', () => {
    hookState.session = makeSession('completed');
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '진행 중이던 분석이 있어요'
    );
    expect(screen.getByTestId('pending-analysis-link')).toHaveAttribute(
      'href',
      '/analysis/integrated/result/session-1'
    );
  });

  it('부분 성공 세션도 결과 링크를 제공한다', () => {
    hookState.session = makeSession('partial');
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onDismiss={vi.fn()} />);

    expect(screen.getByTestId('pending-analysis-link')).toBeInTheDocument();
  });

  it('세션이 없으면 링크 없이 저장되지 않았다고 알린다', () => {
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onDismiss={vi.fn()} />);

    expect(screen.queryByTestId('pending-analysis-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '결과가 저장되지 않았어요'
    );
  });

  it('아직 마무리되지 않은 세션(pending)을 완료로 포장하지 않는다', () => {
    hookState.session = makeSession('pending');
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onDismiss={vi.fn()} />);

    expect(screen.queryByTestId('pending-analysis-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '아직 마무리되지 않았어요'
    );
  });

  it('실패 세션은 링크 없이 실패로 알린다', () => {
    hookState.session = makeSession('failed');
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onDismiss={vi.fn()} />);

    expect(screen.queryByTestId('pending-analysis-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '분석이 완료되지 못했어요'
    );
  });

  it('닫기 버튼은 onDismiss를 호출한다', () => {
    const onDismiss = vi.fn();
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onDismiss={onDismiss} />);

    screen.getByTestId('pending-analysis-dismiss').click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
