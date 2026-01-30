/**
 * AgreementGuard 컴포넌트 테스트
 * 미동의 사용자를 /agreement 페이지로 리다이렉션 검증
 * SDD-TERMS-AGREEMENT.md §7.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
}));

// Mock @clerk/nextjs
let mockIsSignedIn = true;
let mockIsLoaded = true;

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: mockIsSignedIn,
    isLoaded: mockIsLoaded,
  }),
}));

// Mock Supabase client
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

// Import after mocks
import { AgreementGuard } from '@/components/agreement/AgreementGuard';

describe('AgreementGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSignedIn = true;
    mockIsLoaded = true;
    mockPathname = '/dashboard';

    // 기본 체인 설정
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ maybeSingle: mockMaybeSingle });
  });

  it('로딩 중에는 아무것도 하지 않는다', async () => {
    mockIsLoaded = false;

    render(<AgreementGuard />);

    // API 호출 없음
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('미로그인 사용자는 체크하지 않는다', async () => {
    mockIsSignedIn = false;

    render(<AgreementGuard />);

    // API 호출 없음
    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('제외 경로에서는 체크하지 않는다', async () => {
    // 제외 경로 목록
    const excludedPaths = ['/agreement', '/terms', '/privacy', '/help', '/sign-in', '/sign-up'];

    for (const path of excludedPaths) {
      vi.clearAllMocks();
      mockPathname = path;

      render(<AgreementGuard />);

      // API 호출 없음
      expect(mockFrom).not.toHaveBeenCalled();
    }
  });

  it('동의 정보가 없으면 /agreement로 리다이렉트한다', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    render(<AgreementGuard />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/agreement');
    });
  });

  it('필수 동의가 false면 /agreement로 리다이렉트한다', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        terms_agreed: true,
        privacy_agreed: false, // 개인정보 미동의
      },
      error: null,
    });

    render(<AgreementGuard />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/agreement');
    });
  });

  it('모든 필수 동의가 완료되면 리다이렉트하지 않는다', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        terms_agreed: true,
        privacy_agreed: true,
        marketing_agreed: false,
      },
      error: null,
    });

    render(<AgreementGuard />);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalled();
    });

    // 리다이렉트 없음
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('API 에러 시 리다이렉트하지 않는다', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB Error' },
    });

    // console.error를 모킹하여 출력 방지
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AgreementGuard />);

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalled();
    });

    // 에러 시에도 서비스 차단하지 않음
    expect(mockReplace).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('컴포넌트는 null을 렌더링한다', () => {
    mockMaybeSingle.mockResolvedValue({
      data: { terms_agreed: true, privacy_agreed: true },
      error: null,
    });

    const { container } = render(<AgreementGuard />);

    expect(container.innerHTML).toBe('');
  });
});
