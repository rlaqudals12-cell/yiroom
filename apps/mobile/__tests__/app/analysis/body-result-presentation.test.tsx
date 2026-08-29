import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import BodyResultScreen from '../../../app/(analysis)/body/result';
import { renderWithTheme } from '../../helpers/test-utils';

const mockRequestBodyAnalysis = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue('token-1');

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken, isSignedIn: true }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({
    height: '165',
    weight: '55',
    imageUri: 'file:///body.jpg',
  }),
}));

jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [true, null]) }));

jest.mock('../../../lib/api/body', () => ({
  requestBodyAnalysis: (...args: unknown[]) => mockRequestBodyAnalysis(...args),
  BodyApiError: class BodyApiError extends Error {},
}));

jest.mock('../../../lib/image/downscale', () => ({
  downscaleToBase64: jest.fn().mockResolvedValue('x'.repeat(200)),
}));
jest.mock('../../../lib/monitoring/sentry', () => ({ captureError: jest.fn() }));
jest.mock('../../../lib/analytics/tracker', () => ({ trackAnalysisResultView: jest.fn() }));

jest.mock('../../../components/analysis/AnalysisLoadingState', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    AnalysisLoadingState: ({ testID }: { testID?: string }) =>
      ReactModule.createElement(ReactNative.View, { testID }),
  };
});

jest.mock('../../../components/analysis/AnalysisErrorState', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    AnalysisErrorState: ({ testID }: { testID?: string }) =>
      ReactModule.createElement(ReactNative.View, { testID }),
  };
});

jest.mock('../../../components/ui', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    CelebrationEffect: () => ReactModule.createElement(ReactNative.View),
    BadgeDrop: () => ReactModule.createElement(ReactNative.View),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
  };
});

const RESULT = {
  bodyType: 'S',
  bodyTypeLabel: '스트레이트',
  bodyTypeDescription: '직선적인 실루엣이 돋보이는 체형이에요.',
  strengths: ['균형 잡힌 상체'],
  avoidStyles: ['과한 오버핏'],
  styleRecommendations: [{ item: '테일러드 재킷', reason: '직선 실루엣을 살려줘요' }],
  insight: '허리선을 정돈하면 전체 비율이 또렷해 보여요.',
  bmi: 20.2,
  usedMock: false,
  dbSaveFailed: false,
};

describe('체형 결과 진단지 표현', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-1');
    mockRequestBodyAnalysis.mockResolvedValue(RESULT);
  });

  it('체형 결론과 원 BMI를 먼저 보여주고 설명·추천 근거는 접는다', async () => {
    const screen = renderWithTheme(<BodyResultScreen />);

    await waitFor(() => expect(screen.getByTestId('body-analysis-result')).toBeTruthy());

    expect(screen.getAllByText('스트레이트').length).toBeGreaterThan(0);
    expect(screen.getByText('20.2')).toBeTruthy();
    expect(screen.getByText('참고 수치')).toBeTruthy();
    expect(screen.getAllByText('직선적인 실루엣이 돋보이는 체형이에요.').length).toBeGreaterThan(0);
    expect(screen.getByTestId('body-analysis-result-share')).toBeTruthy();
    expect(screen.queryByText('허리선을 정돈하면 전체 비율이 또렷해 보여요.')).toBeNull();
    expect(screen.queryByText(/종합.*점/)).toBeNull();
    expect(screen.queryByTestId('body-analysis-result-grade')).toBeNull();

    fireEvent.press(screen.getByTestId('body-analysis-result-section-basis-trigger'));
    expect(screen.getAllByText('직선적인 실루엣이 돋보이는 체형이에요.').length).toBeGreaterThan(0);
    expect(screen.getByText('허리선을 정돈하면 전체 비율이 또렷해 보여요.')).toBeTruthy();
  });

  it('서버 폴백은 예시 결과·낮은 신뢰도로 고지한다', async () => {
    mockRequestBodyAnalysis.mockResolvedValue({ ...RESULT, usedMock: true });
    const screen = renderWithTheme(<BodyResultScreen />);

    await waitFor(() => expect(screen.getByTestId('body-analysis-result-fallback')).toBeTruthy());
    expect(screen.getAllByText('예시 결과 · 낮은 신뢰도')).toHaveLength(2);
  });
});
