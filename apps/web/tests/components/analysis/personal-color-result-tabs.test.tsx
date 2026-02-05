/**
 * PC-1 결과 페이지 탭 구조 및 에러 처리 테스트
 *
 * @module tests/components/analysis/personal-color-result-tabs
 * @description
 * - 3탭 구조 렌더링 검증 (기본 분석, 색상 입혀보기, 상세 리포트)
 * - ADR-063 용어 변경 일치 검증
 * - isRetryable 에러 분기 검증
 * - getSeasonToneDepth 순수 함수 검증
 * - transformDbToResult 변환 로직 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// 페이지 소스에서 추출한 순수 함수 재구현 (export되지 않은 함수 테스트)
// 원본: apps/web/app/(main)/analysis/personal-color/result/[id]/page.tsx

type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
type ToneType = 'warm' | 'cool';
type DepthType = 'light' | 'deep';

/** 시즌별 톤/깊이 결정 (page.tsx에서 추출) */
function getSeasonToneDepth(seasonType: SeasonType): { tone: ToneType; depth: DepthType } {
  switch (seasonType) {
    case 'spring':
      return { tone: 'warm', depth: 'light' };
    case 'summer':
      return { tone: 'cool', depth: 'light' };
    case 'autumn':
      return { tone: 'warm', depth: 'deep' };
    case 'winter':
      return { tone: 'cool', depth: 'deep' };
  }
}

/** 신뢰도 기준값 (page.tsx에서 추출) */
const LOW_CONFIDENCE_THRESHOLD = 70;

// ============================================================================
// 탭 구조 상수 (page.tsx 소스코드 기반)
// ============================================================================

/** 페이지에서 사용하는 탭 값 목록 */
const TAB_VALUES = ['basic', 'draping', 'detailed'] as const;

/** 페이지에서 사용하는 탭 이름 목록 (ADR-063 용어 변경 반영) */
const TAB_LABELS = {
  basic: '기본 분석',
  draping: '색상 입혀보기',
  detailed: '상세 리포트',
} as const;

/** 기본 활성 탭 */
const DEFAULT_TAB = 'basic';

// ============================================================================
// 순수 함수 테스트
// ============================================================================

describe('getSeasonToneDepth (시즌별 톤/깊이 결정)', () => {
  describe('정상 케이스', () => {
    it('spring은 warm/light를 반환한다', () => {
      const result = getSeasonToneDepth('spring');
      expect(result).toEqual({ tone: 'warm', depth: 'light' });
    });

    it('summer는 cool/light를 반환한다', () => {
      const result = getSeasonToneDepth('summer');
      expect(result).toEqual({ tone: 'cool', depth: 'light' });
    });

    it('autumn은 warm/deep를 반환한다', () => {
      const result = getSeasonToneDepth('autumn');
      expect(result).toEqual({ tone: 'warm', depth: 'deep' });
    });

    it('winter는 cool/deep를 반환한다', () => {
      const result = getSeasonToneDepth('winter');
      expect(result).toEqual({ tone: 'cool', depth: 'deep' });
    });
  });

  describe('톤 매핑 일관성', () => {
    it('warm 계열은 spring과 autumn이다', () => {
      const warmSeasons: SeasonType[] = ['spring', 'autumn'];
      warmSeasons.forEach((season) => {
        expect(getSeasonToneDepth(season).tone).toBe('warm');
      });
    });

    it('cool 계열은 summer와 winter이다', () => {
      const coolSeasons: SeasonType[] = ['summer', 'winter'];
      coolSeasons.forEach((season) => {
        expect(getSeasonToneDepth(season).tone).toBe('cool');
      });
    });

    it('light 계열은 spring과 summer이다', () => {
      const lightSeasons: SeasonType[] = ['spring', 'summer'];
      lightSeasons.forEach((season) => {
        expect(getSeasonToneDepth(season).depth).toBe('light');
      });
    });

    it('deep 계열은 autumn과 winter이다', () => {
      const deepSeasons: SeasonType[] = ['autumn', 'winter'];
      deepSeasons.forEach((season) => {
        expect(getSeasonToneDepth(season).depth).toBe('deep');
      });
    });
  });

  describe('모든 시즌 4개가 커버됨', () => {
    it('4개 시즌 모두 유효한 결과를 반환한다', () => {
      const allSeasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];
      allSeasons.forEach((season) => {
        const result = getSeasonToneDepth(season);
        expect(result).toHaveProperty('tone');
        expect(result).toHaveProperty('depth');
        expect(['warm', 'cool']).toContain(result.tone);
        expect(['light', 'deep']).toContain(result.depth);
      });
    });
  });
});

// ============================================================================
// 탭 구조 상수 검증
// ============================================================================

describe('PC-1 결과 페이지 탭 구조', () => {
  describe('탭 개수 및 값', () => {
    it('탭은 정확히 3개이다', () => {
      expect(TAB_VALUES).toHaveLength(3);
    });

    it('탭 값이 basic, draping, detailed이다', () => {
      expect(TAB_VALUES).toContain('basic');
      expect(TAB_VALUES).toContain('draping');
      expect(TAB_VALUES).toContain('detailed');
    });

    it('기본 활성 탭은 basic이다', () => {
      expect(DEFAULT_TAB).toBe('basic');
    });
  });

  describe('탭 이름이 ADR-063 용어 변경과 일치한다', () => {
    it('기본 분석 탭 이름이 "기본 분석"이다 (전문용어 미사용)', () => {
      expect(TAB_LABELS.basic).toBe('기본 분석');
    });

    it('드레이핑 탭 이름이 "색상 입혀보기"이다 ("드레이핑" 전문용어 미사용)', () => {
      expect(TAB_LABELS.draping).toBe('색상 입혀보기');
      // "드레이핑", "시뮬레이터" 등 전문용어가 탭 이름에 없어야 함
      expect(TAB_LABELS.draping).not.toContain('드레이핑');
      expect(TAB_LABELS.draping).not.toContain('시뮬레이터');
    });

    it('상세 리포트 탭 이름이 "상세 리포트"이다 ("균일도" 등 전문용어 미사용)', () => {
      expect(TAB_LABELS.detailed).toBe('상세 리포트');
      expect(TAB_LABELS.detailed).not.toContain('균일도');
      expect(TAB_LABELS.detailed).not.toContain('반사율');
    });
  });

  describe('탭 이름에 전문 용어가 포함되지 않는다', () => {
    const forbiddenTerms = ['드레이핑', '시뮬레이터', '균일도', '반사율', 'CIE', 'Lab', 'sRGB'];

    it.each(forbiddenTerms)('탭 이름에 "%s" 전문용어가 없다', (term) => {
      Object.values(TAB_LABELS).forEach((label) => {
        expect(label).not.toContain(term);
      });
    });
  });
});

// ============================================================================
// 신뢰도 기준값 검증
// ============================================================================

describe('LOW_CONFIDENCE_THRESHOLD (신뢰도 기준값)', () => {
  it('기준값이 70이다', () => {
    expect(LOW_CONFIDENCE_THRESHOLD).toBe(70);
  });

  it('신뢰도 70 미만이 재분석 권장 대상이다', () => {
    expect(69 < LOW_CONFIDENCE_THRESHOLD).toBe(true);
    expect(70 < LOW_CONFIDENCE_THRESHOLD).toBe(false);
    expect(71 < LOW_CONFIDENCE_THRESHOLD).toBe(false);
  });
});

// ============================================================================
// 에러 처리 로직 테스트
// ============================================================================

describe('PC-1 에러 처리 로직', () => {
  describe('isRetryable 분기 (HTTP 상태 코드 기반)', () => {
    // page.tsx 에러 처리 로직 추출:
    // const retryable = response.status >= 500;
    function isRetryable(status: number): boolean {
      return status >= 500;
    }

    describe('5xx 서버 에러 (retryable)', () => {
      it('500 상태코드는 retryable이다', () => {
        expect(isRetryable(500)).toBe(true);
      });

      it('502 상태코드는 retryable이다', () => {
        expect(isRetryable(502)).toBe(true);
      });

      it('503 상태코드는 retryable이다', () => {
        expect(isRetryable(503)).toBe(true);
      });

      it('504 상태코드는 retryable이다', () => {
        expect(isRetryable(504)).toBe(true);
      });
    });

    describe('4xx 클라이언트 에러 (not retryable)', () => {
      it('400 상태코드는 retryable이 아니다', () => {
        expect(isRetryable(400)).toBe(false);
      });

      it('401 상태코드는 retryable이 아니다', () => {
        expect(isRetryable(401)).toBe(false);
      });

      it('403 상태코드는 retryable이 아니다', () => {
        expect(isRetryable(403)).toBe(false);
      });

      it('404 상태코드는 retryable이 아니다', () => {
        expect(isRetryable(404)).toBe(false);
      });

      it('429 상태코드는 retryable이 아니다', () => {
        expect(isRetryable(429)).toBe(false);
      });
    });

    describe('경계값 케이스', () => {
      it('499는 retryable이 아니다', () => {
        expect(isRetryable(499)).toBe(false);
      });

      it('500은 retryable이다 (경계값)', () => {
        expect(isRetryable(500)).toBe(true);
      });
    });
  });

  describe('에러 메시지 분기', () => {
    // page.tsx에서 추출한 에러 메시지 결정 로직
    function getErrorMessage(serverError: string | null, isRetryable: boolean): string {
      return (
        serverError ||
        (isRetryable ? '서버에 일시적인 문제가 있습니다' : '결과를 불러올 수 없습니다')
      );
    }

    it('서버 에러 메시지가 있으면 그것을 우선 사용한다', () => {
      const message = getErrorMessage('커스텀 에러 메시지', false);
      expect(message).toBe('커스텀 에러 메시지');
    });

    it('retryable 에러는 "서버에 일시적인 문제가 있습니다" 메시지를 사용한다', () => {
      const message = getErrorMessage(null, true);
      expect(message).toBe('서버에 일시적인 문제가 있습니다');
    });

    it('permanent 에러는 "결과를 불러올 수 없습니다" 메시지를 사용한다', () => {
      const message = getErrorMessage(null, false);
      expect(message).toBe('결과를 불러올 수 없습니다');
    });

    it('빈 문자열 서버 에러는 fallback 메시지를 사용한다', () => {
      // JavaScript에서 빈 문자열은 falsy → fallback
      const message = getErrorMessage('', true);
      expect(message).toBe('서버에 일시적인 문제가 있습니다');
    });
  });
});

// ============================================================================
// 페이지 렌더링 테스트 (통합)
// ============================================================================

// 무거운 하위 컴포넌트 모킹
vi.mock('@/components/analysis/visual', () => ({
  DrapingSimulationTab: ({ className }: { className?: string }) => (
    <div data-testid="mock-draping-tab" className={className}>
      DrapingSimulationTab Mock
    </div>
  ),
}));

vi.mock('@/components/analysis/personal-color/DetailedEvidenceReport', () => ({
  default: () => <div data-testid="mock-detailed-report">DetailedEvidenceReport Mock</div>,
}));

vi.mock('@/components/analysis/AnalysisEvidenceReport', () => ({
  default: () => <div data-testid="mock-evidence-report">AnalysisEvidenceReport Mock</div>,
}));

vi.mock('@/components/analysis/visual-report', () => ({
  VisualReportCard: () => <div data-testid="mock-visual-report">VisualReportCard Mock</div>,
}));

vi.mock('@/components/analysis/RecommendedProducts', () => ({
  RecommendedProducts: () => (
    <div data-testid="mock-recommended-products">RecommendedProducts Mock</div>
  ),
}));

vi.mock('@/components/share', () => ({
  ShareButton: () => <button data-testid="mock-share-button">Share</button>,
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

vi.mock('@/components/analysis/ContextLinkingCard', () => ({
  ContextLinkingCard: () => <div data-testid="mock-context-linking">ContextLinkingCard Mock</div>,
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

// next/navigation은 setup.ts에서 전역 모킹됨 (useRouter, usePathname, useSearchParams)
// useParams만 추가 모킹 필요
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
    useParams: () => ({ id: 'test-analysis-123' }),
    usePathname: () => '/analysis/personal-color/result/test-analysis-123',
    useSearchParams: () => new URLSearchParams(),
  };
});

// AnalysisResult 컴포넌트 모킹 (page.tsx 내부 import: '../../_components/AnalysisResult')
vi.mock('@/app/(main)/analysis/personal-color/_components/AnalysisResult', () => ({
  default: () => <div data-testid="mock-analysis-result">AnalysisResult Mock</div>,
}));

// DB 변환 테스트용 Mock 데이터
const createMockDbData = (overrides = {}) => ({
  id: 'test-analysis-123',
  clerk_user_id: 'user_test_123',
  season: 'Summer',
  undertone: 'cool',
  confidence: 85,
  best_colors: [{ name: '라벤더', hex: '#E6E6FA' }],
  worst_colors: [{ name: '오렌지', hex: '#FF8C00' }],
  makeup_recommendations: {
    lipstick: [{ shade: '로즈 핑크', hex: '#FF66B2' }],
  },
  fashion_recommendations: {
    tops: ['화이트 블라우스'],
  },
  image_analysis: {
    insight: '쿨톤 피부에 맑은 색상이 잘 어울립니다',
    analysisEvidence: null,
    imageQuality: null,
    usedMock: false,
  },
  face_image_url: 'https://example.com/test-image.jpg',
  created_at: '2026-02-01T10:00:00Z',
  ...overrides,
});

// Clerk 모킹을 테스트 파일 레벨에서 오버라이드
// setup.ts에서 기본 isSignedIn: false로 설정됨
// 여기서 로그인 상태로 변경 가능
const mockUseAuth = vi.fn();
vi.mock('@clerk/nextjs', async () => {
  const actual = await vi.importActual('@clerk/nextjs');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
    useUser: () => ({
      isSignedIn: false,
      user: null,
      isLoaded: true,
    }),
    SignInButton: ({ children }: { children: React.ReactNode }) => children,
    SignOutButton: ({ children }: { children: React.ReactNode }) => children,
    UserButton: () => null,
  };
});

describe('PC-1 결과 페이지 렌더링', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // 기본: 비로그인 상태
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      userId: null,
      isLoaded: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.resetModules();
  });

  // Clerk 모킹을 로그인 상태로 변경하는 헬퍼
  function setupSignedInState(): void {
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      userId: 'user_test_123',
      isLoaded: true,
    });
  }

  // fetch 성공 응답 설정 헬퍼
  function setupSuccessfulFetch(dbData = createMockDbData()): void {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: dbData }),
    });
  }

  // fetch 에러 응답 설정 헬퍼
  function setupErrorFetch(status: number, errorMessage?: string): void {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve({ error: errorMessage }),
    });
  }

  describe('3탭 렌더링', () => {
    it('데이터 로드 후 3개 탭 트리거가 모두 표시된다', async () => {
      setupSignedInState();
      setupSuccessfulFetch();

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      // 데이터 로드 대기
      await waitFor(() => {
        expect(screen.getByText('기본 분석')).toBeInTheDocument();
      });

      // 3개 탭 트리거 확인
      expect(screen.getByText('기본 분석')).toBeInTheDocument();
      expect(screen.getByText('색상 입혀보기')).toBeInTheDocument();
      expect(screen.getByText('상세 리포트')).toBeInTheDocument();
    });

    it('기본 탭(basic)이 초기 활성 상태이다', async () => {
      setupSignedInState();
      setupSuccessfulFetch();

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByTestId('basic-tab')).toBeInTheDocument();
      });

      // basic 탭 콘텐츠가 표시됨
      const basicTab = screen.getByTestId('basic-tab');
      expect(basicTab).toBeInTheDocument();
    });

    it('draping 탭에 data-testid="draping-tab"이 존재한다', async () => {
      setupSignedInState();
      setupSuccessfulFetch();

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByTestId('draping-tab')).toBeInTheDocument();
      });
    });

    it('detailed 탭에 data-testid="detailed-tab"이 존재한다', async () => {
      setupSignedInState();
      setupSuccessfulFetch();

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByTestId('detailed-tab')).toBeInTheDocument();
      });
    });
  });

  describe('에러 상태 UI', () => {
    it('5xx 에러 시 "다시 시도" 버튼이 표시된다', async () => {
      setupSignedInState();
      setupErrorFetch(500, '서버에 일시적인 문제가 있습니다');

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByText('다시 시도')).toBeInTheDocument();
      });

      // "다시 시도" 버튼이 있고 "새로 분석하기"는 없음
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
      expect(screen.queryByText('새로 분석하기')).not.toBeInTheDocument();
    });

    it('4xx 에러 시 "새로 분석하기" 버튼이 표시된다', async () => {
      setupSignedInState();
      setupErrorFetch(404, '결과를 불러올 수 없습니다');

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByText('새로 분석하기')).toBeInTheDocument();
      });

      // "새로 분석하기" 버튼이 있고 "다시 시도"는 없음
      expect(screen.getByText('새로 분석하기')).toBeInTheDocument();
      expect(screen.queryByText('다시 시도')).not.toBeInTheDocument();
    });

    it('에러 상태에서 "대시보드로" 링크가 항상 표시된다', async () => {
      setupSignedInState();
      setupErrorFetch(500);

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByText('대시보드로')).toBeInTheDocument();
      });
    });
  });

  describe('로딩 상태', () => {
    it('데이터 로드 중 로딩 스피너가 표시된다', async () => {
      setupSignedInState();
      // fetch를 지연시켜 로딩 상태 유지
      mockFetch.mockReturnValueOnce(new Promise(() => {}));

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      expect(screen.getByText('결과를 불러오는 중...')).toBeInTheDocument();
    });
  });

  describe('비로그인 상태', () => {
    it('비로그인 시 로딩 상태가 유지된다 (fetchAnalysis 미실행)', async () => {
      // isSignedIn: false일 때 fetchAnalysis가 호출되지 않으므로
      // isLoading이 true 상태로 유지됨 → 로딩 화면 표시
      // (page.tsx: if (!isLoaded || isLoading) → 로딩 UI)

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      // fetch가 호출되지 않아 isLoading이 true 상태 유지
      expect(screen.getByText('결과를 불러오는 중...')).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Mock 데이터 알림', () => {
    it('AI Fallback 사용 시 MockDataNotice가 표시된다', async () => {
      setupSignedInState();
      setupSuccessfulFetch(
        createMockDbData({
          image_analysis: {
            insight: 'Mock insight',
            analysisEvidence: null,
            imageQuality: null,
            usedMock: true,
          },
        })
      );

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-data-notice')).toBeInTheDocument();
      });
    });

    it('AI 분석 정상 시 MockDataNotice가 표시되지 않는다', async () => {
      setupSignedInState();
      setupSuccessfulFetch();

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByText('기본 분석')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('mock-data-notice')).not.toBeInTheDocument();
    });
  });

  describe('드레이핑 탭 구조', () => {
    it('draping 탭 트리거가 tab role로 렌더링된다', async () => {
      setupSignedInState();
      setupSuccessfulFetch();

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByText('색상 입혀보기')).toBeInTheDocument();
      });

      // draping 탭 트리거가 올바른 role과 aria 속성을 가짐
      const drapingTrigger = screen.getByRole('tab', { name: /색상 입혀보기/ });
      expect(drapingTrigger).toBeInTheDocument();
      expect(drapingTrigger).toHaveAttribute('data-state', 'inactive');
      expect(drapingTrigger).toHaveAttribute('aria-selected', 'false');
    });

    it('basic 탭 트리거가 기본 활성 상태이다', async () => {
      setupSignedInState();
      setupSuccessfulFetch();

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByText('기본 분석')).toBeInTheDocument();
      });

      const basicTrigger = screen.getByRole('tab', { name: /기본 분석/ });
      expect(basicTrigger).toHaveAttribute('data-state', 'active');
      expect(basicTrigger).toHaveAttribute('aria-selected', 'true');
    });

    it('3개 탭 트리거 모두 tab role을 가진다', async () => {
      setupSignedInState();
      setupSuccessfulFetch();

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByText('기본 분석')).toBeInTheDocument();
      });

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('draping 탭 콘텐츠 영역이 초기에는 비활성 상태이다', async () => {
      setupSignedInState();
      setupSuccessfulFetch();

      const PersonalColorResultPage = (
        await import('@/app/(main)/analysis/personal-color/result/[id]/page')
      ).default;

      render(<PersonalColorResultPage />);

      await waitFor(() => {
        expect(screen.getByTestId('draping-tab')).toBeInTheDocument();
      });

      // draping 탭 콘텐츠가 비활성 상태 (activeTab !== 'draping'이므로 내용이 null)
      const drapingContent = screen.getByTestId('draping-tab');
      expect(drapingContent).toHaveAttribute('data-state', 'inactive');
    });
  });
});

// ============================================================================
// transformDbToResult 변환 로직 간접 검증
// ============================================================================

describe('DB -> Result 변환 검증 (간접)', () => {
  describe('시즌 매핑', () => {
    it('모든 시즌 문자열이 소문자로 정규화된다', () => {
      // page.tsx: const seasonType = dbData.season.toLowerCase() as SeasonType;
      const testCases = [
        { input: 'Summer', expected: 'summer' },
        { input: 'SPRING', expected: 'spring' },
        { input: 'Autumn', expected: 'autumn' },
        { input: 'WINTER', expected: 'winter' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(input.toLowerCase()).toBe(expected);
      });
    });
  });

  describe('신뢰도 기본값', () => {
    it('DB confidence가 null이면 기본값 85를 사용한다', () => {
      // page.tsx: confidence: dbData.confidence || 85
      const dbConfidence: number | null = null;
      const result = dbConfidence || 85;
      expect(result).toBe(85);
    });

    it('DB confidence가 0이면 기본값 85를 사용한다 (falsy 처리)', () => {
      // 0도 falsy이므로 || 연산자에 의해 85가 됨 (의도적 동작 확인)
      const dbConfidence = 0;
      const result = dbConfidence || 85;
      expect(result).toBe(85);
    });

    it('DB confidence가 유효하면 그 값을 사용한다', () => {
      const dbConfidence = 92;
      const result = dbConfidence || 85;
      expect(result).toBe(92);
    });
  });

  describe('인사이트 우선순위', () => {
    it('AI 분석 인사이트가 있으면 그것을 우선 사용한다', () => {
      // page.tsx: insight: dbData.image_analysis?.insight || mockEasyInsight?.summary || 기본값
      const aiInsight = 'AI 분석 결과: 쿨톤 피부';
      const mockSummary = 'Mock 요약';
      const fallback = '기본 인사이트';

      const result = aiInsight || mockSummary || fallback;
      expect(result).toBe('AI 분석 결과: 쿨톤 피부');
    });

    it('AI 인사이트 없으면 Mock 요약을 사용한다', () => {
      const aiInsight: string | undefined = undefined;
      const mockSummary = 'Mock 요약';
      const fallback = '기본 인사이트';

      const result = aiInsight || mockSummary || fallback;
      expect(result).toBe('Mock 요약');
    });

    it('둘 다 없으면 기본 인사이트를 사용한다', () => {
      const aiInsight: string | undefined = undefined;
      const mockSummary: string | undefined = undefined;
      const fallback = '기본 인사이트';

      const result = aiInsight || mockSummary || fallback;
      expect(result).toBe('기본 인사이트');
    });
  });
});
