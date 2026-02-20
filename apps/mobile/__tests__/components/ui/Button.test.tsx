/**
 * Button UI 컴포넌트 테스트
 *
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

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
import { Button } from '../../../components/ui/Button';

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

describe('Button', () => {
  it('텍스트를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Button onPress={() => {}}>저장하기</Button>
    );

    expect(getByText('저장하기')).toBeTruthy();
  });

  it('onPress 콜백이 호출되어야 한다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Button onPress={onPress} testID="test-btn">
        클릭
      </Button>
    );

    fireEvent.press(getByTestId('test-btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태에서 onPress가 호출되지 않아야 한다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Button onPress={onPress} disabled testID="disabled-btn">
        비활성
      </Button>
    );

    fireEvent.press(getByTestId('disabled-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('isLoading 상태에서 텍스트가 숨겨져야 한다', () => {
    const { queryByText } = renderWithTheme(
      <Button onPress={() => {}} isLoading testID="loading-btn">
        로딩
      </Button>
    );

    expect(queryByText('로딩')).toBeNull();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <Button onPress={() => {}} testID="my-button">
        버튼
      </Button>
    );

    expect(getByTestId('my-button')).toBeTruthy();
  });

  it('다크 모드에서도 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <Button onPress={() => {}}>다크 버튼</Button>,
      true
    );

    expect(getByText('다크 버튼')).toBeTruthy();
  });

  it('variant=secondary가 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <Button onPress={() => {}} variant="secondary">
        보조 버튼
      </Button>
    );

    expect(getByText('보조 버튼')).toBeTruthy();
  });

  it('variant=ghost가 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <Button onPress={() => {}} variant="ghost">
        투명 버튼
      </Button>
    );

    expect(getByText('투명 버튼')).toBeTruthy();
  });
});
