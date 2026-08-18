import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const { View } = require('react-native');

  const Stack = ({ children }: { children: React.ReactNode }) => (
    <View testID="stack-root">{children}</View>
  );
  Stack.Screen = () => <View />;

  return {
    Stack,
    Redirect: ({ href }: { href: string }) => (
      <View testID="wellness-gate-redirect" accessibilityLabel={href} />
    ),
  };
});

jest.mock('@yiroom/shared', () => ({
  FEATURE_FLAGS: { WELLNESS_PHASE2: false },
}));

jest.mock('../../lib/theme', () => ({
  useTheme: () => ({
    colors: { card: '#fff', foreground: '#111' },
    typography: { weight: { semibold: '600' } },
  }),
}));

import MentalHealthLayout from '../../app/mental-health/_layout';
import YearlyReviewLayout from '../../app/yearly-review/_layout';
import NutritionLayout from '../../app/(nutrition)/_layout';
import WorkoutLayout from '../../app/(workout)/_layout';

describe('숨김 웰니스 라우트 그룹 게이트', () => {
  it.each([
    ['운동', WorkoutLayout],
    ['영양', NutritionLayout],
    ['연간 리뷰 Mock', YearlyReviewLayout],
    ['마음 건강 Mock', MentalHealthLayout],
  ] as const)('%s 직접 진입을 오늘 탭으로 돌린다', (_label, Layout) => {
    const { getByTestId, queryByTestId } = render(<Layout />);

    expect(getByTestId('wellness-gate-redirect').props.accessibilityLabel).toBe('/(tabs)');
    expect(queryByTestId('stack-root')).toBeNull();
  });
});
