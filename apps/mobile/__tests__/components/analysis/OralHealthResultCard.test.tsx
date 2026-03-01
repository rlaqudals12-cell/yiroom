/**
 * OralHealthResultCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { OralHealthResultCard } from '../../../components/analysis/OralHealthResultCard';

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

describe('OralHealthResultCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <OralHealthResultCard overallScore={75} />,
    );
    expect(getByTestId('oral-health-result-card')).toBeTruthy();
  });

  it('전체 점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <OralHealthResultCard overallScore={75} />,
    );
    expect(getByText('75')).toBeTruthy();
  });

  it('치아 색상 탭을 기본 표시한다', () => {
    const { getByText } = renderWithTheme(
      <OralHealthResultCard
        overallScore={75}
        toothColor={{ currentShade: 'A2', brightness: 70, yellowness: 30 }}
      />,
    );
    expect(getByText('A2')).toBeTruthy();
  });

  it('잇몸 건강 탭으로 전환한다', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <OralHealthResultCard
        overallScore={75}
        gumHealth={{ status: 'healthy', inflammationScore: 15 }}
      />,
    );
    fireEvent.press(getByText('잇몸 건강'));
    expect(getByTestId('gum-health-indicator')).toBeTruthy();
  });

  it('화이트닝 탭으로 전환한다', () => {
    const { getByText } = renderWithTheme(
      <OralHealthResultCard
        overallScore={75}
        whiteningGoal={{
          targetShade: 'B1',
          expectedDuration: '4-6주',
          methods: [{ name: '치과 화이트닝', effectiveness: 'high' }],
        }}
      />,
    );
    fireEvent.press(getByText('화이트닝'));
    expect(getByText('B1')).toBeTruthy();
    expect(getByText('4-6주')).toBeTruthy();
  });

  it('과도 화이트닝 경고를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <OralHealthResultCard
        overallScore={75}
        whiteningGoal={{
          targetShade: '0M1',
          expectedDuration: '12주',
          methods: [],
          overWhiteningWarning: true,
        }}
      />,
    );
    fireEvent.press(getByText('화이트닝'));
    expect(getByText(/과도한 화이트닝/)).toBeTruthy();
  });

  it('추천사항을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <OralHealthResultCard
        overallScore={75}
        recommendations={['정기 스케일링', '올바른 칫솔질']}
      />,
    );
    expect(getByText(/정기 스케일링/)).toBeTruthy();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <OralHealthResultCard overallScore={82} />,
    );
    expect(getByLabelText(/구강건강 분석 결과.*82점/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <OralHealthResultCard overallScore={75} />,
      true,
    );
    expect(getByTestId('oral-health-result-card')).toBeTruthy();
  });
});
