/** 비밀번호 재설정 Clerk 팩터 왕복 회귀 테스트 */
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ForgotPasswordScreen from '../../../app/(auth)/forgot-password';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  gradeColors,
  lightColors,
  moduleColors,
  nutrientColors,
  radii,
  scoreColors,
  shadows,
  spacing,
  statusColors,
  trustColors,
  typography,
} from '../../../lib/theme/tokens';

const mockSignInCreate = jest.fn();
const mockAttemptFirstFactor = jest.fn();
const mockSetActive = jest.fn();
const mockReplace = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSignIn: jest.fn(() => ({
    signIn: {
      create: mockSignInCreate,
      attemptFirstFactor: mockAttemptFirstFactor,
    },
    setActive: mockSetActive,
    isLoaded: true,
  })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
  })),
}));

function createThemeValue(): ThemeContextValue {
  return {
    colors: lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark: false,
    colorScheme: 'light',
    themeMode: 'system',
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderScreen() {
  return render(
    <ThemeContext.Provider value={createThemeValue()}>
      <ForgotPasswordScreen />
    </ThemeContext.Provider>
  );
}

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('이메일로 재설정 코드를 요청하고 코드 입력 단계로 전환한다', async () => {
    mockSignInCreate.mockResolvedValueOnce({ status: 'needs_first_factor' });
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('forgot-password-request-button'));

    await waitFor(() => {
      expect(mockSignInCreate).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        identifier: 'user@example.com',
      });
      expect(getByTestId('auth-forgot-password-verify-screen')).toBeTruthy();
    });
  });

  it('코드와 새 비밀번호 제출 완료 시 세션을 활성화하고 메인 탭으로 이동한다', async () => {
    mockSignInCreate.mockResolvedValueOnce({ status: 'needs_first_factor' });
    mockAttemptFirstFactor.mockResolvedValueOnce({
      status: 'complete',
      createdSessionId: 'session_reset',
    });
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('forgot-password-request-button'));
    await waitFor(() => expect(getByTestId('forgot-password-code-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('forgot-password-code-input'), '123456');
    fireEvent.changeText(getByTestId('forgot-password-new-password-input'), 'new-password');
    fireEvent.press(getByTestId('forgot-password-submit-button'));

    await waitFor(() => {
      expect(mockAttemptFirstFactor).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        code: '123456',
        password: 'new-password',
      });
      expect(mockSetActive).toHaveBeenCalledWith({ session: 'session_reset' });
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
      expect(mockSetActive.mock.invocationCallOrder[0]).toBeLessThan(
        mockReplace.mock.invocationCallOrder[0]
      );
    });
  });

  it('코드 확인 단계의 Clerk 오류도 사용자에게 알림으로 표시한다', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockSignInCreate.mockResolvedValueOnce({ status: 'needs_first_factor' });
    mockAttemptFirstFactor.mockRejectedValueOnce({
      errors: [{ message: '인증 코드가 만료되었습니다.' }],
    });
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('forgot-password-request-button'));
    await waitFor(() => expect(getByTestId('forgot-password-code-input')).toBeTruthy());
    fireEvent.changeText(getByTestId('forgot-password-code-input'), '000000');
    fireEvent.changeText(getByTestId('forgot-password-new-password-input'), 'new-password');
    fireEvent.press(getByTestId('forgot-password-submit-button'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('재설정 실패', '인증 코드가 만료되었습니다.');
      expect(mockSetActive).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('Clerk 오류를 사용자에게 알림으로 표시한다', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockSignInCreate.mockRejectedValueOnce({
      errors: [{ message: '등록된 이메일을 찾을 수 없습니다.' }],
    });
    const { getByTestId } = renderScreen();

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'missing@example.com');
    fireEvent.press(getByTestId('forgot-password-request-button'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('재설정 실패', '등록된 이메일을 찾을 수 없습니다.');
    });
  });
});
