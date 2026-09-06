/** 비밀번호 재설정 Clerk 팩터 왕복 회귀 테스트 */
import fs from 'node:fs';
import path from 'node:path';

import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import ts from 'typescript';

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

jest.mock('@/lib/i18n', () => jest.requireActual('@/lib/i18n'));

const mockSignInCreate = jest.fn();
const mockAttemptFirstFactor = jest.fn();
const mockSetActive = jest.fn();
const mockReplace = jest.fn();

import { i18n } from '../../../lib/i18n';

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

function findUiKoreanLiterals(): string[] {
  const relativePath = 'app/(auth)/forgot-password.tsx';
  const absolutePath = path.join(process.cwd(), relativePath);
  const sourceText = fs.readFileSync(absolutePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const violations: string[] = [];

  function visit(node: ts.Node): void {
    if (
      (ts.isStringLiteralLike(node) || ts.isJsxText(node)) &&
      /[가-힣]/.test(node.getText(sourceFile))
    ) {
      violations.push(node.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

describe('ForgotPasswordScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('ko');
  });

  it('가시 문구·placeholder·접근성 문구를 한국어 카탈로그에서 렌더링한다', async () => {
    mockSignInCreate.mockResolvedValueOnce({ status: 'needs_first_factor' });
    const { getByLabelText, getByPlaceholderText, getByTestId, getByText } = renderScreen();

    expect(getByText('비밀번호 재설정')).toBeTruthy();
    expect(getByText('가입한 이메일로 인증 코드를 보내드려요')).toBeTruthy();
    expect(getByPlaceholderText('이메일을 입력하세요')).toBeTruthy();
    expect(getByLabelText('이메일')).toBeTruthy();
    expect(getByLabelText('인증 코드 받기')).toBeTruthy();

    fireEvent.changeText(getByTestId('forgot-password-email-input'), 'user@example.com');
    fireEvent.press(getByTestId('forgot-password-request-button'));

    await waitFor(() => {
      expect(getByText('user@example.com로 전송된 인증 코드를 입력해주세요')).toBeTruthy();
      expect(getByPlaceholderText('6자리 코드 입력')).toBeTruthy();
      expect(getByPlaceholderText('새 비밀번호를 입력하세요')).toBeTruthy();
      expect(getByLabelText('인증 코드')).toBeTruthy();
      expect(getByLabelText('새 비밀번호')).toBeTruthy();
      expect(getByLabelText('비밀번호 재설정')).toBeTruthy();
    });
  });

  it('검수용 영문 카탈로그로 전환하면 재설정 첫 화면이 영어로만 렌더링된다', async () => {
    await i18n.changeLanguage('en');
    const screen = renderScreen();

    expect(screen.getByText('Reset Password')).toBeTruthy();
    expect(
      screen.getByText("We'll send a verification code to the email you signed up with")
    ).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(screen.getByLabelText('Send verification code')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/[가-힣]/);
  });

  it('입력 검증 알림도 한국어 카탈로그 문구를 사용한다', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByTestId } = renderScreen();

    fireEvent.press(getByTestId('forgot-password-request-button'));

    expect(alertSpy).toHaveBeenCalledWith('알림', '이메일을 입력해주세요.');
  });

  it('화면 코드에 한국어 UI literal이 다시 들어오지 않는다', () => {
    expect(findUiKoreanLiterals()).toEqual([]);
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
