/**
 * ClothingCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ClothingCard } from '../../../components/inventory/ClothingCard';

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

describe('ClothingCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ClothingCard id="1" name="흰 셔츠" category="top" />,
    );
    expect(getByTestId('clothing-card')).toBeTruthy();
  });

  it('이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ClothingCard id="1" name="흰 셔츠" category="top" />,
    );
    expect(getByText('흰 셔츠')).toBeTruthy();
  });

  it('카테고리 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ClothingCard id="1" name="흰 셔츠" category="top" />,
    );
    expect(getByText('👕')).toBeTruthy();
  });

  it('카테고리 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ClothingCard id="1" name="흰 셔츠" category="top" />,
    );
    expect(getByText('상의')).toBeTruthy();
  });

  it('색상 정보를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ClothingCard id="1" name="흰 셔츠" category="top" color="화이트" />,
    );
    expect(getByText('상의 · 화이트')).toBeTruthy();
  });

  it('계절 정보를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ClothingCard id="1" name="패딩" category="outer" season="겨울" />,
    );
    expect(getByText('아우터 · 겨울')).toBeTruthy();
  });

  it('즐겨찾기 하트를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ClothingCard id="1" name="흰 셔츠" category="top" isFavorite />,
    );
    expect(getByText('❤️')).toBeTruthy();
  });

  it('onPress 호출 시 id를 전달한다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ClothingCard id="abc" name="흰 셔츠" category="top" onPress={onPress} />,
    );
    fireEvent.press(getByTestId('clothing-card'));
    expect(onPress).toHaveBeenCalledWith('abc');
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <ClothingCard id="1" name="흰 셔츠" category="top" />,
    );
    expect(getByLabelText('흰 셔츠, 상의')).toBeTruthy();
  });

  it('즐겨찾기 접근성 레이블을 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ClothingCard id="1" name="흰 셔츠" category="top" isFavorite />,
    );
    expect(getByLabelText('흰 셔츠, 상의, 즐겨찾기')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ClothingCard id="1" name="흰 셔츠" category="top" />,
      true,
    );
    expect(getByTestId('clothing-card')).toBeTruthy();
  });
});
