/**
 * IngredientConflictAlert 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { IngredientConflictAlert } from '../../../components/inventory/IngredientConflictAlert';

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

const mockConflicts = [
  { ingredient: '레티놀', reason: 'AHA/BHA와 병용 시 자극 가능', severity: 'high' as const },
  { ingredient: '비타민C', reason: '나이아신아마이드와 효과 감소', severity: 'medium' as const },
  { ingredient: '티트리', reason: '민감 피부 주의', severity: 'low' as const },
];

describe('IngredientConflictAlert', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />,
    );
    expect(getByTestId('ingredient-conflict-alert')).toBeTruthy();
  });

  it('성분 주의 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />,
    );
    expect(getByText('⚠️')).toBeTruthy();
    expect(getByText('성분 주의')).toBeTruthy();
  });

  it('충돌 성분을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />,
    );
    expect(getByText('레티놀')).toBeTruthy();
    expect(getByText('비타민C')).toBeTruthy();
    expect(getByText('티트리')).toBeTruthy();
  });

  it('충돌 사유를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />,
    );
    expect(getByText('AHA/BHA와 병용 시 자극 가능')).toBeTruthy();
    expect(getByText('나이아신아마이드와 효과 감소')).toBeTruthy();
  });

  it('접근성 레이블에 충돌 건수를 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />,
    );
    expect(getByLabelText('성분 충돌 3건, 위험 1건')).toBeTruthy();
  });

  it('testID를 갖는다', () => {
    const { getByTestId } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />,
    );
    expect(getByTestId('ingredient-conflict-alert')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <IngredientConflictAlert conflicts={mockConflicts} />,
      true,
    );
    expect(getByTestId('ingredient-conflict-alert')).toBeTruthy();
  });
});
