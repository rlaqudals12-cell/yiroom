/**
 * C-1 체형 결과 화면 — 동작 회귀: 분석 요청은 화면 진입당 정확히 1회
 *
 * 재발 방지 핵심: clerk-expo의 getToken은 렌더마다 참조가 바뀐다.
 * analyzeBody(useCallback)가 getToken에 의존하면 effect가 상태 갱신 →
 * 재렌더 → 새 getToken → effect 재발화로 무한 요청 루프가 된다.
 * (실측 사고: 체형 분석 요청 폭풍 — 서버에 16초간 11행 중복 저장 + 429)
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// ── 네이티브/화면 의존성 mock ──────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => (
      <View {...props}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({
    height: '175',
    weight: '70',
    imageUri: 'file:///body.jpg',
    imageBase64: 'x'.repeat(200),
  }),
}));

// 핵심: useAuth가 호출될 때마다 "새로운" getToken 참조를 반환하도록 흉내낸다
// (clerk-expo 실동작 — 이 참조 불안정성이 무한 루프의 방아쇠였다)
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    getToken: jest.fn().mockResolvedValue('tok_123'),
  }),
}));

const mockRequestBodyAnalysis = jest.fn();
jest.mock('../../../lib/api/body', () => ({
  requestBodyAnalysis: (...args: unknown[]) => (mockRequestBodyAnalysis as jest.Mock)(...args),
  BodyApiError: class BodyApiError extends Error {},
}));

jest.mock('../../../lib/gemini', () => ({
  imageToBase64: jest.fn().mockResolvedValue('x'.repeat(200)),
}));

jest.mock('../../../lib/monitoring/sentry', () => ({ captureError: jest.fn() }));

jest.mock('../../../components/analysis', () => {
  const { View, Text } = require('react-native');
  return {
    AnalysisLoadingState: ({ testID }: { testID?: string }) => <View testID={testID} />,
    AnalysisErrorState: ({ testID, message }: { testID?: string; message?: string }) => (
      <View testID={testID}>
        <Text>{message}</Text>
      </View>
    ),
    ResultLayout: ({ testID }: { testID?: string }) => <View testID={testID} />,
    MetricBar: () => <View />,
    TopActionsCard: () => <View />,
    useAnalysisStyles: () => ({
      module: { body: { base: '#8b5cf6' } },
      colors: {
        foreground: '#111',
        mutedForeground: '#666',
        muted: '#eee',
        overlayForeground: '#fff',
      },
      isDark: false,
    }),
  };
});

jest.mock('../../../components/analysis/body', () => {
  const { View } = require('react-native');
  return {
    StylingPrinciplesCard: () => <View />,
    OutfitExamplesCard: () => <View />,
    ClosetPromptCard: () => <View />,
  };
});

jest.mock('../../../components/common/AIBadge', () => {
  const { View } = require('react-native');
  return { AIBadge: () => <View /> };
});

jest.mock('../../../components/common/ProgressiveDisclosure', () => {
  const { View } = require('react-native');
  return { ProgressiveDisclosure: () => <View /> };
});

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    GradientCard: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    CelebrationEffect: () => <View />,
    BadgeDrop: () => <View />,
  };
});

jest.mock('../../../lib/analysis', () => ({ buildBodyTopActions: () => [] }));

import BodyResultScreen from '../../../app/(analysis)/body/result';

const VALID_RESULT = {
  bodyType: 'S',
  bodyTypeLabel: '스트레이트',
  bodyTypeDescription: '직선적인 실루엣의 골격이에요. 핏이 살아있는 옷이 잘 어울려요.',
  strengths: ['어깨 라인'],
  avoidStyles: ['오버핏'],
  styleRecommendations: [{ item: '테일러드 재킷', reason: '직선 골격' }],
  insight: undefined,
  bmi: 22.9,
  usedMock: false,
};

describe('BodyResultScreen — 요청 1회 고정 (무한 루프 재발 방지)', () => {
  beforeEach(() => {
    mockRequestBodyAnalysis.mockReset();
  });

  it('getToken 참조가 렌더마다 바뀌어도 분석 요청은 정확히 1회만 발화한다', async () => {
    mockRequestBodyAnalysis.mockResolvedValue(VALID_RESULT);

    const { getByTestId } = render(<BodyResultScreen />);

    // 성공 상태 렌더(= 상태 갱신으로 재렌더가 여러 번 일어난 뒤)까지 대기
    await waitFor(() => expect(getByTestId('body-analysis-result')).toBeTruthy());

    // 재렌더 이후에도 추가 발화가 없어야 한다
    await new Promise((r) => setTimeout(r, 50));
    expect(mockRequestBodyAnalysis).toHaveBeenCalledTimes(1);
  });

  it('실패 시에도 자동 재요청 루프 없이 1회로 멈춘다 (에러 상태 표시)', async () => {
    mockRequestBodyAnalysis.mockRejectedValue(new Error('boom'));

    const { getByTestId } = render(<BodyResultScreen />);

    await waitFor(() => expect(getByTestId('body-analysis-error')).toBeTruthy());

    await new Promise((r) => setTimeout(r, 50));
    expect(mockRequestBodyAnalysis).toHaveBeenCalledTimes(1);
  });
});
