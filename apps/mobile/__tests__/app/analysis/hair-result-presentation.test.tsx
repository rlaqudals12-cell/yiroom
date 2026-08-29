import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import HairResultScreen from '../../../app/(analysis)/hair/result';
import { renderWithTheme } from '../../helpers/test-utils';

const mockRequestHairAnalysis = jest.fn();
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
  useLocalSearchParams: () => ({ imageUri: 'file:///hair.jpg' }),
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('../../../lib/api/hair', () => ({
  requestHairAnalysis: (...args: unknown[]) => mockRequestHairAnalysis(...args),
  HairApiError: class HairApiError extends Error {},
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

jest.mock('../../../components/ui', () => ({
  ...(() => {
    const ReactModule = require('react');
    const ReactNative = require('react-native');
    return {
      CelebrationEffect: () =>
        ReactModule.createElement(ReactNative.View, { testID: 'celebration-effect' }),
      BadgeDrop: () => ReactModule.createElement(ReactNative.View, { testID: 'badge-drop' }),
    };
  })(),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
  };
});

const RESULT = {
  texture: 'wavy',
  thickness: 'thick',
  scalpCondition: 'oily',
  damageLevel: 20,
  scores: { shine: 60, elasticity: 72, density: 55, scalpHealth: 65 },
  mainConcerns: ['푸석함'],
  careRoutine: ['미지근한 물로 샴푸하세요'],
  recommendedStyles: ['레이어드 컷'],
  usedMock: false,
  dbSaveFailed: false,
};

describe('헤어 결과 진단지 표현', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-1');
    mockRequestHairAnalysis.mockResolvedValue(RESULT);
  });

  it('분류 결론과 원 데이터 속성을 먼저 보여주고 숫자 근거는 접는다', async () => {
    const screen = renderWithTheme(<HairResultScreen />);

    await waitFor(() => expect(screen.getByTestId('hair-analysis-result')).toBeTruthy());

    expect(screen.getAllByText('웨이브 · 굵은 모발').length).toBeGreaterThan(0);
    expect(screen.getAllByText('지성 두피').length).toBeGreaterThan(0);
    expect(screen.getByText('20% · 높을수록 손상이 큰 값')).toBeTruthy();
    expect(screen.queryByText('60점')).toBeNull();
    expect(screen.queryByText(/종합.*점/)).toBeNull();
    expect(screen.queryByTestId('hair-analysis-result-grade')).toBeNull();

    fireEvent.press(screen.getByTestId('hair-analysis-result-section-condition-trigger'));

    expect(screen.getByText('60')).toBeTruthy();
    expect(screen.getByText('72')).toBeTruthy();
    expect(screen.getByText('55')).toBeTruthy();
    expect(screen.getByText('65')).toBeTruthy();
    expect(screen.queryByText(/\d+점/)).toBeNull();
    expect(screen.getByTestId('hair-analysis-result-share')).toBeTruthy();
  });

  it('서버 폴백을 예시 결과·낮은 신뢰도로 고지한다', async () => {
    mockRequestHairAnalysis.mockResolvedValue({ ...RESULT, usedMock: true });
    const screen = renderWithTheme(<HairResultScreen />);

    await waitFor(() => expect(screen.getByTestId('hair-analysis-result-fallback')).toBeTruthy());
    expect(screen.getAllByText('예시 결과 · 낮은 신뢰도')).toHaveLength(2);
  });
});
