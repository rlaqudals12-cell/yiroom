/**
 * BarcodeInput 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { BarcodeInput } from '../../../components/inventory/BarcodeInput';

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

describe('BarcodeInput', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <BarcodeInput value="" onChangeText={jest.fn()} />,
    );
    expect(getByTestId('barcode-input')).toBeTruthy();
  });

  it('텍스트 입력 필드를 표시한다', () => {
    const { getByTestId } = renderWithTheme(
      <BarcodeInput value="12345" onChangeText={jest.fn()} />,
    );
    expect(getByTestId('barcode-text-input')).toBeTruthy();
  });

  it('값을 표시한다', () => {
    const { getByDisplayValue } = renderWithTheme(
      <BarcodeInput value="8801234567890" onChangeText={jest.fn()} />,
    );
    expect(getByDisplayValue('8801234567890')).toBeTruthy();
  });

  it('텍스트 변경 시 onChangeText가 호출된다', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = renderWithTheme(
      <BarcodeInput value="" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByTestId('barcode-text-input'), '12345');
    expect(onChangeText).toHaveBeenCalledWith('12345');
  });

  it('검색 버튼을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <BarcodeInput value="" onChangeText={jest.fn()} onSearch={jest.fn()} />,
    );
    expect(getByText('검색')).toBeTruthy();
  });

  it('검색 버튼을 누르면 onSearch가 호출된다', () => {
    const onSearch = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <BarcodeInput value="12345" onChangeText={jest.fn()} onSearch={onSearch} />,
    );
    fireEvent.press(getByLabelText('바코드 검색'));
    expect(onSearch).toHaveBeenCalled();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <BarcodeInput value="" onChangeText={jest.fn()} />,
    );
    expect(getByLabelText('바코드 번호')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <BarcodeInput value="" onChangeText={jest.fn()} />,
      true,
    );
    expect(getByTestId('barcode-input')).toBeTruthy();
  });
});
