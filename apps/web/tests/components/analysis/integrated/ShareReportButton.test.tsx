import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareReportButton } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/ShareReportButton';

const mocks = vi.hoisted(() => ({
  shareToKakao: vi.fn(() => Promise.resolve(true)),
  copyToClipboard: vi.fn(() => Promise.resolve(true)),
  trackCreated: vi.fn(() => Promise.resolve()),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/share/social', () => ({ shareToKakao: mocks.shareToKakao }));
vi.mock('@/lib/share/shareUtils', () => ({ copyToClipboard: mocks.copyToClipboard }));
vi.mock('@/lib/analytics/tracker', () => ({
  trackReportShareCreated: mocks.trackCreated,
}));

describe('ShareReportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url: 'https://yiroom.app/share/report/abc' }),
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('공유 버튼 위에 전송 유도 리드를 제공하고 카카오 전송 라벨을 쓴다', () => {
    render(<ShareReportButton sessionId="session-1" />);
    const lead = screen.getByTestId('share-report-lead');
    const button = screen.getByTestId('share-report-kakao-button');
    expect(lead).toHaveTextContent('shareReport.lead');
    expect(lead.nextElementSibling).toContainElement(button);
    expect(button).toHaveAccessibleName('shareReport.sendKakao');
  });

  it('공개 링크 생성 뒤 카카오 ref와 생성 이벤트를 배선한다', async () => {
    mocks.trackCreated.mockReturnValueOnce(new Promise(() => {}));
    render(<ShareReportButton sessionId="session-1" />);

    fireEvent.click(screen.getByTestId('share-report-kakao-button'));

    await waitFor(() => expect(mocks.shareToKakao).toHaveBeenCalledTimes(1));
    expect(mocks.shareToKakao).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://yiroom.app/share/report/abc',
        referralCode: 'kakao',
      })
    );
    expect(mocks.trackCreated).toHaveBeenCalledWith('kakao');
  });

  it('링크 복사는 ref=link URL만 클립보드에 전달한다', async () => {
    render(<ShareReportButton sessionId="session-2" />);

    fireEvent.click(screen.getByTestId('share-report-copy-button'));

    await waitFor(() => expect(mocks.copyToClipboard).toHaveBeenCalledTimes(1));
    expect(mocks.copyToClipboard).toHaveBeenCalledWith(
      'https://yiroom.app/share/report/abc?ref=link'
    );
    expect(mocks.trackCreated).toHaveBeenCalledWith('link');
    expect(screen.getByRole('status')).toHaveTextContent('shareReport.copied');
  });
});
