import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';

import SkinResultScreen from '../../../app/(analysis)/skin/result';
import { renderWithTheme } from '../../helpers/test-utils';

jest.mock('../../../components/analysis/BiometricRouteGate', () => ({
  BiometricResultRouteGate: ({ children }: { children: React.ReactNode }) => children,
}));

const mockRequestSkinAnalysis = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue('token-1');

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken, isSignedIn: true, userId: null }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ imageUri: 'file:///skin.jpg' }),
}));

jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [true, null]) }));

jest.mock('../../../lib/api/skin', () => ({
  requestSkinAnalysis: (...args: unknown[]) => mockRequestSkinAnalysis(...args),
  SkinApiError: class SkinApiError extends Error {},
}));

jest.mock('../../../lib/image/downscale', () => ({
  downscaleToBase64: jest.fn().mockResolvedValue('x'.repeat(200)),
}));
jest.mock('../../../lib/monitoring/sentry', () => ({ captureError: jest.fn() }));
jest.mock('../../../lib/analytics/tracker', () => ({ trackAnalysisResultView: jest.fn() }));
jest.mock('../../../lib/supabase', () => ({ useClerkSupabaseClient: () => ({}) }));

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
    CelebrationEffect: () =>
      ReactModule.createElement(ReactNative.View, { testID: 'celebration-effect' }),
    BadgeDrop: () => ReactModule.createElement(ReactNative.View, { testID: 'badge-drop' }),
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
  analysisId: 'skin-1',
  skinType: 'combination',
  metrics: {
    moisture: 65,
    oil: 40,
    pores: 55,
    wrinkles: 20,
    pigmentation: 30,
    sensitivity: 25,
    elasticity: 70,
  },
  usedMock: false,
  dbSaveFailed: false,
  homeCareBoundary: {
    concernIds: ['pigmentation'],
    disclaimer:
      '사진만으로 홈케어가 충분한지 또는 시술이 필요한지 판정할 수 없어요. 불편이 지속되면 피부과 전문의와 상담해 주세요.',
  },
};

describe('피부 결과 진단지 표현', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-1');
    mockRequestSkinAnalysis.mockResolvedValue(RESULT);
  });

  it('피부 타입과 원 지표를 먼저 보여주고 나머지 근거는 접는다', async () => {
    const screen = renderWithTheme(<SkinResultScreen />);

    await waitFor(() => expect(screen.getByTestId('skin-analysis-result')).toBeTruthy());

    expect(screen.getAllByText('복합성 피부').length).toBeGreaterThan(0);
    expect(screen.getByTestId('skin-analysis-result-share')).toBeTruthy();
    expect(screen.getByText('65')).toBeTruthy();
    expect(screen.getByText('40')).toBeTruthy();
    expect(screen.getByText('25')).toBeTruthy();
    expect(screen.queryByText('55')).toBeNull();
    expect(screen.queryByText(/종합.*점/)).toBeNull();
    expect(screen.queryByTestId('skin-analysis-result-grade')).toBeNull();

    fireEvent.press(screen.getByTestId('skin-analysis-result-section-metrics-trigger'));

    expect(screen.getByText('55')).toBeTruthy();
    expect(screen.getByText('70')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('30')).toBeTruthy();
  });

  it('서버 폴백은 예시 결과·낮은 신뢰도로 고지한다', async () => {
    mockRequestSkinAnalysis.mockResolvedValue({ ...RESULT, usedMock: true });
    const screen = renderWithTheme(<SkinResultScreen />);

    await waitFor(() => expect(screen.getByTestId('skin-analysis-result-fallback')).toBeTruthy());
    expect(screen.getAllByText('예시 결과 · 낮은 신뢰도')).toHaveLength(2);
    expect(
      screen.queryByTestId('skin-analysis-result-section-home-care-boundary-trigger')
    ).toBeNull();
  });

  it('서버가 보존한 일반 홈케어 한계만 보여주고 구체 시술은 만들지 않는다', async () => {
    const screen = renderWithTheme(<SkinResultScreen />);

    await waitFor(() => expect(screen.getByTestId('skin-analysis-result')).toBeTruthy());
    expect(
      screen.getByTestId('skin-analysis-result-section-home-care-boundary-trigger')
    ).toBeTruthy();
    expect(
      screen.getByText('사진만으로 홈케어의 충분함이나 시술 필요 여부를 판정할 수 없어요.')
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('skin-analysis-result-section-home-care-boundary-trigger'));
    expect(screen.getByText(/불편이 지속되면 피부과 전문의와 상담/)).toBeTruthy();
    expect(screen.queryByText(/IPL|필링|보톡스/)).toBeNull();
    expect(screen.queryByText(/매칭률|효과적/)).toBeNull();
  });
});
