/**
 * OnboardingCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { OnboardingCard } from '../../../components/onboarding/OnboardingCard';

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

describe('OnboardingCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <OnboardingCard step={1} totalSteps={3} title="환영합니다" description="이룸에 오신 것을 환영합니다" />,
    );
    expect(getByTestId('onboarding-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <OnboardingCard step={1} totalSteps={3} title="환영합니다" description="설명" />,
    );
    expect(getByText('환영합니다')).toBeTruthy();
  });

  it('설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <OnboardingCard step={1} totalSteps={3} title="제목" description="이룸에 오신 것을 환영합니다" />,
    );
    expect(getByText('이룸에 오신 것을 환영합니다')).toBeTruthy();
  });

  it('이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <OnboardingCard step={1} totalSteps={3} title="제목" description="설명" emoji="✨" />,
    );
    expect(getByText('✨')).toBeTruthy();
  });

  it('다음 버튼을 누르면 onNext가 호출된다', () => {
    const onNext = jest.fn();
    const { getByTestId } = renderWithTheme(
      <OnboardingCard step={1} totalSteps={3} title="제목" description="설명" onNext={onNext} />,
    );
    fireEvent.press(getByTestId('onboarding-next-button'));
    expect(onNext).toHaveBeenCalled();
  });

  it('건너뛰기 버튼을 누르면 onSkip이 호출된다', () => {
    const onSkip = jest.fn();
    const { getByTestId } = renderWithTheme(
      <OnboardingCard step={1} totalSteps={3} title="제목" description="설명" onSkip={onSkip} />,
    );
    fireEvent.press(getByTestId('onboarding-skip-button'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('마지막 단계에서 시작하기를 표시한다', () => {
    const { getByText, queryByTestId } = renderWithTheme(
      <OnboardingCard step={3} totalSteps={3} title="제목" description="설명" isLast />,
    );
    expect(getByText('시작하기')).toBeTruthy();
    expect(queryByTestId('onboarding-skip-button')).toBeNull();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <OnboardingCard step={2} totalSteps={3} title="피부 분석" description="설명" />,
    );
    expect(getByLabelText('온보딩 2/3단계, 피부 분석')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <OnboardingCard step={1} totalSteps={3} title="제목" description="설명" />,
      true,
    );
    expect(getByTestId('onboarding-card')).toBeTruthy();
  });
});
