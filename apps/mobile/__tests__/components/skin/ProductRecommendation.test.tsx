/**
 * ProductRecommendation 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ProductRecommendation } from '../../../components/skin/ProductRecommendation';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>,
  );
}

const defaultProps = {
  productName: '히알루론산 세럼',
  brand: '이니스프리',
  category: '세럼',
  reason: '건조한 피부에 수분 공급',
};

describe('ProductRecommendation', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ProductRecommendation {...defaultProps} />,
    );
    expect(getByTestId('product-recommendation')).toBeTruthy();
  });

  it('제품명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProductRecommendation {...defaultProps} />,
    );
    expect(getByText('히알루론산 세럼')).toBeTruthy();
  });

  it('브랜드를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProductRecommendation {...defaultProps} />,
    );
    expect(getByText('이니스프리')).toBeTruthy();
  });

  it('카테고리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProductRecommendation {...defaultProps} />,
    );
    expect(getByText('세럼')).toBeTruthy();
  });

  it('추천 이유를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProductRecommendation {...defaultProps} />,
    );
    expect(getByText('건조한 피부에 수분 공급')).toBeTruthy();
  });

  it('매칭률을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProductRecommendation {...defaultProps} matchRate={85} />,
    );
    expect(getByText('매칭 85%')).toBeTruthy();
  });

  it('가격을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProductRecommendation {...defaultProps} price="25,000원" />,
    );
    expect(getByText('25,000원')).toBeTruthy();
  });

  it('클릭이 동작한다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ProductRecommendation {...defaultProps} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('product-recommendation'));
    expect(onPress).toHaveBeenCalled();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <ProductRecommendation {...defaultProps} matchRate={85} />,
    );
    expect(getByLabelText('이니스프리 히알루론산 세럼 추천, 매칭률 85%')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ProductRecommendation {...defaultProps} />, true,
    );
    expect(getByTestId('product-recommendation')).toBeTruthy();
  });
});
