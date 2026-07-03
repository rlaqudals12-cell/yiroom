/**
 * ProfileCardGrid 컴포넌트 테스트 (ADR-109 — 모바일 프로필 중심)
 *
 * 5축 정체성 프로필 카드 그리드: 빈 칸 CTA / 완료 칸 / 추이 칩 /
 * 페르소나 한 줄 / 통합 분석 CTA 렌더링 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// lucide-react-native는 react-native-svg 의존성으로 Platform.OS 문제 발생 — barrel import 경유 시 필요
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: (_target, name) => (name === '__esModule' ? true : View) });
});

// useAdaptiveAnimation mock
jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 150, normal: 300, slow: 500, staggerInterval: 80 },
  useAdaptiveAnimation: () => ({ shouldAnimate: false, duration: 300 }),
}));

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
import { ProfileCardGrid } from '../../../components/home/ProfileCardGrid';
import type { AnalysisSummary } from '../../../hooks/useUserAnalyses';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

const ALL_AXES = ['personal-color', 'skin', 'body', 'hair', 'makeup'] as const;

function makeAnalysis(
  type: AnalysisSummary['type'],
  overrides: Partial<AnalysisSummary> = {}
): AnalysisSummary {
  return {
    id: `analysis_${type}`,
    type,
    createdAt: new Date(),
    summary: `${type} 요약`,
    ...overrides,
  };
}

describe('ProfileCardGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('빈 배열이면 5개 축 모두 빈 카드와 완성도 0% 문구를 렌더링해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(<ProfileCardGrid analyses={[]} />);

    ALL_AXES.forEach((type) => {
      expect(getByTestId(`profile-card-empty-${type}`)).toBeTruthy();
    });
    expect(getByText('나를 0% 알아냈어요')).toBeTruthy();
  });

  it('일부 분석이 있으면 해당 축은 완료 카드, 나머지는 빈 카드를 렌더링해야 한다', () => {
    const analyses = [
      makeAnalysis('personal-color', { summary: '봄 웜톤' }),
      makeAnalysis('skin', { summary: '피부 점수 82점', skinScore: 82 }),
    ];
    const { getByTestId, queryByTestId, getByText } = renderWithTheme(
      <ProfileCardGrid analyses={analyses} />
    );

    expect(getByTestId('profile-card-personal-color')).toBeTruthy();
    expect(getByTestId('profile-card-skin')).toBeTruthy();
    expect(queryByTestId('profile-card-empty-personal-color')).toBeNull();
    expect(queryByTestId('profile-card-empty-skin')).toBeNull();

    (['body', 'hair', 'makeup'] as const).forEach((type) => {
      expect(getByTestId(`profile-card-empty-${type}`)).toBeTruthy();
    });

    // 완성도 2/5 = 40%
    expect(getByText('나를 40% 알아냈어요')).toBeTruthy();
    expect(getByText('봄 웜톤')).toBeTruthy();
    expect(getByText('피부 점수 82점')).toBeTruthy();
  });

  it('skin 분석에 skinTrend/skinDelta가 있으면 추이 칩을 렌더링해야 한다', () => {
    const analyses = [
      makeAnalysis('skin', {
        summary: '피부 점수 82점',
        skinScore: 82,
        skinTrend: 'up',
        skinDelta: 3,
      }),
    ];
    const { getByTestId, getByText } = renderWithTheme(<ProfileCardGrid analyses={analyses} />);

    expect(getByTestId('skin-trend-chip')).toBeTruthy();
    expect(getByText('+3')).toBeTruthy();
  });

  it('skin 분석에 skinTrend가 없으면 추이 칩을 렌더링하지 않아야 한다', () => {
    const analyses = [makeAnalysis('skin', { summary: '피부 점수 82점', skinScore: 82 })];
    const { queryByTestId } = renderWithTheme(<ProfileCardGrid analyses={analyses} />);

    expect(queryByTestId('skin-trend-chip')).toBeNull();
  });

  it('personaOneLine이 있으면 페르소나 한 줄을 렌더링해야 한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <ProfileCardGrid analyses={[]} personaOneLine="당신은 화사한 사람" />
    );

    expect(getByTestId('profile-persona-line')).toBeTruthy();
    expect(getByText('당신은 화사한 사람')).toBeTruthy();
  });

  it('personaOneLine이 null이면 페르소나 한 줄을 렌더링하지 않아야 한다', () => {
    const { queryByTestId } = renderWithTheme(
      <ProfileCardGrid analyses={[]} personaOneLine={null} />
    );

    expect(queryByTestId('profile-persona-line')).toBeNull();
  });

  it('완료 축이 5개 미만이면 통합 분석 CTA를 렌더링해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ProfileCardGrid analyses={[makeAnalysis('personal-color')]} />
    );

    expect(getByTestId('profile-card-integrated-cta')).toBeTruthy();
  });

  it('5축 모두 완료되면 통합 분석 CTA를 렌더링하지 않아야 한다', () => {
    const analyses = ALL_AXES.map((type) => makeAnalysis(type));
    const { queryByTestId, getByText } = renderWithTheme(<ProfileCardGrid analyses={analyses} />);

    expect(queryByTestId('profile-card-integrated-cta')).toBeNull();
    expect(getByText('완성')).toBeTruthy();
  });

  it('최상위 컨테이너 testID="profile-card-grid"가 존재해야 한다', () => {
    const { getByTestId } = renderWithTheme(<ProfileCardGrid analyses={[]} />);

    expect(getByTestId('profile-card-grid')).toBeTruthy();
  });

  it('다크 모드에서도 정상 렌더링되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ProfileCardGrid analyses={[makeAnalysis('skin', { summary: '피부 점수 82점' })]} />,
      true
    );

    expect(getByTestId('profile-card-grid')).toBeTruthy();
    expect(getByTestId('profile-card-skin')).toBeTruthy();
  });
});
