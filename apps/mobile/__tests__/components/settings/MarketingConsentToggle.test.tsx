/**
 * MarketingConsentToggle 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { MarketingConsentToggle } from '../../../components/settings/MarketingConsentToggle';

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

describe('MarketingConsentToggle', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MarketingConsentToggle isEnabled={false} onToggle={jest.fn()} />,
    );
    expect(getByTestId('marketing-consent-toggle')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MarketingConsentToggle isEnabled={false} onToggle={jest.fn()} />,
    );
    expect(getByText('마케팅 수신 동의')).toBeTruthy();
  });

  it('설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MarketingConsentToggle isEnabled={false} onToggle={jest.fn()} />,
    );
    expect(getByText(/뷰티 팁을 받아보세요/)).toBeTruthy();
  });

  it('스위치를 표시한다', () => {
    const { getByTestId } = renderWithTheme(
      <MarketingConsentToggle isEnabled={true} onToggle={jest.fn()} />,
    );
    expect(getByTestId('marketing-switch')).toBeTruthy();
  });

  it('스위치 토글 시 onToggle이 호출된다', () => {
    const onToggle = jest.fn();
    const { getByTestId } = renderWithTheme(
      <MarketingConsentToggle isEnabled={false} onToggle={onToggle} />,
    );
    fireEvent(getByTestId('marketing-switch'), 'valueChange', true);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('마지막 변경 날짜를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MarketingConsentToggle isEnabled={true} onToggle={jest.fn()} lastUpdated="2026-02-28" />,
    );
    expect(getByText('마지막 변경: 2026-02-28')).toBeTruthy();
  });

  it('활성화 시 접근성 레이블에 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <MarketingConsentToggle isEnabled={true} onToggle={jest.fn()} />,
    );
    expect(getByLabelText('마케팅 수신 동의, 활성화됨')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MarketingConsentToggle isEnabled={false} onToggle={jest.fn()} />,
      true,
    );
    expect(getByTestId('marketing-consent-toggle')).toBeTruthy();
  });
});
