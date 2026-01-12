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

    it('웰니스 스코어를 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        // K-5 리디자인: 웰니스 스코어 텍스트 → 링 차트 컴포넌트
        expect(screen.getByTestId('wellness-score-ring')).toBeInTheDocument();
      });
    });

    it('배지 컬렉션 섹션을 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('배지 컬렉션')).toBeInTheDocument();
      });
    });

    it('챌린지 섹션을 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('챌린지')).toBeInTheDocument();
      });
    });

    it('연속 기록 섹션을 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('연속 기록')).toBeInTheDocument();
      });
    });

    it('가입일 정보를 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        // K-5 리디자인: '가입 정보' 섹션 → '가입일:' 인라인 표시
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
        abandoned: 0,
      });

      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // 진행 중
        expect(screen.getByText('3')).toBeInTheDocument(); // 완료
        expect(screen.getByText('5')).toBeInTheDocument(); // 전체 참여
      });
    });
  });

  describe('배지 표시', () => {
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
      vi.mocked(getUserLevel).mockResolvedValue(null);
      vi.mocked(getUserChallengeStats).mockResolvedValue({
        total: 0,
        inProgress: 0,
        completed: 0,
        failed: 0,
        abandoned: 0,
      });
    });

    it('배지가 없을 때 안내 메시지를 표시한다', async () => {
      vi.mocked(getUserBadges).mockResolvedValue([]);

      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('아직 획득한 배지가 없어요')).toBeInTheDocument();
      });
    });

    it('획득한 배지 수를 표시한다', async () => {
      vi.mocked(getUserBadges).mockResolvedValue([
        {
          id: 'ub1',
          clerkUserId: 'user_123',
          badgeId: 'badge1',
          earnedAt: new Date(),
          badge: {
            id: 'badge1',
            code: 'first_workout',
            name: '첫 운동',
            description: '첫 운동 완료',
            icon: '🎯',
            category: 'workout',
            rarity: 'common',
            requirement: { type: 'count', domain: 'workout', sessions: 1 },
            xpReward: 10,
            sortOrder: 1,
            createdAt: new Date(),
          },
        },
      ]);

      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('1/23개')).toBeInTheDocument();
      });
    });
  });

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
        const img = screen.getByRole('img', { name: '테스트 사용자' });
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
