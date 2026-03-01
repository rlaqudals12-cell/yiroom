/**
 * SkinVitalityScore 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { SkinVitalityScore } from '../../../components/analysis/SkinVitalityScore';

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
  score: 72,
  factors: {
    positive: ['탄력 우수', '수분 적정'],
    negative: ['유분 과다'],
  },
};

describe('SkinVitalityScore', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<SkinVitalityScore {...defaultProps} />);
    expect(getByTestId('skin-vitality-score')).toBeTruthy();
  });

  it('피부 활력도 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(<SkinVitalityScore {...defaultProps} />);
    expect(getByText('피부 활력도')).toBeTruthy();
  });

  it('점수를 표시한다', () => {
    const { getByText } = renderWithTheme(<SkinVitalityScore {...defaultProps} />);
    expect(getByText('72')).toBeTruthy();
  });

  it('매우 활력 있음 레벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SkinVitalityScore {...defaultProps} score={85} />,
    );
    expect(getByText('매우 활력 있음')).toBeTruthy();
  });

  it('양호함 레벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SkinVitalityScore {...defaultProps} score={65} />,
    );
    expect(getByText('양호함')).toBeTruthy();
  });

  it('관리 필요 레벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SkinVitalityScore {...defaultProps} score={45} />,
    );
    expect(getByText('관리 필요')).toBeTruthy();
  });

  it('집중 케어 권장 레벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SkinVitalityScore {...defaultProps} score={30} />,
    );
    expect(getByText('집중 케어 권장')).toBeTruthy();
  });

  it('강점 요인을 표시한다', () => {
    const { getByText } = renderWithTheme(<SkinVitalityScore {...defaultProps} />);
    expect(getByText('탄력 우수')).toBeTruthy();
    expect(getByText('수분 적정')).toBeTruthy();
  });

  it('개선 요인을 표시한다', () => {
    const { getByText } = renderWithTheme(<SkinVitalityScore {...defaultProps} />);
    expect(getByText('유분 과다')).toBeTruthy();
  });

  it('showDetails=false 시 요인을 숨긴다', () => {
    const { queryByText } = renderWithTheme(
      <SkinVitalityScore {...defaultProps} showDetails={false} />,
    );
    expect(queryByText('탄력 우수')).toBeNull();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<SkinVitalityScore {...defaultProps} />, true);
    expect(getByTestId('skin-vitality-score')).toBeTruthy();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(<SkinVitalityScore {...defaultProps} />);
    expect(getByLabelText(/피부 활력도 72점/)).toBeTruthy();
  });
});
