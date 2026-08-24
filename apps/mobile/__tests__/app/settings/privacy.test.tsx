/**
 * 개인정보 설정 화면 테스트
 *
 * 대상: app/settings/privacy.tsx
 * 의존성: useAuth (Clerk), useClerkSupabaseClient, useTheme, Alert, Switch
 */
import React from 'react';
import { Alert, Share } from 'react-native';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';

import { useAuth, useUser } from '@clerk/clerk-expo';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Supabase mock
const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });
const mockUpdate = jest.fn().mockReturnThis();
const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
const mockQuery = {
  select: jest.fn(),
  update: mockUpdate,
  eq: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  single: mockSingle,
};
mockQuery.select.mockReturnValue(mockQuery);
mockQuery.eq.mockReturnValue(mockQuery);
mockQuery.order.mockReturnValue(mockQuery);
mockQuery.limit.mockReturnValue(mockQuery);

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({
    rpc: mockRpc,
    from: jest.fn(() => mockQuery),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test_user_123' } },
        error: null,
      }),
    },
  }),
}));

jest.mock('../../../lib/api/account', () => ({
  deleteAccount: jest.fn(),
  AccountApiError: class AccountApiError extends Error {
    public readonly status: number;
    public readonly code: string | undefined;

    constructor(message: string, status: number, code?: string) {
      super(message);
      this.name = 'AccountApiError';
      this.status = status;
      this.code = code;
    }
  },
}));

jest.mock('../../../lib/api/consent-preferences', () => ({
  fetchConsentPreferences: jest.fn(),
  updateConsentPreferences: jest.fn(),
  ConsentPreferencesApiError: class ConsentPreferencesApiError extends Error {
    public readonly status: number;
    public readonly code: string | undefined;

    constructor(message: string, status: number, code?: string) {
      super(message);
      this.name = 'ConsentPreferencesApiError';
      this.status = status;
      this.code = code;
    }
  },
}));

jest.mock('../../../lib/api/biometric-consent', () => ({
  revokeBiometricConsent: jest.fn(),
  BiometricConsentApiError: class BiometricConsentApiError extends Error {
    public readonly status: number;
    public readonly code: string | undefined;
    public readonly partialResult: unknown;

    constructor(message: string, status: number, code?: string, partialResult?: unknown) {
      super(message);
      this.name = 'BiometricConsentApiError';
      this.status = status;
      this.code = code;
      this.partialResult = partialResult;
    }
  },
}));

jest.mock('../../../lib/analytics', () => ({
  setAnalyticsConsent: jest.fn(),
}));

jest.spyOn(Alert, 'alert');
jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

import { AccountApiError, deleteAccount } from '../../../lib/api/account';
import {
  BiometricConsentApiError,
  revokeBiometricConsent,
} from '../../../lib/api/biometric-consent';
import {
  ConsentPreferencesApiError,
  fetchConsentPreferences,
  updateConsentPreferences,
} from '../../../lib/api/consent-preferences';
import { setAnalyticsConsent } from '../../../lib/analytics';
import PrivacySettingsScreen from '../../../app/settings/privacy';

const mockDeleteAccount = deleteAccount as jest.MockedFunction<typeof deleteAccount>;
const mockRevokeBiometricConsent = revokeBiometricConsent as jest.MockedFunction<
  typeof revokeBiometricConsent
>;
const mockFetchConsentPreferences = fetchConsentPreferences as jest.MockedFunction<
  typeof fetchConsentPreferences
>;
const mockUpdateConsentPreferences = updateConsentPreferences as jest.MockedFunction<
  typeof updateConsentPreferences
>;
const mockSetAnalyticsConsent = setAnalyticsConsent as jest.MockedFunction<
  typeof setAnalyticsConsent
>;
const mockGetToken = jest.fn();
const mockSignOut = jest.fn();

// ============================================================
// 테마 헬퍼
// ============================================================

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

// ============================================================
// 테스트
// ============================================================

describe('PrivacySettingsScreen (개인정보 설정)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('mock_jwt_token');
    mockSignOut.mockResolvedValue(undefined);
    mockDeleteAccount.mockResolvedValue({
      success: true,
      message: '계정이 성공적으로 삭제되었습니다.',
      deletedAt: '2026-08-18T00:00:00.000Z',
    });
    mockRevokeBiometricConsent.mockResolvedValue({
      consentRevoked: true,
      imagesDeleted: 3,
      databaseTargetsCleared: 11,
      fullyPurged: true,
    });
    mockFetchConsentPreferences.mockResolvedValue({
      analyticsConsent: true,
      marketingConsent: false,
    });
    mockUpdateConsentPreferences.mockResolvedValue({
      analyticsConsent: true,
      marketingConsent: false,
    });
    (useAuth as unknown as jest.Mock).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      userId: 'test_user_123',
      getToken: mockGetToken,
      signOut: mockSignOut,
    });
    (useUser as unknown as jest.Mock).mockReturnValue({
      user: {
        id: 'test_user_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        primaryEmailAddress: { emailAddress: 'test@example.com' },
      },
      isLoaded: true,
      isSignedIn: true,
    });
  });

  // ---------------------------------------------------------------
  // 기본 렌더링
  // ---------------------------------------------------------------
  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByTestId('settings-privacy-screen')).toBeTruthy();
    });

    it('세 개의 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('데이터 수집')).toBeTruthy();
      expect(getByText('공개 및 공유')).toBeTruthy();
      expect(getByText('데이터 관리')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------
  // 데이터 수집 토글
  // ---------------------------------------------------------------
  describe('데이터 수집 토글', () => {
    it('분석 데이터 수집 동의 토글이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('분석 데이터 수집 동의')).toBeTruthy();
      expect(getByText('서비스 개선을 위한 이용 기록 수집')).toBeTruthy();
      expect(getByLabelText('분석 데이터 수집 동의')).toBeTruthy();
    });

    it('마케팅 정보 수신 토글이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('마케팅 정보 수신')).toBeTruthy();
      expect(getByText('이벤트, 할인, 새 기능 소식 알림')).toBeTruthy();
      expect(getByLabelText('마케팅 정보 수신')).toBeTruthy();
    });

    it('서버에서 분석 동의를 읽어 tracker와 스위치에 반영한다', async () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      await waitFor(() => {
        expect(mockFetchConsentPreferences).toHaveBeenCalledWith('mock_jwt_token');
        expect(getByLabelText('분석 데이터 수집 동의').props.value).toBe(true);
        expect(mockSetAnalyticsConsent).toHaveBeenLastCalledWith(true);
      });
    });

    it('마케팅 정보 수신 기본값이 false이다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('마케팅 정보 수신');
      expect(toggle.props.value).toBe(false);
    });

    it('마케팅 동의 변경을 서버에 저장한 뒤 응답 상태를 반영한다', async () => {
      mockUpdateConsentPreferences.mockResolvedValue({
        analyticsConsent: true,
        marketingConsent: true,
      });
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      await waitFor(() => expect(getByLabelText('마케팅 정보 수신').props.disabled).toBe(false));
      const toggle = getByLabelText('마케팅 정보 수신');
      fireEvent(toggle, 'valueChange', true);
      await waitFor(() => {
        expect(mockUpdateConsentPreferences).toHaveBeenCalledWith(
          { marketingConsent: true },
          'mock_jwt_token'
        );
        expect(getByLabelText('마케팅 정보 수신').props.value).toBe(true);
      });
    });

    it('분석 옵트아웃 저장 성공 즉시 tracker 게이트를 닫는다', async () => {
      mockUpdateConsentPreferences.mockResolvedValue({
        analyticsConsent: false,
        marketingConsent: false,
      });
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      await waitFor(() => expect(getByLabelText('분석 데이터 수집 동의').props.value).toBe(true));

      fireEvent(getByLabelText('분석 데이터 수집 동의'), 'valueChange', false);

      await waitFor(() => {
        expect(mockUpdateConsentPreferences).toHaveBeenCalledWith(
          { analyticsConsent: false },
          'mock_jwt_token'
        );
        expect(mockSetAnalyticsConsent).toHaveBeenLastCalledWith(false);
        expect(getByLabelText('분석 데이터 수집 동의').props.value).toBe(false);
      });
    });

    it('서버 저장 실패 시 동의 상태를 바꾸지 않고 사용자 메시지를 표시한다', async () => {
      mockUpdateConsentPreferences.mockRejectedValue(
        new ConsentPreferencesApiError('동의 설정을 저장할 수 없어요.', 500, 'DB_ERROR')
      );
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      await waitFor(() => expect(getByLabelText('분석 데이터 수집 동의').props.value).toBe(true));

      fireEvent(getByLabelText('분석 데이터 수집 동의'), 'valueChange', false);

      expect(mockSetAnalyticsConsent).toHaveBeenLastCalledWith(false);

      await waitFor(() => {
        expect(getByLabelText('분석 데이터 수집 동의').props.value).toBe(true);
        expect(Alert.alert).toHaveBeenLastCalledWith(
          '동의 설정을 저장하지 못했어요',
          '이 기기의 이용기록 전송은 중단했지만 서버 설정을 저장하지 못했어요. 네트워크 연결 후 다시 시도해주세요.'
        );
      });
    });
  });

  // ---------------------------------------------------------------
  // 공개·공유 지원 범위
  // ---------------------------------------------------------------
  describe('공개·공유 지원 범위', () => {
    it('서버에 저장되지 않는 프로필 공개 스위치 대신 미지원 상태를 안내한다', () => {
      const { getByText, queryByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('프로필 공개 설정')).toBeTruthy();
      expect(getByText('모바일 공개 프로필은 아직 제공하지 않아요')).toBeTruthy();
      expect(queryByLabelText('프로필 공개')).toBeNull();
    });

    it('공유는 사용자가 결과 화면에서 명시적으로 실행할 때만 일어남을 안내한다', () => {
      const { getByText, queryByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('분석 결과 공유')).toBeTruthy();
      expect(getByText('결과 화면의 공유 버튼을 누른 경우에만 공유돼요')).toBeTruthy();
      expect(queryByLabelText('분석 결과 공유 허용')).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // 데이터 관리
  // ---------------------------------------------------------------
  describe('데이터 관리', () => {
    it('내 데이터 다운로드 버튼이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('내 데이터 다운로드')).toBeTruthy();
      expect(getByText('저장된 모든 데이터를 파일로 받아보세요')).toBeTruthy();
      expect(getByLabelText('내 데이터 다운로드')).toBeTruthy();
    });

    it('내 데이터 다운로드 버튼이 클릭 가능하다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const button = getByLabelText('내 데이터 다운로드');
      // 비동기 데이터 내보내기 함수가 호출됨 (실제 Supabase 호출은 mock)
      expect(() => fireEvent.press(button)).not.toThrow();
    });

    it('계정 삭제 버튼이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('계정 삭제')).toBeTruthy();
      expect(getByText('모든 데이터가 영구 삭제돼요')).toBeTruthy();
      expect(getByLabelText('계정 삭제')).toBeTruthy();
    });

    it('생체정보 철회 범위와 분석 결과 유지 여부를 확인한 뒤 서버 파기를 호출한다', async () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      fireEvent.press(getByLabelText('생체정보 동의 철회'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      expect(alertCall[0]).toBe('생체정보 동의 철회');
      expect(alertCall[1]).toContain('분석 원본 이미지를 즉시 삭제');
      expect(alertCall[1]).toContain('텍스트 분석 결과는 유지');
      const buttons = alertCall[2] as Array<{
        text: string;
        onPress?: () => void | Promise<void>;
      }>;

      await act(async () => {
        await buttons.find((button) => button.text === '철회 및 이미지 삭제')?.onPress?.();
      });

      expect(mockRevokeBiometricConsent).toHaveBeenCalledWith('mock_jwt_token');
      expect(Alert.alert).toHaveBeenLastCalledWith(
        '철회 완료',
        expect.stringContaining('서버에 저장된 분석 이미지를 삭제')
      );
    });

    it('부분 파기 실패를 전체 성공으로 표시하지 않고 서버 사용자 메시지를 보여준다', async () => {
      mockRevokeBiometricConsent.mockRejectedValue(
        new BiometricConsentApiError(
          '생체정보 동의는 철회했지만 일부 이미지 파기가 끝나지 않았습니다. 잠시 후 다시 시도해주세요.',
          500,
          'PARTIAL_PURGE_ERROR',
          {
            consentRevoked: true,
            imagesDeleted: 2,
            databaseTargetsCleared: 9,
            fullyPurged: false,
          }
        )
      );
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      fireEvent.press(getByLabelText('생체정보 동의 철회'));
      const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
        text: string;
        onPress?: () => void | Promise<void>;
      }>;

      await act(async () => {
        await buttons.find((button) => button.text === '철회 및 이미지 삭제')?.onPress?.();
      });

      expect(Alert.alert).toHaveBeenLastCalledWith(
        '철회를 완료하지 못했어요',
        expect.stringContaining('일부 이미지 파기가 끝나지 않았습니다')
      );
      expect(Alert.alert).not.toHaveBeenLastCalledWith('철회 완료', expect.any(String));
    });

    it('계정 삭제 텍스트가 destructive 색상으로 표시된다', () => {
      const { getByText } = renderWithTheme(<PrivacySettingsScreen />);
      const deleteText = getByText('계정 삭제');
      // destructive 색상이 스타일에 포함됨
      const flatStyle = Array.isArray(deleteText.props.style)
        ? Object.assign({}, ...deleteText.props.style)
        : deleteText.props.style;
      expect(flatStyle.color).toBe(lightColors.destructive);
    });

    it('계정 삭제 확인 Alert가 즉시·복구 불가 계약을 정확히 안내한다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      fireEvent.press(getByLabelText('계정 삭제'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const message = alertCall[1] as string;
      expect(Alert.alert).toHaveBeenCalledWith(
        '계정 삭제',
        expect.stringContaining('즉시'),
        expect.arrayContaining([
          expect.objectContaining({ text: '취소', style: 'cancel' }),
          expect.objectContaining({ text: '영구 삭제', style: 'destructive' }),
        ])
      );
      expect(message).toContain('복구할 수 없어요');
      expect(message).not.toContain('30일');
      expect(message).not.toContain('취소할 수 있어요');
    });

    it('확정 시 Clerk 토큰·이메일로 웹 삭제 API를 호출하고 direct UPDATE를 하지 않는다', async () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      fireEvent.press(getByLabelText('계정 삭제'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2] as Array<{
        text: string;
        style?: string;
        onPress?: () => void | Promise<void>;
      }>;
      const destructiveButton = buttons.find((button) => button.style === 'destructive');

      await act(async () => {
        await destructiveButton?.onPress?.();
      });

      expect(mockGetToken).toHaveBeenCalledTimes(2);
      expect(mockDeleteAccount).toHaveBeenCalledWith('test@example.com', 'mock_jwt_token');
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('다중 이메일 계정은 웹 대조 계약과 같은 emailAddresses[0]을 확인값으로 쓴다', async () => {
      (useUser as unknown as jest.Mock).mockReturnValue({
        user: {
          id: 'test_user_123',
          emailAddresses: [{ emailAddress: 'server-first@example.com' }],
          primaryEmailAddress: { emailAddress: 'different-primary@example.com' },
        },
        isLoaded: true,
        isSignedIn: true,
      });
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      fireEvent.press(getByLabelText('계정 삭제'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2] as Array<{
        style?: string;
        onPress?: () => void | Promise<void>;
      }>;

      await act(async () => {
        await buttons.find((button) => button.style === 'destructive')?.onPress?.();
      });

      expect(mockDeleteAccount).toHaveBeenCalledWith('server-first@example.com', 'mock_jwt_token');
    });

    it('웹 hard-delete가 실패하면 로그아웃하지 않고 서버 사용자 메시지를 표시한다', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockDeleteAccount.mockRejectedValue(
        new AccountApiError(
          '일부 데이터를 삭제하지 못해 계정 삭제를 중단했어요.',
          500,
          'DELETION_FAILED'
        )
      );
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      fireEvent.press(getByLabelText('계정 삭제'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2] as Array<{
        style?: string;
        onPress?: () => void | Promise<void>;
      }>;

      await act(async () => {
        await buttons.find((button) => button.style === 'destructive')?.onPress?.();
      });

      expect(mockSignOut).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenLastCalledWith(
        '오류',
        '일부 데이터를 삭제하지 못해 계정 삭제를 중단했어요.'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Privacy] Delete account error:',
        expect.any(AccountApiError)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------
  // 안내 텍스트
  // ---------------------------------------------------------------
  describe('안내 텍스트', () => {
    it('개인정보 안내 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText(/안전하게 암호화되어 저장돼요/)).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------
  // 다크 모드
  // ---------------------------------------------------------------
  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<PrivacySettingsScreen />, true);
      expect(getByTestId('settings-privacy-screen')).toBeTruthy();
    });
  });
});
