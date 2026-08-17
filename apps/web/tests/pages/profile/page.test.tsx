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
  // IntegratedSessionPromptCard → useLatestIntegratedSession이 useAuth를 소비 — 누락 시 렌더 전체 실패
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
  SignOutButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-out-button">{children}</div>
  ),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: vi.fn(),
}));

// Mock gamification (배지 total은 badges 테이블 실카운트 — 하드코딩 23 제거)
vi.mock('@/lib/gamification', () => ({
  getUserBadges: vi.fn(),
  getAllBadges: vi.fn(),
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
  // 내 분석 결과 = 홈과 동일한 정본 카드로 통일 (ADR-111 One Canon)
  ProfileCardGrid: vi.fn(() => <div data-testid="profile-card-grid">ProfileCardGrid</div>),
}));

// 5축 요약은 ProfileCardGrid가 useAnalysisStatus로 자체 조회 — 프로필 페이지는 값만 전달 (ADR-111)
vi.mock('@/hooks/useAnalysisStatus', () => ({
  useAnalysisStatus: vi.fn(() => ({ analyses: [] })),
}));
vi.mock('@/hooks/useProfilePersona', () => ({
  useProfilePersona: vi.fn(() => null),
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

// Mock feature flags — 게이팅 상태를 명시적으로 고정 (프로덕션 기본값과 동일)
vi.mock('@yiroom/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@yiroom/shared')>();
  return {
    ...actual,
    FEATURE_FLAGS: { ...actual.FEATURE_FLAGS, WELLNESS_PHASE2: false, BADGES: false },
  };
});

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
import { getUserBadges, getAllBadges } from '@/lib/gamification';
import { getUserChallengeStats } from '@/lib/challenges';
import { getUserLevel, calculateUserLevelState } from '@/lib/levels';

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

/** 활동 탭으로 전환하고, 비게이팅 정본 섹션(활동 기록)이 렌더될 때까지 대기 */
async function openActivityTab(): Promise<void> {
  await vi.waitFor(() => {
    expect(screen.getByText('활동')).toBeInTheDocument();
  });
  screen.getByText('활동').click();

  await vi.waitFor(() => {
    expect(screen.getByTestId('activity-summary')).toBeInTheDocument();
  });
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
      vi.mocked(getUserBadges).mockResolvedValue([]);
      vi.mocked(getAllBadges).mockResolvedValue([]);

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

    it('내 분석 결과 섹션(정본 ProfileCardGrid)을 표시한다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByTestId('profile-card-grid')).toBeInTheDocument();
      });
    });

    // 배치 IA-3: 사용자 대면 명칭은 "오늘의 루틴"으로 통일 — 내부 용어 "데일리 캡슐" 부재(재발 방지)
    it('"오늘의 루틴" 링크를 표시하고 "데일리 캡슐" 표기는 없다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('오늘의 루틴')).toBeInTheDocument();
      });
      expect(screen.queryByText('데일리 캡슐')).not.toBeInTheDocument();
    });

    // ADR-098: 웰니스 스코어는 W/N 기반 지표 — WELLNESS_PHASE2=false에서 숨김
    // (prod wellness_scores 0행·쓰기 경로 부재 확인, 2026-07-08 정직화)
    it('웰니스 스코어 링은 표시되지 않는다 (WELLNESS_PHASE2 게이팅)', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByTestId('profile-card-grid')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('wellness-score-ring')).not.toBeInTheDocument();
    });

    // ADR-098 기능 과잉 정리(2026-05-16): 배지 UI는 FEATURE_FLAGS.BADGES=false로 숨김 (코드 유지)
    it('배지 컬렉션 섹션은 표시되지 않는다 (BADGES 게이팅)', async () => {
      render(<ProfilePage />);

      // 게이팅되지 않은 활동 기록 섹션이 렌더된 뒤 배지 섹션 부재 확인
      await openActivityTab();
      expect(screen.queryByText('배지 컬렉션')).not.toBeInTheDocument();
    });

    // 챌린지 목록이 전부 운동·영양 의존 — W/N 숨김 상태에선 달성 불가 목표만 노출됐다
    it('챌린지 섹션은 표시되지 않는다 (WELLNESS_PHASE2 게이팅)', async () => {
      render(<ProfilePage />);

      await openActivityTab();
      expect(screen.queryByText('챌린지')).not.toBeInTheDocument();
      // 3-up 채점판(진행 중·완료·전체 참여)도 섹션 안이라 함께 숨겨진다
      expect(screen.queryByText('전체 참여')).not.toBeInTheDocument();
      expect(screen.queryByTestId('challenge-empty-entry')).not.toBeInTheDocument();
    });

    // 게이팅된 섹션은 조회 자체를 건너뛴다 (결과를 버릴 목적의 왕복 제거)
    it('게이팅된 챌린지·배지는 조회하지 않는다', async () => {
      render(<ProfilePage />);

      await openActivityTab();
      expect(vi.mocked(getUserChallengeStats)).not.toHaveBeenCalled();
      expect(vi.mocked(getUserBadges)).not.toHaveBeenCalled();
      expect(vi.mocked(getAllBadges)).not.toHaveBeenCalled();
    });

    // ADR-098: 운동/식단 연속기록은 FEATURE_FLAGS.WELLNESS_PHASE2=false로 숨김 (코드 유지)
    it('연속 기록 섹션은 표시되지 않는다 (WELLNESS_PHASE2 게이팅)', async () => {
      render(<ProfilePage />);

      await openActivityTab();
      expect(screen.queryByText('연속 기록')).not.toBeInTheDocument();
    });

    // 게이팅으로 비는 활동 탭을 채우는 유일한 표면 — 등급 배선(분석·루틴 체크)의 사용자 대면 결과
    it('활동 탭에 활동 기록 요약과 오늘의 루틴 링크를 표시한다', async () => {
      render(<ProfilePage />);

      await openActivityTab();
      const summary = screen.getByTestId('activity-summary');
      expect(summary).toBeInTheDocument();
      expect(
        screen.getByText(/분석을 완료하거나 오늘의 루틴을 체크하면 활동이 쌓여요/)
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /오늘의 루틴 확인/ })).toHaveAttribute(
        'href',
        '/capsule/daily'
      );
    });

    // "오늘의 루틴" 정본 표면은 /capsule/daily (/capsule은 캡슐 워드로브 대시보드)
    it('더 보기의 "오늘의 루틴" 링크가 /capsule/daily를 가리킨다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        const link = screen.getByRole('link', { name: '오늘의 루틴' });
        expect(link).toHaveAttribute('href', '/capsule/daily');
      });
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

    // 운영 요소 가시성 — 약관·정책 섹션 도달 경로 (창업자 지적 대응)
    it('이용약관 링크가 /terms를 가리킨다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        const link = screen.getByRole('link', { name: '이용약관' });
        expect(link).toHaveAttribute('href', '/terms');
      });
    });

    it('개인정보처리방침 링크가 /privacy를 가리킨다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        const link = screen.getByRole('link', { name: '개인정보처리방침' });
        expect(link).toHaveAttribute('href', '/privacy');
      });
    });

    it('개인정보·동의 관리 링크가 /settings/privacy를 가리킨다 (동의 철회 도달 경로)', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        const link = screen.getByRole('link', { name: '개인정보·동의 관리' });
        expect(link).toHaveAttribute('href', '/settings/privacy');
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

    // 배치 C4: 받은 요청 0이면 응답 대상이 없으므로 '친구 추가'가 주 액션
    it('받은 친구 요청이 없으면 "친구 추가"가 주 액션(primary)이다', async () => {
      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('소셜')).toBeInTheDocument();
      });
      screen.getByText('소셜').click();

      await vi.waitFor(() => {
        const addLink = screen.getByRole('link', { name: '친구 추가' });
        expect(addLink.className).toContain('bg-primary');
      });
      const requestLink = screen.getByRole('link', { name: /친구 요청/ });
      expect(requestLink.className).not.toContain('bg-primary');
    });
  });

  // '챌린지 통계' describe 삭제 (2026-08-17):
  // 챌린지 목록이 전부 운동·영양 의존이라 WELLNESS_PHASE2=false에서 섹션 전체를 게이팅했다
  // (달성 불가능한 목표 노출 제거). 3-up 채점판·빈 상태 링크도 함께 숨겨짐 —
  // 게이팅 자체는 '로그인 상태 > 챌린지 섹션은 표시되지 않는다'로 검증.
  // W/N 복원(WELLNESS_PHASE2=true) 시 채점판/빈 상태 테스트를 복구할 것.

  describe('등급 안내 (활동 배선)', () => {
    const mockUser = {
      id: 'user_123',
      fullName: '테스트 사용자',
      username: 'testuser',
      imageUrl: null,
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      createdAt: new Date('2024-01-01').getTime(),
    };

    function mockLevel(totalActivityCount: number): void {
      vi.mocked(getUserLevel).mockResolvedValue({
        level: 1,
        totalActivityCount,
        levelUpdatedAt: null,
      });
      vi.mocked(calculateUserLevelState).mockReturnValue({
        level: 1,
        totalActivityCount,
        nextLevelThreshold: 30,
        progress: 0,
        levelInfo: {
          level: 1,
          name: 'Lv.1',
          icon: '○',
          color: { name: 'Slate', hex: '#94A3B8', tailwind: 'slate-400' },
          threshold: 0,
        },
      });
    }

    beforeEach(() => {
      vi.mocked(useUser).mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true,
      } as unknown as ReturnType<typeof useUser>);

      vi.mocked(useClerkSupabaseClient).mockReturnValue(createMockSupabase() as any);
      vi.mocked(getUserBadges).mockResolvedValue([]);
      vi.mocked(getAllBadges).mockResolvedValue([]);
    });

    // 배선 전 사용자는 활동 0·Lv.1로 고정돼 있어 "고장난 화면"으로 보였다
    it('활동이 0이면 등급 블록에 활동을 쌓는 방법을 안내한다', async () => {
      mockLevel(0);

      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(
          screen.getByText('분석을 완료하거나 오늘의 루틴을 체크하면 활동이 쌓여요.')
        ).toBeInTheDocument();
      });
    });

    it('활동이 있으면 안내 문구 없이 횟수를 표시한다', async () => {
      mockLevel(4);

      render(<ProfilePage />);

      await vi.waitFor(() => {
        expect(screen.getByText('4회 활동')).toBeInTheDocument();
      });
      expect(
        screen.queryByText('분석을 완료하거나 오늘의 루틴을 체크하면 활동이 쌓여요.')
      ).not.toBeInTheDocument();
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
      vi.mocked(getUserLevel).mockResolvedValue(null);
      vi.mocked(getUserBadges).mockResolvedValue([]);
      vi.mocked(getAllBadges).mockResolvedValue([]);
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
