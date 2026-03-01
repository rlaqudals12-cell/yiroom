/**
 * WellnessScoreCard 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WellnessScoreCard } from '../../../components/wellness/WellnessScoreCard';

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

describe('WellnessScoreCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WellnessScoreCard score={75} />);
    expect(getByTestId('wellness-score-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<WellnessScoreCard score={75} />);
    expect(getByText('종합 웰니스 점수')).toBeTruthy();
  });

  it('점수를 표시한다', () => {
    const { getByText } = renderWithTheme(<WellnessScoreCard score={75} />);
    expect(getByText('75')).toBeTruthy();
    expect(getByText('/ 100')).toBeTruthy();
  });

  it('변화량을 표시한다 (양수)', () => {
    const { getByText } = renderWithTheme(<WellnessScoreCard score={75} change={5} />);
    expect(getByText('▲ 5점')).toBeTruthy();
    expect(getByText('지난주 대비')).toBeTruthy();
  });

  it('변화량을 표시한다 (음수)', () => {
    const { getByText } = renderWithTheme(<WellnessScoreCard score={70} change={-3} />);
    expect(getByText('▼ 3점')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(<WellnessScoreCard score={75} />);
    expect(getByLabelText('웰니스 점수 75점')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WellnessScoreCard score={75} />, true);
    expect(getByTestId('wellness-score-card')).toBeTruthy();
  });
});
