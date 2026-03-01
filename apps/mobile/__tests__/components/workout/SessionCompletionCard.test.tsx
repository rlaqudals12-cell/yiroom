/**
 * SessionCompletionCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { SessionCompletionCard } from '../../../components/workout/SessionCompletionCard';

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
  totalDuration: 45,
  totalCalories: 320,
  exercisesCompleted: 4,
  exercisesTotal: 5,
  setsCompleted: 16,
  setsTotal: 20,
};

describe('SessionCompletionCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<SessionCompletionCard {...defaultProps} />);
    expect(getByTestId('session-completion-card')).toBeTruthy();
  });

  it('운동 완료 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(<SessionCompletionCard {...defaultProps} />);
    expect(getByText('운동 완료!')).toBeTruthy();
    expect(getByText('수고하셨어요')).toBeTruthy();
  });

  it('운동 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(<SessionCompletionCard {...defaultProps} />);
    expect(getByText('45분')).toBeTruthy();
  });

  it('소모 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(<SessionCompletionCard {...defaultProps} />);
    expect(getByText('320kcal')).toBeTruthy();
  });

  it('운동 완료 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<SessionCompletionCard {...defaultProps} />);
    expect(getByText('4/5')).toBeTruthy();
  });

  it('세트 완료 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<SessionCompletionCard {...defaultProps} />);
    expect(getByText('16/20')).toBeTruthy();
  });

  it('완성도를 표시한다', () => {
    const { getByText } = renderWithTheme(<SessionCompletionCard {...defaultProps} />);
    expect(getByText('80%')).toBeTruthy();
  });

  it('공유하기 버튼을 표시한다', () => {
    const onShare = jest.fn();
    const { getByText } = renderWithTheme(
      <SessionCompletionCard {...defaultProps} onShare={onShare} />,
    );
    expect(getByText('공유하기')).toBeTruthy();
    fireEvent.press(getByText('공유하기'));
    expect(onShare).toHaveBeenCalled();
  });

  it('돌아가기 버튼을 표시한다', () => {
    const onGoBack = jest.fn();
    const { getByText } = renderWithTheme(
      <SessionCompletionCard {...defaultProps} onGoBack={onGoBack} />,
    );
    expect(getByText('돌아가기')).toBeTruthy();
    fireEvent.press(getByText('돌아가기'));
    expect(onGoBack).toHaveBeenCalled();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<SessionCompletionCard {...defaultProps} />);
    expect(getByLabelText('운동 완료! 45분, 320kcal')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<SessionCompletionCard {...defaultProps} />, true);
    expect(getByTestId('session-completion-card')).toBeTruthy();
  });
});
