/**
 * ItemDetailSheet 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ItemDetailSheet } from '../../../components/inventory/ItemDetailSheet';

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

describe('ItemDetailSheet', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ItemDetailSheet name="토너" brand="이니스프리" category="스킨케어" />,
    );
    expect(getByTestId('item-detail-sheet')).toBeTruthy();
  });

  it('이름과 브랜드를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemDetailSheet name="토너" brand="이니스프리" category="스킨케어" />,
    );
    expect(getByText('토너')).toBeTruthy();
    expect(getByText('이니스프리 · 스킨케어')).toBeTruthy();
  });

  it('설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemDetailSheet name="토너" brand="이니스프리" category="스킨케어" description="수분 토너" />,
    );
    expect(getByText('수분 토너')).toBeTruthy();
  });

  it('구매일과 유통기한을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemDetailSheet
        name="토너" brand="이니스프리" category="스킨케어"
        purchaseDate="2026-01-01" expiryDate="2027-01-01"
      />,
    );
    expect(getByText('구매일')).toBeTruthy();
    expect(getByText('2026-01-01')).toBeTruthy();
    expect(getByText('유통기한')).toBeTruthy();
    expect(getByText('2027-01-01')).toBeTruthy();
  });

  it('성분을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemDetailSheet
        name="토너" brand="이니스프리" category="스킨케어"
        ingredients={['히알루론산', '나이아신아마이드']}
      />,
    );
    expect(getByText('주요 성분')).toBeTruthy();
    expect(getByText('히알루론산, 나이아신아마이드')).toBeTruthy();
  });

  it('수정 버튼을 누르면 onEdit이 호출된다', () => {
    const onEdit = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ItemDetailSheet name="토너" brand="이니스프리" category="스킨케어" onEdit={onEdit} />,
    );
    fireEvent.press(getByLabelText('수정'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('삭제 버튼을 누르면 onDelete가 호출된다', () => {
    const onDelete = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ItemDetailSheet name="토너" brand="이니스프리" category="스킨케어" onDelete={onDelete} />,
    );
    fireEvent.press(getByLabelText('삭제'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <ItemDetailSheet name="토너" brand="이니스프리" category="스킨케어" />,
    );
    expect(getByLabelText('이니스프리 토너 상세 정보')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ItemDetailSheet name="토너" brand="이니스프리" category="스킨케어" />,
      true,
    );
    expect(getByTestId('item-detail-sheet')).toBeTruthy();
  });
});
