/**
 * ScientificTermTooltip 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ScientificTermTooltip } from '../../../components/analysis/ScientificTermTooltip';

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

describe('ScientificTermTooltip', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ScientificTermTooltip term="TEWL" definition="경표피 수분 손실량" />,
    );
    expect(getByTestId('scientific-term-tooltip')).toBeTruthy();
  });

  it('용어를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ScientificTermTooltip term="pH" definition="수소 이온 농도" />,
    );
    expect(getByText('pH')).toBeTruthy();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <ScientificTermTooltip term="TEWL" definition="경표피 수분 손실량" />,
    );
    expect(getByLabelText(/TEWL.*경표피 수분 손실량/)).toBeTruthy();
  });

  it('터치 시 모달이 표시된다', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <ScientificTermTooltip term="TEWL" definition="경표피 수분 손실량" />,
    );
    fireEvent.press(getByLabelText(/TEWL/));
    expect(getByText('경표피 수분 손실량')).toBeTruthy();
    expect(getByText('탭하여 닫기')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ScientificTermTooltip term="TEWL" definition="경표피 수분 손실량" />,
      true,
    );
    expect(getByTestId('scientific-term-tooltip')).toBeTruthy();
  });
});
