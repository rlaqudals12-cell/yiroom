/**
 * 스타일 탭 스크린 렌더링 테스트
 *
 * 대상: app/(tabs)/style.tsx (StyleTab)
 * 의존성: useRouter, useTheme, MenuCard, lucide-react-native 아이콘
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

// lucide-react-native 아이콘 mock (Proxy로 모든 아이콘 자동 처리)
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target: Record<string, unknown>, prop: string) => {
        if (typeof prop !== 'string' || prop === '__esModule') return undefined;
        return function MockIcon(props: Record<string, unknown>) {
          return <View testID={`icon-${prop}`} {...props} />;
        };
      },
    }
  );
});

import StyleTab from '../../../app/(tabs)/style';

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

describe('StyleTab', () => {
  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<StyleTab />);
      expect(getByTestId('style-tab')).toBeTruthy();
    });

    it('섹션 제목 "스타일"이 표시된다', () => {
      const { getByText } = renderWithTheme(<StyleTab />);
      expect(getByText('스타일')).toBeTruthy();
    });
  });

  describe('메뉴 카드 표시', () => {
    it('체형 분석 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<StyleTab />);
      expect(getByTestId('menu-body')).toBeTruthy();
    });

    it('패션 추천 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<StyleTab />);
      expect(getByTestId('menu-fashion')).toBeTruthy();
    });

    it('내 옷장 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<StyleTab />);
      expect(getByTestId('menu-closet')).toBeTruthy();
    });

    it('오늘의 코디 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<StyleTab />);
      expect(getByTestId('menu-coord')).toBeTruthy();
    });

    it('제품 둘러보기 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<StyleTab />);
      expect(getByTestId('menu-shopping')).toBeTruthy();
    });

    it('메뉴 카드의 설명 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(<StyleTab />);
      expect(
        getByText('AI가 체형을 분석하고 어울리는 스타일을 추천해요')
      ).toBeTruthy();
      expect(
        getByText('옷장을 관리하고 AI 코디 추천을 받으세요')
      ).toBeTruthy();
      expect(
        getByText('인기 제품과 할인 정보를 확인하세요')
      ).toBeTruthy();
    });
  });

  describe('네비게이션', () => {
    it('체형 분석 메뉴 클릭 시 라우터를 호출한다', () => {
      const mockPush = jest.fn();
      const { useRouter } = require('expo-router');
      useRouter.mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        navigate: jest.fn(),
        canGoBack: jest.fn(() => true),
      });

      const { getByTestId } = renderWithTheme(<StyleTab />);
      fireEvent.press(getByTestId('menu-body'));
      expect(mockPush).toHaveBeenCalledWith('/(analysis)/body');
    });

    it('내 옷장 메뉴 클릭 시 라우터를 호출한다', () => {
      const mockPush = jest.fn();
      const { useRouter } = require('expo-router');
      useRouter.mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        navigate: jest.fn(),
        canGoBack: jest.fn(() => true),
      });

      const { getByTestId } = renderWithTheme(<StyleTab />);
      fireEvent.press(getByTestId('menu-closet'));
      expect(mockPush).toHaveBeenCalledWith('/(closet)');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<StyleTab />, true);
      expect(getByTestId('style-tab')).toBeTruthy();
    });

    it('다크 모드에서 5개 메뉴가 모두 표시된다', () => {
      const { getByTestId } = renderWithTheme(<StyleTab />, true);
      expect(getByTestId('menu-body')).toBeTruthy();
      expect(getByTestId('menu-fashion')).toBeTruthy();
      expect(getByTestId('menu-closet')).toBeTruthy();
      expect(getByTestId('menu-coord')).toBeTruthy();
      expect(getByTestId('menu-shopping')).toBeTruthy();
    });
  });
});
