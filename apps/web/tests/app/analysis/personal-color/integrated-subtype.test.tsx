/**
 * 통합 퍼널 형상 회귀 — 12톤 서브타입 키 불일치 (2026-08 수리)
 *
 * 배경: 통합 파이프라인(axis-adapters)은 12톤 서브타입을 `image_analysis.subtype`에만 저장하고
 * `season_subtype` 컬럼은 비워뒀다. 단독 진단지(result page)는 `season_subtype ??
 * image_analysis.seasonSubtype`만 읽어 통합 퍼널 사용자가 심화 진단지를 열면 서브타입이 통째로
 * 소실됐다 → 시즌 폴백 팔레트(true-*)·명도/채도 행 소실·톤 총람 소실.
 * 어휘도 갈렸다: 단독 경로 'mute' vs 통합 경로(classifyTone) 'muted'.
 *
 * 이 테스트는 **prod 형상 픽스처**(subtype만 있고 season_subtype은 null)로 진단지를 실제 렌더해
 * 12톤 해석과 명도/채도 행을 고정한다. AnalysisResult를 모킹하지 않는 것이 핵심 —
 * 모킹하면 "테스트 그린인데 화면 무동작"이 그대로 재발한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ── 무거운/부수효과 하위 컴포넌트만 모킹. 진단지 본체(AnalysisResult)는 실제 렌더한다.
vi.mock('@/components/analysis/personal-color', () => ({
  DrapingSectionDynamic: () => <div data-testid="mock-draping-section">DrapingSection Mock</div>,
}));

vi.mock('@/components/analysis/AnalysisEvidenceReport', () => ({
  default: () => <div data-testid="mock-evidence-report">AnalysisEvidenceReport Mock</div>,
}));

vi.mock('@/components/analysis/visual-report', () => ({
  VisualReportCard: () => <div data-testid="mock-visual-report">VisualReportCard Mock</div>,
}));

vi.mock('@/components/common/ShareButtons', () => ({
  ShareButtons: () => <div data-testid="mock-share-buttons">ShareButtons Mock</div>,
}));

vi.mock('@/hooks/useAnalysisShare', () => ({
  useAnalysisShare: () => ({ share: vi.fn(), loading: false }),
  createPersonalColorShareData: vi.fn(),
}));

vi.mock('@/components/coach/ConsultantCTA', () => ({
  ConsultantCTA: () => <div data-testid="mock-consultant-cta">ConsultantCTA Mock</div>,
}));

vi.mock('@/components/analysis/GenderAdaptiveAccessories', () => ({
  GenderAdaptiveAccessories: () => (
    <div data-testid="mock-accessories">GenderAdaptiveAccessories Mock</div>
  ),
}));

vi.mock('@/components/insights', () => ({
  default: () => null,
  ResultPageInsights: () => (
    <div data-testid="mock-result-page-insights">ResultPageInsights Mock</div>
  ),
  CrossModuleCard: () => <div data-testid="mock-cross-module-card">CrossModuleCard Mock</div>,
}));

vi.mock('@/components/analysis/personal-color/SeasonEducationModal', () => ({
  SeasonEducationModal: () => (
    <div data-testid="mock-season-education-modal">SeasonEducationModal Mock</div>
  ),
}));

vi.mock('@/components/common/AIBadge', () => ({
  AIBadge: () => <span data-testid="mock-ai-badge">AIBadge</span>,
  AITransparencyNotice: () => (
    <div data-testid="mock-ai-transparency">AITransparencyNotice Mock</div>
  ),
}));

vi.mock('@/components/common/MockDataNotice', () => ({
  MockDataNotice: () => <div data-testid="mock-data-notice">MockDataNotice Mock</div>,
}));

// 진단지 본체가 Supabase를 타지 않도록 프로필 훅만 대체 (성별 적응 카피에만 쓰임)
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { gender: 'female', heightCm: null, weightKg: null, allergies: [] },
    isLoading: false,
    error: null,
  }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    }),
    useParams: () => ({ id: 'integrated-pc-123' }),
    usePathname: () => '/analysis/personal-color/result/integrated-pc-123',
    useSearchParams: () => new URLSearchParams(),
  };
});

const mockUseAuth = vi.fn();
vi.mock('@clerk/nextjs', async () => {
  const actual = await vi.importActual('@clerk/nextjs');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
    useUser: () => ({ isSignedIn: true, user: null, isLoaded: true }),
    SignInButton: ({ children }: { children: React.ReactNode }) => children,
    SignOutButton: ({ children }: { children: React.ReactNode }) => children,
    UserButton: () => null,
  };
});

/**
 * 통합 퍼널이 실제로 저장하는 형상 — season_subtype은 null이고 12톤은
 * image_analysis.subtype에 v2 어휘('muted')로 들어 있다.
 */
function createIntegratedDbRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'integrated-pc-123',
    clerk_user_id: 'user_test_123',
    season: 'Summer',
    undertone: 'Cool',
    season_subtype: null,
    confidence: 88,
    best_colors: [
      { name: '라벤더', hex: '#E6E6FA' },
      { name: '더스티 로즈', hex: '#C08081' },
      { name: '세이지', hex: '#9CAF88' },
      { name: '스카이 블루', hex: '#A7C7E7' },
    ],
    worst_colors: [{ name: '오렌지', hex: '#FF8C00' }],
    makeup_recommendations: null,
    fashion_recommendations: null,
    image_analysis: {
      version: 2,
      source: 'integrated',
      tone: 'muted-summer',
      // 결함의 진원지 — 단독 진단지가 읽지 않던 키
      subtype: 'muted',
      usedFallback: false,
    },
    face_image_url: null,
    created_at: '2026-08-01T10:00:00Z',
    ...overrides,
  };
}

describe('통합 퍼널 형상 — 12톤 서브타입 해석 (진단지 실렌더)', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    mockUseAuth.mockReturnValue({ isSignedIn: true, userId: 'user_test_123', isLoaded: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function setupFetch(dbData: Record<string, unknown>): void {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: dbData }),
    });
  }

  async function renderPage(dbData: Record<string, unknown>): Promise<void> {
    setupFetch(dbData);
    const PersonalColorResultPage = (
      await import('@/app/(main)/analysis/personal-color/result/[id]/page')
    ).default;
    render(<PersonalColorResultPage />);
    await waitFor(() => {
      expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
    });
  }

  it('image_analysis.subtype만 있어도 12톤 진단명으로 해석한다', async () => {
    await renderPage(createIntegratedDbRow());

    // 서브타입 소실 시엔 "쿨톤 · 라이트" 같은 시즌 파생 라벨로 추락했다
    expect(screen.getAllByText('여름 쿨 뮤트').length).toBeGreaterThan(0);
  });

  it('12톤 해석에서 명도·채도 정의 행이 렌더된다', async () => {
    await renderPage(createIntegratedDbRow());

    // muted-summer의 12톤 정의 서술 — paletteToneKey가 시즌 폴백('summer')이면 행 자체가 사라진다
    expect(screen.getByText('중간 명도')).toBeInTheDocument();
    expect(screen.getByText('차분한 채도')).toBeInTheDocument();
  });

  it('v2 어휘(muted)와 단독 경로 어휘(mute)가 같은 12톤으로 수렴한다', async () => {
    await renderPage(
      createIntegratedDbRow({
        season_subtype: 'mute',
        image_analysis: { version: 2, source: 'single', usedFallback: false },
      })
    );

    expect(screen.getAllByText('여름 쿨 뮤트').length).toBeGreaterThan(0);
    expect(screen.getByText('중간 명도')).toBeInTheDocument();
  });

  it('서브타입이 전혀 없는 구 데이터는 명도·채도 행을 지어내지 않는다', async () => {
    await renderPage(
      createIntegratedDbRow({
        image_analysis: { version: 1, usedMock: false },
      })
    );

    // 정직 규율 — 12톤 미판정 건에 정의 서술을 붙이지 않는다
    expect(screen.queryByText('중간 명도')).not.toBeInTheDocument();
    expect(screen.queryByText('차분한 채도')).not.toBeInTheDocument();
  });
});
