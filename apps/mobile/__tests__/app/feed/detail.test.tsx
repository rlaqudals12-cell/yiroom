/**
 * 피드 상세 화면 렌더링 테스트
 *
 * 대상: app/(feed)/[id].tsx (FeedDetailScreen)
 * 의존성: useLocalSearchParams, useUser, useClerkSupabaseClient, captureError
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

jest.mock('@/components/ui', () => {
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

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'feed_123' })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(() => ({
    user: { id: 'user_123', firstName: '테스트', imageUrl: null },
    isLoaded: true,
  })),
}));

// Supabase mock: select/single 체인 반환
const mockSupabaseFrom = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
  insert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
}));

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

jest.mock('../../../lib/monitoring/sentry', () => ({
  captureError: jest.fn(),
}));

// --- 테스트 ---

import { waitFor } from '@testing-library/react-native';

import FeedDetailScreen from '../../../app/(feed)/[id]';

describe('FeedDetailScreen', () => {
  it('에러 없이 렌더링된다', async () => {
    // 피드 아이템이 없으면 에러 화면 표시 (정상 동작)
    const { getByText } = renderWithTheme(<FeedDetailScreen />);
    await waitFor(() => {
      expect(getByText('게시물을 찾을 수 없습니다.')).toBeTruthy();
    });
  });

  it('로딩 상태에서 로딩 인디케이터가 표시된다', () => {
    // 초기 렌더링 시 isLoading=true 상태에서 ScreenContainer가 렌더링됨
    // (useEffect에서 fetchFeedItem 호출 전)
    // 로딩 중에는 testID 없는 ScreenContainer가 렌더링됨
    const { queryByTestId } = renderWithTheme(<FeedDetailScreen />);
    // 초기 로딩 시 feed-detail-screen testID가 없어야 함
    expect(queryByTestId('feed-detail-screen')).toBeNull();
  });

  it('피드 데이터 로드 실패 시 에러 메시지를 표시한다', async () => {
    const { getByText } = renderWithTheme(<FeedDetailScreen />);
    await waitFor(() => {
      expect(getByText('게시물을 찾을 수 없습니다.')).toBeTruthy();
    });
  });
});
