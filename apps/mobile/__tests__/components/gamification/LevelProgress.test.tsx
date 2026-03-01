/**
 * LevelProgress 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { LevelProgress } from '../../../components/gamification/LevelProgress';

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

describe('LevelProgress', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <LevelProgress level={5} currentXP={150} requiredXP={300} />,
    );
    expect(getByTestId('level-progress')).toBeTruthy();
  });

  it('레벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LevelProgress level={5} currentXP={150} requiredXP={300} />,
    );
    expect(getByText('Lv.5')).toBeTruthy();
  });

  it('XP 정보를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LevelProgress level={5} currentXP={150} requiredXP={300} />,
    );
    expect(getByText('150/300 XP')).toBeTruthy();
  });

  it('남은 XP를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LevelProgress level={5} currentXP={150} requiredXP={300} />,
    );
    expect(getByText('다음 레벨까지 150 XP')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <LevelProgress level={5} currentXP={150} requiredXP={300} />,
    );
    expect(getByLabelText('레벨 5, 150/300 XP, 50%')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <LevelProgress level={5} currentXP={150} requiredXP={300} />,
      true,
    );
    expect(getByTestId('level-progress')).toBeTruthy();
  });
});
