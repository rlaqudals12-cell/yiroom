/**
 * FastingTimer 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FastingTimer } from '../../../components/nutrition/FastingTimer';

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

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('FastingTimer', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FastingTimer />);
    expect(getByTestId('fasting-timer')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<FastingTimer />);
    expect(getByText('⏱️ 단식 타이머')).toBeTruthy();
  });

  it('목표 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(<FastingTimer targetHours={16} />);
    expect(getByText('목표 16시간')).toBeTruthy();
  });

  it('비활성 상태에서 초기 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(<FastingTimer />);
    expect(getByText('00:00:00')).toBeTruthy();
  });

  it('시작 전 안내를 표시한다', () => {
    const { getByText } = renderWithTheme(<FastingTimer />);
    expect(getByText('시작 버튼을 눌러주세요')).toBeTruthy();
  });

  it('시작 버튼을 표시한다', () => {
    const onToggle = jest.fn();
    const { getByText } = renderWithTheme(
      <FastingTimer onToggle={onToggle} />,
    );
    expect(getByText('시작')).toBeTruthy();
  });

  it('활성 상태에서 종료 버튼을 표시한다', () => {
    const onToggle = jest.fn();
    const { getByText } = renderWithTheme(
      <FastingTimer startTime={new Date().toISOString()} onToggle={onToggle} />,
    );
    expect(getByText('종료')).toBeTruthy();
  });

  it('onToggle 콜백이 호출된다', () => {
    const onToggle = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <FastingTimer onToggle={onToggle} />,
    );
    fireEvent.press(getByLabelText('단식 시작'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<FastingTimer />);
    expect(getByLabelText('단식 타이머, 시작 전')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FastingTimer />, true);
    expect(getByTestId('fasting-timer')).toBeTruthy();
  });
});
