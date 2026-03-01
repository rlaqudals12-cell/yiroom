/**
 * WorkoutStyleCard 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WorkoutStyleCard } from '../../../components/workout/WorkoutStyleCard';

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
  styleName: '파워 빌더',
  description: '근력 중심의 고강도 운동을 선호합니다.',
  matchRate: 85,
  characteristics: ['고강도', '근비대', '점진적 과부하', '복합 운동'],
  recommendedExercises: ['데드리프트', '벤치프레스', '스쿼트'],
};

describe('WorkoutStyleCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WorkoutStyleCard {...defaultProps} />);
    expect(getByTestId('workout-style-card')).toBeTruthy();
  });

  it('스타일 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutStyleCard {...defaultProps} />);
    expect(getByText('파워 빌더')).toBeTruthy();
  });

  it('적합도를 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutStyleCard {...defaultProps} />);
    expect(getByText('85%')).toBeTruthy();
  });

  it('설명을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutStyleCard {...defaultProps} />);
    expect(getByText('근력 중심의 고강도 운동을 선호합니다.')).toBeTruthy();
  });

  it('특성을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutStyleCard {...defaultProps} />);
    expect(getByText('고강도')).toBeTruthy();
    expect(getByText('근비대')).toBeTruthy();
  });

  it('추천 운동을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutStyleCard {...defaultProps} />);
    expect(getByText('• 데드리프트')).toBeTruthy();
    expect(getByText('• 벤치프레스')).toBeTruthy();
  });

  it('추천 운동 없이 렌더링된다', () => {
    const { getByTestId, queryByText } = renderWithTheme(
      <WorkoutStyleCard {...defaultProps} recommendedExercises={[]} />,
    );
    expect(getByTestId('workout-style-card')).toBeTruthy();
    expect(queryByText('추천 운동')).toBeNull();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<WorkoutStyleCard {...defaultProps} />);
    expect(getByLabelText('운동 스타일: 파워 빌더, 적합도 85%')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WorkoutStyleCard {...defaultProps} />, true);
    expect(getByTestId('workout-style-card')).toBeTruthy();
  });
});
