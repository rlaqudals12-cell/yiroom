import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { AnalysisSaveFailureNotice } from '../../../components/analysis/AnalysisSaveFailureNotice';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

const themeValue: ThemeContextValue = {
  colors: lightColors,
  brand,
  module: moduleColors,
  status: statusColors,
  spacing,
  radii,
  shadows,
  typography,
  isDark: false,
  colorScheme: 'light',
  themeMode: 'system',
  setThemeMode: jest.fn(),
  grade: gradeColors,
  nutrient: nutrientColors,
  score: scoreColors,
  trust: trustColors,
};

describe('AnalysisSaveFailureNotice', () => {
  it('결과가 기록에 저장되지 않았음을 숨기지 않고 알린다', () => {
    const { getByTestId, getByText } = render(
      <ThemeContext.Provider value={themeValue}>
        <AnalysisSaveFailureNotice onRetry={jest.fn()} />
      </ThemeContext.Provider>
    );

    expect(getByTestId('analysis-save-failure-notice').props.accessibilityRole).toBe('alert');
    expect(getByText('분석 결과를 기록에 저장하지 못했어요')).toBeTruthy();
    expect(getByText(/다시 방문하면 이 결과를 불러오지 못할 수 있어요/)).toBeTruthy();
  });

  it('재분석 버튼으로 복구 동작을 호출한다', () => {
    const onRetry = jest.fn();
    const { getByTestId } = render(
      <ThemeContext.Provider value={themeValue}>
        <AnalysisSaveFailureNotice onRetry={onRetry} />
      </ThemeContext.Provider>
    );

    fireEvent.press(getByTestId('analysis-save-failure-notice-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
