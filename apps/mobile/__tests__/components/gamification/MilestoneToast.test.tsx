/**
 * MilestoneToast 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { MilestoneToast } from '../../../components/gamification/MilestoneToast';

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

describe('MilestoneToast', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MilestoneToast title="30일 연속 기록!" />,
    );
    expect(getByTestId('milestone-toast')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MilestoneToast title="30일 연속 기록!" />,
    );
    expect(getByText('30일 연속 기록!')).toBeTruthy();
  });

  it('설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MilestoneToast title="30일 연속 기록!" description="대단한 성과예요!" />,
    );
    expect(getByText('대단한 성과예요!')).toBeTruthy();
  });

  it('커스텀 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MilestoneToast title="첫 친구" emoji="🤝" />,
    );
    expect(getByText('🤝')).toBeTruthy();
  });

  it('기본 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MilestoneToast title="달성!" />,
    );
    expect(getByText('🏆')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <MilestoneToast title="30일 연속 기록!" />,
    );
    expect(getByLabelText('마일스톤 달성: 30일 연속 기록!')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MilestoneToast title="30일 연속 기록!" />,
      true,
    );
    expect(getByTestId('milestone-toast')).toBeTruthy();
  });
});
