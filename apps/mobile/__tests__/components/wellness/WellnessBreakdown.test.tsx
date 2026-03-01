/**
 * WellnessBreakdown 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WellnessBreakdown } from '../../../components/wellness/WellnessBreakdown';

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

const mockCategories = [
  { key: 'workout', label: '운동', emoji: '💪', score: 80, maxScore: 100 },
  { key: 'nutrition', label: '영양', emoji: '🍽️', score: 65, maxScore: 100 },
  { key: 'skin', label: '피부', emoji: '✨', score: 90, maxScore: 100 },
  { key: 'mental', label: '정신건강', emoji: '🧠', score: 55, maxScore: 100 },
];

describe('WellnessBreakdown', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WellnessBreakdown categories={mockCategories} />,
    );
    expect(getByTestId('wellness-breakdown')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WellnessBreakdown categories={mockCategories} />,
    );
    expect(getByText('항목별 분석')).toBeTruthy();
  });

  it('카테고리 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WellnessBreakdown categories={mockCategories} />,
    );
    expect(getByText('운동')).toBeTruthy();
    expect(getByText('영양')).toBeTruthy();
    expect(getByText('피부')).toBeTruthy();
    expect(getByText('정신건강')).toBeTruthy();
  });

  it('점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WellnessBreakdown categories={mockCategories} />,
    );
    expect(getByText('80/100')).toBeTruthy();
    expect(getByText('65/100')).toBeTruthy();
  });

  it('이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WellnessBreakdown categories={mockCategories} />,
    );
    expect(getByText('💪')).toBeTruthy();
    expect(getByText('🧠')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <WellnessBreakdown categories={mockCategories} />,
    );
    expect(getByLabelText('웰니스 상세, 4개 항목')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WellnessBreakdown categories={mockCategories} />,
      true,
    );
    expect(getByTestId('wellness-breakdown')).toBeTruthy();
  });
});
