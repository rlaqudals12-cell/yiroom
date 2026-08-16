/**
 * PC-1 결과 페이지 — 공유 카드 사진 옵트인 배선 검증
 *
 * 프라이버시 계약: Clerk 프로필 사진은 **기본 미포함**이며, 사용자가 옵트인해야만
 * createPersonalColorShareData에 profileImage가 전달된다.
 * 카드 진단명은 시트 히어로와 같은 12톤 라벨(undertoneLabel)을 쓴다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

interface ShareResultArg {
  seasonType?: string;
  seasonLabel?: string;
  toneLabel?: string;
}
interface ShareProfileArg {
  profileImage?: string;
  userName?: string;
}

const createPersonalColorShareData = vi.fn(
  (_result: ShareResultArg, _profile?: ShareProfileArg) => ({
    analysisType: 'personal-color' as const,
    title: '나의 퍼스널 컬러',
    subtitle: '이룸 AI 분석 결과',
  })
);

vi.mock('@/hooks/useAnalysisShare', () => ({
  useAnalysisShare: () => ({ share: vi.fn(), loading: false }),
  createPersonalColorShareData: (result: ShareResultArg, profile?: ShareProfileArg) =>
    createPersonalColorShareData(result, profile),
}));

// 실제 옵트인 상태 배선을 검증하기 위해, 배럴 모킹을 체크박스가 있는 스텁으로 교체
// (setup.ts 전역 모킹은 photoOptIn props를 무시한다)
vi.mock('@/components/share', () => ({
  ShareButton: () => <button data-testid="mock-share-button">Share</button>,
  PrintButton: () => <button data-testid="mock-print-button">Print</button>,
  ShareThemePicker: ({
    photoOptIn,
    onPhotoOptInChange,
  }: {
    photoOptIn?: boolean;
    onPhotoOptInChange?: (v: boolean) => void;
  }) => (
    <input
      type="checkbox"
      data-testid="share-photo-optin"
      checked={photoOptIn ?? false}
      onChange={(e) => onPhotoOptInChange?.(e.target.checked)}
    />
  ),
}));

// Popover는 트리거 클릭 전까지 content를 마운트하지 않는다 — 옵트인 배선 검증이 목적이므로
// 컨텐츠를 항상 렌더하는 스텁으로 교체(Radix 개폐 동작은 이 테스트의 관심사가 아님)
vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/analysis/personal-color', () => ({
  DrapingSectionDynamic: () => <div data-testid="mock-draping-section" />,
}));

vi.mock('@/app/(main)/analysis/personal-color/_components/AnalysisResult', () => ({
  default: () => <div data-testid="mock-analysis-result" />,
}));

vi.mock('@/components/coach/ConsultantCTA', () => ({
  ConsultantCTA: () => <div data-testid="mock-consultant-cta" />,
}));

vi.mock('@/components/analysis/GenderAdaptiveAccessories', () => ({
  GenderAdaptiveAccessories: () => <div data-testid="mock-accessories" />,
}));

vi.mock('@/components/insights', () => ({
  default: () => null,
  ResultPageInsights: () => <div data-testid="mock-result-page-insights" />,
  CrossModuleCard: () => <div data-testid="mock-cross-module-card" />,
}));

vi.mock('@/components/analysis/personal-color/SeasonEducationModal', () => ({
  SeasonEducationModal: () => <div data-testid="mock-season-education-modal" />,
}));

vi.mock('@/components/common/AIBadge', () => ({
  AIBadge: () => <span data-testid="mock-ai-badge" />,
  AITransparencyNotice: () => <div data-testid="mock-ai-transparency" />,
}));

vi.mock('@/components/common/MockDataNotice', () => ({
  MockDataNotice: () => <div data-testid="mock-data-notice" />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
    useParams: () => ({ id: 'test-analysis-123' }),
    usePathname: () => '/analysis/personal-color/result/test-analysis-123',
    useSearchParams: () => new URLSearchParams(),
  };
});

// Clerk — 프로필 사진이 있는 로그인 사용자
vi.mock('@clerk/nextjs', async () => {
  const actual = await vi.importActual('@clerk/nextjs');
  return {
    ...actual,
    useAuth: () => ({ isSignedIn: true, userId: 'user_test_123', isLoaded: true }),
    useUser: () => ({
      isSignedIn: true,
      isLoaded: true,
      user: { imageUrl: 'https://clerk.example.com/avatar.png', firstName: '민지', username: null },
    }),
    SignInButton: ({ children }: { children: React.ReactNode }) => children,
    SignOutButton: ({ children }: { children: React.ReactNode }) => children,
    UserButton: () => null,
  };
});

const mockDbData = {
  id: 'test-analysis-123',
  clerk_user_id: 'user_test_123',
  season: 'Summer',
  undertone: 'cool',
  season_subtype: 'mute',
  confidence: 85,
  best_colors: [
    { name: '라벤더', hex: '#E6E6FA' },
    { name: '더스티 로즈', hex: '#C9A9A6' },
    { name: '소프트 블루', hex: '#A7C7E7' },
    { name: '세이지', hex: '#B2BEB5' },
  ],
  worst_colors: [{ name: '오렌지', hex: '#FF8C00' }],
  makeup_recommendations: null,
  fashion_recommendations: null,
  image_analysis: { insight: '테스트 인사이트', usedMock: false },
  face_image_url: 'https://example.com/face.jpg',
  created_at: '2026-02-01T10:00:00Z',
};

/** createPersonalColorShareData의 마지막 호출 인자 */
function lastCall(): [_result: ShareResultArg, _profile?: ShareProfileArg] {
  const calls = createPersonalColorShareData.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1];
}

function lastProfileArg(): ShareProfileArg {
  return lastCall()[1] ?? {};
}

function lastResultArg(): ShareResultArg {
  return lastCall()[0];
}

describe('PC-1 결과 페이지 — 공유 카드 사진 옵트인', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createPersonalColorShareData.mockClear();
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockDbData }),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function renderPage(): Promise<void> {
    const Page = (await import('@/app/(main)/analysis/personal-color/result/[id]/page')).default;
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByTestId('mock-analysis-result')).toBeInTheDocument();
    });
  }

  it('기본값은 사진 미포함 — profileImage를 전달하지 않는다', async () => {
    await renderPage();

    expect(createPersonalColorShareData).toHaveBeenCalled();
    expect(lastProfileArg().profileImage).toBeUndefined();
  });

  it('옵트인 체크박스가 기본 해제 상태로 렌더된다', async () => {
    await renderPage();

    expect(screen.getByTestId('share-photo-optin')).not.toBeChecked();
  });

  it('사용자 이름은 옵트인과 무관하게 전달된다 (사진만 게이팅)', async () => {
    await renderPage();

    expect(lastProfileArg().userName).toBe('민지');
  });

  it('옵트인을 켜면 profileImage가 전달된다', async () => {
    await renderPage();

    fireEvent.click(screen.getByTestId('share-photo-optin'));

    await waitFor(() => {
      expect(lastProfileArg().profileImage).toBe('https://clerk.example.com/avatar.png');
    });
  });

  it('옵트인을 다시 끄면 profileImage가 사라진다', async () => {
    await renderPage();

    const checkbox = screen.getByTestId('share-photo-optin');
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(lastProfileArg().profileImage).toBeDefined();
    });

    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(lastProfileArg().profileImage).toBeUndefined();
    });
  });

  it('카드 진단명에 12톤 라벨(undertoneLabel)을 전달한다', async () => {
    await renderPage();

    // season_subtype='mute' + summer → "여름 쿨 뮤트"류의 12톤 라벨
    expect(lastResultArg().toneLabel).toBeTruthy();
    expect(lastResultArg().toneLabel).not.toBe(lastResultArg().seasonLabel);
  });
});
