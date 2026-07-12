/**
 * 통합분석 "다시 시도" 재진입 복구 테스트 (Defect 2)
 *
 * 대상: app/(analysis)/integrated/index.tsx
 * 결과 화면 "다시 시도"가 넘긴 retryAxes로 (1) 미완료 축만 선택된 채 시작하고,
 * (2) 직전 제출 사진을 인메모리 캐시에서 복원하며, (3) 제출 시 mode:'update'로
 * 그 축만 재실행하는지 검증. 재시도 컨텍스트가 아니면 복원하지 않는지도 확인.
 */
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderWithTheme } from '../../helpers/test-utils';
import { rememberSubmission, clearLastSubmission } from '../../../lib/integrated/last-submission';

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
  requestIntegratedAnalysis: jest.fn().mockResolvedValue({ sessionId: 'sess-retry-1' }),
  IntegratedApiError: class IntegratedApiError extends Error {},
  // 게이트는 이미 충족된 것으로 응답해 생년월일·동의 섹션이 뜨지 않게 함(재시도 흐름에 집중).
  fetchBirthdate: jest.fn().mockResolvedValue({ birthDate: '2000-01-01', hasBirthDate: true }),
  saveBirthdate: jest.fn().mockResolvedValue(undefined),
  evaluateBirthdateGate: jest.fn(() => ({ ok: true, needsSave: false })),
  BirthdateApiError: class BirthdateApiError extends Error {},
  fetchAgreementStatus: jest.fn().mockResolvedValue({ hasAgreed: true }),
  saveAgreement: jest.fn().mockResolvedValue(undefined),
  evaluateAgreementGate: jest.fn(() => ({ ok: true, needsSave: false })),
  AgreementApiError: class AgreementApiError extends Error {},
}));

jest.mock('@/components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
  };
});

import { router, useLocalSearchParams } from 'expo-router';
import { requestIntegratedAnalysis } from '@/lib/api';

import IntegratedAnalysisInputScreen from '../../../app/(analysis)/integrated/index';

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockRequest = requestIntegratedAnalysis as jest.Mock;

describe('IntegratedAnalysisInputScreen — "다시 시도" 재진입 복구', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearLastSubmission();
    mockRequest.mockResolvedValue({ sessionId: 'sess-retry-1' });
  });

  afterEach(() => {
    clearLastSubmission();
  });

  it('retryAxes로 진입하면 미완료 축만 선택된 채 축 선택 UI가 노출된다', async () => {
    mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'hair,makeup' });

    const { findByTestId, getByTestId } = renderWithTheme(<IntegratedAnalysisInputScreen />);

    // 재시도면 재방문 이력이 없어도 축 선택 섹션이 뜬다.
    await findByTestId('axis-select-section');

    const label = (code: string): string =>
      String(getByTestId(`axis-chip-${code}`).props.accessibilityLabel);
    expect(label('hair')).toContain('선택됨');
    expect(label('makeup')).toContain('선택됨');
    expect(label('personal_color')).toContain('선택 안 됨');
    expect(label('skin')).toContain('선택 안 됨');
    expect(label('body')).toContain('선택 안 됨');
  });

  it('직전 제출 사진을 인메모리 캐시에서 복원하고 안내를 표시한다', async () => {
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'skin' });

    const { findByTestId, getByLabelText } = renderWithTheme(<IntegratedAnalysisInputScreen />);

    // 복원 안내 + 제거 버튼(=사진이 채워짐) 노출.
    await findByTestId('restored-photo-notice');
    expect(getByLabelText('얼굴 사진 제거')).toBeTruthy();
  });

  it('재시도 제출 시 mode:update + 미완료 축만 재실행한다', async () => {
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'hair,makeup' });

    const { findByTestId, getByLabelText } = renderWithTheme(<IntegratedAnalysisInputScreen />);
    await findByTestId('restored-photo-notice');

    fireEvent.press(getByLabelText('내 정체성 알아보기'));

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
    const input = mockRequest.mock.calls[0][0] as {
      faceImageBase64: string;
      mode?: string;
      axes?: string[];
    };
    expect(input.mode).toBe('update');
    expect(input.axes).toEqual(['hair', 'makeup']);
    // 복원된 사진이 그대로 제출된다(재선택 불필요).
    expect(input.faceImageBase64).toBe('data:image/jpeg;base64,FACE');
    expect(router.replace).toHaveBeenCalled();
  });

  it('재시도 컨텍스트가 아니면 캐시가 있어도 복원하지 않는다(놀람 방지)', async () => {
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    mockUseLocalSearchParams.mockReturnValue({});

    const { queryByTestId, queryByLabelText } = renderWithTheme(<IntegratedAnalysisInputScreen />);

    // 마운트 비동기 게이트 조회가 끝난 뒤에도 복원/축선택이 없어야 한다.
    await waitFor(() => expect(queryByTestId('axis-select-section')).toBeNull());
    expect(queryByTestId('restored-photo-notice')).toBeNull();
    expect(queryByLabelText('얼굴 사진 제거')).toBeNull();
  });
});
