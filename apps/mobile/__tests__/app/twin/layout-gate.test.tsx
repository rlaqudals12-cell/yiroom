import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockGetToken = jest.fn<Promise<string | null>, []>();
const mockFetchBirthdate = jest.fn();
const mockFetchAgreementStatus = jest.fn();
const mockFetchImageStorageConsent = jest.fn();
const mockSaveImageStorageConsent = jest.fn();
const mockRouterBack = jest.fn();

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

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const Stack = Object.assign(
    ({ children }: { children: React.ReactNode }) => <View testID="twin-stack">{children}</View>,
    { Screen: ({ name }: { name: string }) => <View testID={`twin-route-${name}`} /> }
  );
  return {
    Redirect: ({ href }: { href: string }) => <View accessibilityLabel={href} testID="redirect" />,
    Stack,
    router: { back: mockRouterBack },
  };
});

jest.mock('../../../lib/api/birthdate', () => ({
  fetchBirthdate: (...args: unknown[]) => mockFetchBirthdate(...args),
}));

jest.mock('../../../lib/api/agreement', () => ({
  fetchAgreementStatus: (...args: unknown[]) => mockFetchAgreementStatus(...args),
}));

jest.mock('../../../lib/api/image-storage-consent', () => {
  class ImageStorageConsentApiError extends Error {}
  return {
    ImageStorageConsentApiError,
    fetchImageStorageConsent: (...args: unknown[]) => mockFetchImageStorageConsent(...args),
    saveImageStorageConsent: (...args: unknown[]) => mockSaveImageStorageConsent(...args),
  };
});

jest.mock('../../../components/ui', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    Button: ({ children, onPress, testID }: Record<string, unknown>) => (
      <Pressable onPress={onPress} testID={testID as string}>
        <Text>{children as React.ReactNode}</Text>
      </Pressable>
    ),
    ScreenContainer: ({ children, testID }: Record<string, unknown>) => (
      <View testID={testID as string}>{children as React.ReactNode}</View>
    ),
  };
});

jest.mock('../../../lib/theme', () => ({
  spacing: { md: 12, lg: 20 },
  typography: { size: { sm: 14, xl: 20 }, lineHeight: { relaxed: 1.5 } },
  useTheme: () => ({
    colors: {
      background: '#fffaf5',
      destructive: '#b42318',
      foreground: '#211b18',
      mutedForeground: '#6d625c',
    },
  }),
}));

import TwinLayout from '../../../app/(twin)/_layout';

describe('AI 아바타 라우트 동의 게이트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      getToken: mockGetToken,
      isLoaded: true,
      isSignedIn: true,
      userId: 'user-1',
    };
    mockGetToken.mockResolvedValue('clerk-token');
    mockFetchBirthdate.mockResolvedValue({ hasBirthDate: true });
    mockFetchAgreementStatus.mockResolvedValue({ hasAgreed: true });
    mockFetchImageStorageConsent.mockResolvedValue(true);
    mockSaveImageStorageConsent.mockResolvedValue(undefined);
  });

  it('미로그인은 AI 사진 입력 스택보다 먼저 기존 로그인 화면으로 보낸다', () => {
    mockAuthState = { ...mockAuthState, isSignedIn: false, userId: null };

    const screen = render(<TwinLayout />);

    expect(screen.getByTestId('redirect').props.accessibilityLabel).toBe('/(auth)/sign-in');
    expect(screen.queryByTestId('twin-stack')).toBeNull();
    expect(mockFetchImageStorageConsent).not.toHaveBeenCalled();
  });

  it('생체정보 동의가 없으면 통합 수집 화면으로 보내고 저장 동의도 조회하지 않는다', async () => {
    mockFetchAgreementStatus.mockResolvedValue({ hasAgreed: false });

    const screen = render(<TwinLayout />);

    await waitFor(() =>
      expect(screen.getByTestId('redirect').props.accessibilityLabel).toBe('/(analysis)/integrated')
    );
    expect(screen.queryByTestId('twin-stack')).toBeNull();
    expect(mockFetchImageStorageConsent).not.toHaveBeenCalled();
  });

  it('생체정보와 전용 twin 저장 동의가 모두 있어야 스택을 연다', async () => {
    const screen = render(<TwinLayout />);

    await waitFor(() => expect(screen.getByTestId('twin-stack')).toBeTruthy());
    expect(mockFetchImageStorageConsent).toHaveBeenCalledWith('twin', 'clerk-token');
  });

  it('저장 미동의면 사진 입력 스택을 닫고 목적이 명시된 동의 화면을 보인다', async () => {
    mockFetchImageStorageConsent.mockResolvedValue(false);

    const screen = render(<TwinLayout />);

    expect(await screen.findByTestId('twin-storage-consent-gate')).toBeTruthy();
    expect(screen.queryByTestId('twin-stack')).toBeNull();
    expect(screen.getByText(/Google AI로 전송/)).toBeTruthy();
    expect(screen.getByText(/생성된 AI 아바타/)).toBeTruthy();
  });

  it('저장 동의 조회 실패는 fail-closed하고 재확인 전까지 스택을 열지 않는다', async () => {
    mockFetchImageStorageConsent.mockRejectedValue(new Error('network'));

    const screen = render(<TwinLayout />);

    expect(await screen.findByTestId('twin-storage-consent-retry')).toBeTruthy();
    expect(screen.queryByTestId('twin-stack')).toBeNull();
  });

  it('전용 twin 저장 동의를 저장한 뒤에만 스택을 연다', async () => {
    mockFetchImageStorageConsent.mockResolvedValue(false);
    const screen = render(<TwinLayout />);

    fireEvent.press(await screen.findByTestId('twin-storage-consent-agree'));

    await waitFor(() => expect(screen.getByTestId('twin-stack')).toBeTruthy());
    expect(mockSaveImageStorageConsent).toHaveBeenCalledWith('twin', 'clerk-token');
  });
});
