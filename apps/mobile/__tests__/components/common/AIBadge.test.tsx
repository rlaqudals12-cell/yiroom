/**
 * AIBadge 컴포넌트 테스트
 *
 * AI 기본법 제31조 준수 — AI 생성 결과 표시 배지
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
import { AIBadge } from '../../../components/common/AIBadge';

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
    </ThemeContext.Provider>
  );
}

describe('AIBadge', () => {
  it('기본 라벨을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(<AIBadge />);
    expect(getByText('AI 분석 결과')).toBeTruthy();
  });

  it('커스텀 라벨을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(<AIBadge label="AI 추천 결과" />);
    expect(getByText('AI 추천 결과')).toBeTruthy();
  });

  it('아이콘 + 라벨 2개 자식이 있어야 한다', () => {
    const { getByTestId } = renderWithTheme(<AIBadge />);
    const badge = getByTestId('ai-badge');
    // View (container) → Text (icon, hidden) + Text (label)
    expect(badge.children.length).toBe(2);
  });

  it('testID가 ai-badge여야 한다', () => {
    const { getByTestId } = renderWithTheme(<AIBadge />);
    expect(getByTestId('ai-badge')).toBeTruthy();
  });

  it('접근성 라벨이 설정되어야 한다', () => {
    const { getByTestId } = renderWithTheme(<AIBadge />);
    const badge = getByTestId('ai-badge');
    expect(badge.props.accessibilityLabel).toBe(
      '이 결과는 AI 기술을 사용하여 생성되었어요'
    );
  });

  it('커스텀 접근성 설명이 적용되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <AIBadge description="커스텀 설명" />
    );
    const badge = getByTestId('ai-badge');
    expect(badge.props.accessibilityLabel).toBe('커스텀 설명');
  });

  it('variant=small로 렌더링해야 한다', () => {
    const { getByTestId } = renderWithTheme(<AIBadge variant="small" />);
    expect(getByTestId('ai-badge')).toBeTruthy();
  });

  it('variant=inline으로 렌더링해야 한다', () => {
    const { getByTestId } = renderWithTheme(<AIBadge variant="inline" />);
    expect(getByTestId('ai-badge')).toBeTruthy();
  });

  it('variant=card로 렌더링해야 한다', () => {
    const { getByTestId } = renderWithTheme(<AIBadge variant="card" />);
    expect(getByTestId('ai-badge')).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByTestId } = renderWithTheme(<AIBadge />, true);
    expect(getByTestId('ai-badge')).toBeTruthy();
  });
});
