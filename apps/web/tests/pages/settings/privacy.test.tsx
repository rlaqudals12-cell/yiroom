/**
 * 개인정보 설정 페이지 통합 테스트
 * SDD-MARKETING-TOGGLE-UI.md §4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrivacySettingsPage from '@/app/(main)/settings/privacy/page';

// Clerk 모킹
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: vi.fn(),
}));

// next/link 모킹
vi.mock('next/link', () => ({
  default: vi.fn(({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )),
}));

// sonner 토스트 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    ArrowLeft: () => <span data-testid="arrow-left-icon">ArrowLeft</span>,
    Shield: () => <span data-testid="shield-icon">Shield</span>,
    Image: () => <span data-testid="image-icon">Image</span>,
    Trash2: () => <span data-testid="trash2-icon">Trash2</span>,
    AlertCircle: () => <span data-testid="alert-circle-icon">AlertCircle</span>,
    CheckCircle: () => <span data-testid="check-circle-icon">CheckCircle</span>,
    Info: () => <span data-testid="info-icon">Info</span>,
    Megaphone: () => <span data-testid="megaphone-icon">Megaphone</span>,
  };
});

// ConsentStatus 모킹
vi.mock('@/components/analysis/consent', () => ({
  ConsentStatus: vi.fn(({ consent }: any) => (
    <div data-testid="consent-status">{consent?.consent_given ? '동의함' : '동의 안 함'}</div>
  )),
}));

import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

// Mock Supabase 헬퍼
function createMockSupabase(options?: {
  imageConsentData?: any;
  agreementData?: any;
  imageConsentError?: any;
  agreementError?: any;
}) {
  let queryCounter = 0;

  const mockMaybeSingle = vi.fn().mockImplementation(() => {
    queryCounter++;
    // 첫 번째 쿼리: image_consents
    if (queryCounter === 1) {
      return Promise.resolve({
        data: options?.imageConsentData || null,
        error: options?.imageConsentError || null,
      });
    }
    // 두 번째 쿼리: user_agreements
    return Promise.resolve({
      data: options?.agreementData || null,
      error: options?.agreementError || null,
    });
  });

  const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
  const mockSelect = vi.fn().mockReturnValue({
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
  });
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ error: null }),
  });
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });

  return {
    from: mockFrom,
    _testHelpers: {
      mockFrom,
      mockSelect,
      mockEq,
      mockMaybeSingle,
      mockUpdate,
    },
  };
}

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PrivacySettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 인증 상태: 로그인됨
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    } as unknown as ReturnType<typeof useAuth>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('렌더링', () => {
    it('페이지가 정상적으로 렌더링된다', async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('privacy-settings-page')).toBeInTheDocument();
      });
    });

    it('헤더에 제목이 표시된다', async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('개인정보 설정')).toBeInTheDocument();
      });
    });

    it('설정으로 돌아가기 링크가 표시된다', async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        const backLink = screen.getByLabelText('설정으로 돌아가기');
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/settings');
      });
    });
  });

  describe('이미지 동의 카드', () => {
    it('이미지 동의 카드가 표시된다', async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('image-consent-card')).toBeInTheDocument();
      });
    });

    it('이미지 동의 카드 제목이 표시된다', async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('피부 분석 이미지 저장 동의')).toBeInTheDocument();
      });
    });

    it('동의 상태 컴포넌트가 표시된다', async () => {
      const mockSupabase = createMockSupabase({
        imageConsentData: {
          id: 'ic1',
          consent_given: true,
          consent_at: '2024-01-01T00:00:00Z',
          consent_version: 'v1.0',
          retention_until: '2025-01-01T00:00:00Z',
          analysis_type: 'skin',
        },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('consent-status')).toBeInTheDocument();
      });
    });

    it('동의하지 않았을 때 안내 메시지가 표시된다', async () => {
      const mockSupabase = createMockSupabase({
        imageConsentData: {
          id: 'ic1',
          consent_given: false,
          analysis_type: 'skin',
        },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/이미지 저장 동의를 하지 않으면 분석 결과를 저장할 수 없어요/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('마케팅 동의 카드', () => {
    it('user_agreements 데이터가 있을 때 마케팅 동의 카드가 표시된다', async () => {
      const mockSupabase = createMockSupabase({
        agreementData: {
          marketing_agreed: true,
          marketing_agreed_at: '2024-01-01T00:00:00Z',
          marketing_withdrawn_at: null,
        },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('marketing-consent-card')).toBeInTheDocument();
      });
    });

    it('user_agreements 데이터가 없을 때 마케팅 동의 카드가 표시되지 않는다', async () => {
      const mockSupabase = createMockSupabase({
        agreementData: null,
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('marketing-consent-card')).not.toBeInTheDocument();
      });
    });

    it('마케팅 동의 카드에 올바른 초기값이 전달된다', async () => {
      const mockSupabase = createMockSupabase({
        agreementData: {
          marketing_agreed: true,
          marketing_agreed_at: '2024-01-15T09:30:00Z',
          marketing_withdrawn_at: null,
        },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        const card = screen.getByTestId('marketing-consent-card');
        expect(card).toBeInTheDocument();

        // 토글이 켜져있는지 확인
        const toggle = screen.getByRole('switch');
        expect(toggle).toHaveAttribute('data-state', 'checked');
      });
    });

    it('마케팅 동의 철회 상태가 올바르게 표시된다', async () => {
      const mockSupabase = createMockSupabase({
        agreementData: {
          marketing_agreed: false,
          marketing_agreed_at: '2024-01-01T00:00:00Z',
          marketing_withdrawn_at: '2024-02-01T00:00:00Z',
        },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        const toggle = screen.getByRole('switch');
        expect(toggle).toHaveAttribute('data-state', 'unchecked');
      });
    });
  });

  describe('토글 상호작용', () => {
    it('토글 변경 시 API 호출 후 상태가 업데이트된다', async () => {
      const mockSupabase = createMockSupabase({
        agreementData: {
          marketing_agreed: false,
          marketing_agreed_at: null,
          marketing_withdrawn_at: '2024-01-01T00:00:00Z',
        },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('marketing-consent-card')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('data-state', 'unchecked');

      fireEvent.click(toggle);

      // API 호출 확인
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/agreement', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marketingAgreed: true }),
        });
      });

      // 상태 변경 확인
      await waitFor(() => {
        expect(toggle).toHaveAttribute('data-state', 'checked');
      });
    });

    it('API 실패 시 이전 상태로 롤백된다', async () => {
      const mockSupabase = createMockSupabase({
        agreementData: {
          marketing_agreed: false,
          marketing_agreed_at: null,
          marketing_withdrawn_at: '2024-01-01T00:00:00Z',
        },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('marketing-consent-card')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('data-state', 'unchecked');

      fireEvent.click(toggle);

      // 낙관적 업데이트로 일시적으로 checked
      expect(toggle).toHaveAttribute('data-state', 'checked');

      // API 실패 후 롤백
      await waitFor(() => {
        expect(toggle).toHaveAttribute('data-state', 'unchecked');
      });
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중에는 로딩 메시지가 표시된다', () => {
      vi.mocked(useAuth).mockReturnValue({
        isSignedIn: true,
        isLoaded: false,
      } as unknown as ReturnType<typeof useAuth>);

      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
    });

    it('데이터 로딩 중에는 로딩 메시지가 표시된다', async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      // 초기 로딩 상태
      expect(screen.getByText('불러오는 중...')).toBeInTheDocument();

      // 로딩 완료 대기
      await waitFor(() => {
        expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument();
      });
    });
  });

  describe('비로그인 상태', () => {
    it('로그인하지 않았을 때 로딩 스피너가 계속 표시된다', () => {
      // 현재 페이지 로직: isSignedIn=false이면 fetchConsent가 early return하여 isLoading이 true로 유지됨
      vi.mocked(useAuth).mockReturnValue({
        isSignedIn: false,
        isLoaded: true,
      } as unknown as ReturnType<typeof useAuth>);

      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      // 비로그인 상태에서는 로딩 중 표시 (페이지 로직 개선 필요)
      expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
    });
  });

  describe('에러 처리', () => {
    it('이미지 동의 정보 조회 실패 시 에러를 콘솔에 출력한다', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockSupabase = createMockSupabase({
        imageConsentError: { message: 'Database error' },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('[Privacy] Failed to fetch image consent:', {
          message: 'Database error',
        });
      });

      consoleErrorSpy.mockRestore();
    });

    it('마케팅 동의 정보 조회 실패 시 에러를 콘솔에 출력한다', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockSupabase = createMockSupabase({
        agreementError: { message: 'Database error' },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[Privacy] Failed to fetch marketing consent:',
          { message: 'Database error' }
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('개인정보 처리방침', () => {
    it('개인정보 처리방침 카드가 표시된다', async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('개인정보 처리방침')).toBeInTheDocument();
      });
    });

    it('개인정보 처리방침 링크가 표시된다', async () => {
      const mockSupabase = createMockSupabase();
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        const link = screen.getByText('전체 개인정보 처리방침 보기');
        expect(link).toBeInTheDocument();
        expect(link.closest('a')).toHaveAttribute('href', '/privacy-policy');
      });
    });
  });

  describe('엣지 케이스', () => {
    it('이미지 동의와 마케팅 동의가 모두 있을 때 정상적으로 표시된다', async () => {
      const mockSupabase = createMockSupabase({
        imageConsentData: {
          id: 'ic1',
          consent_given: true,
          consent_at: '2024-01-01T00:00:00Z',
          consent_version: 'v1.0',
          retention_until: '2025-01-01T00:00:00Z',
          analysis_type: 'skin',
        },
        agreementData: {
          marketing_agreed: true,
          marketing_agreed_at: '2024-01-01T00:00:00Z',
          marketing_withdrawn_at: null,
        },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('image-consent-card')).toBeInTheDocument();
        expect(screen.getByTestId('marketing-consent-card')).toBeInTheDocument();
      });
    });

    it('이미지 동의는 있지만 마케팅 동의 데이터가 없을 때', async () => {
      const mockSupabase = createMockSupabase({
        imageConsentData: {
          id: 'ic1',
          consent_given: true,
          consent_at: '2024-01-01T00:00:00Z',
          consent_version: 'v1.0',
          retention_until: '2025-01-01T00:00:00Z',
          analysis_type: 'skin',
        },
        agreementData: null,
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('image-consent-card')).toBeInTheDocument();
        expect(screen.queryByTestId('marketing-consent-card')).not.toBeInTheDocument();
      });
    });

    it('보관 기한이 만료된 경우 안내 메시지가 표시된다', async () => {
      // 과거 날짜
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 10);

      const mockSupabase = createMockSupabase({
        imageConsentData: {
          id: 'ic1',
          consent_given: true,
          consent_at: '2023-01-01T00:00:00Z',
          consent_version: 'v1.0',
          retention_until: expiredDate.toISOString(),
          analysis_type: 'skin',
        },
      });
      vi.mocked(useClerkSupabaseClient).mockReturnValue(mockSupabase as any);

      render(<PrivacySettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('보관 기한이 만료되었습니다')).toBeInTheDocument();
      });
    });
  });
});
