import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) => (
      <View testID="wellness-route-redirect" accessibilityLabel={href} />
    ),
    router: { push: jest.fn() },
  };
});

jest.mock('../../components/profile', () => ({
  WellnessScoreRing: () => null,
  AchievementGrid: () => null,
}));
jest.mock('../../components/ui', () => ({
  ScreenContainer: ({ children }: { children: React.ReactNode }) => children,
  GlassCard: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../../components/wellness', () => ({ StressVisualization: () => null }));
jest.mock('../../hooks', () => ({
  useUserAnalyses: jest.fn(),
  useWorkoutData: jest.fn(),
  useNutritionData: jest.fn(),
  useWellnessScore: jest.fn(),
}));
jest.mock('../../lib/wellness', () => ({ buildStressVisualization: jest.fn() }));

import WellnessScorePageGuard from '../../app/wellness';

describe('/wellness route gate', () => {
  it('WELLNESS_PHASE2=false이면 프로필로 리다이렉트한다', () => {
    const { getByTestId } = render(<WellnessScorePageGuard />);

    expect(getByTestId('wellness-route-redirect').props.accessibilityLabel).toBe('/(tabs)/profile');
  });
});
