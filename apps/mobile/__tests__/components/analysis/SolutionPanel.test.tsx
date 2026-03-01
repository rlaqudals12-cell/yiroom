/**
 * SolutionPanel 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { SolutionPanel } from '../../../components/analysis/SolutionPanel';
import type { SolutionStep } from '../../../components/analysis/SolutionPanel';

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

const mockSteps: SolutionStep[] = [
  { id: '1', step: 1, title: '세안', description: '약산성 클렌저로 세안', priority: 'high' },
  { id: '2', step: 2, title: '토너', description: 'BHA 토너 적용', priority: 'medium' },
  { id: '3', step: 3, title: '보습', description: '세라마이드 크림 도포', priority: 'low' },
];

describe('SolutionPanel', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <SolutionPanel steps={mockSteps} />,
    );
    expect(getByTestId('solution-panel')).toBeTruthy();
  });

  it('기본 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SolutionPanel steps={mockSteps} />,
    );
    expect(getByText('맞춤 솔루션')).toBeTruthy();
  });

  it('커스텀 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SolutionPanel title="추천 루틴" steps={mockSteps} />,
    );
    expect(getByText('추천 루틴')).toBeTruthy();
  });

  it('단계를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SolutionPanel steps={mockSteps} />,
    );
    expect(getByText('세안')).toBeTruthy();
    expect(getByText('토너')).toBeTruthy();
    expect(getByText('보습')).toBeTruthy();
  });

  it('단계 설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SolutionPanel steps={mockSteps} />,
    );
    expect(getByText('약산성 클렌저로 세안')).toBeTruthy();
  });

  it('우선순위 배지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SolutionPanel steps={mockSteps} />,
    );
    expect(getByText('필수')).toBeTruthy();
    expect(getByText('권장')).toBeTruthy();
    expect(getByText('참고')).toBeTruthy();
  });

  it('단계 터치 시 콜백이 호출된다', () => {
    const onStepPress = jest.fn();
    const { getByText } = renderWithTheme(
      <SolutionPanel steps={mockSteps} onStepPress={onStepPress} />,
    );
    fireEvent.press(getByText('세안'));
    expect(onStepPress).toHaveBeenCalledWith(mockSteps[0]);
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <SolutionPanel steps={mockSteps} />,
    );
    expect(getByLabelText(/맞춤 솔루션.*3단계/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <SolutionPanel steps={mockSteps} />,
      true,
    );
    expect(getByTestId('solution-panel')).toBeTruthy();
  });
});
