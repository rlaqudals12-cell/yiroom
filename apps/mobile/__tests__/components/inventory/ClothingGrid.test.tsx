/**
 * ClothingGrid 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ClothingGrid } from '../../../components/inventory/ClothingGrid';

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

const mockItems = [
  { id: '1', name: '흰 셔츠', category: 'top' as const },
  { id: '2', name: '청바지', category: 'bottom' as const },
];

describe('ClothingGrid', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ClothingGrid items={mockItems} />);
    expect(getByTestId('clothing-grid')).toBeTruthy();
  });

  it('의류 카드를 표시한다', () => {
    const { getAllByTestId } = renderWithTheme(<ClothingGrid items={mockItems} />);
    expect(getAllByTestId('clothing-card')).toHaveLength(2);
  });

  it('빈 상태에서 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(<ClothingGrid items={[]} />);
    expect(getByText('👗')).toBeTruthy();
    expect(getByText('등록된 의류가 없습니다')).toBeTruthy();
  });

  it('커스텀 빈 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ClothingGrid items={[]} emptyMessage="의류를 추가해주세요" />,
    );
    expect(getByText('의류를 추가해주세요')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(<ClothingGrid items={mockItems} />);
    expect(getByLabelText('의류 2개')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ClothingGrid items={mockItems} />, true);
    expect(getByTestId('clothing-grid')).toBeTruthy();
  });
});
