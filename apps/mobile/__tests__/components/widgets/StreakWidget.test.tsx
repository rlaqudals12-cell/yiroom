/**
 * StreakWidget 컴포넌트 테스트
 *
 * 연속 달성 일수, 레벨 배지, 최고 기록 표시 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { StreakWidget } from '../../../components/widgets/StreakWidget';

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
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

describe('StreakWidget', () => {
  describe('medium size (기본)', () => {
    it('기본 렌더링이 정상 동작해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={15} longestStreak={30} />
      );

      expect(getByText('연속 기록')).toBeTruthy();
    });

    it('testID="streak-widget"이 존재해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <StreakWidget streak={10} longestStreak={20} />
      );

      expect(getByTestId('streak-widget')).toBeTruthy();
    });

    it('스트릭 일수를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={15} longestStreak={30} />
      );

      expect(getByText('15일')).toBeTruthy();
    });

    it('최고 기록을 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={15} longestStreak={30} />
      );

      expect(getByText('최고: 30일')).toBeTruthy();
    });

    it('recentBadges를 최대 3개까지 표시해야 한다', () => {
      const badges = ['🏅', '🎖️', '🥇', '🥈'];
      const { getByText, queryByText } = renderWithTheme(
        <StreakWidget streak={10} longestStreak={20} recentBadges={badges} />
      );

      expect(getByText('🏅')).toBeTruthy();
      expect(getByText('🎖️')).toBeTruthy();
      expect(getByText('🥇')).toBeTruthy();
      // 4번째 배지는 표시되지 않아야 한다
      expect(queryByText('🥈')).toBeNull();
    });

    it('recentBadges가 빈 배열이면 배지 영역을 렌더링하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <StreakWidget streak={10} longestStreak={20} recentBadges={[]} />
      );

      // 배지 이모지가 없으므로 배지 텍스트가 없어야 한다
      expect(queryByText('🏅')).toBeNull();
    });

    it('다크 모드에서도 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={15} longestStreak={30} />,
        true
      );

      expect(getByText('연속 기록')).toBeTruthy();
      expect(getByText('15일')).toBeTruthy();
    });
  });

  describe('size="small"', () => {
    it('"일 연속" 텍스트를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={7} longestStreak={14} size="small" />
      );

      expect(getByText('일 연속')).toBeTruthy();
    });

    it('스트릭 숫자를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={7} longestStreak={14} size="small" />
      );

      expect(getByText('7')).toBeTruthy();
    });

    it('testID가 없어야 한다 (medium에만 존재)', () => {
      const { queryByTestId } = renderWithTheme(
        <StreakWidget streak={7} longestStreak={14} size="small" />
      );

      expect(queryByTestId('streak-widget')).toBeNull();
    });
  });

  describe('레벨 계산', () => {
    it('0일이면 새싹 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={0} longestStreak={0} />
      );

      expect(getByText('새싹')).toBeTruthy();
    });

    it('2일이면 새싹 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={2} longestStreak={2} />
      );

      expect(getByText('새싹')).toBeTruthy();
    });

    it('3일이면 시작 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={3} longestStreak={3} />
      );

      expect(getByText('시작')).toBeTruthy();
    });

    it('5일이면 시작 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={5} longestStreak={5} />
      );

      expect(getByText('시작')).toBeTruthy();
    });

    it('7일이면 챌린저 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={7} longestStreak={7} />
      );

      expect(getByText('챌린저')).toBeTruthy();
    });

    it('10일이면 챌린저 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={10} longestStreak={10} />
      );

      expect(getByText('챌린저')).toBeTruthy();
    });

    it('30일이면 마스터 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={30} longestStreak={30} />
      );

      expect(getByText('마스터')).toBeTruthy();
    });

    it('50일이면 마스터 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={50} longestStreak={50} />
      );

      expect(getByText('마스터')).toBeTruthy();
    });

    it('100일이면 레전드 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={100} longestStreak={100} />
      );

      expect(getByText('레전드')).toBeTruthy();
    });

    it('150일이면 레전드 레벨이어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={150} longestStreak={150} />
      );

      expect(getByText('레전드')).toBeTruthy();
    });
  });

  describe('레벨 이모지 (medium)', () => {
    it('새싹 레벨은 이모지를 표시해야 한다', () => {
      const { getAllByText } = renderWithTheme(
        <StreakWidget streak={0} longestStreak={0} />
      );

      // bigEmoji 영역에서 새싹 이모지 확인
      const emojiElements = getAllByText('🌱');
      expect(emojiElements.length).toBeGreaterThan(0);
    });

    it('마스터 레벨은 이모지를 표시해야 한다', () => {
      const { getAllByText } = renderWithTheme(
        <StreakWidget streak={50} longestStreak={50} />
      );

      const emojiElements = getAllByText('🔥');
      expect(emojiElements.length).toBeGreaterThan(0);
    });
  });

  describe('엣지 케이스', () => {
    it('longestStreak이 streak보다 클 때 정상 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={5} longestStreak={100} />
      );

      expect(getByText('5일')).toBeTruthy();
      expect(getByText('최고: 100일')).toBeTruthy();
    });

    it('recentBadges가 undefined일 때 기본값 빈 배열로 동작해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <StreakWidget streak={10} longestStreak={20} />
      );

      // 에러 없이 렌더링되어야 한다
      expect(getByTestId('streak-widget')).toBeTruthy();
    });

    it('recentBadges가 1개일 때 1개만 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StreakWidget streak={10} longestStreak={20} recentBadges={['🏅']} />
      );

      expect(getByText('🏅')).toBeTruthy();
    });
  });
});
