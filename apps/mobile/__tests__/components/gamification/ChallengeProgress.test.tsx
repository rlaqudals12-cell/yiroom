/**
 * ChallengeProgress 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ChallengeProgress } from '../../../components/gamification/ChallengeProgress';

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

const mockDays = [
  { day: 1, completed: true },
  { day: 2, completed: true },
  { day: 3, completed: true },
  { day: 4, completed: false },
  { day: 5, completed: false },
];

describe('ChallengeProgress', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ChallengeProgress title="7일 챌린지" days={mockDays} streak={3} />,
    );
    expect(getByTestId('challenge-progress')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ChallengeProgress title="7일 챌린지" days={mockDays} streak={3} />,
    );
    expect(getByText('7일 챌린지')).toBeTruthy();
  });

  it('완료 일수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ChallengeProgress title="7일 챌린지" days={mockDays} streak={3} />,
    );
    expect(getByText('3/5일 완료')).toBeTruthy();
  });

  it('연속 일수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ChallengeProgress title="7일 챌린지" days={mockDays} streak={3} />,
    );
    expect(getByText('🔥 3일 연속')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <ChallengeProgress title="7일 챌린지" days={mockDays} streak={3} />,
    );
    expect(getByLabelText('7일 챌린지, 3/5일 완료, 3일 연속')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ChallengeProgress title="7일 챌린지" days={mockDays} streak={3} />,
      true,
    );
    expect(getByTestId('challenge-progress')).toBeTruthy();
  });
});
