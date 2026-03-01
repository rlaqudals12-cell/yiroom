/**
 * MyRankCard 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { MyRankCard } from '../../../components/gamification/MyRankCard';

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

describe('MyRankCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MyRankCard rank={5} totalUsers={100} score={750} />,
    );
    expect(getByTestId('my-rank-card')).toBeTruthy();
  });

  it('순위를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MyRankCard rank={5} totalUsers={100} score={750} />,
    );
    expect(getByText('5위')).toBeTruthy();
  });

  it('총 사용자 수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MyRankCard rank={5} totalUsers={100} score={750} />,
    );
    expect(getByText('/ 100명')).toBeTruthy();
  });

  it('점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MyRankCard rank={5} totalUsers={100} score={750} />,
    );
    expect(getByText('750점')).toBeTruthy();
  });

  it('백분위를 계산하여 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MyRankCard rank={5} totalUsers={100} score={750} />,
    );
    expect(getByText('상위 5%')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <MyRankCard rank={5} totalUsers={100} score={750} />,
    );
    expect(getByLabelText('내 순위 5위, 상위 5%')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MyRankCard rank={5} totalUsers={100} score={750} />,
      true,
    );
    expect(getByTestId('my-rank-card')).toBeTruthy();
  });
});
