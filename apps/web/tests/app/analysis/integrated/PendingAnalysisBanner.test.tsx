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
  recoveryState:
    | 'checking'
    | 'not_found'
    | 'error'
    | 'pending'
    | 'completed'
    | 'failed'
    | 'stalled';
  error: Error | null;
  refetch: ReturnType<typeof vi.fn>;
  lastRequestId: string | null;
} = {
  session: null,
  isLoading: false,
  recoveryState: 'not_found',
  error: null,
  refetch: vi.fn(),
  lastRequestId: null,
};

vi.mock('@/hooks/usePendingIntegratedSession', () => ({
  usePendingIntegratedSession: (requestId: string | null) => {
    hookState.lastRequestId = requestId;
    return {
      session: hookState.session,
      isLoading: hookState.isLoading,
      error: hookState.error,
      recoveryState: hookState.recoveryState,
      refetch: hookState.refetch,
    };
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
    hookState.recoveryState = 'not_found';
    hookState.error = null;
    hookState.lastRequestId = null;
    vi.clearAllMocks();
  });

  it('조회 중에는 결과를 단언하지 않고 확인 중 상태를 표시한다', () => {
    hookState.isLoading = true;
    hookState.recoveryState = 'checking';
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={vi.fn()} />);
    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent('확인하고 있어요');
  });

  it('마커의 상관 ID로만 조회한다 (시각 추정 없음)', () => {
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={vi.fn()} />);
    expect(hookState.lastRequestId).toBe(REQUEST_ID);
  });

  it('상관 ID가 일치하는 완료 세션이면 결과 링크를 제공한다', () => {
    hookState.session = makeSession('completed');
    hookState.recoveryState = 'completed';
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={vi.fn()} />);

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
    hookState.recoveryState = 'completed';
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={vi.fn()} />);

    expect(screen.getByTestId('pending-analysis-link')).toBeInTheDocument();
  });

  it('세션이 아직 없으면 not-found로 구분하고 계속 확인한다고 알린다', () => {
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={vi.fn()} />);

    expect(screen.queryByTestId('pending-analysis-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '아직 요청 세션을 찾지 못했어요'
    );
  });

  it('아직 마무리되지 않은 세션(pending)을 완료로 포장하지 않는다', () => {
    hookState.session = makeSession('pending');
    hookState.recoveryState = 'pending';
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={vi.fn()} />);

    expect(screen.queryByTestId('pending-analysis-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '아직 마무리되지 않았어요'
    );
  });

  it('실패 세션은 링크 없이 실패로 알린다', () => {
    hookState.session = makeSession('failed');
    hookState.recoveryState = 'failed';
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={vi.fn()} />);

    expect(screen.queryByTestId('pending-analysis-link')).not.toBeInTheDocument();
    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '분석이 완료되지 못했어요'
    );
  });

  it('기존 요청 포기 버튼은 onAbandon을 호출한다', () => {
    const onAbandon = vi.fn();
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={onAbandon} />);

    screen.getByTestId('pending-analysis-dismiss').click();
    expect(onAbandon).toHaveBeenCalledTimes(1);
  });

  it('조회 오류는 결과 없음과 다른 문구로 표시한다', () => {
    hookState.recoveryState = 'error';
    hookState.error = new Error('db down');
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={vi.fn()} />);

    expect(screen.getByTestId('pending-analysis-banner')).toHaveTextContent(
      '요청 상태를 불러오지 못했어요'
    );
  });

  it('수동 다시 확인 버튼은 refetch를 호출한다', () => {
    render(<PendingAnalysisBanner requestId={REQUEST_ID} onAbandon={vi.fn()} />);

    screen.getByTestId('pending-analysis-refetch').click();
    expect(hookState.refetch).toHaveBeenCalledTimes(1);
  });
});
