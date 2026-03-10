/**
 * 제품함(선반) 목록 스크린 테스트
 *
 * 대상: app/(inventory)/shelf.tsx
 * 상태 필터 탭(전체/보관중/사용중/다씀) + 제품 목록
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

import ShelfScreen from '../../../app/(inventory)/shelf';

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

describe('ShelfScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('testID가 존재한다', () => {
      const { getByTestId } = renderWithTheme(<ShelfScreen />);
      expect(getByTestId('shelf-screen')).toBeTruthy();
    });

    it('4개 상태 필터 탭이 표시된다', () => {
      const { getAllByText, getByText } = renderWithTheme(<ShelfScreen />);
      expect(getByText('전체')).toBeTruthy();
      // 보관중/사용중은 필터 탭 + 상태 뱃지에 모두 존재
      expect(getAllByText('보관중').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('사용중').length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('다 씀').length).toBeGreaterThanOrEqual(1);
    });

    it('목업 제품 4개가 모두 표시된다', () => {
      const { getByText } = renderWithTheme(<ShelfScreen />);
      expect(getByText('아이소이 수분 크림')).toBeTruthy();
      expect(getByText('라운드랩 자작나무 토너')).toBeTruthy();
      expect(getByText('달바 선크림')).toBeTruthy();
      expect(getByText('이니스프리 그린티 세럼')).toBeTruthy();
    });
  });

  describe('제품 정보 표시', () => {
    it('브랜드 이름이 표시된다', () => {
      const { getByText } = renderWithTheme(<ShelfScreen />);
      expect(getByText('아이소이')).toBeTruthy();
      expect(getByText('라운드랩')).toBeTruthy();
    });

    it('사용기한이 표시된다', () => {
      const { getByText } = renderWithTheme(<ShelfScreen />);
      expect(getByText('사용기한: 2026-08')).toBeTruthy();
    });

    it('상태 뱃지가 표시된다', () => {
      const { getAllByText } = renderWithTheme(<ShelfScreen />);
      // 사용중 2개
      const inUse = getAllByText('사용중');
      expect(inUse.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('필터 동작', () => {
    it('보관중 필터 선택 시 해당 제품만 표시된다', () => {
      const { getAllByText, getByText, queryByText } = renderWithTheme(<ShelfScreen />);
      // 필터 탭 중 첫 번째 '보관중' 클릭
      fireEvent.press(getAllByText('보관중')[0]);
      // 보관중 제품만 표시
      expect(getByText('달바 선크림')).toBeTruthy();
      // 사용중/다씀 제품은 미표시
      expect(queryByText('아이소이 수분 크림')).toBeNull();
      expect(queryByText('이니스프리 그린티 세럼')).toBeNull();
    });
  });
});
