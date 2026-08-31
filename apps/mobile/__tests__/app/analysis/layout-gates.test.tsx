import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetToken = jest.fn<Promise<string | null>, []>();
const mockFetchBirthdate = jest.fn();
const mockFetchAgreementStatus = jest.fn();
const mockRouterReplace = jest.fn();

let mockSegments: string[] = ['(analysis)', 'integrated'];
let mockAuthState: {
  getToken: typeof mockGetToken;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  userId: string | null;
} = {
  getToken: mockGetToken,
  isLoaded: true,
  isSignedIn: true,
  userId: 'user-1',
};

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('@yiroom/shared', () => ({
  FEATURE_FLAGS: { WELLNESS_PHASE2: false },
}));

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const Stack = Object.assign(
    ({ children }: { children: React.ReactNode }) => (
      <View testID="analysis-stack">{children}</View>
    ),
    {
      Screen: ({ name, redirect }: { name: string; redirect?: boolean }) => (
        <View
          accessibilityState={{ disabled: redirect === true }}
          testID={`analysis-route-${name}`}
        />
      ),
    }
  );

  return {
    Redirect: ({ href }: { href: string }) => (
      <View accessibilityLabel={href} testID="analysis-gate-redirect" />
    ),
    router: { replace: (...args: unknown[]) => mockRouterReplace(...args) },
    Stack,
    useSegments: () => mockSegments,
  };
});

jest.mock('../../../components/analysis/AnalysisErrorState', () => {
  const ReactModule = require('react');
  const { Pressable, View } = require('react-native');
  return {
    AnalysisErrorState: ({ onRetry, testID }: { onRetry?: () => void; testID: string }) =>
      ReactModule.createElement(
        View,
        { testID },
        ReactModule.createElement(Pressable, { onPress: onRetry, testID: `${testID}-retry` })
      ),
  };
});

jest.mock('../../../lib/api/birthdate', () => ({
  fetchBirthdate: (...args: unknown[]) => mockFetchBirthdate(...args),
}));

jest.mock('../../../lib/api/agreement', () => ({
  fetchAgreementStatus: (...args: unknown[]) => mockFetchAgreementStatus(...args),
}));

jest.mock('../../../lib/theme', () => ({
  useTheme: () => ({
    colors: { card: '#fff', foreground: '#111' },
    isDark: false,
    typography: { weight: { semibold: '600' } },
  }),
}));

import AnalysisLayout, { requiresStandaloneAnalysisGate } from '../../../app/(analysis)/_layout';
import { BiometricResultRouteGate } from '../../../components/analysis/BiometricRouteGate';

describe('분석 레이아웃 선제 게이트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSegments = ['(analysis)', 'integrated'];
    mockAuthState = {
      getToken: mockGetToken,
      isLoaded: true,
      isSignedIn: true,
      userId: 'user-1',
    };
    mockGetToken.mockResolvedValue('clerk-token');
    mockFetchBirthdate.mockResolvedValue({ hasBirthDate: true });
    mockFetchAgreementStatus.mockResolvedValue({ hasAgreed: true });
  });

  it.each(['personal-color', 'skin', 'body', 'hair', 'makeup'])(
    '%s의 입력·카메라 화면만 레이아웃에서 선제 게이트한다',
    (axis) => {
      expect(requiresStandaloneAnalysisGate(['(analysis)', axis])).toBe(true);
      expect(requiresStandaloneAnalysisGate(['(analysis)', axis, 'camera'])).toBe(true);
      expect(requiresStandaloneAnalysisGate(['(analysis)', axis, 'result'])).toBe(false);
      expect(requiresStandaloneAnalysisGate(['(analysis)', axis, 'history'])).toBe(false);
    }
  );

  it('통합 분석은 자체 동의 수집 화면을 사용할 수 있도록 레이아웃 게이트에서 제외한다', () => {
    mockSegments = ['(analysis)', 'integrated'];
    mockAuthState = {
      getToken: mockGetToken,
      isLoaded: true,
      isSignedIn: false,
      userId: null,
    };

    const screen = render(<AnalysisLayout />);

    expect(screen.getByTestId('analysis-stack')).toBeTruthy();
    expect(screen.queryByTestId('analysis-gate-redirect')).toBeNull();
  });

  it.each([
    'skin/diary',
    'skin/diary-entry',
    'skin/consultation',
    'skin/solution',
    'skin/compare',
    'body/compare',
    'hair/compare',
    'makeup/compare',
  ])('%s 백로그 화면을 Expo Router 등록에서 제외한다', (routeName) => {
    const screen = render(<AnalysisLayout />);

    expect(screen.getByTestId(`analysis-route-${routeName}`).props.accessibilityState).toEqual({
      disabled: true,
    });
  });

  it('미로그인 사용자는 사진 화면보다 먼저 기존 로그인 플로우로 보낸다', () => {
    mockSegments = ['(analysis)', 'skin', 'camera'];
    mockAuthState = {
      getToken: mockGetToken,
      isLoaded: true,
      isSignedIn: false,
      userId: null,
    };

    const screen = render(<AnalysisLayout />);

    expect(mockRouterReplace).toHaveBeenCalledWith({
      pathname: '/(auth)/sign-in',
      params: { returnTo: '/(analysis)/skin/camera' },
    });
    expect(screen.queryByTestId('analysis-stack')).toBeNull();
    expect(mockFetchBirthdate).not.toHaveBeenCalled();
  });

  it.each([
    ['생년월일', { hasBirthDate: false }, { hasAgreed: true }],
    ['생체동의', { hasBirthDate: true }, { hasAgreed: false }],
  ])(
    '%s가 없으면 사진 입력 전에 기존 통합 수집 화면으로 보낸다',
    async (_gate, birthdate, agreement) => {
      mockSegments = ['(analysis)', 'hair', 'camera'];
      mockFetchBirthdate.mockResolvedValue(birthdate);
      mockFetchAgreementStatus.mockResolvedValue(agreement);

      const screen = render(<AnalysisLayout />);
      expect(screen.getByTestId('standalone-analysis-gate-loading')).toBeTruthy();

      await waitFor(() =>
        expect(mockRouterReplace).toHaveBeenCalledWith('/(analysis)/integrated')
      );
      expect(mockFetchBirthdate).toHaveBeenCalledWith('clerk-token');
      expect(mockFetchAgreementStatus).toHaveBeenCalledWith('clerk-token');
      expect(screen.queryByTestId('analysis-stack')).toBeNull();
    }
  );

  it('연령과 생체동의를 모두 확인한 사용자에게만 단독 분석 스택을 연다', async () => {
    mockSegments = ['(analysis)', 'makeup', 'index'];

    const screen = render(<AnalysisLayout />);

    await waitFor(() => expect(screen.getByTestId('analysis-stack')).toBeTruthy());
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('로그인 계정이 바뀌면 이전 계정의 허용 상태를 재사용하지 않고 다시 확인한다', async () => {
    mockSegments = ['(analysis)', 'skin', 'camera'];
    const screen = render(<AnalysisLayout />);

    await waitFor(() => expect(screen.getByTestId('analysis-stack')).toBeTruthy());
    expect(mockFetchBirthdate).toHaveBeenCalledTimes(1);

    mockAuthState = { ...mockAuthState, userId: 'user-2' };
    screen.rerender(<AnalysisLayout />);

    await waitFor(() => expect(mockFetchBirthdate).toHaveBeenCalledTimes(2));
    expect(mockFetchAgreementStatus).toHaveBeenCalledTimes(2);
  });

  it('게이트 조회 실패 시 사진 화면을 열지 않고 통합 수집 화면으로 fail-closed한다', async () => {
    mockSegments = ['(analysis)', 'body'];
    mockFetchBirthdate.mockRejectedValue(new Error('network'));

    const screen = render(<AnalysisLayout />);

    await waitFor(() =>
      expect(mockRouterReplace).toHaveBeenCalledWith('/(analysis)/integrated')
    );
    expect(screen.queryByTestId('analysis-stack')).toBeNull();
  });

  it('같은 게이트 상태가 다시 렌더되어도 이동은 한 번만 발행한다', () => {
    mockSegments = ['(analysis)', 'skin', 'camera'];
    mockAuthState = {
      getToken: mockGetToken,
      isLoaded: true,
      isSignedIn: false,
      userId: null,
    };

    const screen = render(<AnalysisLayout />);
    expect(mockRouterReplace).toHaveBeenCalledTimes(1);

    screen.rerender(<AnalysisLayout />);
    expect(mockRouterReplace).toHaveBeenCalledTimes(1);
  });

  it('새 사진 결과의 게이트 조회 실패는 이동하지 않고 오류와 재시도를 제공한다', async () => {
    mockFetchBirthdate.mockRejectedValueOnce(new Error('network'));

    const screen = render(
      <BiometricResultRouteGate imageUri="file:///fresh.jpg">
        <React.Fragment />
      </BiometricResultRouteGate>
    );

    await waitFor(() => expect(screen.getByTestId('biometric-route-gate-error')).toBeTruthy());
    expect(mockRouterReplace).not.toHaveBeenCalled();

    mockFetchBirthdate.mockResolvedValue({ hasBirthDate: true });
    fireEvent.press(screen.getByTestId('biometric-route-gate-error-retry'));

    await waitFor(() => expect(screen.queryByTestId('biometric-route-gate-error')).toBeNull());
    expect(mockFetchBirthdate).toHaveBeenCalledTimes(2);
  });

  it.each(['index', 'camera', 'result', 'history'])(
    'WELLNESS_PHASE2=false이면 posture/%s 직접 진입을 오늘 탭으로 막는다',
    (screenName) => {
      mockSegments = ['(analysis)', 'posture', screenName];

      const screen = render(<AnalysisLayout />);

      expect(screen.getByTestId('analysis-gate-redirect').props.accessibilityLabel).toBe('/(tabs)');
      expect(screen.queryByTestId('analysis-stack')).toBeNull();
      expect(mockGetToken).not.toHaveBeenCalled();
    }
  );
});
