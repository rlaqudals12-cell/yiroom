/**
 * 프로필 페이지 테스트
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfilePage from '@/app/(main)/profile/page';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  SignOutButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-out-button">{children}</div>
  ),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: vi.fn(),
}));

// Mock gamification
vi.mock('@/lib/gamification', () => ({
  getUserLevelInfo: vi.fn(),
  getUserBadges: vi.fn(),
}));

// Mock gamification components
vi.mock('@/components/gamification', () => ({
  BadgeCard: vi.fn(() => <div data-testid="badge-card">BadgeCard</div>),
}));

// Mock common components
vi.mock('@/components/common', () => ({
  LevelBadgeFilled: vi.fn(() => <span data-testid="level-badge">Level Badge</span>),
  LevelProgress: vi.fn(() => <div data-testid="level-progress">LevelProgress</div>),
}));

// Mock profile components (K-5)
vi.mock('@/components/profile', () => ({
  WellnessScoreRing: vi.fn(() => <div data-testid="wellness-score-ring">WellnessScoreRing</div>),
  MyInfoSummaryCard: vi.fn(() => <div data-testid="my-info-summary-card">MyInfoSummaryCard</div>),
}));

// Mock QRCodeDisplay
vi.mock('@/components/common/QRCodeDisplay', () => ({
  QRCodeDisplay: vi.fn(() => <div data-testid="qr-code-display">QRCodeDisplay</div>),
}));

// Mock greeting utilities
vi.mock('@/lib/utils/greeting', () => ({
  getGreetingWithEmoji: vi.fn(() => ({
    greeting: 'Hello!',
    emoji: 'wave',
    timeOfDay: 'morning',
  })),
  TIME_GRADIENTS: {
    morning: 'from-yellow-50 to-orange-50',
    afternoon: 'from-blue-50 to-cyan-50',
    evening: 'from-purple-50 to-pink-50',
    night: 'from-indigo-900 to-purple-900',
  },
}));

// Mock challenges
vi.mock('@/lib/challenges', () => ({
  getUserChallengeStats: vi.fn(),
}));

// Mock levels
vi.mock('@/lib/levels', () => ({
  getUserLevel: vi.fn(),
  calculateUserLevelState: vi.fn(),
}));

// Mock animations
vi.mock('@/components/animations', () => ({
  FadeInUp: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="fade-in-up">{children}</div>
  )),
}));

// Mock BottomNav
vi.mock('@/components/BottomNav', () => ({
  BottomNav: vi.fn(() => <nav data-testid="bottom-nav">BottomNav</nav>),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  )),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const MockIcon = ({ className }: { className?: string }) => (
    <span className={className} data-testid="mock-icon" />
  );
  return {
    ...actual,
    LogOut: MockIcon,
    User: MockIcon,
    Users: MockIcon,
    Settings: MockIcon,
    Trophy: MockIcon,
    Target: MockIcon,
    Award: MockIcon,
    ChevronRight: MockIcon,
    Calendar: MockIcon,
    Bell: MockIcon,
    Shield: MockIcon,
    HelpCircle: MockIcon,
    MessageSquare: MockIcon,
    Star: MockIcon,
    TrendingUp: MockIcon,
    Flame: MockIcon,
    Zap: MockIcon,
    Heart: MockIcon,
    Megaphone: MockIcon,
    Palette: MockIcon,
    FlaskConical: MockIcon,
    QrCode: MockIcon,
  };
});

import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { getUserLevelInfo, getUserBadges } from '@/lib/gamification';
import { getUserChallengeStats } from '@/lib/challenges';
import { getUserLevel } from '@/lib/levels';

// Mock Supabase response helper - 체이너블 쿼리 빌더
function createMockSupabase() {
  // 재귀적 체이너블 객체 생성
  const createChainable = (data: unknown = null) => {
    const result = { data, error: null };
    const chainable: Record<string, unknown> = {
      select: vi.fn(() => chainable),
      eq: vi.fn(() => chainable),
      neq: vi.fn(() => chainable),
      or: vi.fn(() => chainable),
      order: vi.fn(() => chainable),
      limit: vi.fn(() => chainable),
      single: vi.fn(() => Promise.resolve(result)),
      maybeSingle: vi.fn(() => Promise.resolve(result)),
      then: (resolve: (value: typeof result) => unknown) => resolve(result),
    };
    return chainable;
  };

  return {
    from: vi.fn(() => createChainable()),
  };
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 로딩 메시지를 표시한다', () => {
      vi.mocked(useUser).mockReturnValue({
        user: null,
        isLoaded: false,
        isSignedIn: false,
      } as unknown as ReturnType<typeof useUser>);

      vi.mocked(useClerkSupabaseClient).mockReturnValue(createMockSupabase() as any);

      render(<ProfilePage />);

      expect(screen.getByText('프로필 불러오는 중...')).toBeInTheDocument();
    });
  });

  describe('비로그인 상태', () => {
    it('로그인하지 않은 경우 로그인 안내 메시지를 표시한다', () => {
      vi.mocked(useUser).mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false,
      } as unknown as ReturnType<typeof useUser>);

      vi.mocked(useClerkSupabaseClient).mockReturnValue(createMockSupabase() as any);

      render(<ProfilePage />);

      expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();
      expect(screen.getByText('프로필을 확인하려면 먼저 로그인해주세요')).toBeInTheDocument();
    });
  });

  describe('로그인 상태', () => {
    const mockUser = {
      id: 'user_123',
      fullName: '테스트 사용자',
      username: 'testuser',
      imageUrl: 'https://example.com/avatar.jpg',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      createdAt: new Date('2024-01-01').getTime(),
    };

    beforeEach(() => {
      vi.mocked(useUser).mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true,
      } as unknown as ReturnType<typeof useUser>);

      vi.mocked(useClerkSupabaseClient).mockReturnValue(createMockSupabase() as any);

      // Mock API responses
      vi.mocked(getUserLevelInfo).mockResolvedValue({
        level: 5,
        currentXp: 150,
        totalXp: 450,
        xpForNextLevel: 200,
        xpProgress: 50,
        tier: 'beginner',
        tierName: '비기너',
      });

      vi.mocked(getUserBadges).mockResolvedValue([]);

      vi.mocked(getUserChallengeStats).mockResolvedValue({
        total: 3,
        inProgress: 1,
        completed: 2,
        failed: 0,
        expired: 0,
        abandoned: 0,
      });

      // Mock levels
      vi.mocked(getUserLevel).mockResolvedValue(null);
    });

    it('사용자 이름을 표시한다', async () => {
      render(<ProfilePage />);

      // 로딩 후 사용자 이름 표시 (페이지에서는 "님"을 붙임)
      await vi.waitFor(() => {
        expect(screen.getByText('테스트 사용자님')).toBeInTheDocument();
      });
    });

    it('내 분석 결과 섹션을 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText(/내 분석 결과/)).toBeInTheDocument();
      });
    });

    it('웰니스 스코어 링을 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        // K-5: WellnessScoreRing 컴포넌트 testid로 확인
        expect(screen.getByTestId('wellness-score-ring')).toBeInTheDocument();
      });
    });

    // ADR-098 기능 과잉 정리(2026-05-16): 배지 UI는 FEATURE_FLAGS.BADGES=false로 숨김 (코드 유지)
    it('배지 컬렉션 섹션은 표시되지 않는다 (BADGES 게이팅)', async () => {
      render(<ProfilePage />);

      // 활동 탭으로 전환
      await vi.waitFor(() => {
        expect(screen.getByText('활동')).toBeInTheDocument();
      });
      screen.getByText('활동').click();

      // 게이팅되지 않은 챌린지 섹션이 렌더된 뒤 배지 섹션 부재 확인
      await vi.waitFor(() => {
        expect(screen.getByText('챌린지')).toBeInTheDocument();
      });
      expect(screen.queryByText('배지 컬렉션')).not.toBeInTheDocument();
    });

    it('챌린지 섹션을 표시한다', async () => {
      render(<ProfilePage />);

      // 활동 탭으로 전환
      await vi.waitFor(() => {
        expect(screen.getByText('활동')).toBeInTheDocument();
      });
      screen.getByText('활동').click();

      await vi.waitFor(() => {
        expect(screen.getByText('챌린지')).toBeInTheDocument();
      });
    });

    // ADR-098: 운동/식단 연속기록은 FEATURE_FLAGS.WELLNESS_PHASE2=false로 숨김 (코드 유지)
    it('연속 기록 섹션은 표시되지 않는다 (WELLNESS_PHASE2 게이팅)', async () => {
      render(<ProfilePage />);

      // 활동 탭으로 전환
      await vi.waitFor(() => {
        expect(screen.getByText('활동')).toBeInTheDocument();
      });
      screen.getByText('활동').click();

      // 게이팅되지 않은 챌린지 섹션이 렌더된 뒤 연속 기록 섹션 부재 확인
      await vi.waitFor(() => {
        expect(screen.getByText('챌린지')).toBeInTheDocument();
      });
      expect(screen.queryByText('연속 기록')).not.toBeInTheDocument();
    });

    it('가입일 정보를 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        // K-5: "가입 정보" 섹션 대신 "가입일:" 텍스트로 확인
        expect(screen.getByText(/가입일:/)).toBeInTheDocument();
      });
    });

    it('설정 링크를 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        const settingsLink = screen.getByRole('link', { name: '설정' });
        expect(settingsLink).toBeInTheDocument();
        expect(settingsLink).toHaveAttribute('href', '/profile/settings');
      });
    });

    it('리더보드 섹션을 표시한다', async () => {
      render(<ProfilePage />);

      // 소셜 탭으로 전환
      await vi.waitFor(() => {
        expect(screen.getByText('소셜')).toBeInTheDocument();
      });
      screen.getByText('소셜').click();

      await vi.waitFor(() => {
        expect(screen.getByText('리더보드')).toBeInTheDocument();
      });
    });
  });

  describe('챌린지 통계', () => {
    const mockUser = {
      id: 'user_123',
      fullName: '테스트 사용자',
      username: 'testuser',
      imageUrl: null,
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      createdAt: new Date('2024-01-01').getTime(),
    };

    beforeEach(() => {
      vi.mocked(useUser).mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true,
      } as unknown as ReturnType<typeof useUser>);

      vi.mocked(useClerkSupabaseClient).mockReturnValue(createMockSupabase() as any);

      vi.mocked(getUserLevelInfo).mockResolvedValue(null);
      vi.mocked(getUserBadges).mockResolvedValue([]);
      vi.mocked(getUserLevel).mockResolvedValue(null);
    });

    it('챌린지 통계를 표시한다', async () => {
      vi.mocked(getUserChallengeStats).mockResolvedValue({
        total: 5,
        inProgress: 2,
        completed: 3,
        failed: 0,
        expired: 0,
        abandoned: 0,
      });

      render(<ProfilePage />);

      // 활동 탭으로 전환
      await vi.waitFor(() => {
        expect(screen.getByText('활동')).toBeInTheDocument();
      });
      screen.getByText('활동').click();

      await vi.waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // 진행 중
        expect(screen.getByText('3')).toBeInTheDocument(); // 완료
        expect(screen.getByText('5')).toBeInTheDocument(); // 전체 참여
      });
    });
  });

  // '배지 표시' describe 삭제 (2026-07-08):
  // ADR-098 기능 과잉 정리(2026-05-16)로 배지 UI 전체가 FEATURE_FLAGS.BADGES=false 게이팅되어
  // "아직 획득한 배지가 없어요" 안내와 "N/23개" 카운트가 렌더되지 않음.
  // 게이팅 자체는 '로그인 상태 > 배지 컬렉션 섹션은 표시되지 않는다' 테스트로 검증.
  // 배지 UI 복원(BADGES=true) 시 배지 빈 상태/카운트 테스트를 복구할 것.

  describe('프로필 이미지', () => {
    beforeEach(() => {
      vi.mocked(useClerkSupabaseClient).mockReturnValue(createMockSupabase() as any);
      vi.mocked(getUserLevelInfo).mockResolvedValue(null);
      vi.mocked(getUserLevel).mockResolvedValue(null);
      vi.mocked(getUserBadges).mockResolvedValue([]);
      vi.mocked(getUserChallengeStats).mockResolvedValue({
        total: 0,
        inProgress: 0,
        completed: 0,
        failed: 0,
        expired: 0,
        abandoned: 0,
      });
    });

    it('프로필 이미지가 있으면 이미지를 표시한다', async () => {
      vi.mocked(useUser).mockReturnValue({
        user: {
          id: 'user_123',
          fullName: '테스트 사용자',
          username: 'testuser',
          imageUrl: 'https://example.com/avatar.jpg',
          primaryEmailAddress: { emailAddress: 'test@example.com' },
          createdAt: new Date('2024-01-01').getTime(),
        },
        isLoaded: true,
        isSignedIn: true,
      } as unknown as ReturnType<typeof useUser>);

      render(<ProfilePage />);

      await vi.waitFor(() => {
        // K-5: alt text가 변경됨
        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      });
    });

    it('프로필 이미지가 없으면 이니셜을 표시한다', async () => {
      vi.mocked(useUser).mockReturnValue({
        user: {
          id: 'user_123',
          fullName: '테스트 사용자',
          username: 'testuser',
          imageUrl: null,
          primaryEmailAddress: { emailAddress: 'test@example.com' },
          createdAt: new Date('2024-01-01').getTime(),
        },
        isLoaded: true,
        isSignedIn: true,
      } as unknown as ReturnType<typeof useUser>);

      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('테')).toBeInTheDocument();
      });
    });
  });
});
