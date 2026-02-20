/**
 * Badge UI 컴포넌트 테스트
 *
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
import { Badge } from '../../../components/ui/Badge';

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

describe('Badge', () => {
  it('텍스트를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(<Badge>신규</Badge>);

    expect(getByText('신규')).toBeTruthy();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <Badge testID="my-badge">테스트</Badge>
    );

    expect(getByTestId('my-badge')).toBeTruthy();
  });

  it('default variant가 기본값이어야 한다', () => {
    const { getByText } = renderWithTheme(<Badge>기본</Badge>);

    expect(getByText('기본')).toBeTruthy();
  });

  it('secondary variant를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Badge variant="secondary">보조</Badge>
    );

    expect(getByText('보조')).toBeTruthy();
  });

  it('destructive variant를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Badge variant="destructive">위험</Badge>
    );

    expect(getByText('위험')).toBeTruthy();
  });

  it('outline variant를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Badge variant="outline">외곽선</Badge>
    );

    expect(getByText('외곽선')).toBeTruthy();
  });

  it('다크 모드에서도 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <Badge variant="default">다크 뱃지</Badge>,
      true
    );

    expect(getByText('다크 뱃지')).toBeTruthy();
  });

  it('다크 모드에서 모든 variant가 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <>
        <Badge variant="default">A</Badge>
        <Badge variant="secondary">B</Badge>
        <Badge variant="destructive">C</Badge>
        <Badge variant="outline">D</Badge>
      </>,
      true
    );

    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(getByText('C')).toBeTruthy();
    expect(getByText('D')).toBeTruthy();
  });
});
