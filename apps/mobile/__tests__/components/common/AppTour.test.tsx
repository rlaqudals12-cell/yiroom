/**
 * AppTour 공통 컴포넌트 테스트
 *
 * 온보딩용 투어 오버레이: 반투명 배경 위에 단계별 툴팁 카드.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

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
import { AppTour, type TourStep } from '../../../components/common/AppTour';

// ============================================================
// 테마 헬퍼
// ============================================================

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

// ============================================================
// 테스트 데이터
// ============================================================

const mockSteps: TourStep[] = [
  { title: '홈 화면', description: '대시보드에서 전체 현황을 확인하세요.', position: 'top' },
  { title: '분석하기', description: 'AI가 당신의 피부를 분석해요.', position: 'center' },
  { title: '기록 확인', description: '분석 기록을 확인하고 비교해보세요.', position: 'bottom' },
];

// ============================================================
// 테스트
// ============================================================

describe('AppTour', () => {
  it('isVisible=true일 때 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AppTour
        steps={mockSteps}
        currentStep={0}
        onNext={jest.fn()}
        onSkip={jest.fn()}
        isVisible={true}
      />,
    );

    expect(getByTestId('app-tour')).toBeTruthy();
  });

  it('isVisible=false일 때 null을 반환한다', () => {
    const { queryByTestId } = renderWithTheme(
      <AppTour
        steps={mockSteps}
        currentStep={0}
        onNext={jest.fn()}
        onSkip={jest.fn()}
        isVisible={false}
      />,
    );

    expect(queryByTestId('app-tour')).toBeNull();
  });

  it('빈 steps 배열은 null을 반환한다', () => {
    const { queryByTestId } = renderWithTheme(
      <AppTour
        steps={[]}
        currentStep={0}
        onNext={jest.fn()}
        onSkip={jest.fn()}
        isVisible={true}
      />,
    );

    expect(queryByTestId('app-tour')).toBeNull();
  });

  it('스텝 제목과 설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AppTour
        steps={mockSteps}
        currentStep={0}
        onNext={jest.fn()}
        onSkip={jest.fn()}
        isVisible={true}
      />,
    );

    expect(getByText('홈 화면')).toBeTruthy();
    expect(getByText('대시보드에서 전체 현황을 확인하세요.')).toBeTruthy();
  });

  it('스텝 카운터를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AppTour
        steps={mockSteps}
        currentStep={0}
        onNext={jest.fn()}
        onSkip={jest.fn()}
        isVisible={true}
      />,
    );

    expect(getByText('1 / 3')).toBeTruthy();
  });

  it('다음 버튼 클릭시 onNext를 호출한다', () => {
    const onNext = jest.fn();
    const { getByText } = renderWithTheme(
      <AppTour
        steps={mockSteps}
        currentStep={0}
        onNext={onNext}
        onSkip={jest.fn()}
        isVisible={true}
      />,
    );

    fireEvent.press(getByText('다음'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('건너뛰기 클릭시 onSkip을 호출한다', () => {
    const onSkip = jest.fn();
    const { getByText } = renderWithTheme(
      <AppTour
        steps={mockSteps}
        currentStep={0}
        onNext={jest.fn()}
        onSkip={onSkip}
        isVisible={true}
      />,
    );

    fireEvent.press(getByText('건너뛰기'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('마지막 스텝에서 완료 텍스트를 표시한다', () => {
    const { getByText, queryByText } = renderWithTheme(
      <AppTour
        steps={mockSteps}
        currentStep={2}
        onNext={jest.fn()}
        onSkip={jest.fn()}
        isVisible={true}
      />,
    );

    expect(getByText('완료')).toBeTruthy();
    expect(queryByText('다음')).toBeNull();
    expect(getByText('3 / 3')).toBeTruthy();
  });
});
