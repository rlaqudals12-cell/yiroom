/**
 * InventoryGrid 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { InventoryGrid } from '../../../components/inventory/InventoryGrid';

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
  { id: '1', name: '토너', brand: '이니스프리', category: '스킨케어' },
  { id: '2', name: '선크림', brand: '비오레', category: '자외선차단' },
];

describe('InventoryGrid', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<InventoryGrid items={mockItems} />);
    expect(getByTestId('inventory-grid')).toBeTruthy();
  });

  it('아이템 카드를 표시한다', () => {
    const { getAllByTestId } = renderWithTheme(<InventoryGrid items={mockItems} />);
    expect(getAllByTestId('item-card')).toHaveLength(2);
  });

  it('빈 상태에서 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(<InventoryGrid items={[]} />);
    expect(getByText('📦')).toBeTruthy();
    expect(getByText('등록된 제품이 없습니다')).toBeTruthy();
  });

  it('커스텀 빈 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <InventoryGrid items={[]} emptyMessage="제품을 추가해주세요" />,
    );
    expect(getByText('제품을 추가해주세요')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(<InventoryGrid items={mockItems} />);
    expect(getByLabelText('보유 제품 2개')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<InventoryGrid items={mockItems} />, true);
    expect(getByTestId('inventory-grid')).toBeTruthy();
  });
});
