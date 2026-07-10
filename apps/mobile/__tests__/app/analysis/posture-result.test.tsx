/**
 * 자세 분석 결과 화면 렌더링 테스트
 *
 * 대상: app/(analysis)/posture/result.tsx
 * testID: analysis-posture-result-screen
 */
import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

// --- Standard mocks ---

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => (props: Record<string, unknown>) => <View {...props} />,
    }
  );
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown => new Proxy({}, { get: () => createChainable });
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

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
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

// --- Screen-specific mocks ---

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  router: mockRouter,
  useLocalSearchParams: jest.fn(() => ({
    imageUri: 'file:///test-image.jpg',
    imageBase64: undefined,
  })),
}));

// Gemini / AI 분석 mock
const mockPostureResult = {
  postureType: 'forward_head' as const,
  overallScore: 72,
  scores: {
    headAlignment: 60,
    shoulderBalance: 75,
    spineAlignment: 70,
    hipAlignment: 82,
  },
  issues: ['거북목 경향이 있어요'],
  exercises: [{ name: '턱 당기기', description: '턱을 뒤로 당기세요', duration: '30초 x 3세트' }],
  dailyTips: ['모니터 높이를 눈높이로 맞추세요'],
};

jest.mock('../../../lib/gemini', () => ({
  analyzePosture: jest.fn(() =>
    Promise.resolve({ result: mockPostureResult, usedFallback: false })
  ),
  imageToBase64: jest.fn(() => Promise.resolve('base64data')),
}));

jest.mock('../../../lib/monitoring/sentry', () => ({
  captureError: jest.fn(),
}));

// 분석 공통 컴포넌트 mock
jest.mock('../../../components/analysis', () => {
  const { View, Text } = require('react-native');
  return {
    AnalysisLoadingState: ({ message, testID }: { message: string; testID?: string }) => (
      <View testID={testID}>
        <Text>{message}</Text>
      </View>
    ),
    AnalysisErrorState: ({ message, testID }: { message: string; testID?: string }) => (
      <View testID={testID}>
        <Text>{message}</Text>
      </View>
    ),
    AnalysisTrustBadge: ({ testID }: { testID?: string; [key: string]: unknown }) => (
      <View testID={testID} />
    ),
    AnalysisResultButtons: ({
      testID,
      primaryText,
    }: {
      testID?: string;
      primaryText?: string;
      [key: string]: unknown;
    }) => <View testID={testID}>{primaryText ? <Text>{primaryText}</Text> : null}</View>,
    MetricBar: ({ label, value }: { label: string; value: number }) => (
      <View>
        <Text>
          {label}: {value}
        </Text>
      </View>
    ),
    useAnalysisStyles: jest.fn(() => ({
      styles: {
        container: {},
        content: {},
        imageContainer: {},
        resultCard: {},
        label: {},
        subLabel: {},
        section: {},
        sectionTitle: {},
        listItem: {},
      },
      module: {
        posture: { base: '#6366f1' },
      },
      colors: {
        foreground: '#000',
        mutedForeground: '#666',
      },
    })),
  };
});

jest.mock('../../../components/common/AIBadge', () => {
  const { View } = require('react-native');
  return {
    AIBadge: () => <View testID="ai-badge" />,
  };
});

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
      [key: string]: unknown;
    }) => <View testID={testID}>{children}</View>,
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
    CelebrationEffect: ({
      visible,
      onComplete,
    }: {
      visible: boolean;
      onComplete: () => void;
      [key: string]: unknown;
    }) => {
      // 자동으로 onComplete 호출하여 후속 상태 전이 허용
      if (visible) {
        setTimeout(onComplete, 0);
      }
      return null;
    },
    BadgeDrop: () => null,
  };
});

// --- Import screen after mocks ---
import PostureResultScreen from '../../../app/(analysis)/posture/result';

describe('PostureResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('초기 로딩 상태가 표시된다', () => {
    const { getByTestId } = renderWithTheme(<PostureResultScreen />);
    // useEffect가 analyzePosture를 호출하기 전 isLoading=true
    expect(getByTestId('posture-loading')).toBeTruthy();
  });

  it('분석 완료 후 결과 화면이 렌더링된다', async () => {
    const { findByTestId } = renderWithTheme(<PostureResultScreen />);
    // analyzePosture mock이 resolve되면 결과 화면 표시
    const resultScreen = await findByTestId('analysis-posture-result-screen');
    expect(resultScreen).toBeTruthy();
  });

  it('분석 실패 시 에러 상태가 표시된다', async () => {
    const { analyzePosture } = require('../../../lib/gemini');
    analyzePosture.mockRejectedValueOnce(new Error('분석 실패'));

    const { findByTestId } = renderWithTheme(<PostureResultScreen />);
    const errorState = await findByTestId('posture-error');
    expect(errorState).toBeTruthy();
  });

  // 회귀 방지: posture는 오펀(숨김 웰니스 축) — 존재하지 않는 운동 탭 CTA가 없어야 한다
  it('운동 탭 CTA(교정 운동 시작하기)가 노출되지 않는다', async () => {
    const { findByTestId, queryByText } = renderWithTheme(<PostureResultScreen />);
    await findByTestId('analysis-posture-result-screen');
    expect(queryByText(/교정 운동 시작/)).toBeNull();
  });

  it('존재하지 않는 /(tabs)/workout 라우트로 이동하지 않는다', async () => {
    const { findByTestId } = renderWithTheme(<PostureResultScreen />);
    await findByTestId('analysis-posture-result-screen');
    expect(mockRouter.push).not.toHaveBeenCalledWith('/(tabs)/workout');
  });
});
