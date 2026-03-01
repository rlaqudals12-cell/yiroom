/**
 * ScanResult 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ScanResult } from '../../../components/inventory/ScanResult';

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

describe('ScanResult', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ScanResult productName="토너" brand="이니스프리" barcode="8801234567890" />,
    );
    expect(getByTestId('scan-result')).toBeTruthy();
  });

  it('제품명과 브랜드를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ScanResult productName="토너" brand="이니스프리" barcode="8801234567890" />,
    );
    expect(getByText('토너')).toBeTruthy();
    expect(getByText('이니스프리')).toBeTruthy();
  });

  it('바코드를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ScanResult productName="토너" brand="이니스프리" barcode="8801234567890" />,
    );
    expect(getByText('바코드: 8801234567890')).toBeTruthy();
  });

  it('매칭 신뢰도를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ScanResult productName="토너" brand="이니스프리" barcode="8801234567890" matchConfidence={95} />,
    );
    expect(getByText('매칭 95%')).toBeTruthy();
  });

  it('추가 버튼을 누르면 onAdd가 호출된다', () => {
    const onAdd = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ScanResult productName="토너" brand="이니스프리" barcode="8801234567890" onAdd={onAdd} />,
    );
    fireEvent.press(getByLabelText('인벤토리에 추가'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('닫기 버튼을 누르면 onDismiss가 호출된다', () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ScanResult productName="토너" brand="이니스프리" barcode="8801234567890" onDismiss={onDismiss} />,
    );
    fireEvent.press(getByLabelText('닫기'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <ScanResult productName="토너" brand="이니스프리" barcode="8801234567890" />,
    );
    expect(getByLabelText('스캔 결과: 이니스프리 토너')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ScanResult productName="토너" brand="이니스프리" barcode="8801234567890" />,
      true,
    );
    expect(getByTestId('scan-result')).toBeTruthy();
  });
});
