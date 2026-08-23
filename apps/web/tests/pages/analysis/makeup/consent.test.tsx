import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true, userId: 'test-user-123' }),
}));

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockLimit = vi.fn(() => ({ single: mockSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ order: mockOrder, eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: mockFrom }),
}));

vi.mock('@/lib/utils/image-compression', () => ({
  compressFileToBase64: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockBase64'),
}));

vi.mock('@/app/(main)/analysis/makeup/_components/MakeupGuide', () => ({
  MakeupGuide: ({ onStartUpload }: { onStartUpload: () => void }) => (
    <button type="button" onClick={onStartUpload} data-testid="go-upload">
      사진 선택하기
    </button>
  ),
}));

vi.mock('@/app/(main)/analysis/makeup/_components/MakeupAnalysisResultView', () => ({
  MakeupAnalysisResultView: () => <div data-testid="makeup-analysis-result" />,
}));

vi.mock('@/components/analysis/consent', () => ({
  ImageConsentModal: ({
    isOpen,
    onConsent,
    onSkip,
    analysisType,
  }: {
    isOpen: boolean;
    onConsent: () => void;
    onSkip: () => void;
    analysisType: string;
  }) =>
    isOpen ? (
      <div data-testid="image-consent-modal" data-analysis-type={analysisType}>
        <button type="button" onClick={onConsent} data-testid="consent-agree">
          저장하기
        </button>
        <button type="button" onClick={onSkip} data-testid="consent-skip">
          건너뛰기
        </button>
      </div>
    ) : null,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/makeup-preview');

import MakeupAnalysisPage from '@/app/(main)/analysis/makeup/page';

describe('MakeupAnalysisPage 이미지 저장 선택 동의', () => {
  const analysisResponse = {
    ok: true,
    json: () =>
      Promise.resolve({
        result: { analyzedAt: new Date().toISOString() },
        data: { id: 'makeup-result-1' },
      }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  async function selectPhotoAndStart(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByTestId('go-upload'));
    fireEvent.change(screen.getByTestId('makeup-file-input'), {
      target: { files: [new File(['test'], 'makeup.jpg', { type: 'image/jpeg' })] },
    });
    await user.click(screen.getByTestId('makeup-analyze-button'));
  }

  it('미동의 사용자가 분석을 시작하면 메이크업용 모달을 먼저 연다', async () => {
    const user = userEvent.setup();
    render(<MakeupAnalysisPage />);

    await selectPhotoAndStart(user);

    const modal = screen.getByTestId('image-consent-modal');
    expect(modal).toHaveAttribute('data-analysis-type', 'makeup');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('건너뛰면 동의 저장 없이 분석만 실행한다', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue(analysisResponse);
    render(<MakeupAnalysisPage />);

    await selectPhotoAndStart(user);
    await user.click(screen.getByTestId('consent-skip'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analyze/makeup',
        expect.objectContaining({ method: 'POST' })
      );
    });
    const analyzeCall = mockFetch.mock.calls.find(([input]) => input === '/api/analyze/makeup');
    expect(JSON.parse(analyzeCall?.[1]?.body as string)).toEqual(
      expect.objectContaining({ imageStorageAllowed: false })
    );
    expect(mockFetch).not.toHaveBeenCalledWith('/api/consent', expect.anything());
  });

  it('저장하기를 선택하면 makeup 동의를 기록한 뒤 분석한다', async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      if (input === '/api/consent') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ consent: { analysis_type: 'makeup', consent_given: true } }),
        });
      }
      return Promise.resolve(analysisResponse);
    });
    render(<MakeupAnalysisPage />);

    await selectPhotoAndStart(user);
    await user.click(screen.getByTestId('consent-agree'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/consent',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ analysisType: 'makeup' }),
        })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/analyze/makeup',
        expect.objectContaining({ method: 'POST' })
      );
    });
    const analyzeCall = mockFetch.mock.calls.find(([input]) => input === '/api/analyze/makeup');
    expect(JSON.parse(analyzeCall?.[1]?.body as string)).toEqual(
      expect.objectContaining({ imageStorageAllowed: true })
    );
  });

  it('동의 조회가 끝나기 전에는 분석 버튼을 잠근다', async () => {
    let settleLookup!: (value: { data: null; error: null }) => void;
    mockMaybeSingle.mockReturnValueOnce(
      new Promise((resolve) => {
        settleLookup = resolve;
      })
    );
    const user = userEvent.setup();
    render(<MakeupAnalysisPage />);

    await user.click(screen.getByTestId('go-upload'));
    fireEvent.change(screen.getByTestId('makeup-file-input'), {
      target: { files: [new File(['test'], 'makeup.jpg', { type: 'image/jpeg' })] },
    });

    expect(screen.getByTestId('makeup-analyze-button')).toBeDisabled();
    expect(screen.getByText('저장 설정 확인 중...')).toBeInTheDocument();
    settleLookup({ data: null, error: null });
    await waitFor(() => expect(screen.getByTestId('makeup-analyze-button')).toBeEnabled());
  });

  it('기존 동의가 최신·유효할 때만 모달 없이 명시적 저장 허용으로 분석한다', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        analysis_type: 'makeup',
        consent_given: true,
        consent_version: 'v1.0',
        retention_until: '2099-01-01T00:00:00.000Z',
      },
      error: null,
    });
    mockFetch.mockResolvedValue(analysisResponse);
    const user = userEvent.setup();
    render(<MakeupAnalysisPage />);

    await selectPhotoAndStart(user);

    expect(screen.queryByTestId('image-consent-modal')).not.toBeInTheDocument();
    const analyzeCall = mockFetch.mock.calls.find(([input]) => input === '/api/analyze/makeup');
    expect(JSON.parse(analyzeCall?.[1]?.body as string)).toEqual(
      expect.objectContaining({ imageStorageAllowed: true })
    );
  });

  it('동의 저장 500을 알리고 명시적 미저장으로 분석을 계속한다', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      if (input === '/api/consent') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'temporary failure' }),
        });
      }
      return Promise.resolve(analysisResponse);
    });
    const user = userEvent.setup();
    render(<MakeupAnalysisPage />);

    await selectPhotoAndStart(user);
    await user.click(screen.getByTestId('consent-agree'));

    expect(await screen.findByRole('status')).toHaveTextContent(
      '사진은 저장하지 않고 분석을 진행해요.'
    );
    const analyzeCall = mockFetch.mock.calls.find(([input]) => input === '/api/analyze/makeup');
    expect(JSON.parse(analyzeCall?.[1]?.body as string)).toEqual(
      expect.objectContaining({ imageStorageAllowed: false })
    );
  });

  it.each(['under_age', 'no_birthdate'])(
    '%s 403도 알리고 미저장 분석을 계속한다',
    async (reason) => {
      mockFetch.mockImplementation((input: RequestInfo | URL) => {
        if (input === '/api/consent') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ reason }),
          });
        }
        return Promise.resolve(analysisResponse);
      });
      const user = userEvent.setup();
      render(<MakeupAnalysisPage />);

      await selectPhotoAndStart(user);
      await user.click(screen.getByTestId('consent-agree'));

      expect(await screen.findByRole('status')).toHaveTextContent(
        '사진은 저장하지 않고 분석을 진행해요.'
      );
      const analyzeCall = mockFetch.mock.calls.find(([input]) => input === '/api/analyze/makeup');
      expect(JSON.parse(analyzeCall?.[1]?.body as string)).toEqual(
        expect.objectContaining({ imageStorageAllowed: false })
      );
    }
  );

  it('저장 동의 버튼을 연속으로 눌러도 동의와 분석 요청을 한 번씩만 보낸다', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      if (input === '/api/consent') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ consent: { analysis_type: 'makeup' } }),
        });
      }
      return Promise.resolve(analysisResponse);
    });
    const user = userEvent.setup();
    render(<MakeupAnalysisPage />);

    await selectPhotoAndStart(user);
    const agree = screen.getByTestId('consent-agree');
    fireEvent.click(agree);
    fireEvent.click(agree);

    await waitFor(() =>
      expect(
        mockFetch.mock.calls.filter(([input]) => input === '/api/analyze/makeup')
      ).toHaveLength(1)
    );
    expect(mockFetch.mock.calls.filter(([input]) => input === '/api/consent')).toHaveLength(1);
  });
});
