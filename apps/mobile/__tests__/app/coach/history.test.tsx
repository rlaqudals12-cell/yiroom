/**
 * 코치 채팅 히스토리 화면 렌더링 테스트
 *
 * 대상: app/(coach)/history.tsx (CoachHistoryScreen)
 * 의존성: useUser, useClerkSupabaseClient, getCoachSessions, deleteCoachSession
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
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// --- 컴포넌트/라이브러리 mock ---

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string; [key: string]: unknown }) => <View testID={testID}>{children}</View>,
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
  };
});

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(() => ({
    user: { id: 'user_123' },
    isLoaded: true,
  })),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  },
}));

const mockGetCoachSessions = jest.fn().mockResolvedValue([]);
const mockDeleteCoachSession = jest.fn().mockResolvedValue(true);

jest.mock('../../../lib/coach', () => ({
  getCoachSessions: (...args: unknown[]) => mockGetCoachSessions(...args),
  deleteCoachSession: (...args: unknown[]) => mockDeleteCoachSession(...args),
}));

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: jest.fn(() => ({})),
}));

// --- 테스트 ---

import { waitFor } from '@testing-library/react-native';

import CoachHistoryScreen from '../../../app/(coach)/history';

describe('CoachHistoryScreen', () => {
  beforeEach(() => {
    mockGetCoachSessions.mockResolvedValue([]);
  });

  it('에러 없이 렌더링된다', async () => {
    const { getByTestId } = renderWithTheme(<CoachHistoryScreen />);
    await waitFor(() => {
      expect(getByTestId('coach-history-screen')).toBeTruthy();
    });
  });

  it('세션이 없을 때 빈 상태 메시지를 표시한다', async () => {
    const { getByText } = renderWithTheme(<CoachHistoryScreen />);
    await waitFor(() => {
      expect(getByText('아직 대화 기록이 없어요')).toBeTruthy();
    });
  });

  it('새 대화 시작 버튼이 표시된다', async () => {
    const { getByText } = renderWithTheme(<CoachHistoryScreen />);
    await waitFor(() => {
      expect(getByText('+ 새 대화 시작')).toBeTruthy();
    });
  });
});
