/**
 * 공유 테스트 유틸리티
 *
 * UX v3 화면 렌더링 테스트를 위한 공통 mock + helper.
 * 각 테스트 파일에서 반복되는 ThemeProvider, mock 설정을 중앙화.
 */
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../lib/theme/ThemeProvider';
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
} from '../../lib/theme/tokens';

/** ThemeContextValue mock 생성 */
export function createThemeValue(isDark = false): ThemeContextValue {
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

/** ThemeProvider wrapper로 렌더링 */
export function renderWithTheme(
  ui: React.ReactElement,
  isDark = false,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const themeValue = createThemeValue(isDark);
  return render(
    <ThemeContext.Provider value={themeValue}>
      {ui}
    </ThemeContext.Provider>,
    options
  );
}

/** 공통 mock 셋업 — jest.mock() 호출 모음 (파일 최상위에서 호출) */
export function setupCommonMocks(): void {
  // 이 함수는 타입 안전성만 제공하며, 실제 mock은 각 파일에서 jest.mock() 호출
}
