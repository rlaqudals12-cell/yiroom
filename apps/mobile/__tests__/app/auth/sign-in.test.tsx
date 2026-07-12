/**
 * 로그인 화면 렌더링 테스트
 *
 * 대상: app/(auth)/sign-in.tsx (SignInScreen)
 * 의존성: useSignIn, useRouter, useTheme
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

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

// Platform mock (sign-in.tsx에서 Platform.OS 직접 참조)
const platformMock = {
  OS: 'ios',
  select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
  Version: '17.0',
  isPad: false,
  isTV: false,
  isVision: false,
  isTesting: true,
  constants: {
    osVersion: '17.0',
    interfaceIdiom: 'phone',
    isTesting: true,
    forceTouchAvailable: false,
    reactNativeVersion: { major: 0, minor: 79, patch: 0 },
    systemName: 'iOS',
  },
};

jest.mock('react-native/Libraries/Utilities/Platform.ios', () => ({
  __esModule: true,
  default: platformMock,
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: platformMock,
}));

// useSignIn mock 설정
const mockSignInCreate = jest.fn();
const mockSetActive = jest.fn();
// 추가 인증(email_code) 단계 mock — needs_first_factor / needs_second_factor 흐름 검증용
const mockPrepareFirstFactor = jest.fn();
const mockAttemptFirstFactor = jest.fn();
const mockPrepareSecondFactor = jest.fn();
const mockAttemptSecondFactor = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(() => ({
    isSignedIn: false,
    isLoaded: true,
    userId: null,
    getToken: jest.fn(),
  })),
  useUser: jest.fn(() => ({
    user: null,
    isLoaded: true,
    isSignedIn: false,
  })),
  useSignIn: jest.fn(() => ({
    signIn: {
      create: mockSignInCreate,
      prepareFirstFactor: mockPrepareFirstFactor,
      attemptFirstFactor: mockAttemptFirstFactor,
      prepareSecondFactor: mockPrepareSecondFactor,
      attemptSecondFactor: mockAttemptSecondFactor,
    },
    setActive: mockSetActive,
    isLoaded: true,
  })),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
}));

// expo-router useRouter mock
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => '/'),
  Link: 'Link',
}));

import SignInScreen from '../../../app/(auth)/sign-in';

// ============================================
// 테마 헬퍼
// ============================================

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

// ============================================
// 테스트
// ============================================

describe('SignInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('로그인 화면을 정상적으로 렌더링한다', () => {
      const { getByTestId } = renderWithTheme(<SignInScreen />);
      expect(getByTestId('auth-signin-screen')).toBeTruthy();
    });

    it('앱 제목 "이룸"을 표시한다', () => {
      const { getByText } = renderWithTheme(<SignInScreen />);
      expect(getByText('이룸')).toBeTruthy();
    });

    it('슬로건 "온전한 나를 만나다"를 표시한다', () => {
      const { getByText } = renderWithTheme(<SignInScreen />);
      expect(getByText('온전한 나를 만나다')).toBeTruthy();
    });

    it('이메일 입력 필드를 표시한다', () => {
      const { getByTestId } = renderWithTheme(<SignInScreen />);
      const emailInput = getByTestId('signin-email-input');
      expect(emailInput).toBeTruthy();
      expect(emailInput.props.placeholder).toBe('이메일을 입력하세요');
    });

    it('비밀번호 입력 필드를 표시한다', () => {
      const { getByTestId } = renderWithTheme(<SignInScreen />);
      const passwordInput = getByTestId('signin-password-input');
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.props.placeholder).toBe('비밀번호를 입력하세요');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('로그인 버튼을 표시한다', () => {
      const { getByTestId, getByText } = renderWithTheme(<SignInScreen />);
      expect(getByTestId('signin-submit-button')).toBeTruthy();
      expect(getByText('로그인')).toBeTruthy();
    });

    it('회원가입 링크를 표시한다', () => {
      const { getByText } = renderWithTheme(<SignInScreen />);
      expect(getByText('계정이 없으신가요?')).toBeTruthy();
      expect(getByText('회원가입')).toBeTruthy();
    });
  });

  describe('testID 확인', () => {
    it('주요 testID가 모두 존재한다', () => {
      const { getByTestId } = renderWithTheme(<SignInScreen />);

      expect(getByTestId('auth-signin-screen')).toBeTruthy();
      expect(getByTestId('signin-email-input')).toBeTruthy();
      expect(getByTestId('signin-password-input')).toBeTruthy();
      expect(getByTestId('signin-submit-button')).toBeTruthy();
    });
  });

  describe('사용자 상호작용', () => {
    it('이메일 입력 시 값이 업데이트된다', () => {
      const { getByTestId } = renderWithTheme(<SignInScreen />);
      const emailInput = getByTestId('signin-email-input');

      fireEvent.changeText(emailInput, 'test@example.com');
      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('비밀번호 입력 시 값이 업데이트된다', () => {
      const { getByTestId } = renderWithTheme(<SignInScreen />);
      const passwordInput = getByTestId('signin-password-input');

      fireEvent.changeText(passwordInput, 'password123');
      expect(passwordInput.props.value).toBe('password123');
    });

    it('회원가입 링크 클릭 시 회원가입 페이지로 이동한다', () => {
      const { getByText } = renderWithTheme(<SignInScreen />);

      fireEvent.press(getByText('회원가입'));
      expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-up');
    });

    it('이메일/비밀번호 미입력 시 알림을 표시한다', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.press(getByTestId('signin-submit-button'));
      expect(alertSpy).toHaveBeenCalledWith('알림', '이메일과 비밀번호를 입력해주세요.');
    });

    it('로그인 성공 시 메인 탭으로 이동한다', async () => {
      mockSignInCreate.mockResolvedValueOnce({
        status: 'complete',
        createdSessionId: 'session_123',
      });

      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.changeText(getByTestId('signin-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signin-password-input'), 'password123');
      fireEvent.press(getByTestId('signin-submit-button'));

      await waitFor(() => {
        expect(mockSignInCreate).toHaveBeenCalledWith({
          identifier: 'test@example.com',
          password: 'password123',
        });
        expect(mockSetActive).toHaveBeenCalledWith({ session: 'session_123' });
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    it('로그인 실패 시 에러 알림을 표시한다', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockSignInCreate.mockRejectedValueOnce({
        errors: [{ message: '잘못된 비밀번호입니다.' }],
      });

      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.changeText(getByTestId('signin-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signin-password-input'), 'wrong');
      fireEvent.press(getByTestId('signin-submit-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('로그인 실패', '잘못된 비밀번호입니다.');
      });
    });

    it('로그인 실패 시 기본 에러 메시지를 표시한다 (errors 없는 경우)', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockSignInCreate.mockRejectedValueOnce(new Error('Network error'));

      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.changeText(getByTestId('signin-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signin-password-input'), 'password');
      fireEvent.press(getByTestId('signin-submit-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('로그인 실패', '로그인에 실패했습니다.');
      });
    });
  });

  describe('추가 인증 (needs_first_factor / email_code)', () => {
    // (a) status='needs_first_factor' → prepareFirstFactor 호출 + 코드 입력 UI 노출
    it('needs_first_factor(email_code) 시 인증 코드를 발송하고 코드 입력 UI로 전환한다', async () => {
      mockSignInCreate.mockResolvedValueOnce({
        status: 'needs_first_factor',
        supportedFirstFactors: [
          {
            strategy: 'email_code',
            emailAddressId: 'eid_123',
            safeIdentifier: 't***@example.com',
          },
        ],
      });
      mockPrepareFirstFactor.mockResolvedValueOnce({ status: 'needs_first_factor' });

      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.changeText(getByTestId('signin-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signin-password-input'), 'password123');
      fireEvent.press(getByTestId('signin-submit-button'));

      await waitFor(() => {
        expect(mockPrepareFirstFactor).toHaveBeenCalledWith({
          strategy: 'email_code',
          emailAddressId: 'eid_123',
        });
      });

      // 코드 입력 화면으로 전환되었는지 확인
      await waitFor(() => {
        expect(getByTestId('auth-signin-verify-screen')).toBeTruthy();
        expect(getByTestId('signin-code-input')).toBeTruthy();
      });
    });

    // (b) attemptFirstFactor complete → setActive + 메인 탭 이동
    it('인증 코드 입력 후 attemptFirstFactor 완료 시 setActive 후 메인 탭으로 이동한다', async () => {
      mockSignInCreate.mockResolvedValueOnce({
        status: 'needs_first_factor',
        supportedFirstFactors: [
          {
            strategy: 'email_code',
            emailAddressId: 'eid_123',
            safeIdentifier: 't***@example.com',
          },
        ],
      });
      mockPrepareFirstFactor.mockResolvedValueOnce({ status: 'needs_first_factor' });
      mockAttemptFirstFactor.mockResolvedValueOnce({
        status: 'complete',
        createdSessionId: 'session_456',
      });

      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.changeText(getByTestId('signin-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signin-password-input'), 'password123');
      fireEvent.press(getByTestId('signin-submit-button'));

      const codeInput = await waitFor(() => getByTestId('signin-code-input'));

      fireEvent.changeText(codeInput, '123456');
      fireEvent.press(getByTestId('signin-verify-button'));

      await waitFor(() => {
        expect(mockAttemptFirstFactor).toHaveBeenCalledWith({
          strategy: 'email_code',
          code: '123456',
        });
        expect(mockSetActive).toHaveBeenCalledWith({ session: 'session_456' });
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    // (c) needs_second_factor인데 email_code 2차 팩터가 없으면 → 정직한 Alert (무반응 금지)
    it('needs_second_factor에 email_code 팩터가 없으면 웹 로그인 안내 알림을 표시한다', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockSignInCreate.mockResolvedValueOnce({
        status: 'needs_second_factor',
        supportedFirstFactors: null,
        supportedSecondFactors: [{ strategy: 'totp' }],
      });

      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.changeText(getByTestId('signin-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signin-password-input'), 'password123');
      fireEvent.press(getByTestId('signin-submit-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          '추가 인증 필요',
          '추가 인증이 필요한 계정이에요. 웹(yiroom.vercel.app)에서 로그인해주세요.'
        );
      });
    });

    // needs_first_factor이지만 email_code 팩터가 없으면 무반응 대신 안내 (fall-through 경로)
    it('needs_first_factor이지만 email_code 팩터가 없으면 웹 로그인 안내 알림을 표시한다', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockSignInCreate.mockResolvedValueOnce({
        status: 'needs_first_factor',
        supportedFirstFactors: [{ strategy: 'reset_password_email_code' }],
      });

      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.changeText(getByTestId('signin-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signin-password-input'), 'password123');
      fireEvent.press(getByTestId('signin-submit-button'));

      await waitFor(() => {
        expect(mockPrepareFirstFactor).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith(
          '추가 인증 필요',
          '추가 인증이 필요한 계정이에요. 웹(yiroom.vercel.app)에서 로그인해주세요.'
        );
      });
    });
  });

  describe('추가 인증 (needs_second_factor / email_code) — 실기 재현 케이스', () => {
    // 비밀번호 1차 통과 후 Clerk가 이메일 코드를 "2차" 팩터로 요구하는 경우
    // (dev 인스턴스 재로그인 실측: status=needs_second_factor + supportedSecondFactors=[email_code])
    const SECOND_FACTOR_RESULT = {
      status: 'needs_second_factor',
      supportedFirstFactors: null,
      supportedSecondFactors: [
        {
          strategy: 'email_code',
          emailAddressId: 'eid_second',
          safeIdentifier: 't***@example.com',
          primary: true,
        },
      ],
    };

    it('needs_second_factor(email_code) 시 prepareSecondFactor 후 코드 입력 UI로 전환한다', async () => {
      mockSignInCreate.mockResolvedValueOnce(SECOND_FACTOR_RESULT);
      mockPrepareSecondFactor.mockResolvedValueOnce({ status: 'needs_second_factor' });

      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.changeText(getByTestId('signin-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signin-password-input'), 'password123');
      fireEvent.press(getByTestId('signin-submit-button'));

      await waitFor(() => {
        expect(mockPrepareSecondFactor).toHaveBeenCalledWith({ strategy: 'email_code' });
      });

      await waitFor(() => {
        expect(getByTestId('auth-signin-verify-screen')).toBeTruthy();
        expect(getByTestId('signin-code-input')).toBeTruthy();
      });

      // 1차 팩터 경로를 잘못 타지 않았는지 고정
      expect(mockPrepareFirstFactor).not.toHaveBeenCalled();
    });

    it('2차 코드 입력 후 attemptSecondFactor 완료 시 setActive 후 메인 탭으로 이동한다', async () => {
      mockSignInCreate.mockResolvedValueOnce(SECOND_FACTOR_RESULT);
      mockPrepareSecondFactor.mockResolvedValueOnce({ status: 'needs_second_factor' });
      mockAttemptSecondFactor.mockResolvedValueOnce({
        status: 'complete',
        createdSessionId: 'session_2fa',
      });

      const { getByTestId } = renderWithTheme(<SignInScreen />);

      fireEvent.changeText(getByTestId('signin-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signin-password-input'), 'password123');
      fireEvent.press(getByTestId('signin-submit-button'));

      const codeInput = await waitFor(() => getByTestId('signin-code-input'));

      fireEvent.changeText(codeInput, '424242');
      fireEvent.press(getByTestId('signin-verify-button'));

      await waitFor(() => {
        expect(mockAttemptSecondFactor).toHaveBeenCalledWith({
          strategy: 'email_code',
          code: '424242',
        });
        expect(mockAttemptFirstFactor).not.toHaveBeenCalled();
        expect(mockSetActive).toHaveBeenCalledWith({ session: 'session_2fa' });
        expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
      });
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상적으로 렌더링된다', () => {
      const { getByTestId, getByText } = renderWithTheme(<SignInScreen />, true);

      expect(getByTestId('auth-signin-screen')).toBeTruthy();
      expect(getByText('이룸')).toBeTruthy();
      expect(getByTestId('signin-email-input')).toBeTruthy();
      expect(getByTestId('signin-password-input')).toBeTruthy();
      expect(getByTestId('signin-submit-button')).toBeTruthy();
    });

    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<SignInScreen />, true);
      expect(getByTestId('auth-signin-screen')).toBeTruthy();
    });
  });

  describe('이메일 입력 필드 속성', () => {
    it('이메일 키보드 타입을 사용한다', () => {
      const { getByTestId } = renderWithTheme(<SignInScreen />);
      const emailInput = getByTestId('signin-email-input');
      expect(emailInput.props.keyboardType).toBe('email-address');
    });

    it('자동 대문자 변환이 꺼져 있다', () => {
      const { getByTestId } = renderWithTheme(<SignInScreen />);
      const emailInput = getByTestId('signin-email-input');
      expect(emailInput.props.autoCapitalize).toBe('none');
    });
  });
});
