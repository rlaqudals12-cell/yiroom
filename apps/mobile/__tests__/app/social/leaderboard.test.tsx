/**
 * 리더보드 스크린 테스트
 *
 * 대상: app/(social)/leaderboard/index.tsx
 * 5개 카테고리 탭(XP/레벨/웰니스/운동/영양) + 전체/친구 탭 + 순위 목록
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// 리더보드 mock 데이터
const mockRankings = [
  {
    rank: 1,
    userId: 'user_1',
    displayName: '김민수',
    avatarUrl: null,
    score: 9500,
    level: 25,
    tier: 'diamond',
  },
  {
    rank: 2,
    userId: 'user_2',
    displayName: '이지은',
    avatarUrl: 'https://example.com/avatar.jpg',
    score: 8200,
    level: 22,
    tier: 'platinum',
  },
  {
    rank: 3,
    userId: 'test_user_123',
    displayName: '테스트 사용자',
    avatarUrl: null,
    score: 7000,
    level: 18,
    tier: 'gold',
  },
];

const mockUseLeaderboard = jest.fn(() => ({
  rankings: mockRankings,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));

const mockUseFriendsLeaderboard = jest.fn(() => ({
  rankings: [],
  isLoading: false,
  error: null,
  refetch: jest.fn(),
}));

const mockUseMyRanking = jest.fn(() => ({
  rank: 3,
  totalUsers: 100,
  percentile: 3,
}));

jest.mock('../../../lib/social/useLeaderboard', () => ({
  useLeaderboard: (...args: unknown[]) => (mockUseLeaderboard as jest.Mock)(...args),
  useFriendsLeaderboard: (...args: unknown[]) => (mockUseFriendsLeaderboard as jest.Mock)(...args),
  useMyRanking: (...args: unknown[]) => (mockUseMyRanking as jest.Mock)(...args),
}));

jest.mock('../../../lib/social', () => ({
  getTierColor: jest.fn((tier: string) => {
    const colors: Record<string, string> = {
      diamond: '#b9f2ff',
      platinum: '#e5e4e2',
      gold: '#ffd700',
    };
    return colors[tier] ?? '#888';
  }),
  getTierLabel: jest.fn((tier: string) => {
    const labels: Record<string, string> = {
      diamond: '다이아몬드',
      platinum: '플래티넘',
      gold: '골드',
    };
    return labels[tier] ?? tier;
  }),
}));

import LeaderboardScreen from '../../../app/(social)/leaderboard/index';

// ============================================================
// 테마 헬퍼
// ============================================================

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ============================================================
// 테스트
// ============================================================

describe('LeaderboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLeaderboard.mockReturnValue({
      rankings: mockRankings,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseFriendsLeaderboard.mockReturnValue({
      rankings: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseMyRanking.mockReturnValue({
      rank: 3,
      totalUsers: 100,
      percentile: 3,
    });
  });

  describe('기본 렌더링', () => {
    it('testID가 존재한다', () => {
      const { getByTestId } = renderWithTheme(<LeaderboardScreen />);
      expect(getByTestId('social-leaderboard-screen')).toBeTruthy();
    });

    it('5개 카테고리 탭이 모두 표시된다', () => {
      const { getAllByText } = renderWithTheme(<LeaderboardScreen />);
      // XP는 카테고리 탭 + 점수 라벨에 동시 존재
      expect(getAllByText('XP').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('레벨').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('웰니스').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('운동').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('영양').length).toBeGreaterThanOrEqual(1);
    });

    it('전체/친구 탭이 표시된다', () => {
      const { getByText } = renderWithTheme(<LeaderboardScreen />);
      expect(getByText('전체')).toBeTruthy();
      expect(getByText('친구')).toBeTruthy();
    });
  });

  describe('내 순위 카드', () => {
    it('내 순위와 총 사용자 수가 표시된다', () => {
      const { getByText } = renderWithTheme(<LeaderboardScreen />);
      expect(getByText('내 순위')).toBeTruthy();
      expect(getByText('3위 / 100명')).toBeTruthy();
    });

    it('상위 퍼센트가 표시된다', () => {
      const { getByText } = renderWithTheme(<LeaderboardScreen />);
      expect(getByText('상위 3%')).toBeTruthy();
    });
  });

  describe('랭킹 목록', () => {
    it('사용자 이름이 표시된다', () => {
      const { getByText } = renderWithTheme(<LeaderboardScreen />);
      expect(getByText(/김민수/)).toBeTruthy();
      expect(getByText(/이지은/)).toBeTruthy();
    });

    it('빈 리더보드일 때 안내 메시지가 표시된다', () => {
      mockUseLeaderboard.mockReturnValue({
        rankings: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      const { getByText } = renderWithTheme(<LeaderboardScreen />);
      expect(getByText('아직 리더보드 데이터가 없어요')).toBeTruthy();
    });

    it('친구 탭에서 빈 상태 메시지가 표시된다', () => {
      const { getByText } = renderWithTheme(<LeaderboardScreen />);
      fireEvent.press(getByText('친구'));
      expect(getByText('친구를 추가하면 리더보드를 볼 수 있어요')).toBeTruthy();
    });
  });
});
