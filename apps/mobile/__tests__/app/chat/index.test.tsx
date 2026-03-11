/**
 * AI 채팅 메인 화면 렌더링 테스트
 *
 * 대상: app/(chat)/index.tsx (ChatScreen)
 * 의존성: ScreenContainer, ChatInterface
 */
import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

// --- 공통 mock ---

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: Record<string, unknown>) => <View {...props} /> });
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown => new Proxy({}, { get: () => createChainable });
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    FadeInUp: createChainable(), FadeIn: createChainable(), FadeInDown: createChainable(),
    ZoomIn: createChainable(), SlideInRight: createChainable(), SlideInLeft: createChainable(),
    Easing: { out: () => ({}), exp: {}, bezier: () => ({}), linear: {}, ease: {}, in: () => ({}), inOut: () => ({}) },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v, withSpring: (v: unknown) => v, withDelay: (_d: unknown, v: unknown) => v,
  };
});

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// --- 컴포넌트 mock ---

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string; [key: string]: unknown }) => <View testID={testID}>{children}</View>,
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
  };
});

jest.mock('../../../components/chat/ChatInterface', () => {
  const { View, Text } = require('react-native');
  return {
    ChatInterface: () => (
      <View testID="chat-interface">
        <Text>ChatInterface Mock</Text>
      </View>
    ),
  };
});

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

// --- 테스트 ---

import ChatScreen from '../../../app/(chat)/index';

describe('ChatScreen', () => {
  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ChatScreen />);
    expect(getByTestId('chat-screen')).toBeTruthy();
  });

  it('ChatInterface 컴포넌트가 포함된다', () => {
    const { getByTestId } = renderWithTheme(<ChatScreen />);
    expect(getByTestId('chat-interface')).toBeTruthy();
  });

  it('다크 모드에서도 에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ChatScreen />, true);
    expect(getByTestId('chat-screen')).toBeTruthy();
  });
});
