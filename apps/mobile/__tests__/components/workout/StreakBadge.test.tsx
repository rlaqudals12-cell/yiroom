/**
 * StreakBadge 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { StreakBadge } from '../../../components/workout/StreakBadge';

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

describe('StreakBadge', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<StreakBadge streak={5} />);
    expect(getByTestId('streak-badge')).toBeTruthy();
  });

  it('새싹 레벨을 표시한다 (0-6일)', () => {
    const { getByText } = renderWithTheme(<StreakBadge streak={3} />);
    expect(getByText('3일')).toBeTruthy();
    expect(getByText('새싹')).toBeTruthy();
  });

  it('러너 레벨을 표시한다 (7-29일)', () => {
    const { getByText } = renderWithTheme(<StreakBadge streak={15} />);
    expect(getByText('15일')).toBeTruthy();
    expect(getByText('러너')).toBeTruthy();
  });

  it('챌린저 레벨을 표시한다 (30-59일)', () => {
    const { getByText } = renderWithTheme(<StreakBadge streak={45} />);
    expect(getByText('45일')).toBeTruthy();
    expect(getByText('챌린저')).toBeTruthy();
  });

  it('마스터 레벨을 표시한다 (60-99일)', () => {
    const { getByText } = renderWithTheme(<StreakBadge streak={75} />);
    expect(getByText('75일')).toBeTruthy();
    expect(getByText('마스터')).toBeTruthy();
  });

  it('레전드 레벨을 표시한다 (100+일)', () => {
    const { getByText } = renderWithTheme(<StreakBadge streak={150} />);
    expect(getByText('150일')).toBeTruthy();
    expect(getByText('레전드')).toBeTruthy();
  });

  it('compact 모드로 렌더링된다', () => {
    const { getByTestId, getByText } = renderWithTheme(<StreakBadge streak={10} compact />);
    expect(getByTestId('streak-badge')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<StreakBadge streak={15} />);
    expect(getByLabelText('15일 연속 운동, 러너 레벨')).toBeTruthy();
  });

  it('compact 접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<StreakBadge streak={15} compact />);
    expect(getByLabelText('15일 연속, 러너')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<StreakBadge streak={5} />, true);
    expect(getByTestId('streak-badge')).toBeTruthy();
  });
});
