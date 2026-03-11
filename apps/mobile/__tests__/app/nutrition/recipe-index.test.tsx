/**
 * 레시피 목록 화면 렌더링 테스트
 *
 * 대상: app/(nutrition)/recipe/index.tsx
 * 의존성: useTheme, expo-router, ScreenContainer, GlassCard
 */
import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

// ============================================================
// Mocks
// ============================================================

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    { get: () => (props: Record<string, unknown>) => <View {...props} /> }
  );
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown =>
    new Proxy({}, { get: () => createChainable });
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    FadeInUp: createChainable(),
    FadeIn: createChainable(),
    FadeInDown: createChainable(),
    ZoomIn: createChainable(),
    SlideInRight: createChainable(),
    SlideInLeft: createChainable(),
    Easing: {
      out: () => ({}),
      exp: {},
      bezier: () => ({}),
      linear: {},
      ease: {},
      in: () => ({}),
      inOut: () => ({}),
    },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    withDelay: (_d: unknown, v: unknown) => v,
  };
});

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('../../../components/ui', () => {
  const { View, Text } = require('react-native');
  return {
    ScreenContainer: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
      [key: string]: unknown;
    }) => <View testID={testID}>{children}</View>,
    GlassCard: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    DataStateWrapper: ({
      children,
      isLoading,
      isEmpty,
    }: {
      children: React.ReactNode;
      isLoading: boolean;
      isEmpty: boolean;
      [key: string]: unknown;
    }) =>
      isLoading || isEmpty ? (
        <View testID="data-state-wrapper" />
      ) : (
        <View>{children}</View>
      ),
    SectionHeader: ({
      title,
    }: {
      title: string;
      [key: string]: unknown;
    }) => (
      <View>
        <Text>{title}</Text>
      </View>
    ),
    AnimatedCard: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    StatCard: ({
      label,
      value,
    }: {
      label: string;
      value: string;
      [key: string]: unknown;
    }) => (
      <View>
        <Text>{label}</Text>
        <Text>{value}</Text>
      </View>
    ),
  };
});

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({
    opacity: 1,
    transform: [{ scale: 1 }],
  })),
}));

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  router: mockRouter,
  useLocalSearchParams: () => ({}),
}));

import RecipeListScreen from '../../../app/(nutrition)/recipe/index';

// ============================================================
// 테스트
// ============================================================

describe('RecipeListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('testID "recipe-list-screen"이 존재한다', () => {
    const { getByTestId } = renderWithTheme(<RecipeListScreen />);
    expect(getByTestId('recipe-list-screen')).toBeTruthy();
  });

  it('맞춤 레시피 제목이 표시된다', () => {
    const { getByText } = renderWithTheme(<RecipeListScreen />);
    expect(getByText('맞춤 레시피')).toBeTruthy();
  });

  it('카테고리 탭 전체가 표시된다', () => {
    const { getByText, getAllByText } = renderWithTheme(<RecipeListScreen />);
    expect(getByText('전체')).toBeTruthy();
    expect(getByText('아침')).toBeTruthy();
    expect(getByText('점심')).toBeTruthy();
    expect(getByText('저녁')).toBeTruthy();
    // '간식'은 탭 + 레시피 태그에 중복 존재하므로 getAllByText 사용
    expect(getAllByText('간식').length).toBeGreaterThanOrEqual(1);
  });
});
