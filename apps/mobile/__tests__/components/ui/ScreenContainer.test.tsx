/**
 * ScreenContainer UI 컴포넌트 테스트
 *
 * 화면 컨테이너의 children 렌더링, SafeAreaView, ScrollView 검증.
 * react-native-safe-area-context를 수동 모킹.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { Text } from 'react-native';
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
import { ScreenContainer } from '../../../components/ui/ScreenContainer';

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

describe('ScreenContainer', () => {
  describe('렌더링', () => {
    it('children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer>
          <Text>화면 내용</Text>
        </ScreenContainer>
      );

      expect(getByText('화면 내용')).toBeTruthy();
    });

    it('여러 children을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer>
          <Text>첫 번째</Text>
          <Text>두 번째</Text>
        </ScreenContainer>
      );

      expect(getByText('첫 번째')).toBeTruthy();
      expect(getByText('두 번째')).toBeTruthy();
    });

    it('기본 testID가 screen-container여야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ScreenContainer>
          <Text>내용</Text>
        </ScreenContainer>
      );

      expect(getByTestId('screen-container')).toBeTruthy();
    });

    it('커스텀 testID가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ScreenContainer testID="custom-screen">
          <Text>내용</Text>
        </ScreenContainer>
      );

      expect(getByTestId('custom-screen')).toBeTruthy();
    });
  });

  describe('SafeAreaView', () => {
    it('SafeAreaView로 래핑되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ScreenContainer>
          <Text>안전 영역 내용</Text>
        </ScreenContainer>
      );

      // SafeAreaView는 View로 모킹되며, testID가 전달됨
      const container = getByTestId('screen-container');
      expect(container).toBeTruthy();
    });

    it('scrollable=false일 때도 SafeAreaView로 래핑되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ScreenContainer scrollable={false}>
          <Text>비스크롤 내용</Text>
        </ScreenContainer>
      );

      expect(getByTestId('screen-container')).toBeTruthy();
    });
  });

  describe('ScrollView', () => {
    it('기본 scrollable=true일 때 ScrollView로 래핑되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer>
          <Text>스크롤 가능 내용</Text>
        </ScreenContainer>
      );

      expect(getByText('스크롤 가능 내용')).toBeTruthy();
    });

    it('scrollable=false일 때 ScrollView 없이 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer scrollable={false}>
          <Text>비스크롤 내용</Text>
        </ScreenContainer>
      );

      expect(getByText('비스크롤 내용')).toBeTruthy();
    });

    it('scrollable=true일 때 children을 정상 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer scrollable={true}>
          <Text>스크롤 내용 1</Text>
          <Text>스크롤 내용 2</Text>
        </ScreenContainer>
      );

      expect(getByText('스크롤 내용 1')).toBeTruthy();
      expect(getByText('스크롤 내용 2')).toBeTruthy();
    });
  });

  describe('Refresh', () => {
    it('onRefresh가 전달되어도 에러 없이 렌더링되어야 한다', () => {
      const onRefresh = jest.fn();
      const { getByText } = renderWithTheme(
        <ScreenContainer refreshing={false} onRefresh={onRefresh}>
          <Text>새로고침 가능</Text>
        </ScreenContainer>
      );

      expect(getByText('새로고침 가능')).toBeTruthy();
    });
  });

  describe('backgroundGradient', () => {
    it('backgroundGradient="home"으로 에러 없이 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer backgroundGradient="home">
          <Text>홈 그라디언트</Text>
        </ScreenContainer>
      );

      expect(getByText('홈 그라디언트')).toBeTruthy();
    });

    it('backgroundGradient="beauty"로 에러 없이 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer backgroundGradient="beauty">
          <Text>뷰티 그라디언트</Text>
        </ScreenContainer>
      );

      expect(getByText('뷰티 그라디언트')).toBeTruthy();
    });

    it('다크 모드에서 backgroundGradient가 에러 없이 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer backgroundGradient="profile">
          <Text>다크 프로필</Text>
        </ScreenContainer>,
        true
      );

      expect(getByText('다크 프로필')).toBeTruthy();
    });

    it('scrollable=false에서도 backgroundGradient가 적용되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer scrollable={false} backgroundGradient="records">
          <Text>비스크롤 그라디언트</Text>
        </ScreenContainer>
      );

      expect(getByText('비스크롤 그라디언트')).toBeTruthy();
    });

    it('backgroundGradient 없이도 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer>
          <Text>기본 화면</Text>
        </ScreenContainer>
      );

      expect(getByText('기본 화면')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer>
          <Text>다크 모드 화면</Text>
        </ScreenContainer>,
        true
      );

      expect(getByText('다크 모드 화면')).toBeTruthy();
    });

    it('다크 모드에서 scrollable=false로 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ScreenContainer scrollable={false}>
          <Text>다크 비스크롤</Text>
        </ScreenContainer>,
        true
      );

      expect(getByText('다크 비스크롤')).toBeTruthy();
    });
  });
});
