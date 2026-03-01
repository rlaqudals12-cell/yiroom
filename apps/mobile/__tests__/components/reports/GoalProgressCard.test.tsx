/**
 * GoalProgressCard 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { GoalProgressCard } from '../../../components/reports/GoalProgressCard';

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

describe('GoalProgressCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <GoalProgressCard title="주간 운동" current={3} target={5} unit="회" />,
    );
    expect(getByTestId('goal-progress-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <GoalProgressCard title="주간 운동" current={3} target={5} unit="회" />,
    );
    expect(getByText('주간 운동')).toBeTruthy();
  });

  it('퍼센트를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <GoalProgressCard title="주간 운동" current={3} target={5} unit="회" />,
    );
    expect(getByText('60%')).toBeTruthy();
  });

  it('현재/목표를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <GoalProgressCard title="주간 운동" current={3} target={5} unit="회" />,
    );
    expect(getByText('3회 / 5회')).toBeTruthy();
  });

  it('100% 달성 시 퍼센트를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <GoalProgressCard title="물 섭취" current={8} target={8} unit="잔" />,
    );
    expect(getByText('100%')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <GoalProgressCard title="주간 운동" current={3} target={5} unit="회" />,
    );
    expect(getByLabelText('주간 운동 목표 60% 달성')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <GoalProgressCard title="주간 운동" current={3} target={5} unit="회" />,
      true,
    );
    expect(getByTestId('goal-progress-card')).toBeTruthy();
  });
});
