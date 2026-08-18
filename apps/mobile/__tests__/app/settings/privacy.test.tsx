/**
 * 개인정보 설정 화면 테스트
 *
 * 대상: app/settings/privacy.tsx
 * 의존성: useAuth (Clerk), useClerkSupabaseClient, useTheme, Alert, Switch
 */
import React from 'react';
import { Alert, Share } from 'react-native';
import { act, render, fireEvent } from '@testing-library/react-native';

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

jest.spyOn(Alert, 'alert');
jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

import { AccountApiError, deleteAccount } from '../../../lib/api/account';
import PrivacySettingsScreen from '../../../app/settings/privacy';

const mockDeleteAccount = deleteAccount as jest.MockedFunction<typeof deleteAccount>;
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
      const { getAllByText, getByText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('데이터 수집')).toBeTruthy();
      // "프로필 공개"는 섹션 제목과 토글 라벨 모두에 존재
      expect(getAllByText('프로필 공개').length).toBeGreaterThanOrEqual(2);
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

    it('분석 데이터 수집 동의 기본값이 true이다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('분석 데이터 수집 동의');
      expect(toggle.props.value).toBe(true);
    });

    it('마케팅 정보 수신 기본값이 false이다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('마케팅 정보 수신');
      expect(toggle.props.value).toBe(false);
    });

    it('마케팅 정보 수신 토글을 변경할 수 있다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('마케팅 정보 수신');
      fireEvent(toggle, 'valueChange', true);
      expect(toggle.props.value).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // 프로필 공개 토글
  // ---------------------------------------------------------------
  describe('프로필 공개 토글', () => {
    it('프로필 공개 토글이 표시된다', () => {
      const { getAllByText, getByText, getByLabelText } = renderWithTheme(
        <PrivacySettingsScreen />
      );
      // "프로필 공개"는 섹션 제목과 토글 라벨 양쪽에 존재
      expect(getAllByText('프로필 공개').length).toBeGreaterThanOrEqual(2);
      expect(getByText('다른 사용자가 내 프로필을 볼 수 있어요')).toBeTruthy();
      expect(getByLabelText('프로필 공개')).toBeTruthy();
    });

    it('분석 결과 공유 허용 토글이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('분석 결과 공유 허용')).toBeTruthy();
      expect(getByText('분석 결과를 친구와 공유할 수 있어요')).toBeTruthy();
      expect(getByLabelText('분석 결과 공유 허용')).toBeTruthy();
    });

    it('프로필 공개 기본값이 false이다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('프로필 공개');
      expect(toggle.props.value).toBe(false);
    });

    it('분석 결과 공유 허용 기본값이 false이다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('분석 결과 공유 허용');
      expect(toggle.props.value).toBe(false);
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

      expect(mockGetToken).toHaveBeenCalledTimes(1);
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

      expect(mockDeleteAccount).toHaveBeenCalledWith(
        'server-first@example.com',
        'mock_jwt_token'
      );
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
