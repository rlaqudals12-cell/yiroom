/**
 * 설정 메인 화면 테스트
 *
 * 대상: app/settings/index.tsx (SettingsScreen)
 * 의존성: useTheme, expo-router, expo-haptics, expo-constants, Linking
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

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

import SettingsScreen from '../../../app/settings/index';

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

describe('SettingsScreen', () => {
  const { router } = require('expo-router');
  const Haptics = require('expo-haptics');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<SettingsScreen />);
      expect(getByTestId('settings-screen')).toBeTruthy();
    });

    it('testID가 settings-screen으로 설정된다', () => {
      const { getByTestId } = renderWithTheme(<SettingsScreen />);
      expect(getByTestId('settings-screen')).toBeTruthy();
    });
  });

  describe('주요 UI 요소 표시', () => {
    it('섹션 타이틀들을 표시한다', () => {
      const { getAllByText } = renderWithTheme(<SettingsScreen />);

      // "위젯"은 섹션 제목과 "위젯 설정" 항목에 모두 포함되므로 getAllByText 사용
      expect(getAllByText(/알림 및 목표/i).length).toBeGreaterThanOrEqual(1);
      expect(getAllByText(/위젯/i).length).toBeGreaterThanOrEqual(1);
      expect(getAllByText(/앱 정보/i).length).toBeGreaterThanOrEqual(1);
    });

    it('알림 설정 항목을 표시한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      expect(getByText('알림 설정')).toBeTruthy();
      expect(getByText('물, 운동, 식사 알림')).toBeTruthy();
    });

    it('목표 설정 항목을 표시한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      expect(getByText('목표 설정')).toBeTruthy();
      expect(getByText('일일 물, 칼로리 목표')).toBeTruthy();
    });

    it('위젯 설정 항목을 표시한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      expect(getByText('위젯 설정')).toBeTruthy();
      expect(getByText('홈 화면 위젯 미리보기')).toBeTruthy();
    });

    it('앱 정보 항목들을 표시한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      expect(getByText('이용약관')).toBeTruthy();
      expect(getByText('개인정보 처리방침')).toBeTruthy();
      expect(getByText('피드백 보내기')).toBeTruthy();
    });

    it('앱 이름과 버전 정보를 표시한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      expect(getByText('이룸')).toBeTruthy();
      expect(getByText('버전 0.1.0')).toBeTruthy();
    });
  });

  describe('네비게이션 상호작용', () => {
    it('알림 설정 클릭 시 /settings/notifications로 이동한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      fireEvent.press(getByText('알림 설정'));

      expect(Haptics.selectionAsync).toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith('/settings/notifications');
    });

    it('목표 설정 클릭 시 /settings/goals로 이동한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      fireEvent.press(getByText('목표 설정'));

      expect(Haptics.selectionAsync).toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith('/settings/goals');
    });

    it('위젯 설정 클릭 시 /settings/widgets로 이동한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      fireEvent.press(getByText('위젯 설정'));

      expect(Haptics.selectionAsync).toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith('/settings/widgets');
    });

    it('이용약관 클릭 시 /terms로 이동한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      fireEvent.press(getByText('이용약관'));

      expect(router.push).toHaveBeenCalledWith('/terms');
    });

    it('개인정보 처리방침 클릭 시 /privacy-policy로 이동한다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />);
      fireEvent.press(getByText('개인정보 처리방침'));

      expect(router.push).toHaveBeenCalledWith('/privacy-policy');
    });

    it('피드백 보내기 클릭 시 mailto 링크를 연다', () => {
      jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

      const { getByText } = renderWithTheme(<SettingsScreen />);
      fireEvent.press(getByText('피드백 보내기'));

      expect(Haptics.selectionAsync).toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith('mailto:support@yiroom.app');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<SettingsScreen />, true);
      expect(getByTestId('settings-screen')).toBeTruthy();
    });

    it('다크 모드에서 배경색이 변경된다', () => {
      const { getByTestId } = renderWithTheme(<SettingsScreen />, true);
      const screen = getByTestId('settings-screen');

      // 다크 모드 배경색 확인
      const flatStyle = Array.isArray(screen.props.style)
        ? Object.assign({}, ...screen.props.style)
        : screen.props.style;
      expect(flatStyle.backgroundColor).toBe(darkColors.background);
    });

    it('다크 모드에서 모든 섹션이 표시된다', () => {
      const { getByText } = renderWithTheme(<SettingsScreen />, true);
      expect(getByText('이룸')).toBeTruthy();
      expect(getByText('알림 설정')).toBeTruthy();
      expect(getByText('목표 설정')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('각 설정 항목에 화살표(>)가 표시된다', () => {
      const { getAllByText } = renderWithTheme(<SettingsScreen />);
      // 6개 설정 항목 모두에 화살표 존재
      const arrows = getAllByText('\u203A'); // '>'
      expect(arrows.length).toBe(6);
    });
  });
});
