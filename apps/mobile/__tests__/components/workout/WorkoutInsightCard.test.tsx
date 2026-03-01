/**
 * WorkoutInsightCard 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WorkoutInsightCard, type WorkoutInsight } from '../../../components/workout/WorkoutInsightCard';

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

const mockInsights: WorkoutInsight[] = [
  { id: '1', title: '하체 근력 부족', description: '하체 운동 비중을 늘려보세요.', category: 'strength', priority: 'high' },
  { id: '2', title: '유산소 균형', description: '심폐 지구력이 양호합니다.', category: 'cardio', priority: 'low' },
  { id: '3', title: '회복 필요', description: '오버트레이닝 징후가 보입니다.', category: 'recovery', priority: 'medium' },
];

describe('WorkoutInsightCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WorkoutInsightCard insights={mockInsights} />);
    expect(getByTestId('workout-insight-card')).toBeTruthy();
  });

  it('인사이트 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutInsightCard insights={mockInsights} />);
    expect(getByText('하체 근력 부족')).toBeTruthy();
    expect(getByText('유산소 균형')).toBeTruthy();
    expect(getByText('회복 필요')).toBeTruthy();
  });

  it('인사이트 설명을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutInsightCard insights={mockInsights} />);
    expect(getByText('하체 운동 비중을 늘려보세요.')).toBeTruthy();
  });

  it('섹션 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutInsightCard insights={mockInsights} />);
    expect(getByText('운동 인사이트')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<WorkoutInsightCard insights={mockInsights} />);
    expect(getByLabelText('운동 인사이트 3개')).toBeTruthy();
  });

  it('빈 배열에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WorkoutInsightCard insights={[]} />);
    expect(getByTestId('workout-insight-card')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WorkoutInsightCard insights={mockInsights} />, true);
    expect(getByTestId('workout-insight-card')).toBeTruthy();
  });
});
