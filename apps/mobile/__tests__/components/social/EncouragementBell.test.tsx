/**
 * EncouragementBell 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { EncouragementBell } from '../../../components/social/EncouragementBell';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}
function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(<ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>);
}

describe('EncouragementBell', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<EncouragementBell count={5} />);
    expect(getByTestId('encouragement-bell')).toBeTruthy();
  });

  it('카운트를 표시한다', () => {
    const { getByText } = renderWithTheme(<EncouragementBell count={12} />);
    expect(getByText('12')).toBeTruthy();
  });

  it('응원 전 음소거 벨 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(<EncouragementBell count={3} isRung={false} />);
    expect(getByText('🔕')).toBeTruthy();
  });

  it('응원 후 벨 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(<EncouragementBell count={3} isRung />);
    expect(getByText('🔔')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(<EncouragementBell count={5} onPress={onPress} />);
    fireEvent.press(getByTestId('encouragement-bell'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<EncouragementBell count={5} />);
    expect(getByLabelText('응원하기, 5명 응원')).toBeTruthy();
  });

  it('응원 상태 접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<EncouragementBell count={5} isRung />);
    expect(getByLabelText('응원하기, 응원함, 5명 응원')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<EncouragementBell count={5} />, true);
    expect(getByTestId('encouragement-bell')).toBeTruthy();
  });
});
