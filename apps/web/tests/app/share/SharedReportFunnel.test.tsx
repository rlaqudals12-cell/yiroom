import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SharedReportFunnel } from '@/app/share/report/[token]/_components/SharedReportFunnel';

const analytics = vi.hoisted(() => ({
  trackView: vi.fn(() => Promise.resolve()),
}));

const authState = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => authState,
}));

vi.mock('@/lib/analytics/tracker', () => ({
  trackSharedReportView: analytics.trackView,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

describe('SharedReportFunnel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isLoaded = true;
    authState.isSignedIn = true;
  });

  it('ref 채널로 공개 리포트 열람을 기록한다', async () => {
    render(<SharedReportFunnel referralSource="kakao" />);

    await waitFor(() => expect(analytics.trackView).toHaveBeenCalledWith('kakao'));
    expect(screen.getByTestId('shared-report-funnel')).toHaveAttribute(
      'data-referral-source',
      'kakao'
    );
  });

  it('분석 CTA에는 ref만 보존하고 클릭을 분석 시작으로 오계측하지 않는다', () => {
    render(<SharedReportFunnel referralSource="link" />);

    const cta = screen.getByTestId('shared-report-analysis-start');
    expect(cta).toHaveAttribute('href', '/analysis/personal-color?ref=link');
  });

  it('익명 수신자의 열람은 동의 없이 계측하지 않는다', async () => {
    authState.isSignedIn = false;

    render(<SharedReportFunnel referralSource="kakao" />);
    await Promise.resolve();

    expect(analytics.trackView).not.toHaveBeenCalled();
  });
});
