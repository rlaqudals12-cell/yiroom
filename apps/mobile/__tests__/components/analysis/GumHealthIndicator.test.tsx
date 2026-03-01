/**
 * GumHealthIndicator 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { GumHealthIndicator } from '../../../components/analysis/GumHealthIndicator';
import type { GumHealthResult } from '../../../components/analysis/GumHealthIndicator';

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

const healthyResult: GumHealthResult = {
  status: 'healthy',
  inflammationScore: 15,
};

const mildResult: GumHealthResult = {
  status: 'mild_gingivitis',
  inflammationScore: 45,
  affectedAreas: [{ name: '앞니 잇몸', severity: 'mild' }],
  recommendations: ['부드러운 칫솔 사용', '잇몸 마사지'],
};

const severeResult: GumHealthResult = {
  status: 'severe_inflammation',
  inflammationScore: 85,
  needsDentalVisit: true,
  affectedAreas: [{ name: '어금니 잇몸', severity: 'severe' }],
};

describe('GumHealthIndicator', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <GumHealthIndicator result={healthyResult} />,
    );
    expect(getByTestId('gum-health-indicator')).toBeTruthy();
  });

  it('건강 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <GumHealthIndicator result={healthyResult} />,
    );
    expect(getByText('건강')).toBeTruthy();
  });

  it('경미한 치은염을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <GumHealthIndicator result={mildResult} />,
    );
    expect(getByText('경미한 치은염')).toBeTruthy();
  });

  it('영향 부위를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <GumHealthIndicator result={mildResult} />,
    );
    expect(getByText(/앞니 잇몸/)).toBeTruthy();
  });

  it('추천사항을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <GumHealthIndicator result={mildResult} />,
    );
    expect(getByText(/부드러운 칫솔 사용/)).toBeTruthy();
  });

  it('치과 방문 권장을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <GumHealthIndicator result={severeResult} />,
    );
    expect(getByText(/치과 방문 권장/)).toBeTruthy();
  });

  it('컴팩트 모드에서 렌더링된다', () => {
    const { getByTestId, queryByText } = renderWithTheme(
      <GumHealthIndicator result={mildResult} compact />,
    );
    expect(getByTestId('gum-health-indicator')).toBeTruthy();
    // 컴팩트 모드에서는 영향 부위가 숨겨짐
    expect(queryByText('영향 부위')).toBeNull();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <GumHealthIndicator result={healthyResult} />,
    );
    expect(getByLabelText(/잇몸 건강.*건강.*15/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <GumHealthIndicator result={healthyResult} />,
      true,
    );
    expect(getByTestId('gum-health-indicator')).toBeTruthy();
  });
});
