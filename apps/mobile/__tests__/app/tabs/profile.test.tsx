/**
 * 프로필 탭 스크린 렌더링 테스트
 *
 * 대상: app/(tabs)/profile.tsx (ProfileScreen)
 * 의존성: useUser, useClerk, useTheme, useUserAnalyses,
 *          useWorkoutData, useNutritionData, profileLogger
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
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// 분석 결과 mock
jest.mock('../../../hooks/useUserAnalyses', () => ({
  useUserAnalyses: jest.fn(() => ({
    personalColor: { season: 'spring' },
    skinAnalysis: { skinType: '복합성' },
    bodyAnalysis: null,
    isLoading: false,
  })),
}));

// 운동 데이터 mock
jest.mock('../../../hooks/useWorkoutData', () => ({
  useWorkoutData: jest.fn(() => ({
    streak: { currentStreak: 7 },
    todayWorkout: null,
    analysis: { type: 'strength' },
    isLoading: false,
  })),
  getWorkoutTypeLabel: jest.fn((type: string) => type),
  getWorkoutTypeDescription: jest.fn((type: string) => type),
}));

// 영양 데이터 mock
jest.mock('../../../hooks/useNutritionData', () => ({
  useNutritionData: jest.fn(() => ({
    todaySummary: null,
    settings: null,
    streak: { currentStreak: 3 },
    isLoading: false,
  })),
  calculateCalorieProgress: jest.fn(),
  getNutrientStatus: jest.fn(),
  getNutrientStatusColor: jest.fn(),
}));

// 로거 mock
jest.mock('../../../lib/utils/logger', () => ({
  profileLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

import ProfileScreen from '../../../app/(tabs)/profile';

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
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

describe('ProfileScreen', () => {
  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<ProfileScreen />);
      expect(getByTestId('profile-screen')).toBeTruthy();
    });
  });

  describe('로그인 상태 (기본 mock)', () => {
    it('사용자 이름이 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      // jest.setup.js mock: fullName = '테스트 사용자'
      expect(getByText('테스트 사용자')).toBeTruthy();
    });

    it('로그아웃 버튼이 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('로그아웃')).toBeTruthy();
    });

    it('로그아웃 버튼 클릭 시 signOut을 호출한다', () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined);
      const { useClerk } = require('@clerk/clerk-expo');
      useClerk.mockReturnValue({ signOut: mockSignOut });

      const { getByText } = renderWithTheme(<ProfileScreen />);
      fireEvent.press(getByText('로그아웃'));
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('분석 결과 섹션', () => {
    it('분석 결과 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('분석 결과')).toBeTruthy();
    });

    it('퍼스널 컬러 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('퍼스널 컬러')).toBeTruthy();
    });

    it('피부 분석 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('피부 분석')).toBeTruthy();
    });

    it('체형 분석 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('체형 분석')).toBeTruthy();
    });

    it('완료된 분석에 시즌/타입 서브타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('spring')).toBeTruthy();
    });
  });

  describe('기록 섹션', () => {
    it('기록 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('기록')).toBeTruthy();
    });

    it('운동 기록 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('운동 기록')).toBeTruthy();
    });

    it('식단 기록 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('식단 기록')).toBeTruthy();
    });

    it('주간 리포트 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('주간 리포트')).toBeTruthy();
    });

    it('운동 연속 일수가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText(/7일 연속/)).toBeTruthy();
    });

    it('영양 연속 일수가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText(/3일 연속/)).toBeTruthy();
    });
  });

  describe('설정 섹션', () => {
    it('설정 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('설정')).toBeTruthy();
    });

    it('알림 설정 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('알림 설정')).toBeTruthy();
    });

    it('목표 설정 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('목표 설정')).toBeTruthy();
    });

    it('위젯 설정 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('위젯 설정')).toBeTruthy();
    });

    it('전체 설정 메뉴가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('전체 설정')).toBeTruthy();
    });
  });

  describe('로그아웃 상태', () => {
    it('로그인 버튼이 표시된다', () => {
      const { useUser } = require('@clerk/clerk-expo');
      useUser.mockReturnValueOnce({
        user: null,
        isLoaded: true,
        isSignedIn: false,
      });

      const { getByText } = renderWithTheme(<ProfileScreen />);
      expect(getByText('로그인이 필요합니다')).toBeTruthy();
      expect(getByText('로그인')).toBeTruthy();
    });

    it('로그인 버튼 클릭 시 로그인 페이지로 이동한다', () => {
      const { useUser } = require('@clerk/clerk-expo');
      useUser.mockReturnValueOnce({
        user: null,
        isLoaded: true,
        isSignedIn: false,
      });

      const mockPush = jest.fn();
      const { router } = require('expo-router');
      router.push = mockPush;

      const { getByText } = renderWithTheme(<ProfileScreen />);
      fireEvent.press(getByText('로그인'));
      expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<ProfileScreen />, true);
      expect(getByTestId('profile-screen')).toBeTruthy();
    });

    it('다크 모드에서 프로필 정보가 표시된다', () => {
      const { getByText } = renderWithTheme(<ProfileScreen />, true);
      expect(getByText('테스트 사용자')).toBeTruthy();
    });
  });
});
