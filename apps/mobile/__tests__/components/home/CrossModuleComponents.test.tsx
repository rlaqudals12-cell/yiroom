/**
 * 교차 모듈 인사이트 테스트
 *
 * CrossModuleInsight 컴포넌트, _testOnly_generateInsights
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
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { CrossModuleInsight } from '../../../components/home/CrossModuleInsight';
import {
  _testOnly_generateInsights,
  type CrossModuleInsight as InsightType,
} from '../../../hooks/useCrossModuleInsights';

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
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ========================================
// generateInsights (규칙 기반 인사이트 생성)
// ========================================

describe('generateInsights', () => {
  const baseParams = {
    skinScore: null,
    bodyType: null,
    hasPersonalColor: false,
    workoutStreak: 0,
    waterIntake: 0,
    waterGoal: 2000,
    calorieIntake: 0,
    calorieGoal: 2000,
    analysisCount: 0,
  };

  it('기본 환영 인사이트를 반환해야 한다', () => {
    const insights = _testOnly_generateInsights(baseParams);
    expect(insights.length).toBeGreaterThanOrEqual(1);
    // 분석 권유 (analysisCount < 3) + 환영이 아닌 경우도 있음
    const hasWelcomeOrEncourage = insights.some(
      (i) => i.id === 'welcome' || i.id === 'analysis-encourage'
    );
    expect(hasWelcomeOrEncourage).toBe(true);
  });

  it('피부 수분 낮고 수분 섭취 부족하면 skin-water 인사이트를 생성해야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      skinScore: 30,
      waterIntake: 500,
      waterGoal: 2000,
    });
    const skinWater = insights.find((i) => i.id === 'skin-water');
    expect(skinWater).toBeDefined();
    expect(skinWater?.modules).toContain('skin');
    expect(skinWater?.modules).toContain('nutrition');
  });

  it('피부 수분 높으면 skin-water 인사이트를 생성하지 않아야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      skinScore: 70,
      waterIntake: 500,
      waterGoal: 2000,
    });
    expect(insights.find((i) => i.id === 'skin-water')).toBeUndefined();
  });

  it('운동 7일 연속이면 streak-week 인사이트를 생성해야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      workoutStreak: 7,
    });
    const streak = insights.find((i) => i.id === 'workout-streak-week');
    expect(streak).toBeDefined();
    expect(streak?.title).toContain('7일');
  });

  it('운동 3일 연속이면 streak 인사이트를 생성해야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      workoutStreak: 3,
    });
    const streak = insights.find((i) => i.id === 'workout-streak');
    expect(streak).toBeDefined();
    expect(streak?.title).toContain('3일');
  });

  it('칼로리 목표 80% 이상 달성하면 calorie-on-track 인사이트를 생성해야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      calorieIntake: 1700,
      calorieGoal: 2000,
    });
    expect(insights.find((i) => i.id === 'calorie-on-track')).toBeDefined();
  });

  it('칼로리 목표 미달이면 calorie-on-track을 생성하지 않아야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      calorieIntake: 800,
      calorieGoal: 2000,
    });
    expect(insights.find((i) => i.id === 'calorie-on-track')).toBeUndefined();
  });

  it('분석 3개 미만이면 분석 권유를 생성해야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      analysisCount: 1,
    });
    const encourage = insights.find((i) => i.id === 'analysis-encourage');
    expect(encourage).toBeDefined();
    expect(encourage?.title).toContain('2개');
  });

  it('분석 3개 완료면 분석 권유를 생성하지 않아야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      analysisCount: 3,
    });
    expect(insights.find((i) => i.id === 'analysis-encourage')).toBeUndefined();
  });

  it('퍼스널컬러 + 체형 있으면 style-synergy를 생성해야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      hasPersonalColor: true,
      bodyType: 'hourglass',
      analysisCount: 3,
    });
    expect(insights.find((i) => i.id === 'style-synergy')).toBeDefined();
  });

  it('우선순위 내림차순으로 정렬해야 한다', () => {
    const insights = _testOnly_generateInsights({
      ...baseParams,
      skinScore: 30,
      waterIntake: 500,
      waterGoal: 2000,
      workoutStreak: 5,
      hasPersonalColor: true,
      bodyType: 'hourglass',
      analysisCount: 3,
    });
    for (let i = 1; i < insights.length; i++) {
      expect(insights[i - 1].priority).toBeGreaterThanOrEqual(insights[i].priority);
    }
  });
});

// ========================================
// CrossModuleInsight 컴포넌트
// ========================================

describe('CrossModuleInsight', () => {
  const mockInsights: InsightType[] = [
    {
      id: 'skin-water',
      emoji: '💧',
      title: '피부 수분이 부족해요',
      description: '물을 더 마시면 피부 수분도가 올라갈 수 있어요',
      modules: ['skin', 'nutrition'],
      priority: 90,
    },
    {
      id: 'workout-streak',
      emoji: '💪',
      title: '운동 5일 연속 달성',
      description: '좋은 습관이 만들어지고 있어요!',
      modules: ['workout'],
      priority: 70,
    },
    {
      id: 'calorie-on-track',
      emoji: '🥗',
      title: '식단 관리 잘 하고 있어요',
      description: '균형 잡힌 식단이 긍정적인 영향을 줘요',
      modules: ['nutrition', 'skin', 'body'],
      priority: 65,
    },
    {
      id: 'extra',
      emoji: '✨',
      title: '추가 인사이트',
      description: '이건 maxItems 초과',
      modules: [],
      priority: 10,
    },
  ];

  it('맞춤 인사이트 타이틀을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    expect(getByText('맞춤 인사이트')).toBeTruthy();
  });

  it('인사이트 제목을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    expect(getByText('피부 수분이 부족해요')).toBeTruthy();
    expect(getByText('운동 5일 연속 달성')).toBeTruthy();
    expect(getByText('식단 관리 잘 하고 있어요')).toBeTruthy();
  });

  it('인사이트 설명을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    expect(getByText('물을 더 마시면 피부 수분도가 올라갈 수 있어요')).toBeTruthy();
  });

  it('maxItems만큼만 표시해야 한다', () => {
    const { queryByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} maxItems={3} />
    );
    // 4번째 인사이트는 숨김
    expect(queryByText('추가 인사이트')).toBeNull();
  });

  it('maxItems 기본값 3으로 제한해야 한다', () => {
    const { queryByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    expect(queryByText('추가 인사이트')).toBeNull();
  });

  it('빈 배열일 때 null을 반환해야 한다', () => {
    const { toJSON } = renderWithTheme(
      <CrossModuleInsight insights={[]} />
    );
    expect(toJSON()).toBeNull();
  });

  it('testID를 설정해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} testID="insight" />
    );
    expect(getByTestId('insight')).toBeTruthy();
  });

  it('다크모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />,
      true,
    );
    expect(getByText('맞춤 인사이트')).toBeTruthy();
    expect(getByText('피부 수분이 부족해요')).toBeTruthy();
  });

  it('이모지를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    expect(getByText('💧')).toBeTruthy();
    expect(getByText('💪')).toBeTruthy();
  });
});
