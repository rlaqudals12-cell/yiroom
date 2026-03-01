/**
 * NamedSkeleton 컴포넌트 테스트
 *
 * 도메인별 스켈레톤 변형
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
import { NamedSkeleton } from '../../../components/common/NamedSkeleton';
import type { SkeletonVariant } from '../../../components/common/NamedSkeleton';

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
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>,
  );
}

const allVariants: SkeletonVariant[] = [
  'analysis-result',
  'product-card',
  'profile',
  'workout-card',
  'nutrition-summary',
  'ranking',
  'timeline',
];

describe('NamedSkeleton', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NamedSkeleton variant="analysis-result" />,
    );
    expect(getByTestId('named-skeleton')).toBeTruthy();
  });

  it('접근성 라벨이 올바르다', () => {
    const { getByLabelText } = renderWithTheme(
      <NamedSkeleton variant="product-card" />,
    );
    expect(getByLabelText('로딩 중')).toBeTruthy();
  });

  it.each(allVariants)('variant "%s"가 렌더링된다', (variant) => {
    const { getByTestId } = renderWithTheme(
      <NamedSkeleton variant={variant} />,
    );
    expect(getByTestId('named-skeleton')).toBeTruthy();
  });

  it('count=3이면 3개가 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NamedSkeleton variant="product-card" count={3} />,
    );
    const container = getByTestId('named-skeleton');
    // count=3이면 자식이 3개
    expect(container.children.length).toBe(3);
  });

  it('count 기본값은 1이다', () => {
    const { getByTestId } = renderWithTheme(
      <NamedSkeleton variant="profile" />,
    );
    const container = getByTestId('named-skeleton');
    expect(container.children.length).toBe(1);
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NamedSkeleton variant="analysis-result" />,
      true,
    );
    expect(getByTestId('named-skeleton')).toBeTruthy();
  });

  it('다크모드에서 모든 variant가 렌더링된다', () => {
    for (const variant of allVariants) {
      const { getByTestId, unmount } = renderWithTheme(
        <NamedSkeleton variant={variant} />,
        true,
      );
      expect(getByTestId('named-skeleton')).toBeTruthy();
      unmount();
    }
  });
});
