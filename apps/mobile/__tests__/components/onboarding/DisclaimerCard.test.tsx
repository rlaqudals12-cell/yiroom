/**
 * DisclaimerCard 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { DisclaimerCard } from '../../../components/onboarding/DisclaimerCard';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system',
    setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

describe('DisclaimerCard', () => {
  const defaultMessage = '본 서비스는 전문 의료 조언을 대체하지 않아요.';

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DisclaimerCard message={defaultMessage} />
    );
    expect(getByTestId('disclaimer-card')).toBeTruthy();
  });

  it('메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DisclaimerCard message={defaultMessage} />
    );
    expect(getByText(defaultMessage)).toBeTruthy();
  });

  it('기본 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DisclaimerCard message={defaultMessage} />
    );
    expect(getByText('서비스 이용 안내')).toBeTruthy();
  });

  it('커스텀 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DisclaimerCard message={defaultMessage} title="주의사항" />
    );
    expect(getByText('주의사항')).toBeTruthy();
  });

  it('커스텀 testID를 지원한다', () => {
    const { getByTestId } = renderWithTheme(
      <DisclaimerCard message={defaultMessage} testID="custom-disclaimer" />
    );
    expect(getByTestId('custom-disclaimer')).toBeTruthy();
  });

  it('접근성 role이 alert이다', () => {
    const { getByTestId } = renderWithTheme(
      <DisclaimerCard message={defaultMessage} />
    );
    // accessibilityRole="alert" 설정 확인
    expect(getByTestId('disclaimer-card').props.accessibilityRole).toBe('alert');
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DisclaimerCard message={defaultMessage} />,
      true
    );
    expect(getByTestId('disclaimer-card')).toBeTruthy();
  });
});
