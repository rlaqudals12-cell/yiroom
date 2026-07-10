/**
 * OnboardingHero 컴포넌트 테스트
 *
 * OnboardingHero는 emoji가 아닌 Lucide 아이콘(icon prop)을 사용한다.
 * (모바일 규칙: 이모지 지양, 웹과 통일)
 */
import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

// Lucide 아이콘 대역 — icon prop으로 전달되어 렌더링 여부를 검증한다.
function MockIcon(props: Record<string, unknown>) {
  return <View testID="hero-icon" {...props} />;
}

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
import { OnboardingHero } from '../../../components/onboarding/OnboardingHero';

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

describe('OnboardingHero', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <OnboardingHero title="목표 선택" subtitle="맞춤 추천을 위해 선택해주세요" />
    );
    expect(getByTestId('onboarding-hero')).toBeTruthy();
  });

  it('아이콘(icon prop)을 렌더링한다', () => {
    const { getByTestId } = renderWithTheme(
      <OnboardingHero icon={MockIcon} title="기본 정보" subtitle="설명" />
    );
    expect(getByTestId('hero-icon')).toBeTruthy();
  });

  it('icon을 전달하지 않으면 아이콘이 렌더링되지 않는다', () => {
    const { queryByTestId } = renderWithTheme(<OnboardingHero title="기본 정보" subtitle="설명" />);
    expect(queryByTestId('hero-icon')).toBeNull();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <OnboardingHero icon={MockIcon} title="목표를 선택해주세요" subtitle="설명" />
    );
    expect(getByText('목표를 선택해주세요')).toBeTruthy();
  });

  it('부제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <OnboardingHero icon={MockIcon} title="제목" subtitle="맞춤 추천을 제공해드릴게요" />
    );
    expect(getByText('맞춤 추천을 제공해드릴게요')).toBeTruthy();
  });

  it('커스텀 testID를 지원한다', () => {
    const { getByTestId } = renderWithTheme(
      <OnboardingHero
        icon={MockIcon}
        title="거의 다 왔어요!"
        subtitle="설명"
        testID="custom-hero"
      />
    );
    expect(getByTestId('custom-hero')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <OnboardingHero icon={MockIcon} title="제목" subtitle="설명" />,
      true
    );
    expect(getByTestId('onboarding-hero')).toBeTruthy();
  });

  it('glowColor를 전달해도 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <OnboardingHero icon={MockIcon} title="제목" subtitle="설명" glowColor="#EC4899" />
    );
    expect(getByTestId('onboarding-hero')).toBeTruthy();
  });
});
