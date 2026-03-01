/**
 * BadgeGrid 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { BadgeGrid } from '../../../components/gamification/BadgeGrid';

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

const mockBadges = [
  { id: '1', name: '첫 분석', emoji: '📸', description: '첫 AI 분석 완료', isUnlocked: true },
  { id: '2', name: '7일 연속', emoji: '🔥', description: '7일 연속 기록', isUnlocked: true },
  { id: '3', name: '마스터', emoji: '👑', description: '모든 분석 완료', isUnlocked: false },
];

describe('BadgeGrid', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<BadgeGrid badges={mockBadges} />);
    expect(getByTestId('badge-grid')).toBeTruthy();
  });

  it('타이틀을 표시한다', () => {
    const { getByText } = renderWithTheme(<BadgeGrid badges={mockBadges} />);
    expect(getByText('뱃지')).toBeTruthy();
  });

  it('해금 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<BadgeGrid badges={mockBadges} />);
    expect(getByText('2/3')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<BadgeGrid badges={mockBadges} />);
    expect(getByLabelText('뱃지 3개 중 2개 해금')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<BadgeGrid badges={mockBadges} />, true);
    expect(getByTestId('badge-grid')).toBeTruthy();
  });
});
