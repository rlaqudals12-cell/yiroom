/**
 * Input UI 컴포넌트 테스트
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
import { Input } from '../../../components/ui/Input';

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

describe('Input', () => {
  it('라벨을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Input label="이메일" placeholder="example@email.com" />
    );

    expect(getByText('이메일')).toBeTruthy();
  });

  it('라벨 없이도 렌더링되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <Input placeholder="입력하세요" testID="no-label-input" />
    );

    expect(getByTestId('no-label-input')).toBeTruthy();
  });

  it('placeholder가 표시되어야 한다', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <Input placeholder="이름을 입력하세요" />
    );

    expect(getByPlaceholderText('이름을 입력하세요')).toBeTruthy();
  });

  it('에러 메시지를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <Input label="이메일" error="올바른 이메일을 입력해주세요" />
    );

    expect(getByText('올바른 이메일을 입력해주세요')).toBeTruthy();
  });

  it('에러 없으면 에러 메시지가 없어야 한다', () => {
    const { queryByText } = renderWithTheme(
      <Input label="이메일" placeholder="test@test.com" />
    );

    expect(queryByText('올바른 이메일을 입력해주세요')).toBeNull();
  });

  it('testID가 전달되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <Input testID="email-input" placeholder="test" />
    );

    expect(getByTestId('email-input')).toBeTruthy();
  });

  it('텍스트 입력이 동작해야 한다', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = renderWithTheme(
      <Input testID="text-input" onChangeText={onChangeText} />
    );

    fireEvent.changeText(getByTestId('text-input'), '홍길동');
    expect(onChangeText).toHaveBeenCalledWith('홍길동');
  });

  it('다크 모드에서도 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <Input label="다크 입력" placeholder="입력" />,
      true
    );

    expect(getByText('다크 입력')).toBeTruthy();
  });
});
