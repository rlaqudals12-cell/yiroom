/**
 * 회원가입 화면 렌더링 테스트
 *
 * 대상: app/(auth)/sign-up.tsx (SignUpScreen)
 * 의존성: useSignUp, useRouter, useTheme
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// Platform mock (sign-up.tsx에서 Platform.OS 직접 참조)
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

// useSignUp mock 설정
const mockSignUpCreate = jest.fn();
const mockPrepareEmailVerification = jest.fn();
const mockAttemptEmailVerification = jest.fn();
const mockSetActive = jest.fn();

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
  useSignUp: jest.fn(() => ({
    signUp: {
      create: mockSignUpCreate,
      prepareEmailAddressVerification: mockPrepareEmailVerification,
      attemptEmailAddressVerification: mockAttemptEmailVerification,
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

import SignUpScreen from '../../../app/(auth)/sign-up';

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
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ============================================
// 테스트
// ============================================

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('회원가입 화면을 정상적으로 렌더링한다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />);
      expect(getByTestId('auth-signup-screen')).toBeTruthy();
    });

    it('제목 "회원가입"을 표시한다', () => {
      const { getAllByText } = renderWithTheme(<SignUpScreen />);
      // 제목 + 버튼에 "회원가입"이 2개 존재
      expect(getAllByText('회원가입').length).toBeGreaterThanOrEqual(1);
    });

    it('슬로건 "이룸과 함께 시작하세요"를 표시한다', () => {
      const { getByText } = renderWithTheme(<SignUpScreen />);
      expect(getByText('이룸과 함께 시작하세요')).toBeTruthy();
    });

    it('이메일 입력 필드를 표시한다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />);
      const emailInput = getByTestId('signup-email-input');
      expect(emailInput).toBeTruthy();
      expect(emailInput.props.placeholder).toBe('이메일을 입력하세요');
    });

    it('비밀번호 입력 필드를 표시한다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />);
      const passwordInput = getByTestId('signup-password-input');
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.props.placeholder).toBe('8자 이상 입력하세요');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('비밀번호 확인 입력 필드를 표시한다', () => {
      const { getByText } = renderWithTheme(<SignUpScreen />);
      expect(getByText('비밀번호 확인')).toBeTruthy();
    });

    it('회원가입 버튼을 표시한다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />);
      expect(getByTestId('signup-submit-button')).toBeTruthy();
    });

    it('로그인 링크를 표시한다', () => {
      const { getByText } = renderWithTheme(<SignUpScreen />);
      expect(getByText('이미 계정이 있으신가요?')).toBeTruthy();
      expect(getByText('로그인')).toBeTruthy();
    });
  });

  describe('testID 확인', () => {
    it('주요 testID가 모두 존재한다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />);

      expect(getByTestId('auth-signup-screen')).toBeTruthy();
      expect(getByTestId('signup-email-input')).toBeTruthy();
      expect(getByTestId('signup-password-input')).toBeTruthy();
      expect(getByTestId('signup-submit-button')).toBeTruthy();
    });
  });

  describe('사용자 상호작용', () => {
    it('이메일 입력 시 값이 업데이트된다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />);
      const emailInput = getByTestId('signup-email-input');

      fireEvent.changeText(emailInput, 'new@example.com');
      expect(emailInput.props.value).toBe('new@example.com');
    });

    it('비밀번호 입력 시 값이 업데이트된다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />);
      const passwordInput = getByTestId('signup-password-input');

      fireEvent.changeText(passwordInput, 'password123');
      expect(passwordInput.props.value).toBe('password123');
    });

    it('로그인 링크 클릭 시 로그인 페이지로 이동한다', () => {
      const { getByText } = renderWithTheme(<SignUpScreen />);

      fireEvent.press(getByText('로그인'));
      expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');
    });

    it('이메일/비밀번호 미입력 시 알림을 표시한다', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId } = renderWithTheme(<SignUpScreen />);

      fireEvent.press(getByTestId('signup-submit-button'));
      expect(alertSpy).toHaveBeenCalledWith(
        '알림',
        '이메일과 비밀번호를 입력해주세요.'
      );
    });

    it('비밀번호 불일치 시 알림을 표시한다', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <SignUpScreen />
      );

      fireEvent.changeText(getByTestId('signup-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signup-password-input'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('비밀번호를 다시 입력하세요'),
        'different456'
      );
      fireEvent.press(getByTestId('signup-submit-button'));

      expect(alertSpy).toHaveBeenCalledWith(
        '알림',
        '비밀번호가 일치하지 않습니다.'
      );
    });

    it('비밀번호 8자 미만 시 알림을 표시한다', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <SignUpScreen />
      );

      fireEvent.changeText(getByTestId('signup-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signup-password-input'), 'short');
      fireEvent.changeText(
        getByPlaceholderText('비밀번호를 다시 입력하세요'),
        'short'
      );
      fireEvent.press(getByTestId('signup-submit-button'));

      expect(alertSpy).toHaveBeenCalledWith(
        '알림',
        '비밀번호는 8자 이상이어야 합니다.'
      );
    });

    it('회원가입 성공 시 이메일 인증 화면으로 전환된다', async () => {
      mockSignUpCreate.mockResolvedValueOnce({});
      mockPrepareEmailVerification.mockResolvedValueOnce({});

      const { getByTestId, getByPlaceholderText, getByText } = renderWithTheme(
        <SignUpScreen />
      );

      fireEvent.changeText(getByTestId('signup-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signup-password-input'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('비밀번호를 다시 입력하세요'),
        'password123'
      );
      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(mockSignUpCreate).toHaveBeenCalledWith({
          emailAddress: 'test@example.com',
          password: 'password123',
        });
        expect(mockPrepareEmailVerification).toHaveBeenCalledWith({
          strategy: 'email_code',
        });
        // 인증 화면으로 전환
        expect(getByText('이메일 인증')).toBeTruthy();
      });
    });

    it('회원가입 실패 시 에러 알림을 표시한다', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockSignUpCreate.mockRejectedValueOnce({
        errors: [{ message: '이미 사용 중인 이메일입니다.' }],
      });

      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <SignUpScreen />
      );

      fireEvent.changeText(getByTestId('signup-email-input'), 'exist@example.com');
      fireEvent.changeText(getByTestId('signup-password-input'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('비밀번호를 다시 입력하세요'),
        'password123'
      );
      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          '회원가입 실패',
          '이미 사용 중인 이메일입니다.'
        );
      });
    });

    it('회원가입 실패 시 기본 에러 메시지를 표시한다 (errors 없는 경우)', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockSignUpCreate.mockRejectedValueOnce(new Error('Network error'));

      const { getByTestId, getByPlaceholderText } = renderWithTheme(
        <SignUpScreen />
      );

      fireEvent.changeText(getByTestId('signup-email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('signup-password-input'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('비밀번호를 다시 입력하세요'),
        'password123'
      );
      fireEvent.press(getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          '회원가입 실패',
          '회원가입에 실패했습니다.'
        );
      });
    });
  });

  describe('이메일 인증 화면', () => {
    async function renderVerificationScreen() {
      mockSignUpCreate.mockResolvedValueOnce({});
      mockPrepareEmailVerification.mockResolvedValueOnce({});

      const result = renderWithTheme(<SignUpScreen />);

      fireEvent.changeText(
        result.getByTestId('signup-email-input'),
        'test@example.com'
      );
      fireEvent.changeText(
        result.getByTestId('signup-password-input'),
        'password123'
      );
      fireEvent.changeText(
        result.getByPlaceholderText('비밀번호를 다시 입력하세요'),
        'password123'
      );
      fireEvent.press(result.getByTestId('signup-submit-button'));

      await waitFor(() => {
        expect(result.getByText('이메일 인증')).toBeTruthy();
      });

      return result;
    }

    it('인증 코드 입력 필드를 표시한다', async () => {
      const { getByPlaceholderText } = await renderVerificationScreen();
      expect(getByPlaceholderText('6자리 코드 입력')).toBeTruthy();
    });

    it('인증 완료 버튼을 표시한다', async () => {
      const { getByText } = await renderVerificationScreen();
      expect(getByText('인증 완료')).toBeTruthy();
    });

    it('이메일 안내 문구를 표시한다', async () => {
      const { getByText } = await renderVerificationScreen();
      expect(
        getByText('test@example.com로 전송된 인증 코드를 입력해주세요')
      ).toBeTruthy();
    });

    it('인증 코드 미입력 시 알림을 표시한다', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = await renderVerificationScreen();

      fireEvent.press(getByText('인증 완료'));

      expect(alertSpy).toHaveBeenCalledWith(
        '알림',
        '인증 코드를 입력해주세요.'
      );
    });

    it('인증 성공 시 온보딩으로 이동한다', async () => {
      mockAttemptEmailVerification.mockResolvedValueOnce({
        status: 'complete',
        createdSessionId: 'session_new',
      });

      const { getByPlaceholderText, getByText } =
        await renderVerificationScreen();

      fireEvent.changeText(getByPlaceholderText('6자리 코드 입력'), '123456');
      fireEvent.press(getByText('인증 완료'));

      await waitFor(() => {
        expect(mockAttemptEmailVerification).toHaveBeenCalledWith({
          code: '123456',
        });
        expect(mockSetActive).toHaveBeenCalledWith({
          session: 'session_new',
        });
        expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/step1');
      });
    });

    it('인증 실패 시 에러 알림을 표시한다', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      mockAttemptEmailVerification.mockRejectedValueOnce({
        errors: [{ message: '잘못된 인증 코드입니다.' }],
      });

      const { getByPlaceholderText, getByText } =
        await renderVerificationScreen();

      fireEvent.changeText(getByPlaceholderText('6자리 코드 입력'), '000000');
      fireEvent.press(getByText('인증 완료'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          '인증 실패',
          '잘못된 인증 코드입니다.'
        );
      });
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상적으로 렌더링된다', () => {
      const { getByTestId, getAllByText } = renderWithTheme(
        <SignUpScreen />,
        true
      );

      expect(getByTestId('auth-signup-screen')).toBeTruthy();
      expect(getAllByText('회원가입').length).toBeGreaterThanOrEqual(1);
      expect(getByTestId('signup-email-input')).toBeTruthy();
      expect(getByTestId('signup-password-input')).toBeTruthy();
      expect(getByTestId('signup-submit-button')).toBeTruthy();
    });

    it('다크 모드에서 배경색이 다크 컬러를 사용한다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />, true);
      const screen = getByTestId('auth-signup-screen');

      // style이 중첩 배열일 수 있으므로 JSON 직렬화로 색상 포함 여부 확인
      const styleStr = JSON.stringify(screen.props.style);
      expect(styleStr).toContain(darkColors.card);
    });
  });

  describe('이메일 입력 필드 속성', () => {
    it('이메일 키보드 타입을 사용한다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />);
      const emailInput = getByTestId('signup-email-input');
      expect(emailInput.props.keyboardType).toBe('email-address');
    });

    it('자동 대문자 변환이 꺼져 있다', () => {
      const { getByTestId } = renderWithTheme(<SignUpScreen />);
      const emailInput = getByTestId('signup-email-input');
      expect(emailInput.props.autoCapitalize).toBe('none');
    });
  });
});
