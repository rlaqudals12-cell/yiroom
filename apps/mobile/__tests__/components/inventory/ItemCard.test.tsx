/**
 * ItemCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ItemCard } from '../../../components/inventory/ItemCard';

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

describe('ItemCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ItemCard id="1" name="토너" brand="이니스프리" category="스킨케어" />,
    );
    expect(getByTestId('item-card')).toBeTruthy();
  });

  it('이름과 브랜드를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemCard id="1" name="토너" brand="이니스프리" category="스킨케어" />,
    );
    expect(getByText('토너')).toBeTruthy();
    expect(getByText('이니스프리 · 스킨케어')).toBeTruthy();
  });

  it('기본 이모지 🧴를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemCard id="1" name="토너" brand="이니스프리" category="스킨케어" />,
    );
    expect(getByText('🧴')).toBeTruthy();
  });

  it('커스텀 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemCard id="1" name="선크림" brand="비오레" category="자외선차단" emoji="☀️" />,
    );
    expect(getByText('☀️')).toBeTruthy();
  });

  it('유통기한을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemCard id="1" name="토너" brand="이니스프리" category="스킨케어" expiryDate="2026-12-01" />,
    );
    expect(getByText('유통기한: 2026-12-01')).toBeTruthy();
  });

  it('만료된 경우 경고를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemCard id="1" name="토너" brand="이니스프리" category="스킨케어" expiryDate="2025-01-01" isExpired />,
    );
    expect(getByText('⚠️ 기한 만료')).toBeTruthy();
  });

  it('onPress 호출 시 id를 전달한다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ItemCard id="abc" name="토너" brand="이니스프리" category="스킨케어" onPress={onPress} />,
    );
    fireEvent.press(getByTestId('item-card'));
    expect(onPress).toHaveBeenCalledWith('abc');
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <ItemCard id="1" name="토너" brand="이니스프리" category="스킨케어" />,
    );
    expect(getByLabelText('이니스프리 토너')).toBeTruthy();
  });

  it('만료 시 접근성 레이블에 만료 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ItemCard id="1" name="토너" brand="이니스프리" category="스킨케어" isExpired />,
    );
    expect(getByLabelText('이니스프리 토너, 기한 만료')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ItemCard id="1" name="토너" brand="이니스프리" category="스킨케어" />,
      true,
    );
    expect(getByTestId('item-card')).toBeTruthy();
  });
});
