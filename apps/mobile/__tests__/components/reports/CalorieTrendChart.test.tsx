/**
 * CalorieTrendChart 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { CalorieTrendChart } from '../../../components/reports/CalorieTrendChart';

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

const mockData = [
  { label: '월', value: 1800 },
  { label: '화', value: 2100 },
  { label: '수', value: 1900 },
  { label: '목', value: 2200 },
  { label: '금', value: 2000 },
];

describe('CalorieTrendChart', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<CalorieTrendChart data={mockData} />);
    expect(getByTestId('calorie-trend-chart')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<CalorieTrendChart data={mockData} />);
    expect(getByText('칼로리 추이')).toBeTruthy();
  });

  it('라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(<CalorieTrendChart data={mockData} />);
    expect(getByText('월')).toBeTruthy();
    expect(getByText('금')).toBeTruthy();
  });

  it('목표 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <CalorieTrendChart data={mockData} targetCalories={2000} />,
    );
    expect(getByText('목표: 2000kcal')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(<CalorieTrendChart data={mockData} />);
    expect(getByLabelText('칼로리 트렌드, 5일')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<CalorieTrendChart data={mockData} />, true);
    expect(getByTestId('calorie-trend-chart')).toBeTruthy();
  });
});
