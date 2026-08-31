import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import MakeupResultScreen from '../../../app/(analysis)/makeup/result';
import { renderWithTheme } from '../../helpers/test-utils';

jest.mock('../../../components/analysis/BiometricRouteGate', () => ({
  BiometricResultRouteGate: ({ children }: { children: React.ReactNode }) => children,
}));

const mockRequestMakeupAnalysis = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue('token-1');
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken, isSignedIn: true }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => ({ imageUri: 'file:///makeup.jpg' }),
}));

jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [true, null]) }));

jest.mock('../../../lib/api/makeup', () => ({
  requestMakeupAnalysis: (...args: unknown[]) => mockRequestMakeupAnalysis(...args),
  MakeupApiError: class MakeupApiError extends Error {},
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
  faceShape: 'oval',
  undertone: 'cool',
  eyeShape: 'almond',
  lipShape: 'bow',
  scores: { skinTone: 82, eyeBalance: 88, lipBalance: 88, overall: 88 },
  recommendations: {
    base: '얇고 맑은 베이스를 사용해 주세요.',
    eye: '눈꼬리를 따라 차분하게 음영을 넣어 주세요.',
    lip: '입술 중앙부터 로즈 컬러를 발라 주세요.',
    blush: '볼 중앙에 라벤더 블러셔를 올려 주세요.',
    contour: '얼굴 외곽에 옅은 음영을 넣어 주세요.',
  },
  bestColors: ['#AABBCC', '#DDEEFF', '#CC99BB', '#778899'],
  usedMock: false,
  dbSaveFailed: false,
};

describe('메이크업 결과 진단지 표현', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-1');
    mockRequestMakeupAnalysis.mockResolvedValue(RESULT);
  });

  it('분류·실제 추천색을 먼저 보여주고 점수 없이 부위별 근거를 접는다', async () => {
    const screen = renderWithTheme(<MakeupResultScreen />);

    await waitFor(() => expect(screen.getByTestId('makeup-analysis-result')).toBeTruthy());

    expect(screen.getAllByText('계란형 · 쿨톤').length).toBeGreaterThan(0);
    expect(screen.getAllByText('아몬드형').length).toBeGreaterThan(0);
    expect(screen.getAllByText('큐피드 보우').length).toBeGreaterThan(0);
    expect(screen.getByTestId('makeup-analysis-result-share')).toBeTruthy();
    expect(screen.getByTestId('makeup-best-colors-swatch-3')).toBeTruthy();
    expect(screen.queryByText('88')).toBeNull();
    expect(screen.queryByText(/종합.*점/)).toBeNull();
    expect(screen.queryByTestId('makeup-analysis-result-grade')).toBeNull();
    expect(screen.queryByText('볼 중앙에 라벤더 블러셔를 올려 주세요.')).toBeNull();

    fireEvent.press(screen.getByTestId('makeup-analysis-result-section-recommendations-trigger'));
    expect(screen.getByText('볼 중앙에 라벤더 블러셔를 올려 주세요.')).toBeTruthy();
    expect(mockRequestMakeupAnalysis).toHaveBeenCalledTimes(1);
  });

  it('폴백·저장 실패를 고지하고 기존 제품 CTA와 재시도 경로를 보존한다', async () => {
    mockRequestMakeupAnalysis.mockResolvedValue({
      ...RESULT,
      dbSaveFailed: true,
      usedMock: true,
    });
    const screen = renderWithTheme(<MakeupResultScreen />);

    await waitFor(() => expect(screen.getByTestId('makeup-analysis-result-fallback')).toBeTruthy());
    expect(screen.getAllByText('예시 결과 · 낮은 신뢰도')).toHaveLength(2);
    expect(screen.getByTestId('makeup-analysis-result-save-failed')).toBeTruthy();

    fireEvent.press(screen.getByTestId('makeup-analysis-result-buttons-primary'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/products',
      params: { category: 'makeup' },
    });

    fireEvent.press(screen.getByTestId('makeup-analysis-result-save-retry'));
    expect(mockReplace).toHaveBeenCalledWith('/(analysis)/makeup');
  });

  it('추천색이 비면 팔레트를 지어내지 않는다', async () => {
    mockRequestMakeupAnalysis.mockResolvedValue({ ...RESULT, bestColors: [] });
    const screen = renderWithTheme(<MakeupResultScreen />);

    await waitFor(() => expect(screen.getByTestId('makeup-analysis-result')).toBeTruthy());
    expect(screen.queryByTestId('makeup-best-colors')).toBeNull();
  });
});
