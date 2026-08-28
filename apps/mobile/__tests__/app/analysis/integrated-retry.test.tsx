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
import AsyncStorage from '@react-native-async-storage/async-storage';

import { renderWithTheme } from '../../helpers/test-utils';
import { rememberSubmission, clearLastSubmission } from '../../../lib/integrated/last-submission';
import { readPendingIntegratedRequest } from '../../../lib/integrated/pending-request';

const mockTrackAnalysisStart = jest.fn();
const mockTrackAnalysisComplete = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue('mock_jwt_token');
const mockPendingRefetch = jest.fn();
const mockUsePendingIntegratedSession: jest.Mock = jest.fn((requestId: string | null) => ({
  session: null,
  isLoading: false,
  error: null,
  recoveryState: requestId ? 'pending' : 'not_found',
  refetch: mockPendingRefetch,
}));

jest.mock('@/lib/analytics/tracker', () => ({
  trackAnalysisStart: (...args: unknown[]) => mockTrackAnalysisStart(...args),
  trackAnalysisComplete: (...args: unknown[]) => mockTrackAnalysisComplete(...args),
}));

jest.mock('@/hooks/usePendingIntegratedSession', () => ({
  usePendingIntegratedSession: (requestId: string | null) =>
    mockUsePendingIntegratedSession(requestId),
}));

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
  requestIntegratedAnalysis: jest.fn().mockResolvedValue({
    sessionId: 'sess-retry-1',
    status: 'completed',
    axesCompleted: ['hair', 'makeup'],
    usedFallback: [],
  }),
  createIntegratedClientRequestId: jest.fn(() => '11111111-2222-4333-8444-555555555555'),
  IntegratedApiError: class IntegratedApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
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
const REQUEST_ID = '11111111-2222-4333-8444-555555555555';

async function pressEnabledSubmit(getByLabelText: (label: string) => any): Promise<void> {
  await waitFor(() => {
    expect(getByLabelText('내 정체성 알아보기').props.accessibilityState?.disabled).not.toBe(true);
  });
  fireEvent.press(getByLabelText('내 정체성 알아보기'));
}

describe('IntegratedAnalysisInputScreen — "다시 시도" 재진입 복구', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearLastSubmission();
    const storageMap = (global as unknown as { mockAsyncStorage: Map<string, string> })
      .mockAsyncStorage;
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(storageMap.get(key) ?? null)
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      storageMap.set(key, value);
      return Promise.resolve();
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
      storageMap.delete(key);
      return Promise.resolve();
    });
    const { useAuth } = require('@clerk/clerk-expo');
    mockGetToken.mockResolvedValue('mock_jwt_token');
    useAuth.mockImplementation(() => ({
      isLoaded: true,
      isSignedIn: true,
      userId: 'test_user_123',
      getToken: mockGetToken,
    }));
    mockUsePendingIntegratedSession.mockImplementation((requestId: string | null) => ({
      session: null,
      isLoading: false,
      error: null,
      recoveryState: requestId ? 'pending' : 'not_found',
      refetch: mockPendingRefetch,
    }));
    mockRequest.mockResolvedValue({
      sessionId: 'sess-retry-1',
      status: 'completed',
      axesCompleted: ['hair', 'makeup'],
      usedFallback: [],
    });
  });

  afterEach(() => {
    clearLastSubmission();
  });

  it('세션 판정이 끝난 미로그인 사용자는 입력 폼 대신 기존 로그인 화면으로 즉시 이동한다', () => {
    const { useAuth } = require('@clerk/clerk-expo');
    useAuth.mockReturnValueOnce({
      isLoaded: true,
      isSignedIn: false,
      getToken: jest.fn(),
    });
    mockUseLocalSearchParams.mockReturnValue({});

    const { getByTestId, queryByText } = renderWithTheme(<IntegratedAnalysisInputScreen />);

    expect(getByTestId('redirect').props.accessibilityLabel).toBe('/(auth)/sign-in');
    expect(queryByText('5축 통합 분석')).toBeNull();
    expect(require('@/lib/api').fetchBirthdate).not.toHaveBeenCalled();
  });

  it('Clerk 로딩 중에는 미로그인으로 오판하지 않고 세션 확인 상태만 표시한다', () => {
    const { useAuth } = require('@clerk/clerk-expo');
    useAuth.mockReturnValueOnce({
      isLoaded: false,
      isSignedIn: undefined,
      getToken: jest.fn(),
    });
    mockUseLocalSearchParams.mockReturnValue({});

    const { getByTestId, queryByTestId, getByLabelText } = renderWithTheme(
      <IntegratedAnalysisInputScreen />
    );

    expect(getByTestId('integrated-auth-loading')).toBeTruthy();
    expect(getByLabelText('로그인 상태 확인 중')).toBeTruthy();
    expect(queryByTestId('redirect')).toBeNull();
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

    await pressEnabledSubmit(getByLabelText);

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
    const input = mockRequest.mock.calls[0][0] as {
      faceImageBase64: string;
      clientRequestId?: string;
      mode?: string;
      axes?: string[];
      questionnaire?: { imageStorageConsent?: boolean };
    };
    expect(input.mode).toBe('update');
    expect(input.axes).toEqual(['hair', 'makeup']);
    // 복원된 사진이 그대로 제출된다(재선택 불필요).
    expect(input.faceImageBase64).toBe('data:image/jpeg;base64,FACE');
    expect(input.clientRequestId).toBe('11111111-2222-4333-8444-555555555555');
    expect(input.questionnaire?.imageStorageConsent).toBe(false);
    expect(mockTrackAnalysisStart).toHaveBeenCalledTimes(1);
    expect(mockTrackAnalysisStart).toHaveBeenCalledWith('integrated', 'update', 'mock_jwt_token');
    expect(mockTrackAnalysisComplete).toHaveBeenCalledTimes(1);
    expect(mockTrackAnalysisComplete).toHaveBeenCalledWith(
      'integrated',
      { status: 'completed', axesCompletedCount: 2, usedFallback: false },
      'mock_jwt_token'
    );
    expect(router.replace).toHaveBeenCalled();
  });

  it('네트워크 실패 뒤 remount해도 같은 clientRequestId를 복구하고 새 POST를 만들지 않는다', async () => {
    const { IntegratedApiError, createIntegratedClientRequestId } = require('@/lib/api');
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'skin' });
    mockRequest.mockRejectedValueOnce(new IntegratedApiError('네트워크 연결을 확인해주세요.', 0));

    const first = renderWithTheme(<IntegratedAnalysisInputScreen />);
    await first.findByTestId('restored-photo-notice');

    await pressEnabledSubmit(first.getByLabelText);
    await first.findByText('네트워크 연결을 확인해주세요.');
    await first.findByTestId('pending-integrated-analysis');
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest.mock.calls[0][0].clientRequestId).toBe(REQUEST_ID);
    first.unmount();

    const remounted = renderWithTheme(<IntegratedAnalysisInputScreen />);
    await remounted.findByTestId('pending-integrated-analysis');

    await waitFor(() => expect(mockUsePendingIntegratedSession).toHaveBeenCalledWith(REQUEST_ID));
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(createIntegratedClientRequestId).toHaveBeenCalledTimes(1);
  });

  it('reused completed는 축 payload 없이 sessionId-only 저장 결과 경로로 이동한다', async () => {
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'skin' });
    mockRequest.mockResolvedValue({
      sessionId: 'sess-reused-completed',
      status: 'completed',
      reused: true,
    });

    const screen = renderWithTheme(<IntegratedAnalysisInputScreen />);
    await screen.findByTestId('restored-photo-notice');
    await pressEnabledSubmit(screen.getByLabelText);

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        '/(analysis)/integrated/result/sess-reused-completed'
      )
    );
    expect(String((router.replace as jest.Mock).mock.calls[0][0])).not.toContain('payload=');
    await expect(readPendingIntegratedRequest('test_user_123')).resolves.toBeNull();
    expect(mockTrackAnalysisComplete).not.toHaveBeenCalled();
  });

  it.each(['pending', 'failed'] as const)(
    'reused %s는 axes 없는 요약을 결과 payload로 넘기지 않고 marker를 유지한다',
    async (status) => {
      rememberSubmission('data:image/jpeg;base64,FACE', null);
      mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'skin' });
      mockUsePendingIntegratedSession.mockImplementation((requestId: string | null) => ({
        session: requestId ? { id: 'sess-reused-wait', status } : null,
        isLoading: false,
        error: null,
        recoveryState: requestId ? status : 'not_found',
        refetch: mockPendingRefetch,
      }));
      mockRequest.mockResolvedValue({ sessionId: 'sess-reused-wait', status, reused: true });

      const screen = renderWithTheme(<IntegratedAnalysisInputScreen />);
      await screen.findByTestId('restored-photo-notice');
      await pressEnabledSubmit(screen.getByLabelText);

      await screen.findByTestId('pending-integrated-analysis');
      expect(router.replace).not.toHaveBeenCalled();
      await expect(readPendingIntegratedRequest('test_user_123')).resolves.toBe(REQUEST_ID);
      expect(mockTrackAnalysisComplete).not.toHaveBeenCalled();
    }
  );

  it('원본 저장은 기존 사용자에게도 별도 선택으로 노출되고 명시 선택 때만 true를 보낸다', async () => {
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'skin' });

    const { findByTestId, getByTestId, getByLabelText, getByText } = renderWithTheme(
      <IntegratedAnalysisInputScreen />
    );
    await findByTestId('restored-photo-notice');

    expect(getByTestId('image-storage-consent-section')).toBeTruthy();
    expect(getByText(/동의하지 않아도 분석은 진행돼요/)).toBeTruthy();
    expect(getByText(/보관 1년이 되면 일일 파기 작업으로 삭제를 시작/)).toBeTruthy();
    fireEvent.press(getByTestId('image-storage-consent'));
    await pressEnabledSubmit(getByLabelText);

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
    const input = mockRequest.mock.calls[0][0] as {
      questionnaire: { imageStorageConsent: boolean };
    };
    expect(input.questionnaire.imageStorageConsent).toBe(true);
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

  it('marker 읽기 실패는 경고를 표시하되 새 제출은 비영속 ID로 허용한다(하드락 금지)', async () => {
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'skin' });
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('storage unavailable'));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(new Error('storage unavailable'));

    const screen = renderWithTheme(<IntegratedAnalysisInputScreen />);

    expect(await screen.findByText('분석 요청 상태를 확인할 수 없어요')).toBeTruthy();
    expect(
      screen.getByText('저장된 요청 정보를 읽지 못했어요. 새 분석은 그대로 진행할 수 있어요.')
    ).toBeTruthy();
    await waitFor(() =>
      expect(
        screen.getByLabelText('내 정체성 알아보기').props.accessibilityState?.disabled
      ).not.toBe(true)
    );
    fireEvent.press(screen.getByLabelText('내 정체성 알아보기'));
    // 저장소가 죽어도 제출은 진행된다 — 복구(멱등)만 포기하고 임시 UUID 사용
    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
    expect(mockRequest.mock.calls[0][0].clientRequestId).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('기존 요청 포기 중 remove 실패 시 marker와 제출 차단을 유지한다', async () => {
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'skin' });
    await AsyncStorage.setItem('yiroom:integrated:pending:test_user_123', REQUEST_ID);

    const screen = renderWithTheme(<IntegratedAnalysisInputScreen />);
    await screen.findByTestId('pending-integrated-analysis');
    // marker 읽기까지는 성공하고, 사용자가 포기를 누른 실제 삭제 단계만 실패시킨다.
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValue(new Error('remove failed'));
    fireEvent.press(screen.getByLabelText('기존 분석 요청 포기'));

    expect(
      await screen.findByText('기존 분석 요청을 정리하지 못했어요. 다시 시도해주세요.')
    ).toBeTruthy();
    expect(screen.getByTestId('pending-integrated-analysis')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('내 정체성 알아보기'));
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('제출 버튼 연속 탭도 UUID와 API 요청을 한 번만 만든다', async () => {
    const { createIntegratedClientRequestId } = require('@/lib/api');
    rememberSubmission('data:image/jpeg;base64,FACE', null);
    mockUseLocalSearchParams.mockReturnValue({ retryAxes: 'skin' });
    const screen = renderWithTheme(<IntegratedAnalysisInputScreen />);
    await screen.findByTestId('restored-photo-notice');
    await waitFor(() =>
      expect(
        screen.getByLabelText('내 정체성 알아보기').props.accessibilityState?.disabled
      ).not.toBe(true)
    );

    let releaseToken: (value: string) => void = () => undefined;
    mockGetToken.mockImplementation(
      () => new Promise<string>((resolve) => (releaseToken = resolve))
    );
    const submitButton = screen.getByLabelText('내 정체성 알아보기');
    fireEvent.press(submitButton);
    fireEvent.press(submitButton);
    releaseToken('mock_jwt_token');

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
    expect(createIntegratedClientRequestId).toHaveBeenCalledTimes(1);
  });
});
