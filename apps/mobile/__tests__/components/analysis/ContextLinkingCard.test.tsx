/**
 * ContextLinkingCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ContextLinkingCard } from '../../../components/analysis/ContextLinkingCard';
import type { ContextLink } from '../../../components/analysis/ContextLinkingCard';

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

const mockLinks: ContextLink[] = [
  { id: '1', icon: '🧴', title: '스킨케어 루틴', description: '분석 결과에 맞는 루틴 확인', route: '/skincare' },
  { id: '2', icon: '🛒', title: '제품 추천', description: '맞춤 제품 둘러보기', route: '/products' },
];

describe('ContextLinkingCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ContextLinkingCard links={mockLinks} />,
    );
    expect(getByTestId('context-linking-card')).toBeTruthy();
  });

  it('기본 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ContextLinkingCard links={mockLinks} />,
    );
    expect(getByText('다음 단계')).toBeTruthy();
  });

  it('커스텀 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ContextLinkingCard title="추천 활동" links={mockLinks} />,
    );
    expect(getByText('추천 활동')).toBeTruthy();
  });

  it('링크 항목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ContextLinkingCard links={mockLinks} />,
    );
    expect(getByText('스킨케어 루틴')).toBeTruthy();
    expect(getByText('제품 추천')).toBeTruthy();
  });

  it('링크 설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ContextLinkingCard links={mockLinks} />,
    );
    expect(getByText('분석 결과에 맞는 루틴 확인')).toBeTruthy();
  });

  it('링크 터치 시 콜백이 호출된다', () => {
    const onLinkPress = jest.fn();
    const { getByText } = renderWithTheme(
      <ContextLinkingCard links={mockLinks} onLinkPress={onLinkPress} />,
    );
    fireEvent.press(getByText('스킨케어 루틴'));
    expect(onLinkPress).toHaveBeenCalledWith(mockLinks[0]);
  });

  it('빈 links 시 빈 컨테이너를 렌더링한다', () => {
    const { getByTestId } = renderWithTheme(
      <ContextLinkingCard links={[]} />,
    );
    expect(getByTestId('context-linking-card')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ContextLinkingCard links={mockLinks} />,
      true,
    );
    expect(getByTestId('context-linking-card')).toBeTruthy();
  });
});
