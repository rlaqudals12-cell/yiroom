/**
 * StretchingRoutineCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { StretchingRoutineCard } from '../../../components/stretching/StretchingRoutineCard';

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

describe('StretchingRoutineCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <StretchingRoutineCard id="1" name="아침 루틴" exerciseCount={5} totalMinutes={10} difficulty="easy" />,
    );
    expect(getByTestId('stretching-routine-card')).toBeTruthy();
  });

  it('이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRoutineCard id="1" name="아침 루틴" exerciseCount={5} totalMinutes={10} difficulty="easy" />,
    );
    expect(getByText('아침 루틴')).toBeTruthy();
  });

  it('동작 수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRoutineCard id="1" name="아침 루틴" exerciseCount={5} totalMinutes={10} difficulty="easy" />,
    );
    expect(getByText('5개 동작')).toBeTruthy();
  });

  it('소요 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRoutineCard id="1" name="아침 루틴" exerciseCount={5} totalMinutes={10} difficulty="easy" />,
    );
    expect(getByText('10분')).toBeTruthy();
  });

  it('누르면 onPress가 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <StretchingRoutineCard id="1" name="아침 루틴" exerciseCount={5} totalMinutes={10} difficulty="easy" onPress={onPress} />,
    );
    fireEvent.press(getByTestId('stretching-routine-card'));
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRoutineCard id="1" name="아침 루틴" description="하루를 시작하는 루틴" exerciseCount={5} totalMinutes={10} difficulty="easy" />,
    );
    expect(getByText('하루를 시작하는 루틴')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <StretchingRoutineCard id="1" name="아침 루틴" exerciseCount={5} totalMinutes={10} difficulty="easy" />,
    );
    expect(getByLabelText('아침 루틴 루틴, 5개 동작, 10분')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <StretchingRoutineCard id="1" name="아침 루틴" exerciseCount={5} totalMinutes={10} difficulty="easy" />,
      true,
    );
    expect(getByTestId('stretching-routine-card')).toBeTruthy();
  });
});
