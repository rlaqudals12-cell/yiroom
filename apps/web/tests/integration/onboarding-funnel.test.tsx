/**
 * 가입=첫 미팅 퍼널 통합 테스트 (ADR-114)
 *
 * 시나리오: 가입 직후 forceRedirectUrl("/analysis/integrated?onboarding=1")로 착지한
 * 신규 가입자가 AgreementGuard(약관)·AgeVerificationProvider(연령)에 인터셉트되어도
 * returnTo 체인을 타고 최종적으로 통합분석 온보딩에 도달하는지 검증.
 *
 * 재발 방지:
 * - 가드가 원 목적지(쿼리 포함)를 returnTo로 보존하지 않으면 실패
 * - agreement/complete-profile이 무조건 /dashboard·/home으로 보내면 실패
 * - 외부 URL returnTo가 통과되면(오픈 리다이렉트) 실패
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent, screen } from '@testing-library/react';

// ── next/navigation 모킹 (URL 시뮬레이션) ──────────────────────────────
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathname = '/';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

// ── Clerk 모킹 (로그인 완료 상태) ──────────────────────────────────────
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true, userId: 'user_test' }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

// ── Supabase 모킹 (AgreementGuard의 user_agreements 조회) ──────────────
const mockMaybeSingle = vi.fn();
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ maybeSingle: mockMaybeSingle })),
    })),
  }),
}));

// ── next-intl 모킹 (complete-profile의 t.rich 지원) ─────────────────────
vi.mock('next-intl', () => {
  const t = Object.assign((key: string) => key, {
    rich: (key: string) => key,
  });
  return {
    useTranslations: () => t,
    useLocale: () => 'ko',
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ── next/image 모킹 (agreement 페이지 로고) ─────────────────────────────
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// Import after mocks
import { AgreementGuard } from '@/components/agreement/AgreementGuard';
import { AgeVerificationProvider } from '@/components/providers/AgeVerificationProvider';
import AgreementPage from '@/app/agreement/page';
import CompleteProfilePage from '@/app/(auth)/complete-profile/page';

const ORIGIN = '/analysis/integrated?onboarding=1';

/** 테스트 내 네비게이션 시뮬레이션: jsdom location + usePathname 동기화 */
function navigateTo(url: string): void {
  window.history.replaceState({}, '', url);
  mockPathname = url.split('?')[0];
  mockPush.mockClear();
  mockReplace.mockClear();
}

beforeEach(() => {
  vi.clearAllMocks();
  navigateTo('/');
});

describe('가입=첫 미팅 퍼널: returnTo 체인', () => {
  it('가입→약관→생년월일 체인을 거쳐 통합분석 온보딩에 도달한다', async () => {
    // ── 1단계: 가입 직후 /analysis/integrated?onboarding=1 착지 → 약관 가드 인터셉트
    navigateTo(ORIGIN);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null }); // 미동의

    const step1 = render(<AgreementGuard />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());

    const agreementUrl = mockReplace.mock.calls[0][0] as string;
    expect(agreementUrl).toBe(`/agreement?returnTo=${encodeURIComponent(ORIGIN)}`);
    step1.unmount();

    // ── 2단계: 약관 페이지에서 동의 완료 → returnTo(원 목적지)로 복귀
    navigateTo(agreementUrl);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const step2 = render(<AgreementPage />);
    fireEvent.click(screen.getByTestId('gender-male'));
    fireEvent.click(screen.getByLabelText('전체 동의 (선택 항목·마케팅 수신 포함)'));
    fireEvent.click(screen.getByTestId('agreement-submit'));

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const afterAgreement = mockPush.mock.calls[0][0] as string;
    expect(afterAgreement).toBe(ORIGIN); // /dashboard가 아니라 원 목적지
    step2.unmount();

    // ── 3단계: 원 목적지 재착지 → 연령 가드 인터셉트 (생년월일 미입력)
    navigateTo(afterAgreement);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { birthDate: null, hasBirthDate: false },
      }),
    });

    const step3 = render(
      <AgeVerificationProvider>
        <div data-testid="protected-content" />
      </AgeVerificationProvider>
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalled());

    const completeProfileUrl = mockPush.mock.calls[0][0] as string;
    expect(completeProfileUrl).toBe(`/complete-profile?returnTo=${encodeURIComponent(ORIGIN)}`);
    step3.unmount();

    // ── 4단계: 생년월일 입력 완료 → returnTo(원 목적지)로 복귀
    navigateTo(completeProfileUrl);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const step4 = render(<CompleteProfilePage />);
    const dateInput = document.getElementById('birthDate') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '1995-05-05' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    const finalDestination = mockPush.mock.calls[0][0] as string;

    // 최종 도달: 가입 직후 목적지였던 통합분석 온보딩
    expect(finalDestination).toBe(ORIGIN);
    step4.unmount();
  });

  it('연령 가드가 먼저 인터셉트해도(가드 순서 역전) returnTo가 보존된다', async () => {
    navigateTo(ORIGIN);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { birthDate: null, hasBirthDate: false },
      }),
    });

    const { unmount } = render(
      <AgeVerificationProvider>
        <div />
      </AgeVerificationProvider>
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalled());

    expect(mockPush.mock.calls[0][0]).toBe(
      `/complete-profile?returnTo=${encodeURIComponent(ORIGIN)}`
    );
    unmount();
  });
});

describe('오픈 리다이렉트 방지 (재발 방지)', () => {
  it('agreement: 외부 URL returnTo는 무시하고 /dashboard로 폴백한다', async () => {
    navigateTo(`/agreement?returnTo=${encodeURIComponent('https://evil.com/phish')}`);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { unmount } = render(<AgreementPage />);
    fireEvent.click(screen.getByTestId('gender-female'));
    fireEvent.click(screen.getByLabelText('전체 동의 (선택 항목·마케팅 수신 포함)'));
    fireEvent.click(screen.getByTestId('agreement-submit'));

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockPush.mock.calls[0][0]).toBe('/dashboard');
    unmount();
  });

  it('complete-profile: 프로토콜 상대 URL(//host) returnTo는 무시하고 /home으로 폴백한다', async () => {
    navigateTo(`/complete-profile?returnTo=${encodeURIComponent('//evil.com')}`);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { unmount } = render(<CompleteProfilePage />);
    const dateInput = document.getElementById('birthDate') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '1995-05-05' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockPush.mock.calls[0][0]).toBe('/home');
    unmount();
  });
});

describe('기존 사용자 플로우 무영향', () => {
  it('약관 동의 완료 사용자는 리다이렉트되지 않는다', async () => {
    navigateTo('/dashboard');
    mockMaybeSingle.mockResolvedValue({
      data: { terms_agreed: true, privacy_agreed: true, biometric_agreed: true },
      error: null,
    });

    const { unmount } = render(<AgreementGuard />);
    await waitFor(() => expect(mockMaybeSingle).toHaveBeenCalled());

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    unmount();
  });

  it('생년월일 입력 완료(성인) 사용자는 리다이렉트 없이 콘텐츠가 렌더링된다', async () => {
    navigateTo('/dashboard');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { birthDate: '1995-05-05', hasBirthDate: true },
      }),
    });

    const { unmount } = render(
      <AgeVerificationProvider>
        <div data-testid="protected-content" />
      </AgeVerificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    unmount();
  });

  it('returnTo 없이 약관 동의를 완료하면 기존 기본값 /dashboard로 이동한다', async () => {
    navigateTo('/agreement');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { unmount } = render(<AgreementPage />);
    fireEvent.click(screen.getByTestId('gender-male'));
    fireEvent.click(screen.getByLabelText('전체 동의 (선택 항목·마케팅 수신 포함)'));
    fireEvent.click(screen.getByTestId('agreement-submit'));

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockPush.mock.calls[0][0]).toBe('/dashboard');
    unmount();
  });

  it('returnTo 없이 생년월일을 저장하면 기존 기본값 /home으로 이동한다', async () => {
    navigateTo('/complete-profile');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { unmount } = render(<CompleteProfilePage />);
    const dateInput = document.getElementById('birthDate') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '1995-05-05' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/ }));

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(mockPush.mock.calls[0][0]).toBe('/home');
    unmount();
  });
});
