/**
 * 통합분석 가입=첫 미팅 진입 테스트 (ADR-114)
 *
 * 대상: app/(analysis)/integrated/index.tsx
 * 가입 직후(onboarding=1) 진입 시 "나중에 할래요" 이탈 경로가 노출되고,
 * 일반 진입에서는 노출되지 않는지 검증(분석 강제 금지).
 */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '../../helpers/test-utils';

// --- 공통 mock ---

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('@/hooks/useUserAnalyses', () => ({
  useUserAnalyses: jest.fn(() => ({
    analyses: [],
    personalColor: null,
    skinAnalysis: null,
    bodyAnalysis: null,
    isLoading: false,
    refetch: jest.fn(),
  })),
}));

jest.mock('@/lib/api', () => ({
  requestIntegratedAnalysis: jest.fn(),
  IntegratedApiError: class IntegratedApiError extends Error {},
}));

jest.mock('@/components/ui', () => {
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
  };
});

import { router, useLocalSearchParams } from 'expo-router';

import IntegratedAnalysisInputScreen from '../../../app/(analysis)/integrated/index';

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

describe('IntegratedAnalysisInputScreen — 가입=첫 미팅(ADR-114)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('onboarding=1 진입 시 "나중에 할래요" 스킵 경로가 노출된다', () => {
    mockUseLocalSearchParams.mockReturnValue({ onboarding: '1' });

    const { getByTestId, getByText } = renderWithTheme(<IntegratedAnalysisInputScreen />);

    expect(getByTestId('onboarding-skip-button')).toBeTruthy();
    expect(getByText('나중에 할래요')).toBeTruthy();
  });

  it('스킵 누르면 홈 탭으로 이동한다 (분석 강제 금지)', () => {
    mockUseLocalSearchParams.mockReturnValue({ onboarding: '1' });

    const { getByTestId } = renderWithTheme(<IntegratedAnalysisInputScreen />);
    fireEvent.press(getByTestId('onboarding-skip-button'));

    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('일반 진입(파라미터 없음)에서는 스킵 버튼이 노출되지 않는다', () => {
    mockUseLocalSearchParams.mockReturnValue({});

    const { queryByTestId } = renderWithTheme(<IntegratedAnalysisInputScreen />);

    expect(queryByTestId('onboarding-skip-button')).toBeNull();
  });
});
