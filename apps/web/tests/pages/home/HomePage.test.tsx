/**
 * Home 페이지 테스트
 * /home
 *
 * - 시간 기반 인사말
 * - 오늘의 추천 (뷰티/스타일)
 * - 오늘 기록 요약
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const MockIcon = ({
    className,
    'aria-hidden': ariaHidden,
  }: {
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }) => <svg className={className} aria-hidden={ariaHidden} data-testid="mock-icon" />;
  return {
    ...actual,
    Bell: MockIcon,
    Search: MockIcon,
    ChevronRight: MockIcon,
    Sparkles: MockIcon,
    Droplet: MockIcon,
    Shirt: MockIcon,
    Flame: MockIcon,
    Dumbbell: MockIcon,
    BarChart3: MockIcon,
  };
});

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { firstName: '테스터', username: 'tester' },
    isLoaded: true,
  }),
}));

// Mock components
vi.mock('@/components/BottomNav', () => ({
  BottomNav: () => <nav data-testid="bottom-nav">BottomNav</nav>,
}));

vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/skeletons', () => ({
  HomeSkeleton: () => <div data-testid="home-skeleton">Loading...</div>,
}));

// Mock useAnalysisStatus hook
vi.mock('@/hooks/useAnalysisStatus', () => ({
  useAnalysisStatus: () => ({
    isLoading: false,
    isNewUser: false,
    analyses: {
      personalColor: { id: '1', season: 'spring' },
      skin: { id: '2' },
      body: { id: '3' },
    },
  }),
}));

// Mock HomeAnalysisPrompt and HomeAnalysisSummary
vi.mock('@/app/(main)/home/_components/HomeAnalysisPrompt', () => ({
  default: () => <div data-testid="analysis-prompt">분석 시작하기</div>,
}));

vi.mock('@/app/(main)/home/_components/HomeAnalysisSummary', () => ({
  default: () => <div data-testid="analysis-summary">분석 결과 요약</div>,
}));

// Mock RecentlyViewed
vi.mock('@/components/products/RecentlyViewed', () => ({
  RecentlyViewed: () => <div data-testid="recently-viewed">최근 본 제품</div>,
}));

import HomePage from '@/app/(main)/home/page';

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('홈 페이지가 렌더링된다', () => {
      render(<HomePage />);

      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('헤더에 이룸 로고가 표시된다', () => {
      render(<HomePage />);

      expect(screen.getByText('이룸')).toBeInTheDocument();
    });

    it('사용자 이름이 인사말에 표시된다', () => {
      render(<HomePage />);

      expect(screen.getByText(/테스터님/)).toBeInTheDocument();
    });

    it('오늘의 추천 섹션이 표시된다', () => {
      render(<HomePage />);

      expect(screen.getByText('오늘의 추천')).toBeInTheDocument();
    });

    it('피부 맞춤 추천 버튼이 표시된다', () => {
      render(<HomePage />);

      expect(screen.getByText('피부 맞춤')).toBeInTheDocument();
      expect(screen.getByText('스킨케어 추천')).toBeInTheDocument();
    });

    it('체형 맞춤 추천 버튼이 표시된다', () => {
      render(<HomePage />);

      expect(screen.getByText('체형 맞춤')).toBeInTheDocument();
      expect(screen.getByText('코디 추천')).toBeInTheDocument();
    });

    it('BottomNav가 렌더링된다', () => {
      render(<HomePage />);

      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    });
  });

  describe('네비게이션', () => {
    it('알림 버튼 클릭 시 /notifications로 이동한다', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const notificationButton = screen.getByRole('button', { name: /알림 확인/ });
      await user.click(notificationButton);

      expect(mockPush).toHaveBeenCalledWith('/notifications');
    });

    it('검색 버튼 클릭 시 /search로 이동한다', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const searchButton = screen.getByRole('button', { name: /검색 페이지로 이동/ });
      await user.click(searchButton);

      expect(mockPush).toHaveBeenCalledWith('/search');
    });

    it('피부 맞춤 버튼 클릭 시 /beauty로 이동한다', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const beautyButton = screen.getByRole('button', { name: /피부 맞춤 제품 추천 보기/ });
      await user.click(beautyButton);

      expect(mockPush).toHaveBeenCalledWith('/beauty');
    });

    it('체형 맞춤 버튼 클릭 시 /style로 이동한다', async () => {
      const user = userEvent.setup();
      render(<HomePage />);

      const styleButton = screen.getByRole('button', { name: /체형 맞춤 코디 추천 보기/ });
      await user.click(styleButton);

      expect(mockPush).toHaveBeenCalledWith('/style');
    });

  });

  describe('시간 기반 인사', () => {
    it('인사말이 표시된다', () => {
      render(<HomePage />);

      // 시간에 따라 다른 인사말이 표시됨 (이에요/예요 포함)
      const greetings = ['좋은 아침이에요', '좋은 오후예요', '좋은 저녁이에요', '좋은 밤이에요'];
      const hasGreeting = greetings.some((greeting) => screen.queryByText(new RegExp(greeting)));

      expect(hasGreeting).toBe(true);
    });
  });

  describe('접근성', () => {
    it('헤더 버튼들에 aria-label이 있다', () => {
      render(<HomePage />);

      expect(screen.getByRole('button', { name: /알림 확인/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /검색 페이지로 이동/ })).toBeInTheDocument();
    });

    it('추천 섹션에 aria-label이 있다', () => {
      render(<HomePage />);

      expect(screen.getByRole('region', { name: /오늘의 맞춤 추천/ })).toBeInTheDocument();
    });

    it('아이콘에 aria-hidden이 적용되어 있다', () => {
      render(<HomePage />);

      const icons = screen.getByTestId('home-page').querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

});

describe('HomePage - 로딩 상태', () => {
  it('로딩 중에는 스켈레톤이 표시된다', async () => {
    // useUser가 로딩 중인 상태를 모킹
    vi.doMock('@clerk/nextjs', () => ({
      useUser: () => ({
        user: null,
        isLoaded: false,
      }),
    }));

    // 모듈 캐시 초기화 후 다시 import
    vi.resetModules();

    const { default: HomePageLoading } = await import('@/app/(main)/home/page');

    render(<HomePageLoading />);

    expect(screen.getByTestId('home-skeleton')).toBeInTheDocument();
  });
});
