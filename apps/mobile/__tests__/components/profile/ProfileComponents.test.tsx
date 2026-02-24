/**
 * 프로필 게이미피케이션 컴포넌트 테스트
 *
 * 대상: WellnessScoreRing, LevelBadge, AchievementGrid
 * 의존성: useTheme, ScoreGauge, Reanimated
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
import { WellnessScoreRing } from '../../../components/profile/WellnessScoreRing';
import { LevelBadge } from '../../../components/profile/LevelBadge';
import { AchievementGrid } from '../../../components/profile/AchievementGrid';
import type { WellnessBreakdown, WellnessLevel, Achievement } from '../../../hooks/useWellnessScore';

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

// --- WellnessScoreRing ---
describe('WellnessScoreRing', () => {
  const defaultBreakdown: WellnessBreakdown = {
    analysis: 70,
    workout: 50,
    nutrition: 40,
  };

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WellnessScoreRing
        score={55}
        breakdown={defaultBreakdown}
        testID="wellness"
      />
    );
    expect(getByTestId('wellness')).toBeTruthy();
  });

  it('ScoreGauge가 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WellnessScoreRing
        score={55}
        breakdown={defaultBreakdown}
        testID="wellness"
      />
    );
    expect(getByTestId('wellness-gauge')).toBeTruthy();
  });

  it('영역별 점수 텍스트가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <WellnessScoreRing
        score={55}
        breakdown={defaultBreakdown}
        testID="wellness"
      />
    );
    expect(getByText('분석')).toBeTruthy();
    expect(getByText('운동')).toBeTruthy();
    expect(getByText('영양')).toBeTruthy();
  });

  it('영역별 값이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <WellnessScoreRing
        score={55}
        breakdown={defaultBreakdown}
        testID="wellness"
      />
    );
    expect(getByText('70')).toBeTruthy();
    expect(getByText('50')).toBeTruthy();
    expect(getByText('40')).toBeTruthy();
  });

  it('접근성 라벨이 있어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <WellnessScoreRing
        score={55}
        breakdown={defaultBreakdown}
        testID="wellness"
      />
    );
    expect(getByLabelText('웰니스 점수 55점')).toBeTruthy();
  });

  it('score 0일 때 격려 메시지가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <WellnessScoreRing
        score={0}
        breakdown={{ analysis: 0, workout: 0, nutrition: 0 }}
        testID="wellness"
      />
    );
    expect(getByText('분석을 시작하면 점수가 올라가요')).toBeTruthy();
  });

  it('score > 0일 때 격려 메시지가 없어야 한다', () => {
    const { queryByText } = renderWithTheme(
      <WellnessScoreRing
        score={30}
        breakdown={{ analysis: 40, workout: 0, nutrition: 0 }}
        testID="wellness"
      />
    );
    expect(queryByText('분석을 시작하면 점수가 올라가요')).toBeNull();
  });

  it('다크 모드에서 에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WellnessScoreRing
        score={55}
        breakdown={defaultBreakdown}
        testID="wellness"
      />,
      true
    );
    expect(getByTestId('wellness')).toBeTruthy();
  });
});

// --- LevelBadge ---
describe('LevelBadge', () => {
  const defaultLevel: WellnessLevel = {
    level: 3,
    title: '성장하는 나',
    xp: 40,
    nextLevelXp: 60,
  };

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <LevelBadge level={defaultLevel} testID="level" />
    );
    expect(getByTestId('level')).toBeTruthy();
  });

  it('레벨 번호가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <LevelBadge level={defaultLevel} testID="level" />
    );
    expect(getByText('Lv.3')).toBeTruthy();
  });

  it('레벨 타이틀이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <LevelBadge level={defaultLevel} testID="level" />
    );
    expect(getByText('성장하는 나')).toBeTruthy();
  });

  it('XP 텍스트가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <LevelBadge level={defaultLevel} testID="level" />
    );
    expect(getByText('40/60')).toBeTruthy();
  });

  it('접근성 라벨이 있어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <LevelBadge level={defaultLevel} testID="level" />
    );
    expect(getByLabelText(/레벨 3.*성장하는 나.*40\/60/)).toBeTruthy();
  });

  it('레벨 1에서도 에러 없이 렌더링된다', () => {
    const { getByText } = renderWithTheme(
      <LevelBadge
        level={{ level: 1, title: '시작', xp: 0, nextLevelXp: 20 }}
        testID="level"
      />
    );
    expect(getByText('Lv.1')).toBeTruthy();
    expect(getByText('시작')).toBeTruthy();
  });

  it('다크 모드에서 에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <LevelBadge level={defaultLevel} testID="level" />,
      true
    );
    expect(getByTestId('level')).toBeTruthy();
  });
});

// --- AchievementGrid ---
describe('AchievementGrid', () => {
  const mockAchievements: Achievement[] = [
    {
      id: 'first-analysis',
      title: '첫 분석',
      description: '첫 번째 분석을 완료했어요',
      emoji: '🔬',
      unlocked: true,
      category: 'analysis',
    },
    {
      id: 'color-master',
      title: '컬러 마스터',
      description: '퍼스널 컬러 분석을 완료했어요',
      emoji: '🎨',
      unlocked: true,
      category: 'analysis',
    },
    {
      id: 'skin-expert',
      title: '피부 전문가',
      description: '피부 분석을 완료했어요',
      emoji: '✨',
      unlocked: false,
      category: 'analysis',
    },
    {
      id: 'body-aware',
      title: '체형 인식',
      description: '체형 분석을 완료했어요',
      emoji: '💪',
      unlocked: false,
      category: 'analysis',
    },
    {
      id: 'workout-start',
      title: '운동 시작',
      description: '첫 운동을 기록했어요',
      emoji: '🏃',
      unlocked: false,
      category: 'workout',
    },
    {
      id: 'nutrition-start',
      title: '식단 기록 시작',
      description: '첫 식단을 기록했어요',
      emoji: '🥗',
      unlocked: false,
      category: 'nutrition',
    },
  ];

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />
    );
    expect(getByTestId('achievements')).toBeTruthy();
  });

  it('헤더 "나의 업적"이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />
    );
    expect(getByText('나의 업적')).toBeTruthy();
  });

  it('달성 카운트가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />
    );
    expect(getByText('2/6')).toBeTruthy();
  });

  it('해제된 업적 제목이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />
    );
    expect(getByText('첫 분석')).toBeTruthy();
    expect(getByText('컬러 마스터')).toBeTruthy();
  });

  it('잠긴 업적 제목도 표시된다', () => {
    const { getByText } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />
    );
    expect(getByText('피부 전문가')).toBeTruthy();
  });

  it('접근성 라벨에 달성 수가 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />
    );
    expect(getByLabelText('업적 2/6개 달성')).toBeTruthy();
  });

  it('해제된 업적에 달성 완료 접근성 라벨이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />
    );
    expect(getByLabelText('첫 분석 달성 완료')).toBeTruthy();
  });

  it('잠긴 업적에 미달성 접근성 라벨이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />
    );
    expect(getByLabelText('피부 전문가 미달성')).toBeTruthy();
  });

  it('전부 잠금 시 격려 메시지가 표시된다', () => {
    const allLocked = mockAchievements.map((a) => ({ ...a, unlocked: false }));
    const { getByText } = renderWithTheme(
      <AchievementGrid achievements={allLocked} testID="achievements" />
    );
    expect(getByText('활동을 시작하면 뱃지를 획득할 수 있어요')).toBeTruthy();
  });

  it('일부 해제 시 격려 메시지가 없어야 한다', () => {
    const { queryByText } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />
    );
    expect(queryByText('활동을 시작하면 뱃지를 획득할 수 있어요')).toBeNull();
  });

  it('다크 모드에서 에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AchievementGrid achievements={mockAchievements} testID="achievements" />,
      true
    );
    expect(getByTestId('achievements')).toBeTruthy();
  });

  it('빈 배열도 에러 없이 렌더링된다', () => {
    const { getByText } = renderWithTheme(
      <AchievementGrid achievements={[]} testID="achievements" />
    );
    expect(getByText('0/0')).toBeTruthy();
  });
});
