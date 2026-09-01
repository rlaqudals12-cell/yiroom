import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import PersonalColorResultScreen from '../../../app/(analysis)/personal-color/result';
import { renderWithTheme } from '../../helpers/test-utils';

jest.mock('../../../components/analysis/BiometricRouteGate', () => ({
  BiometricResultRouteGate: ({ children }: { children: React.ReactNode }) => children,
}));

const mockRequestPersonalColorAnalysis = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue('token-1');
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken, isSignedIn: true }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => ({
    imageUri: 'file:///personal-color.jpg',
    answers: JSON.stringify({ 0: 'warm', 1: 'cool', 2: 'neutral', 3: 'warm', 4: 'cool' }),
  }),
}));

jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [true, null]) }));
jest.mock('expo-image', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    Image: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
  };
});

jest.mock('../../../lib/api/personalColor', () => ({
  requestPersonalColorAnalysis: (...args: unknown[]) => mockRequestPersonalColorAnalysis(...args),
  getPersonalColorSubtypeLabel: (value: string) =>
    ({ bright: '브라이트', light: '라이트', true: '트루', mute: '뮤트', deep: '딥' })[value],
  parsePersonalColorSelfReport: () => ({
    skinAppearance: 'warm',
    veinAppearance: 'cool',
    jewelryPreference: 'neutral',
    sunReaction: 'warm',
    whitePreference: 'cool',
  }),
  PersonalColorApiError: class PersonalColorApiError extends Error {},
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

const SERVER_RESULT = {
  season: 'Spring',
  seasonSubtype: 'bright',
  confidence: 0.91,
  description: '서버 분석 설명',
  bestColors: ['#123456', '#ABCDEF'],
  worstColors: ['#654321'],
  usedMock: false,
  dbSaveFailed: false,
  analysisEvidence: {
    veinColor: 'blue',
    skinUndertone: 'pink',
    skinHairContrast: 'high',
    eyeColor: 'dark_brown',
    lipNaturalColor: 'pink',
  },
  imageQuality: {
    lightingCondition: 'natural',
    makeupDetected: false,
    analysisReliability: 'high',
  },
};

describe('퍼스널컬러 결과 서버 팔레트·진단지 배선', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-1');
    mockRequestPersonalColorAnalysis.mockResolvedValue(SERVER_RESULT);
  });

  it('서버 12톤·팔레트를 우선하고 신뢰도는 채점 없이 평문으로만 표시한다', async () => {
    const screen = renderWithTheme(<PersonalColorResultScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('analysis-personal-color-result-screen')).toBeTruthy()
    );

    expect(screen.getAllByText('봄 웜톤').length).toBeGreaterThan(0);
    expect(screen.getAllByText('브라이트').length).toBeGreaterThan(0);
    expect(screen.getByTestId('pc-adjacent-tone')).toHaveTextContent(/차선이에요/);
    expect(screen.getByTestId('analysis-personal-color-result-screen-share')).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId('pc-best-colors-swatch-0').props.style).backgroundColor
    ).toBe('#123456');
    expect(
      StyleSheet.flatten(screen.getByTestId('pc-best-colors-swatch-1').props.style).backgroundColor
    ).toBe('#ABCDEF');
    expect(screen.queryByTestId('pc-best-colors-swatch-2')).toBeNull();
    expect(screen.getByText('분석 신뢰도 91%')).toBeTruthy();
    expect(
      screen.getByTestId('analysis-personal-color-result-screen-trust-reproducibility')
    ).toHaveTextContent('같은 사진이면 같은 판정을 목표로 합니다.');
    expect(screen.queryByText(/검증했어요/)).toBeNull();
    expect(screen.queryByText(/웜톤.*91|쿨톤.*9/)).toBeNull();
    expect(screen.queryByTestId('pc-warm-score')).toBeNull();
    expect(mockRequestPersonalColorAnalysis).toHaveBeenCalledWith(
      {
        imageBase64: 'x'.repeat(200),
        selfReport: {
          skinAppearance: 'warm',
          veinAppearance: 'cool',
          jewelryPreference: 'neutral',
          sunReaction: 'warm',
          whitePreference: 'cool',
        },
      },
      'token-1'
    );

    fireEvent.press(
      screen.getByTestId('analysis-personal-color-result-screen-section-basis-trigger')
    );
    expect(screen.getByTestId('pc-evidence-rows')).toBeTruthy();
    expect(screen.getByText('혈관 색')).toBeTruthy();
    expect(screen.getByText('파란색')).toBeTruthy();
    expect(screen.getByText('명암 대비')).toBeTruthy();
    expect(screen.getByText('높음')).toBeTruthy();
    expect(screen.getByText('메이크업 감지')).toBeTruthy();
    expect(screen.getByText('감지되지 않음')).toBeTruthy();

    fireEvent.press(
      screen.getByTestId('analysis-personal-color-result-screen-section-avoid-colors-trigger')
    );
    expect(
      StyleSheet.flatten(screen.getByTestId('pc-worst-colors-swatch-0').props.style).backgroundColor
    ).toBe('#654321');
    expect(mockRequestPersonalColorAnalysis).toHaveBeenCalledTimes(1);
  });

  it('서버 팔레트가 비어 정적 참고표를 쓰면 예시 결과·낮은 신뢰도로 고지한다', async () => {
    mockRequestPersonalColorAnalysis.mockResolvedValue({
      ...SERVER_RESULT,
      bestColors: [],
      seasonSubtype: null,
      worstColors: [],
    });
    const screen = renderWithTheme(<PersonalColorResultScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('analysis-personal-color-result-screen-fallback')).toBeTruthy()
    );
    expect(screen.getAllByText('예시 결과 · 낮은 신뢰도')).toHaveLength(2);
    expect(
      StyleSheet.flatten(screen.getByTestId('pc-best-colors-swatch-0').props.style).backgroundColor
    ).toBe('#FFB6C1');
    expect(screen.queryByText('분석 신뢰도 91%')).toBeNull();
    expect(screen.queryByTestId('pc-adjacent-tone')).toBeNull();
    fireEvent.press(
      screen.getByTestId('analysis-personal-color-result-screen-section-basis-trigger')
    );
    expect(screen.queryByTestId('pc-evidence-rows')).toBeNull();
  });

  it('저장 실패 재시도와 기존 시즌 제품 CTA를 보존한다', async () => {
    mockRequestPersonalColorAnalysis.mockResolvedValue({ ...SERVER_RESULT, dbSaveFailed: true });
    const screen = renderWithTheme(<PersonalColorResultScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('analysis-personal-color-result-screen-save-failed')).toBeTruthy()
    );
    fireEvent.press(screen.getByTestId('analysis-personal-color-result-screen-save-retry'));
    expect(mockReplace).toHaveBeenCalledWith('/(analysis)/personal-color');

    fireEvent.press(screen.getByTestId('analysis-personal-color-result-screen-buttons-primary'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/products',
      params: { season: 'Spring', category: 'makeup' },
    });
  });
});
