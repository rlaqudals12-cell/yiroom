import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@clerk/nextjs', () => ({ useAuth: vi.fn() }));
vi.mock('@/lib/supabase/clerk-client', () => ({ useClerkSupabaseClient: vi.fn() }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/components/analysis/consent', () => ({
  ConsentStatus: ({ consent }: { consent: { consent_given?: boolean } | null }) => (
    <span data-testid="consent-status">{consent?.consent_given ? '동의함' : '미동의'}</span>
  ),
}));
vi.mock('@/components/settings', () => ({
  MarketingConsentToggle: () => <div data-testid="marketing-consent-toggle" />,
  AgreementHistory: () => <div data-testid="agreement-history" />,
}));

import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { toast } from 'sonner';
import PrivacySettingsPage from '@/app/(main)/settings/privacy/page';

type ImageRow = {
  id: string;
  clerk_user_id: string;
  analysis_type: 'skin' | 'body' | 'personal-color' | 'hair' | 'makeup';
  consent_given: boolean;
  consent_version: string;
  consent_at: string | null;
  withdrawal_at: string | null;
  retention_until: string | null;
  cleanup_reconciled_at?: string | null;
  created_at: string;
  updated_at: string;
};

const IMAGE_TYPES: ImageRow['analysis_type'][] = [
  'skin',
  'body',
  'personal-color',
  'hair',
  'makeup',
];

const activeSkinConsent: ImageRow = {
  id: 'consent-skin',
  clerk_user_id: 'user-1',
  analysis_type: 'skin',
  consent_given: true,
  consent_version: 'v1.0',
  consent_at: '2026-08-01T00:00:00.000Z',
  withdrawal_at: null,
  retention_until: '2099-08-01T00:00:00.000Z',
  created_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
};

function makeSupabase(options?: {
  imageRows?: ImageRow[];
  imageError?: unknown;
  imageResponses?: Array<{ data: ImageRow[] | null; error: unknown }>;
}) {
  const imageIn = vi.fn();
  const responses = options?.imageResponses;
  if (responses) {
    for (const response of responses) imageIn.mockResolvedValueOnce(response);
  } else {
    imageIn.mockResolvedValue({
      data: options?.imageRows ?? [],
      error: options?.imageError ?? null,
    });
  }

  const agreementMaybeSingle = vi.fn().mockResolvedValue({
    data: {
      marketing_agreed: false,
      marketing_agreed_at: null,
      marketing_withdrawn_at: null,
    },
    error: null,
  });
  const from = vi.fn((table: string) => {
    if (table === 'image_consents') {
      return { select: vi.fn(() => ({ in: imageIn })) };
    }
    if (table === 'user_agreements') {
      return { select: vi.fn(() => ({ maybeSingle: agreementMaybeSingle })) };
    }
    throw new Error(`unexpected table: ${table}`);
  });

  return { from, imageIn };
}

const mockFetch = vi.fn();
global.fetch = mockFetch;

async function renderLoaded() {
  render(<PrivacySettingsPage />);
  await screen.findByTestId('privacy-settings-page');
}

describe('PrivacySettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ isLoaded: true, isSignedIn: true } as ReturnType<
      typeof useAuth
    >);
    vi.mocked(useClerkSupabaseClient).mockReturnValue(makeSupabase() as never);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} }),
    });
  });

  it('이미지 동의를 5축으로 보여주고 체형에는 존재하지 않는 opt-in CTA를 만들지 않는다', async () => {
    await renderLoaded();

    for (const type of ['skin', 'body', 'personal-color', 'hair', 'makeup']) {
      expect(screen.getByTestId(`consent-${type}`)).toBeInTheDocument();
    }
    expect(
      screen.getByText('체형 분석의 새 사진 저장 선택은 현재 지원하지 않습니다.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /체형.*선택/ })).not.toBeInTheDocument();
    expect(screen.getByTestId('consent-hair').querySelector('a')).toHaveAttribute(
      'href',
      '/analysis/hair'
    );
  });

  it('축별 저장과 통합 분석의 분석별 기본 OFF 계약을 구분해 설명한다', async () => {
    await renderLoaded();

    expect(screen.getByText(/원본 사진을 최대 1년 보관할지 축별로 관리/)).toBeInTheDocument();
    expect(screen.getByText(/통합 분석 원본 사진은 분석할 때마다 기본 OFF/)).toBeInTheDocument();
    expect(screen.getByText(/Google\(Gemini\)에 전송/)).toBeInTheDocument();
  });

  it('동의 상태 조회가 실패하면 모두 미동의인 것처럼 축과 CTA를 렌더링하지 않는다', async () => {
    vi.mocked(useClerkSupabaseClient).mockReturnValue(
      makeSupabase({ imageError: { message: 'db unavailable' } }) as never
    );

    await renderLoaded();

    expect(screen.getByRole('alert')).toHaveTextContent('동의 상태를 불러오지 못했습니다');
    expect(screen.queryByTestId('consent-skin')).not.toBeInTheDocument();
  });

  it('동의 상태 조회 실패 후 다시 시도해 서버 상태를 복구한다', async () => {
    const supabase = makeSupabase({
      imageResponses: [
        { data: null, error: { message: 'temporary failure' } },
        { data: [activeSkinConsent], error: null },
      ],
    });
    vi.mocked(useClerkSupabaseClient).mockReturnValue(supabase as never);
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => expect(screen.getByTestId('consent-skin')).toBeInTheDocument());
    expect(supabase.imageIn).toHaveBeenCalledTimes(2);
  });

  it('활성 동의 철회는 DELETE 성공 뒤 저장 안 함 상태로 바꾼다', async () => {
    vi.mocked(useClerkSupabaseClient).mockReturnValue(
      makeSupabase({ imageRows: [activeSkinConsent] }) as never
    );
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: '피부 분석 원본 사진 저장 동의 철회' }));
    fireEvent.click(await screen.findByRole('button', { name: '철회하고 삭제' }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/consent?analysisType=skin', {
        method: 'DELETE',
      })
    );
    await waitFor(() => expect(screen.getByTestId('consent-skin')).toHaveTextContent('미동의'));
  });

  it.each([
    ['만료', { retention_until: '2025-01-01T00:00:00.000Z' }],
    ['구버전', { consent_version: 'v0.9' }],
  ])('%s 동의는 활성 철회 UI로 표시하지 않는다', async (_label, override) => {
    vi.mocked(useClerkSupabaseClient).mockReturnValue(
      makeSupabase({ imageRows: [{ ...activeSkinConsent, ...override }] }) as never
    );

    await renderLoaded();

    expect(
      screen.queryByRole('button', { name: '피부 분석 원본 사진 저장 동의 철회' })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('consent-skin').querySelector('a')).toHaveAttribute(
      'href',
      '/analysis/skin?forceNew=true'
    );
  });

  it('동의 철회 뒤 일부 사진 파기가 실패하면 성공으로 숨기지 않고 재시도 동선을 연다', async () => {
    vi.mocked(useClerkSupabaseClient).mockReturnValue(
      makeSupabase({ imageRows: [activeSkinConsent] }) as never
    );
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          userMessage: '동의는 철회됐지만 일부 사진을 삭제하지 못했습니다.',
          details: { consentRevoked: true, retryable: true },
        },
      }),
    });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: '피부 분석 원본 사진 저장 동의 철회' }));
    fireEvent.click(await screen.findByRole('button', { name: '철회하고 삭제' }));

    expect(await screen.findByRole('button', { name: '사진 삭제 다시 시도' })).toBeInTheDocument();
    expect(screen.getByText(/사진 일부를 삭제하지 못했습니다/)).toBeInTheDocument();
  });

  it('서버에 남은 파기 대기 표식을 새로고침 뒤에도 재시도 동선으로 복원한다', async () => {
    vi.mocked(useClerkSupabaseClient).mockReturnValue(
      makeSupabase({
        imageRows: [
          {
            ...activeSkinConsent,
            consent_given: false,
            withdrawal_at: '2026-08-23T00:00:00.000Z',
          },
        ],
      }) as never
    );

    await renderLoaded();

    expect(screen.getByRole('button', { name: '사진 삭제 다시 시도' })).toBeInTheDocument();
  });

  it('파기 완료 뒤 cron 확인 전에는 재시도나 새 분석 CTA 없이 확인 중으로 구분한다', async () => {
    vi.mocked(useClerkSupabaseClient).mockReturnValue(
      makeSupabase({
        imageRows: [
          {
            ...activeSkinConsent,
            consent_given: false,
            withdrawal_at: '2026-08-23T00:00:00.000Z',
            retention_until: null,
            cleanup_reconciled_at: null,
          },
        ],
      }) as never
    );

    await renderLoaded();

    const skinSection = screen.getByTestId('consent-skin');
    expect(skinSection).toHaveTextContent('사진 삭제 확인 중');
    expect(skinSection).toHaveTextContent('삭제 확인을 마무리하고 있습니다');
    expect(screen.queryByRole('button', { name: '사진 삭제 다시 시도' })).not.toBeInTheDocument();
    expect(skinSection.querySelector('a')).not.toBeInTheDocument();
  });

  it('파기 재시도를 다시 DELETE에 연결하고 성공하면 재시도 표식을 없앤다', async () => {
    vi.mocked(useClerkSupabaseClient).mockReturnValue(
      makeSupabase({
        imageRows: [
          {
            ...activeSkinConsent,
            consent_given: false,
            withdrawal_at: '2026-08-23T00:00:00.000Z',
          },
        ],
      }) as never
    );
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: '사진 삭제 다시 시도' }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '사진 삭제 다시 시도' })).not.toBeInTheDocument()
    );
  });

  it('통합 사진을 포함하는 생체정보 전체 철회 API를 명시 확인 뒤 호출한다', async () => {
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: '생체정보 전체 철회 및 사진 파기' }));
    fireEvent.click(await screen.findByRole('button', { name: '전체 철회 및 파기' }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/agreement/biometric', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
    );
  });

  it('전체 철회 성공 뒤 서버 상태를 재조회해 삭제 실패가 아닌 24시간 확인 중으로 표시한다', async () => {
    const finalizedSkinConsent: ImageRow = {
      ...activeSkinConsent,
      consent_given: false,
      withdrawal_at: '2026-08-23T00:00:00.000Z',
      retention_until: null,
      cleanup_reconciled_at: null,
    };
    const supabase = makeSupabase({
      imageResponses: [
        { data: [activeSkinConsent], error: null },
        { data: [finalizedSkinConsent], error: null },
      ],
    });
    vi.mocked(useClerkSupabaseClient).mockReturnValue(supabase as never);
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: '생체정보 전체 철회 및 사진 파기' }));
    fireEvent.click(await screen.findByRole('button', { name: '전체 철회 및 파기' }));

    await waitFor(() => expect(supabase.imageIn).toHaveBeenCalledTimes(2));
    const skinSection = screen.getByTestId('consent-skin');
    expect(skinSection).toHaveTextContent('사진 삭제 확인 중');
    expect(screen.queryByRole('button', { name: '사진 삭제 다시 시도' })).not.toBeInTheDocument();
    expect(skinSection.querySelector('a')).not.toBeInTheDocument();
  });

  it('전체 철회 부분 실패도 서버를 재조회해 성공 축과 재시도 축을 나눠 표시한다', async () => {
    const activeConsents = IMAGE_TYPES.map((analysisType, index) => ({
      ...activeSkinConsent,
      id: `consent-${analysisType}`,
      analysis_type: analysisType,
      updated_at: `2026-08-01T00:00:0${index}.000Z`,
    }));
    const refreshedConsents = activeConsents.map((consent) => ({
      ...consent,
      consent_given: false,
      withdrawal_at: '2026-08-23T00:00:00.000Z',
      retention_until: consent.analysis_type === 'makeup' ? '2026-08-23T00:00:00.000Z' : null,
      cleanup_reconciled_at: null,
    }));
    const supabase = makeSupabase({
      imageResponses: [
        { data: activeConsents, error: null },
        { data: refreshedConsents, error: null },
      ],
    });
    vi.mocked(useClerkSupabaseClient).mockReturnValue(supabase as never);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: 'PARTIAL_PURGE_ERROR',
          userMessage: '일부 이미지 파기가 끝나지 않았습니다.',
        },
      }),
    });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: '생체정보 전체 철회 및 사진 파기' }));
    fireEvent.click(await screen.findByRole('button', { name: '전체 철회 및 파기' }));

    await waitFor(() => expect(supabase.imageIn).toHaveBeenCalledTimes(2));
    for (const type of IMAGE_TYPES.filter((type) => type !== 'makeup')) {
      expect(screen.getByTestId(`consent-${type}`)).toHaveTextContent('사진 삭제 확인 중');
    }
    expect(screen.getByTestId('consent-makeup')).toHaveTextContent(
      '사진 일부를 삭제하지 못했습니다'
    );
    expect(screen.getByRole('button', { name: '사진 삭제 다시 시도' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /원본 사진 저장 동의 철회/ })
    ).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('일부 이미지 파기가 끝나지 않았습니다.');
  });

  it('전체 철회 뒤 상태 재조회가 실패하면 기존 active CTA를 숨기고 불확실성을 알린다', async () => {
    const supabase = makeSupabase({
      imageResponses: [
        { data: [activeSkinConsent], error: null },
        { data: null, error: { message: 'refresh failed' } },
      ],
    });
    vi.mocked(useClerkSupabaseClient).mockReturnValue(supabase as never);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: { code: 'PARTIAL_PURGE_ERROR', userMessage: '일부 파기가 실패했습니다.' },
      }),
    });
    await renderLoaded();

    fireEvent.click(screen.getByRole('button', { name: '생체정보 전체 철회 및 사진 파기' }));
    fireEvent.click(await screen.findByRole('button', { name: '전체 철회 및 파기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '원본 사진 저장 동의 상태를 불러오지 못했습니다'
    );
    expect(screen.queryByTestId('consent-skin')).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      '철회 요청 후 최신 사진 삭제 상태를 확인하지 못했습니다. 개인정보 설정을 다시 불러와주세요.'
    );
  });

  it('비로그인 상태에서는 설정 내용을 노출하지 않는다', async () => {
    vi.mocked(useAuth).mockReturnValue({ isLoaded: true, isSignedIn: false } as ReturnType<
      typeof useAuth
    >);

    render(<PrivacySettingsPage />);

    expect(await screen.findByText('로그인이 필요합니다')).toBeInTheDocument();
    expect(screen.queryByTestId('privacy-settings-page')).not.toBeInTheDocument();
  });
});
