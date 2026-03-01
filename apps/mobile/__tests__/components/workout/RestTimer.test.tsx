/**
 * RestTimer 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { RestTimer } from '../../../components/workout/RestTimer';

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

describe('RestTimer', () => {
  const onComplete = jest.fn();

  beforeEach(() => {
    onComplete.mockClear();
  });

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RestTimer initialSeconds={60} onComplete={onComplete} />,
    );
    expect(getByTestId('rest-timer')).toBeTruthy();
  });

  it('초기 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RestTimer initialSeconds={90} onComplete={onComplete} />,
    );
    expect(getByText('01:30')).toBeTruthy();
  });

  it('휴식 시간 레이블을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RestTimer initialSeconds={60} onComplete={onComplete} />,
    );
    expect(getByText('휴식 시간')).toBeTruthy();
  });

  it('시간 조절 버튼을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RestTimer initialSeconds={60} onComplete={onComplete} />,
    );
    expect(getByText('-10s')).toBeTruthy();
    expect(getByText('+10s')).toBeTruthy();
    expect(getByText('리셋')).toBeTruthy();
  });

  it('커스텀 조절 단위를 사용한다', () => {
    const { getByText } = renderWithTheme(
      <RestTimer initialSeconds={60} onComplete={onComplete} adjustStep={15} />,
    );
    expect(getByText('-15s')).toBeTruthy();
    expect(getByText('+15s')).toBeTruthy();
  });

  it('건너뛰기 버튼을 표시한다', () => {
    const onSkip = jest.fn();
    const { getByText } = renderWithTheme(
      <RestTimer initialSeconds={60} onComplete={onComplete} onSkip={onSkip} />,
    );
    expect(getByText('건너뛰기')).toBeTruthy();
  });

  it('건너뛰기 콜백이 호출된다', () => {
    const onSkip = jest.fn();
    const { getByText } = renderWithTheme(
      <RestTimer initialSeconds={60} onComplete={onComplete} onSkip={onSkip} />,
    );
    fireEvent.press(getByText('건너뛰기'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('타이머가 감소한다', () => {
    const { getByText } = renderWithTheme(
      <RestTimer initialSeconds={60} onComplete={onComplete} />,
    );
    act(() => { jest.advanceTimersByTime(1000); });
    expect(getByText('00:59')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <RestTimer initialSeconds={90} onComplete={onComplete} />,
    );
    expect(getByLabelText('휴식 타이머 1분 30초 남음')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RestTimer initialSeconds={60} onComplete={onComplete} />, true,
    );
    expect(getByTestId('rest-timer')).toBeTruthy();
  });
});
